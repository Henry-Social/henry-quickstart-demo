"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HenryWordmark from "@/assets/henry-wordmark";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import ProductModal from "@/components/ProductModal";
import SearchBar from "@/components/SearchBar";
import type { Product, ProductDetails } from "@/lib/types";
import { getValidImageUrl } from "@/lib/utils";
import {
  buildDefaultVariantSelections,
  findVariantSelection,
  mergeVariantSelections,
} from "@/lib/variants";

type ViewMode = "desktop" | "mobile";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [detailsProductId, setDetailsProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");
  const [userId, setUserId] = useState("demo_user");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCheckoutIframe, setShowCheckoutIframe] = useState(false);
  const [checkoutIframeUrl, setCheckoutIframeUrl] = useState<string | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [heroView, setHeroView] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const detailsRequestIdRef = useRef(0);

  const placeholders = [
    "Yoga mats with good grip",
    "Nike shoes",
    "Summer dresses",
    "Wireless headphones",
    "Organic skincare",
    "Running gear",
  ];

  // Handle closing the iframe
  const handleCloseIframe = useCallback(() => {
    setShowCheckoutIframe(false);
    setCheckoutIframeUrl(null);
  }, []);

  // Close product modal
  const handleCloseProductModal = () => {
    detailsRequestIdRef.current += 1;
    setProductDetailsLoading(false);
    setShowProductModal(false);
    setSelectedProduct(null);
    setProductDetails(null);
    setDetailsProductId(null);
    setShowCheckoutIframe(false);
    setCheckoutIframeUrl(null);
    setSelectedThumbnailIndex(0);
    setSelectedVariants({});
  };

  const fetchProductDetails = useCallback(
    async ({
      productId,
      preserveSelections = false,
    }: {
      productId: string;
      preserveSelections?: boolean;
    }) => {
      const requestId = ++detailsRequestIdRef.current;
      setProductDetailsLoading(true);

      try {
        const params = new URLSearchParams({ productId, _: Date.now().toString() });

        const response = await fetch(`/api/henry/products/details?${params.toString()}`, {
          cache: "no-store",
        });
        const productResult = await response.json();

        if (requestId !== detailsRequestIdRef.current) {
          return;
        }

        if (productResult?.success && productResult.data) {
          setDetailsProductId(productId);
          setProductDetails(productResult.data);
          setSelectedThumbnailIndex(0);
          setSelectedVariants((prev) =>
            preserveSelections
              ? mergeVariantSelections(productResult.data, prev)
              : buildDefaultVariantSelections(productResult.data),
          );
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        if (requestId === detailsRequestIdRef.current) {
          setProductDetailsLoading(false);
        }
      }
    },
    [],
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

      if (!productDetails || !selectedProduct) {
        return;
      }

      const variantProductId = productDetails.productResults.variants
        ?.find((variant) => variant.title === variantTitle)
        ?.items.find((item) => item.name === optionName)?.id;

      if (variantProductId) {
        fetchProductDetails({
          productId: variantProductId,
          preserveSelections: true,
        });
      }
    },
    [fetchProductDetails, productDetails, selectedProduct, selectedVariants],
  );

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

  const primarySelections = useMemo(() => {
    const variants = productDetails?.productResults?.variants ?? [];
    return {
      size: findVariantSelection(variants, selectedVariants, "size"),
      color: findVariantSelection(variants, selectedVariants, "color"),
    };
  }, [productDetails, selectedVariants]);

  // Search for products
  const searchProducts = async () => {
    if (!searchQuery.trim()) return;

    setHeroView(false);
    setLoading(true);

    try {
      const response = await fetch("/api/henry/products/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
        }),
      });

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        setProducts(result.data);
      } else if (result.data && result.data.length === 0) {
        setProducts([]);
      } else {
        setProducts([]);
      }
    } catch (_error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get product details
  const getProductDetails = (product: Product) => {
    // On mobile, open custom product page in same tab
    if (isMobile) {
      const params = new URLSearchParams({
        imageUrl: product.imageUrl || "",
        price: product.price.toString(),
        name: product.name || "",
        productLink: product.productLink || "",
      });
      window.location.href = `/product/${product.id}?${params.toString()}`;
      return;
    }

    // Desktop: show modal
    setSelectedProduct(product);
    setShowProductModal(true);
    setSelectedVariants({});
    setSelectedThumbnailIndex(0);
    fetchProductDetails({ productId: product.id });
  };

  // Buy now flow (cart checkout)
  const buyNow = async () => {
    if (!selectedProduct || !productDetails) return;

    setLoadingCheckout(true);
    setLoadingMessage("Processing...");

    try {
      const variantMetadata = getVariantMetadata();
      const metadata = {
        ...variantMetadata,
        ...(primarySelections.size?.value ? { Size: primarySelections.size.value } : {}),
        ...(primarySelections.color?.value ? { Color: primarySelections.color.value } : {}),
      };

      // Add to cart
      const cartResponse = await fetch("/api/henry/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          productsDetails: [
            {
              productId: detailsProductId ?? selectedProduct.id,
              name: productDetails.productResults.title,
              price: selectedProduct.price.toString(),
              quantity: 1,
              productLink:
                productDetails.productResults.stores[0]?.link || selectedProduct.productLink,
              productImageLink: getValidImageUrl(selectedProduct.imageUrl),
              metadata,
            },
          ],
        }),
      });

      const cartResult = await cartResponse.json();

      if (!cartResult.success) {
        throw new Error(cartResult.message || "Failed to add to cart");
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
        // Mobile: Redirect to checkout
        if (isMobile) {
          window.location.href = checkoutResult.data.checkout_url;
          return;
        }

        // Desktop: Open in iframe
        const url = new URL(checkoutResult.data.checkout_url);
        url.searchParams.set("embed", "true");
        setCheckoutIframeUrl(url.toString());
        setShowCheckoutIframe(true);
      } else {
        throw new Error(checkoutResult.message || "Failed to create checkout");
      }
    } catch (error) {
      console.error("Buy now error:", error);
      const errorMsg = error instanceof Error ? error.message : "An error occurred during checkout";
      setErrorMessage(errorMsg);
    } finally {
      setLoadingCheckout(false);
    }
  };

  // Generate user ID only on client side
  useEffect(() => {
    setUserId(`user_${Math.random().toString(36).substring(7)}`);
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Rotate search placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Listen for iframe completion messages
  useEffect(() => {
    if (!showCheckoutIframe) return;

    const handleMessage = (event: MessageEvent) => {
      // Check if message is from iframe with completion status
      if (event.data) {
        const { action, orderId, status } = event.data;

        // Check for checkout closed action from Done button
        if (action === "checkoutClosed") {
          console.log("Checkout closed", { orderId, status });
          handleCloseIframe();
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup listener
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [showCheckoutIframe, handleCloseIframe]);

  return (
    <main className="min-h-screen bg-gray-50">
      {heroView ? (
        <div className="min-h-screen flex flex-col">
          <Header userId={userId} />
          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-32">
            <HenryWordmark className="h-16 text-[#44c57e] mb-4" />
            <div className="w-full max-w-2xl">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={searchProducts}
                loading={loading}
                placeholder={placeholders[placeholderIndex]}
                inputRef={searchInputRef}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <Header userId={userId} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-12 flex justify-center">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={searchProducts}
                loading={loading}
                placeholder={placeholders[placeholderIndex]}
                inputRef={searchInputRef}
                className="w-full max-w-2xl"
              />
            </div>
            <ProductGrid products={products} loading={loading} onSelect={getProductDetails} />
          </div>

          {/* Product Details Modal */}
          <ProductModal
            isOpen={showProductModal && !!selectedProduct}
            onClose={handleCloseProductModal}
            viewMode={viewMode}
            setViewMode={setViewMode}
            detailsLoading={productDetailsLoading}
            loadingCheckout={loadingCheckout}
            loadingMessage={loadingMessage}
            productDetails={productDetails}
            selectedProduct={selectedProduct}
            selectedThumbnailIndex={selectedThumbnailIndex}
            setSelectedThumbnailIndex={setSelectedThumbnailIndex}
            selectedVariants={selectedVariants}
            onSelectVariant={handleVariantSelection}
            primarySelections={primarySelections as any}
            buyNow={buyNow}
            errorMessage={errorMessage}
            showCheckoutIframe={showCheckoutIframe}
            checkoutIframeUrl={checkoutIframeUrl}
            onCloseIframe={handleCloseIframe}
          />
        </>
      )}
    </main>
  );
}
