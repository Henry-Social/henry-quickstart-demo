"use client";

"use client";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductMediaSkeleton from "@/components/ProductMediaSkeleton";
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

export const dynamic = "force-dynamic";

type ProductStore = ProductDetails["productResults"]["stores"][number];

const buildStoreKey = (store: ProductStore) => {
  const namePart = store.name || "store";
  const linkPart = store.link || "";
  return `${namePart}::${linkPart}`;
};

const parsePriceValue = (rawPrice?: string) => {
  if (!rawPrice) {
    return 0;
  }
  const normalized = parseFloat(rawPrice.replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) ? normalized : 0;
};

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

  const displayedReviews = useMemo(() => {
    return productDetails?.productResults?.userReviews?.slice(0, 5) ?? [];
  }, [productDetails]);

  useEffect(() => {
    if (selectedStore?.price) {
      setProductPrice(parsePriceValue(selectedStore.price));
    }

    if (selectedStore?.link) {
      setProductLink(selectedStore.link);
    }
  }, [selectedStore]);

  const renderMediaSection = () => {
    if (!productDetails || showMediaSkeleton) {
      return <ProductMediaSkeleton className="max-w-full" />;
    }

    return (
      <>
        <div className="relative h-80 rounded-lg overflow-hidden bg-white shadow-inner">
          {productDetails.productResults.thumbnails &&
          productDetails.productResults.thumbnails.length > 0 ? (
            <>
              <div className="absolute inset-0 image-gradient-overlay z-10 pointer-events-none" />
              <Image
                src={productDetails.productResults.thumbnails![selectedThumbnailIndex]}
                alt={productDetails.productResults.title || productName}
                fill
                className="object-contain p-4"
                unoptimized
              />
            </>
          ) : productDetails.productResults.image || productImage ? (
            <>
              <div className="absolute inset-0 image-gradient-overlay z-10 pointer-events-none" />
              <Image
                src={productDetails.productResults.image || productImage}
                alt={productDetails.productResults.title || productName}
                fill
                className="object-contain p-4"
                unoptimized
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <svg
                className="w-24 h-24 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>No Image</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {productDetails.productResults.thumbnails &&
          productDetails.productResults.thumbnails.length > 1 && (
            <div className="overflow-x-auto pb-2 max-w-full [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
              <div className="flex gap-2 py-1 px-0.5 min-w-min">
                {productDetails.productResults.thumbnails!.map((thumbnail, index) => (
                  <button
                    key={thumbnail || `thumbnail-${index}`}
                    type="button"
                    onClick={() => setSelectedThumbnailIndex(index)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-md border-2 transition-all bg-white ${
                      selectedThumbnailIndex === index
                        ? "border-[#44c57e] opacity-100 shadow-md"
                        : "border-gray-300 opacity-80 hover:opacity-100 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={thumbnail}
                      alt={`${productDetails.productResults.title || productName} - View ${index + 1}`}
                      fill
                      className="object-contain p-1.5 rounded-sm"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
      </>
    );
  };

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
                quantity: 1,
                productLink: storeLink,
                productImageLink: getValidImageUrl(productImage),
                metadata: {
                  ...metadata,
                  ...(selectedStore?.name ? { Merchant: selectedStore.name } : {}),
                  ...(selectedStore?.shipping ? { Shipping: selectedStore.shipping } : {}),
                  ...(selectedStore?.total ? { Total: selectedStore.total } : {}),
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
            <div className="space-y-4 max-w-full overflow-hidden">{renderMediaSection()}</div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                {productDetails ? (
                  <>
                    <h1 className="text-3xl font-bold mb-2">
                      {productDetails.productResults.title || productName}
                    </h1>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                      {productDetails.productResults.stores?.length ? (
                        productDetails.productResults.stores.length > 1 ? (
                          <label className="text-gray-600 text-lg flex flex-col sm:flex-row sm:items-center gap-2">
                            <span>Sold by</span>
                            <select
                              aria-label="Select merchant"
                              className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#44c57e] focus:border-[#44c57e]"
                              value={
                                selectedStoreKey ??
                                (selectedStore ? buildStoreKey(selectedStore) : "")
                              }
                              onChange={(event) => setSelectedStoreKey(event.target.value)}
                            >
                              {productDetails.productResults.stores.map((store) => {
                                const optionKey = buildStoreKey(store);
                                return (
                                  <option key={optionKey} value={optionKey}>
                                    {store.name}
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                        ) : (
                          <p className="text-gray-600 text-lg">
                            Sold by
                            <span className="ml-1 font-medium text-gray-900">
                              {productDetails.productResults.stores[0]?.name}
                            </span>
                          </p>
                        )
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                  </>
                )}
              </div>

              {/* Price */}
              {productDetails ? (
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-[#44c57e]">
                    {selectedStore?.price ||
                      (productPrice ? `$${productPrice.toFixed(2)}` : "Price unavailable")}
                  </div>
                  {selectedStore && (
                    <dl className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <dt>Shipping</dt>
                        <dd className="font-medium text-gray-900">
                          {selectedStore.shipping || "Varies"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Total</dt>
                        <dd className="font-medium text-gray-900">
                          {selectedStore.total || selectedStore.price || "See store"}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              ) : (
                <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
              )}

              {/* Rating */}
              {productDetails ? (
                productDetails.productResults.reviews > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {["one", "two", "three", "four", "five"].map((slot, index) => (
                        <span
                          key={slot}
                          className={
                            index < Math.floor(productDetails.productResults.rating)
                              ? "text-yellow-500"
                              : "text-gray-300"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {productDetails.productResults.rating}/5 (
                      {productDetails.productResults.reviews} reviews)
                    </span>
                  </div>
                ) : null
              ) : (
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
              )}

              {/* Variants */}
              {productDetails && (primarySelections.size || primarySelections.color) && (
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {primarySelections.size && (
                    <span>
                      Size:{" "}
                      <span className="font-semibold">
                        {primarySelections.size.value || "Select a size"}
                      </span>
                    </span>
                  )}
                  {primarySelections.color && (
                    <span>
                      Color:{" "}
                      <span className="font-semibold">
                        {primarySelections.color.value || "Select a color"}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {sortedVariants.map((variant) => (
                <div key={variant.title}>
                  <h4 className="font-medium mb-3 text-lg">{variant.title}:</h4>
                  <div className="flex flex-wrap gap-2">
                    {variant.items.map((item) => {
                      const isAvailable = item.available !== false;
                      const isSelected = selectedVariants[variant.title] === item.name;

                      return (
                        <button
                          key={item.name}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            if (isAvailable) {
                              handleVariantSelection(variant.title, item.name);
                            }
                          }}
                          aria-pressed={isSelected}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            isSelected
                              ? "bg-[#44c57e] text-white border-[#44c57e]"
                              : isAvailable
                                ? "bg-white hover:bg-gray-50 border-gray-300"
                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || !productDetails}
                  className="w-full py-3 bg-[#44c57e] text-white rounded-lg font-semibold hover:bg-[#3aaa6a] disabled:opacity-50 transition-colors"
                >
                  {addingToCart ? (
                    "Adding..."
                  ) : addedToCartSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <title>Added to cart</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Added to Cart
                    </span>
                  ) : (
                    "Add to Cart"
                  )}
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  disabled={loadingCheckout || !productDetails}
                  className="w-full py-3 border border-[#44c57e] text-[#1b8451] rounded-lg font-semibold hover:bg-[#ebf8f1] disabled:opacity-50 transition-colors"
                >
                  {loadingCheckout ? loadingMessage : "Buy Now"}
                </button>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!productDetails && !loading && (
            <div className="text-center py-6 text-gray-500">Unable to load product details</div>
          )}
        </div>

        {displayedReviews.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h2 className="text-2xl font-semibold">Customer Reviews</h2>
              {productDetails && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {productDetails.productResults.rating}/5
                  </span>
                  <span className="ml-1">({productDetails.productResults.reviews} reviews)</span>
                </div>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {displayedReviews.map((review, index) => (
                <div
                  key={`${review.userName || review.title || "review"}-${index}`}
                  className="py-4 first:pt-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      {review.title && <p className="font-semibold text-lg">{review.title}</p>}
                      <p className="text-sm text-gray-500">
                        {review.userName || "Anonymous"}
                        {review.source && <span className="ml-1">· {review.source}</span>}
                      </p>
                    </div>
                    {typeof review.rating === "number" && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <span
                            key={`${review.title || "review"}-${starIndex}`}
                            className={
                              starIndex < Math.round(review.rating || 0)
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-gray-600 ml-1">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {review.text && (
                    <p className="mt-3 text-gray-700 text-sm leading-relaxed">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
