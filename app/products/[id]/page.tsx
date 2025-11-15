"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import SearchPageShell from "@/components/SearchPageShell";
import type { ProductDetails } from "@/lib/types";
import { useCartCount } from "@/lib/useCartCount";
import { usePersistentUserId } from "@/lib/usePersistentUserId";
import { getValidImageUrl } from "@/lib/utils";
import {
  buildDefaultVariantSelections,
  findVariantSelection,
  getVariantPriority,
  mergeVariantSelections,
} from "@/lib/variants";
import {
  DiscussionsCarousel,
  MoreOptionsCarousel,
  ProductDetailsPanel,
  ProductMediaSection,
  RelatedSearchesSection,
  ReviewInsightsCard,
  ReviewsModal,
  VideosCarousel,
} from "./components";
import { buildStoreKey, parsePriceValue } from "./utils";

export const dynamic = "force-dynamic";

function ProductPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawProductId = params.id as string;
  const productId = decodeURIComponent(rawProductId);

  // Get product data from URL parameters (passed from mobile redirect)
  const urlImageUrl = searchParams.get("imageUrl") || "";
  const urlPrice = searchParams.get("price");
  const urlName = searchParams.get("name") || "";
  const urlProductLink = searchParams.get("productLink") || "";

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [activeProductId, setActiveProductId] = useState(productId);
  const [loading, setLoading] = useState(true);
  const [detailsRefreshing, setDetailsRefreshing] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const userId = usePersistentUserId();
  const { cartCount, refreshCartCount } = useCartCount(userId);
  const [productPrice, setProductPrice] = useState<number>(urlPrice ? parseFloat(urlPrice) : 0);
  const [productName, setProductName] = useState<string>(urlName);
  const [productImage, setProductImage] = useState<string>(urlImageUrl);
  const [productLink, setProductLink] = useState<string>(urlProductLink);
  const [selectedStoreKey, setSelectedStoreKey] = useState<string | null>(null);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const detailsRequestIdRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addedToCartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showMediaSkeleton = !productDetails || detailsRefreshing;
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);

  const getVariantMetadata = useCallback(() => {
    const variants = productDetails?.productResults?.variants;
    if (!variants || variants.length === 0) {
      return {};
    }

    return variants.reduce<Record<string, string>>((acc, variant) => {
      const selection = selectedVariants[variant.title];
      if (selection) {
        acc[variant.title] = selection;
      }
      return acc;
    }, {});
  }, [productDetails, selectedVariants]);

  const sortedVariants = useMemo(() => {
    const variants = productDetails?.productResults?.variants;
    if (!variants || variants.length === 0) {
      return [];
    }
    return [...variants].sort((a, b) => getVariantPriority(b.title) - getVariantPriority(a.title));
  }, [productDetails]);

  const primarySelections = useMemo(() => {
    const variants = productDetails?.productResults?.variants ?? [];
    return {
      size: findVariantSelection(variants, selectedVariants, "size"),
      color: findVariantSelection(variants, selectedVariants, "color"),
    };
  }, [productDetails, selectedVariants]);

  const selectedStore = useMemo(() => {
    if (!productDetails?.productResults?.stores?.length) {
      return null;
    }

    const stores = productDetails.productResults.stores;
    if (selectedStoreKey) {
      const match = stores.find((store) => buildStoreKey(store) === selectedStoreKey);
      if (match) {
        return match;
      }
    }

    return stores[0];
  }, [productDetails, selectedStoreKey]);

  const allUserReviews = useMemo(
    () => productDetails?.productResults?.userReviews ?? [],
    [productDetails],
  );
  const highlightedUserReviews = useMemo(() => allUserReviews.slice(0, 2), [allUserReviews]);

  const ratingDistribution = productDetails?.productResults?.ratings ?? [];
  const totalRatingsCount = ratingDistribution.reduce(
    (sum, entry) => sum + (entry?.amount ?? 0),
    0,
  );
  const reviewImages = productDetails?.productResults?.reviewsImages ?? [];
  const moreOptions = productDetails?.productResults?.moreOptions ?? [];
  const videos = productDetails?.productResults?.videos ?? [];
  const discussions = productDetails?.productResults?.discussionsAndForums ?? [];
  const relatedSearches = productDetails?.relatedSearches ?? [];
  const incrementQuantity = useCallback(() => {
    setQuantity((previous) => Math.min(previous + 1, 99));
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity((previous) => Math.max(1, previous - 1));
  }, []);

  useEffect(() => {
    if (selectedStore?.price) {
      setProductPrice(parsePriceValue(selectedStore.price));
    }

    if (selectedStore?.link) {
      setProductLink(selectedStore.link);
    }
  }, [selectedStore]);

  // Applies API detail data to UI state while preserving any viable variant selections.
  const applyProductDetails = useCallback(
    (details: ProductDetails, preserveSelections: boolean) => {
      setProductDetails(details);
      setSelectedThumbnailIndex(0);
      setSelectedVariants((prev) =>
        preserveSelections
          ? mergeVariantSelections(details, prev)
          : buildDefaultVariantSelections(details),
      );

      const productInfo = details.productResults;
      if (productInfo) {
        setProductName(productInfo.title);

        const stores = productInfo.stores ?? [];
        const firstStore = stores[0];
        if (firstStore?.price) {
          setProductPrice(parsePriceValue(firstStore.price));
        }

        if (stores.length) {
          setSelectedStoreKey((prevKey) => {
            if (preserveSelections && prevKey) {
              const stillExists = stores.some((store) => buildStoreKey(store) === prevKey);
              if (stillExists) {
                return prevKey;
              }
            }
            return buildStoreKey(stores[0]!);
          });
        } else {
          setSelectedStoreKey(null);
        }

        const primaryImage = productInfo.thumbnails?.[0] || productInfo.image || urlImageUrl || "";
        setProductImage(primaryImage);

        if (firstStore?.link) {
          setProductLink(firstStore.link);
        } else if (!preserveSelections && urlProductLink) {
          setProductLink(urlProductLink);
        }
      }
    },
    [urlImageUrl, urlProductLink],
  );

  const fetchProductDetails = useCallback(
    async ({
      productIdOverride,
      preserveSelections = false,
    }: {
      productIdOverride?: string;
      preserveSelections?: boolean;
    } = {}) => {
      const requestId = ++detailsRequestIdRef.current;
      const targetProductId = productIdOverride ?? productId;
      if (preserveSelections) {
        setDetailsRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({ productId: targetProductId });
        params.set("_", Date.now().toString());

        const response = await fetch(`/api/henry/products/details?${params.toString()}`, {
          cache: "no-store",
        });
        const productResult = await response.json();

        if (requestId !== detailsRequestIdRef.current) {
          return;
        }

        if (productResult?.success && productResult.data) {
          setActiveProductId(targetProductId);
          applyProductDetails(productResult.data, preserveSelections);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (requestId === detailsRequestIdRef.current) {
          if (preserveSelections) {
            setDetailsRefreshing(false);
          } else {
            setLoading(false);
          }
        }
      }
    },
    [applyProductDetails, productId],
  );

  const handleMoreOptionSelect = useCallback(
    (optionId?: string) => {
      if (!optionId) {
        return;
      }
      void fetchProductDetails({ productIdOverride: optionId, preserveSelections: false });
    },
    [fetchProductDetails],
  );

  const handleVariantSelection = useCallback(
    (variantTitle: string, optionName: string) => {
      if (selectedVariants[variantTitle] === optionName) {
        return;
      }

      setSelectedVariants((prev) => ({
        ...prev,
        [variantTitle]: optionName,
      }));

      const variantProductId = productDetails?.productResults?.variants
        ?.find((variant) => variant.title === variantTitle)
        ?.items.find((item) => item.name === optionName)?.id;

      if (variantProductId) {
        fetchProductDetails({ productIdOverride: variantProductId, preserveSelections: true });
      }
    },
    [fetchProductDetails, productDetails, selectedVariants],
  );

  // Fetch product details
  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  useEffect(() => {
    return () => {
      if (addedToCartTimeoutRef.current) {
        clearTimeout(addedToCartTimeoutRef.current);
      }
    };
  }, []);

  // Adds the currently selected variant to the shared cart. When `silent` is true the caller handles
  // its own loading/error UI (used by the Buy Now flow); otherwise we drive the inline button states.
  const addCurrentSelectionToCart = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!productDetails || !userId) {
        if (!silent) {
          setErrorMessage("Missing product details or user session.");
        }
        return false;
      }

      if (!silent) {
        setAddingToCart(true);
        setErrorMessage(null);
      }

      try {
        const variantMetadata = getVariantMetadata();
        const metadata = {
          ...variantMetadata,
          ...(primarySelections.size?.value ? { Size: primarySelections.size.value } : {}),
          ...(primarySelections.color?.value ? { Color: primarySelections.color.value } : {}),
        };

        const storePrice = selectedStore ? parsePriceValue(selectedStore.price) : productPrice;
        const storeLink = selectedStore?.link || productLink;

        const response = await fetch("/api/henry/cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            productsDetails: [
              {
                productId: activeProductId,
                name: productDetails.productResults.title || productName,
                price: storePrice.toFixed(2),
                quantity,
                productLink: storeLink,
                productImageLink: getValidImageUrl(productImage),
                metadata: {
                  ...metadata,
                  ...(selectedStore?.name ? { Merchant: selectedStore.name } : {}),
                },
              },
            ],
          }),
        });

        const cartResult = await response.json();
        if (!cartResult.success) {
          throw new Error(cartResult.message || "Failed to add to cart");
        }

        if (addedToCartTimeoutRef.current) {
          clearTimeout(addedToCartTimeoutRef.current);
        }
        setAddedToCartSuccess(true);
        addedToCartTimeoutRef.current = setTimeout(() => {
          setAddedToCartSuccess(false);
        }, 3000);

        await refreshCartCount();

        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to add to cart";
        setErrorMessage(errorMsg);
        setAddedToCartSuccess(false);
        return false;
      } finally {
        if (!silent) {
          setAddingToCart(false);
        }
      }
    },
    [
      productDetails,
      userId,
      getVariantMetadata,
      primarySelections,
      activeProductId,
      productName,
      productPrice,
      productLink,
      productImage,
      selectedStore,
      refreshCartCount,
      quantity,
    ],
  );

  const handleAddToCart = () => {
    void addCurrentSelectionToCart();
  };

  // Buy now flow (cart checkout)
  const buyNow = async () => {
    if (!productDetails || !userId) return;

    setErrorMessage(null);
    setLoadingCheckout(true);
    setLoadingMessage("Adding to cart...");

    try {
      const added = await addCurrentSelectionToCart({ silent: true });
      if (!added) {
        throw new Error("Unable to add product to cart.");
      }

      setLoadingMessage("Fetching checkout link...");

      // Create checkout
      const checkoutResponse = await fetch("/api/henry/cart/checkout", {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
      });

      const checkoutResult = await checkoutResponse.json();

      if (checkoutResult.success && checkoutResult.data?.checkout_url) {
        // Navigate directly to avoid popup blockers.
        window.location.href = checkoutResult.data.checkout_url;
      } else {
        throw new Error(checkoutResult.message || "Failed to create checkout");
      }
    } catch (error) {
      console.error("Cart checkout error:", error);
      const errorMsg = error instanceof Error ? error.message : "An error occurred during checkout";
      setErrorMessage(errorMsg);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  }, [router, searchQuery]);

  return (
    <SearchPageShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={handleSearchSubmit}
      placeholder="Search for products"
      inputRef={searchInputRef}
      cartCount={cartCount}
    >
      <div className="overflow-x-hidden">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 overflow-x-hidden">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 max-w-full overflow-hidden">
              <ProductMediaSection
                productDetails={productDetails}
                productName={productName}
                fallbackImage={productImage}
                selectedThumbnailIndex={selectedThumbnailIndex}
                onThumbnailSelect={setSelectedThumbnailIndex}
                showSkeleton={showMediaSkeleton}
              />
              <ReviewInsightsCard
                productDetails={productDetails}
                ratingDistribution={ratingDistribution}
                totalRatingsCount={totalRatingsCount}
                highlightedUserReviews={highlightedUserReviews}
                reviewImages={reviewImages}
                allUserReviews={allUserReviews}
                onOpenReviews={() => setShowReviewsModal(true)}
              />
            </div>

            {/* Product Info */}
            <ProductDetailsPanel
              productDetails={productDetails}
              productName={productName}
              productPrice={productPrice}
              selectedStore={selectedStore}
              selectedStoreKey={selectedStoreKey}
              onStoreChange={setSelectedStoreKey}
              sortedVariants={sortedVariants}
              selectedVariants={selectedVariants}
              onVariantSelect={handleVariantSelection}
              quantity={quantity}
              onIncrementQuantity={incrementQuantity}
              onDecrementQuantity={decrementQuantity}
              onAddToCart={handleAddToCart}
              onBuyNow={buyNow}
              addingToCart={addingToCart}
              addedToCartSuccess={addedToCartSuccess}
              loadingCheckout={loadingCheckout}
              loadingMessage={loadingMessage}
              errorMessage={errorMessage}
              productId={activeProductId}
            />
          </div>

          {!productDetails && !loading && (
            <div className="text-center py-6 text-gray-500">Unable to load product details</div>
          )}
        </div>

        {moreOptions.length > 0 && (
          <MoreOptionsCarousel options={moreOptions} onSelect={handleMoreOptionSelect} />
        )}

        {videos.length > 0 && <VideosCarousel videos={videos} />}

        {discussions.length > 0 && <DiscussionsCarousel discussions={discussions} />}

        {relatedSearches.length > 0 && <RelatedSearchesSection relatedSearches={relatedSearches} />}
      </div>

      <ReviewsModal
        open={showReviewsModal}
        reviews={allUserReviews}
        onClose={() => setShowReviewsModal(false)}
      />
    </SearchPageShell>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
      <ProductPageContent />
    </Suspense>
  );
}
