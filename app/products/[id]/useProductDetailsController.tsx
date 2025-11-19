"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductDetails } from "@/lib/types";
import { getValidImageUrl } from "@/lib/utils";
import {
  buildDefaultVariantSelections,
  findVariantSelection,
  getVariantPriority,
  mergeVariantSelections,
} from "@/lib/variants";
import { buildStoreKey, parsePriceValue } from "./utils";

interface UrlDefaults {
  imageUrl: string;
  price: number;
  name: string;
  productLink: string;
}

interface ControllerArgs {
  productId: string;
  urlDefaults: UrlDefaults;
  userId: string | null;
  refreshCartCount: () => Promise<void>;
}

export function useProductDetailsController({
  productId,
  urlDefaults,
  userId,
  refreshCartCount,
}: ControllerArgs) {
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null
  );
  const [activeProductId, setActiveProductId] = useState(productId);
  const [loading, setLoading] = useState(true);
  const [detailsRefreshing, setDetailsRefreshing] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);
  const [productPrice, setProductPrice] = useState<number>(urlDefaults.price);
  const [productName, setProductName] = useState<string>(urlDefaults.name);
  const [productImage, setProductImage] = useState<string>(
    urlDefaults.imageUrl
  );
  const [productLink, setProductLink] = useState<string>(
    urlDefaults.productLink
  );
  const [selectedStoreKey, setSelectedStoreKey] = useState<string | null>(null);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const detailsRequestIdRef = useRef(0);
  const addedToCartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlDefaultsRef = useRef(urlDefaults);
  const previousProductIdRef = useRef<string | null>(null);

  const showMediaSkeleton = !productDetails || detailsRefreshing;

  const sortedVariants = useMemo(() => {
    const variants = productDetails?.productResults?.variants;
    if (!variants || variants.length === 0) {
      return [];
    }
    return [...variants].sort(
      (a, b) => getVariantPriority(b.title) - getVariantPriority(a.title)
    );
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
      const match = stores.find(
        (store) => buildStoreKey(store) === selectedStoreKey
      );
      if (match) {
        return match;
      }
    }

    return stores[0];
  }, [productDetails, selectedStoreKey]);

  const ratingDistribution = productDetails?.productResults?.ratings ?? [];
  const totalRatingsCount = ratingDistribution.reduce(
    (sum, entry) => sum + (entry?.amount ?? 0),
    0
  );
  const reviewImages = productDetails?.productResults?.reviewsImages ?? [];
  const moreOptions = productDetails?.productResults?.moreOptions ?? [];
  const videos = productDetails?.productResults?.videos ?? [];
  const discussions =
    productDetails?.productResults?.discussionsAndForums ?? [];
  const relatedSearches = productDetails?.relatedSearches ?? [];
  const allUserReviews = productDetails?.productResults?.userReviews ?? [];
  const highlightedUserReviews = useMemo(
    () => allUserReviews.slice(0, 2),
    [allUserReviews]
  );

  useEffect(() => {
    urlDefaultsRef.current = urlDefaults;
  }, [urlDefaults]);

  useEffect(() => {
    if (selectedStore?.price) {
      setProductPrice(parsePriceValue(selectedStore.price));
    }

    if (selectedStore?.link) {
      setProductLink(selectedStore.link);
    }
  }, [selectedStore]);

  const applyProductDetails = useCallback(
    (details: ProductDetails, preserveSelections: boolean) => {
      setProductDetails(details);
      setSelectedThumbnailIndex(0);
      setSelectedVariants((prev) =>
        preserveSelections
          ? mergeVariantSelections(details, prev)
          : buildDefaultVariantSelections(details)
      );

      const productInfo = details.productResults;
      if (productInfo) {
        setProductName(productInfo.title || urlDefaults.name);

        const stores = productInfo.stores ?? [];
        const firstStore = stores[0];
        if (firstStore?.price) {
          setProductPrice(parsePriceValue(firstStore.price));
        }

        if (stores.length) {
          setSelectedStoreKey((prevKey) => {
            if (preserveSelections && prevKey) {
              const stillExists = stores.some(
                (store) => buildStoreKey(store) === prevKey
              );
              if (stillExists) {
                return prevKey;
              }
            }
            return buildStoreKey(stores[0]!);
          });
        } else {
          setSelectedStoreKey(null);
        }

        const primaryImage =
          productInfo.thumbnails?.[0] ||
          productInfo.image ||
          urlDefaults.imageUrl ||
          "";
        setProductImage(primaryImage);

        if (firstStore?.link) {
          setProductLink(firstStore.link);
        } else if (!preserveSelections && urlDefaults.productLink) {
          setProductLink(urlDefaults.productLink);
        }
      }
    },
    [urlDefaults]
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

        const response = await fetch(
          `/api/henry/products/details?${params.toString()}`,
          {
            cache: "no-store",
          }
        );
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
    [applyProductDetails, productId]
  );

  const handleMoreOptionSelect = useCallback(
    (optionId?: string) => {
      if (!optionId) {
        return;
      }
      void fetchProductDetails({
        productIdOverride: optionId,
        preserveSelections: false,
      });
    },
    [fetchProductDetails]
  );

  useEffect(() => {
    if (previousProductIdRef.current === productId) {
      return;
    }
    previousProductIdRef.current = productId;
    const defaults = urlDefaultsRef.current;
    setProductDetails(null);
    setActiveProductId(productId);
    setSelectedVariants({});
    setSelectedStoreKey(null);
    setSelectedThumbnailIndex(0);
    setQuantity(1);
    setAddedToCartSuccess(false);
    setErrorMessage(null);
    setProductPrice(defaults.price);
    setProductName(defaults.name);
    setProductImage(defaults.imageUrl);
    setProductLink(defaults.productLink);
    void fetchProductDetails();
  }, [fetchProductDetails, productId]);

  useEffect(() => {
    return () => {
      if (addedToCartTimeoutRef.current) {
        clearTimeout(addedToCartTimeoutRef.current);
      }
    };
  }, []);

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
        fetchProductDetails({
          productIdOverride: variantProductId,
          preserveSelections: true,
        });
      }
    },
    [fetchProductDetails, productDetails, selectedVariants]
  );

  const incrementQuantity = useCallback(() => {
    setQuantity((previous) => Math.min(previous + 1, 99));
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity((previous) => Math.max(1, previous - 1));
  }, []);

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
          ...(primarySelections.size?.value
            ? { Size: primarySelections.size.value }
            : {}),
          ...(primarySelections.color?.value
            ? { Color: primarySelections.color.value }
            : {}),
        };

        const storePrice = selectedStore
          ? parsePriceValue(selectedStore.price)
          : productPrice;
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
                  ...(selectedStore?.name
                    ? { Merchant: selectedStore.name }
                    : {}),
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
        const errorMsg =
          error instanceof Error ? error.message : "Failed to add to cart";
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
    ]
  );

  const handleAddToCart = useCallback(() => {
    void addCurrentSelectionToCart();
  }, [addCurrentSelectionToCart]);

  const buyNow = useCallback(async () => {
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

      const checkoutResponse = await fetch("/api/henry/cart/checkout", {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
      });

      const checkoutResult = await checkoutResponse.json();

      if (checkoutResult.success && checkoutResult.data?.checkout_url) {
        const returnURL = window.location.origin;

        const checkoutUrl = new URL(checkoutResult.data.checkout_url);
        checkoutUrl.searchParams.set("returnUrl", returnURL);

        window.location.href = checkoutUrl.toString();
      } else {
        throw new Error(checkoutResult.message || "Failed to create checkout");
      }
    } catch (error) {
      console.error("Cart checkout error:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "An error occurred during checkout";
      setErrorMessage(errorMsg);
    } finally {
      setLoadingCheckout(false);
    }
  }, [addCurrentSelectionToCart, productDetails, userId]);

  const onThumbnailSelect = useCallback((index: number) => {
    setSelectedThumbnailIndex(index);
  }, []);

  const relatedData = {
    ratingDistribution,
    totalRatingsCount,
    reviewImages,
    allUserReviews,
    highlightedUserReviews,
    moreOptions,
    videos,
    discussions,
    relatedSearches,
  };

  return {
    productDetails,
    activeProductId,
    loading,
    detailsRefreshing,
    showMediaSkeleton,
    productName,
    productPrice,
    productImage,
    productLink,
    selectedStore,
    selectedStoreKey,
    setSelectedStoreKey,
    sortedVariants,
    selectedVariants,
    onVariantSelect: handleVariantSelection,
    selectedThumbnailIndex,
    onThumbnailSelect,
    quantity,
    incrementQuantity,
    decrementQuantity,
    onAddToCart: handleAddToCart,
    buyNow,
    addingToCart,
    addedToCartSuccess,
    loadingCheckout,
    loadingMessage,
    errorMessage,
    handleMoreOptionSelect,
    relatedData,
  };
}
