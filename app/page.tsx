"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useRef } from "react";
import HenryWordmark from "@/assets/henry-wordmark";
import { getValidImageUrl } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  productLink: string;
  source: string;
}

interface ProductDetails {
  productResults: {
    title: string;
    brand: string;
    reviews: number;
    rating: number;
    image?: string;
    thumbnails?: string[];
    stores: Array<{
      name: string;
      link: string;
      price: string;
      shipping: string;
      total: string;
    }>;
    variants: Array<{
      title: string;
      items: Array<{
        name: string;
        selected?: boolean;
        available?: boolean;
      }>;
    }>;
  };
  relatedSearches: Array<{
    query: string;
    image: string;
    link: string;
  }>;
}

type CheckoutMethod = "cart" | "saved-card" | "guest";
type ViewMode = "desktop" | "mobile";

const buildDefaultVariantSelections = (details: ProductDetails): Record<string, string> => {
  const variants = details.productResults.variants;
  if (!variants || variants.length === 0) {
    return {};
  }

  return variants.reduce<Record<string, string>>((acc, variant) => {
    const selectedItem =
      variant.items.find((item) => item.selected && item.available !== false) ||
      variant.items.find((item) => item.available !== false) ||
      variant.items[0];

    if (selectedItem) {
      acc[variant.title] = selectedItem.name;
    }

    return acc;
  }, {});
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");
  const [userId, setUserId] = useState("demo_user");
  const [checkoutMethod, setCheckoutMethod] = useState<CheckoutMethod>("cart");
  const [hasCollectedCard, setHasCollectedCard] = useState(false);
  const [checkoutResponse, setCheckoutResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCheckoutIframe, setShowCheckoutIframe] = useState(false);
  const [checkoutIframeUrl, setCheckoutIframeUrl] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isCardCollection, setIsCardCollection] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [heroView, setHeroView] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const placeholders = [
    "Yoga mats with good grip",
    "Nike shoes",
    "Summer dresses",
    "Wireless headphones",
    "Organic skincare",
    "Running gear",
  ];

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

  // Handle closing the iframe
  const handleCloseIframe = useCallback(() => {
    // If this was a card collection flow, mark card as collected
    if (isCardCollection) {
      setHasCollectedCard(true);
      setIsCardCollection(false);
    }
    setShowCheckoutIframe(false);
    setCheckoutIframeUrl(null);
    setIframeLoading(true);
  }, [isCardCollection]);

  // Close product modal
  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
    setProductDetails(null);
    setShowCheckoutIframe(false);
    setCheckoutIframeUrl(null);
    setExpandedVariants({});
    setSelectedThumbnailIndex(0);
    setSelectedVariants({});
  };

  const handleVariantSelection = useCallback((variantTitle: string, optionName: string) => {
    setSelectedVariants((prev) => {
      if (prev[variantTitle] === optionName) {
        return prev;
      }

      return {
        ...prev,
        [variantTitle]: optionName,
      };
    });
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
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get product details
  const getProductDetails = async (product: Product) => {
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
    setLoading(true);
    setSelectedProduct(product);
    setShowProductModal(true);
    setSelectedVariants({});

    try {
      // Fetch product details first
      const response = await fetch(`/api/henry/products/details?productId=${product.id}`);
      const productResult = await response.json();

      if (productResult?.success && productResult.data) {
        setProductDetails(productResult.data);
        setSelectedVariants(buildDefaultVariantSelections(productResult.data));
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  // Collect card for authenticated user
  const collectCard = async () => {
    setLoadingCheckout(true);
    setLoadingMessage("Getting card collection link...");
    setErrorMessage(null);
    setCheckoutResponse(null);

    try {
      const response = await fetch("/api/henry/wallet/card-collect", {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
      });

      const result = await response.json();

      if (result.success && result.data?.modal_url) {
        // Mobile: Open in new tab
        if (isMobile) {
          window.open(result.data.modal_url, "_blank");
          setLoadingCheckout(false);
          return;
        }

        // Desktop: Open in iframe
        const url = new URL(result.data.modal_url);
        url.searchParams.set("embed", "true");
        setCheckoutIframeUrl(url.toString());
        setShowCheckoutIframe(true);
        setIframeLoading(true);
        setIsCardCollection(true);
      } else {
        setErrorMessage(result.message || "Failed to initiate card collection");
      }
    } catch (error) {
      console.error("Card collection error:", error);
      setErrorMessage("An error occurred while collecting card");
    } finally {
      setLoadingCheckout(false);
    }
  };

  // Collect card for guest user
  const collectGuestCard = async () => {
    setLoadingCheckout(true);
    setLoadingMessage("Getting guest card collection link...");
    setErrorMessage(null);
    setCheckoutResponse(null);

    try {
      const response = await fetch("/api/henry/wallet/card-collect-guest", {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
      });

      const result = await response.json();

      if (result.success && result.data?.modal_url) {
        // Mobile: Open in new tab
        if (isMobile) {
          window.open(result.data.modal_url, "_blank");
          setLoadingCheckout(false);
          return;
        }

        // Desktop: Open in iframe
        const url = new URL(result.data.modal_url);
        url.searchParams.set("embed", "true");
        setCheckoutIframeUrl(url.toString());
        setShowCheckoutIframe(true);
        setIframeLoading(true);
        setIsCardCollection(true);
      } else {
        setErrorMessage(result.message || "Failed to initiate guest card collection");
      }
    } catch (error) {
      console.error("Guest card collection error:", error);
      setErrorMessage("An error occurred while collecting guest card");
    } finally {
      setLoadingCheckout(false);
    }
  };

  // Single product checkout
  const singleCheckout = async () => {
    if (!selectedProduct || !productDetails) return;

    setLoadingCheckout(true);
    setLoadingMessage("Processing single product checkout...");
    setErrorMessage(null);
    setCheckoutResponse(null);

    try {
      const variantMetadata = getVariantMetadata();

      const checkoutResponse = await fetch("/api/henry/checkout/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          shippingDetails: {
            fullName: "Demo User",
            email: "demo@example.com",
            phoneNumber: "+1234567890",
            addressLine1: "123 Demo Street",
            countryCode: "US",
            city: "New York",
            stateOrProvince: "NY",
            postalCode: "10001",
          },
          productDetails: {
            productId: selectedProduct.id,
            name: productDetails.productResults.title,
            price: selectedProduct.price.toString(),
            quantity: 1,
            productLink:
              productDetails.productResults.stores[0]?.link || selectedProduct.productLink,
            productImageLink: getValidImageUrl(selectedProduct.imageUrl),
            metadata: variantMetadata,
          },
        }),
      });

      const checkoutResult = await checkoutResponse.json();

      if (checkoutResult.success) {
        setCheckoutResponse(checkoutResult);
      } else {
        setErrorMessage(checkoutResult.message || "Failed to complete checkout");
        setCheckoutResponse(checkoutResult);
      }
    } catch (error) {
      console.error("Single checkout error:", error);
      setErrorMessage("An error occurred during checkout");
    } finally {
      setLoadingCheckout(false);
    }
  };

  // Buy now flow (cart checkout)
  const buyNow = async () => {
    if (!selectedProduct || !productDetails) return;

    setLoadingCheckout(true);
    setLoadingMessage("Processing...");

    try {
      const variantMetadata = getVariantMetadata();

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
              productId: selectedProduct.id,
              name: productDetails.productResults.title,
              price: selectedProduct.price.toString(),
              quantity: 1,
              productLink:
                productDetails.productResults.stores[0]?.link || selectedProduct.productLink,
              productImageLink: getValidImageUrl(selectedProduct.imageUrl),
              metadata: variantMetadata,
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

  return (
    <main className="min-h-screen bg-gray-50">
      {heroView ? (
        <div className="min-h-screen flex flex-col">
          {/* Top bar with checkout options */}
          <div className="bg-white py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-end items-center space-x-4">
                {/* Checkout method dropdown temporarily hidden
                <div className="relative">
                  <select
                    value={checkoutMethod}
                    onChange={(e) => {
                      setCheckoutMethod(e.target.value as CheckoutMethod);
                      setHasCollectedCard(false);
                      setCheckoutResponse(null);
                      setErrorMessage(null);
                    }}
                    className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#44c57e]"
                  >
                    <option value="cart">Cart Checkout</option>
                    <option value="saved-card">Saved Card</option>
                    <option value="guest">Guest Checkout</option>
                  </select>
                  <svg
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                */}
                <div className="text-xs text-gray-500">{userId}</div>
              </div>
            </div>
          </div>

          {/* Centered content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-32">
            {/* Henry Labs Logo */}
            <HenryWordmark className="h-16 text-[#44c57e] mb-4" />

            {/* Circular Search Bar */}
            <div className="w-full max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full pl-12 pr-20 py-4 text-lg bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#44c57e] focus:ring-4 focus:ring-[#44c57e]/20 transition-all duration-200 shadow-lg"
                />
                <button
                  onClick={searchProducts}
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-[#44c57e] text-white rounded-full hover:bg-[#3aaa6a] disabled:opacity-50 transition-colors duration-200"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M12 2a10 10 0 00-10 10h4a6 6 0 016-6V2zM2 12a10 10 0 0010 10v-4a6 6 0 01-6-6H2z"
                      ></path>
                    </svg>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Normal Header */}
          <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center">
                  <HenryWordmark className="h-8 text-[#44c57e]" />
                </div>

                {/* Checkout Options */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <select
                      value={checkoutMethod}
                      onChange={(e) => {
                        setCheckoutMethod(e.target.value as CheckoutMethod);
                        setHasCollectedCard(false);
                        setCheckoutResponse(null);
                        setErrorMessage(null);
                      }}
                      className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#44c57e]"
                    >
                      <option value="cart">Cart Checkout</option>
                      <option value="saved-card">Saved Card</option>
                      <option value="guest">Guest Checkout</option>
                    </select>
                    <svg
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-500">{userId}</div>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Circular Search Bar */}
            <div className="mb-12 flex justify-center">
              <div className="relative w-full max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full pl-12 pr-20 py-4 text-lg bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#44c57e] focus:ring-4 focus:ring-[#44c57e]/20 transition-all duration-200 shadow-lg"
                />
                <button
                  onClick={searchProducts}
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-[#44c57e] text-white rounded-full hover:bg-[#3aaa6a] disabled:opacity-50 transition-colors duration-200"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M12 2a10 10 0 00-10 10h4a6 6 0 016-6V2zM2 12a10 10 0 0010 10v-4a6 6 0 01-6-6H2z"
                      ></path>
                    </svg>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="product-grid">
                {[...Array(15)].map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                  >
                    <div className="skeleton aspect-square" />
                    <div className="p-4 space-y-3">
                      <div className="skeleton h-3 w-16 rounded" />
                      <div className="space-y-2">
                        <div className="skeleton h-3 w-full rounded" />
                        <div className="skeleton h-3 w-3/4 rounded" />
                      </div>
                      <div className="pt-2">
                        <div className="skeleton h-5 w-20 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-gray-500 text-center py-16">
                <svg
                  className="mx-auto h-24 w-24 text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-2">Try searching for something!</p>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => getProductDetails(product)}
                    className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden group"
                  >
                    {product.imageUrl && (
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-4 flex flex-col h-32">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                        {product.source}
                      </p>
                      <h3 className="text-sm text-gray-900 line-clamp-2 mb-auto">{product.name}</h3>
                      <div className="pt-2">
                        <p className="text-base font-bold text-black">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Modal */}
          {showProductModal && selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-black bg-opacity-50 modal-overlay"
                onClick={() => !showCheckoutIframe && handleCloseProductModal()}
              />

              {/* Modal Content */}
              <div
                className={`relative bg-white rounded-2xl shadow-2xl modal-content overflow-hidden transition-all duration-300 ${
                  viewMode === "desktop"
                    ? "w-[min(1512px,90vw)] h-[min(982px,90vh)]"
                    : "w-[430px] h-[932px]"
                }`}
              >
                {!showCheckoutIframe ? (
                  <>
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                      <h2 className="text-xl font-bold">Product Details</h2>
                      <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setViewMode("desktop")}
                            className={`p-2 rounded transition-colors ${
                              viewMode === "desktop" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            }`}
                            aria-label="Desktop view"
                            title="Desktop view"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setViewMode("mobile")}
                            className={`p-2 rounded transition-colors ${
                              viewMode === "mobile" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            }`}
                            aria-label="Mobile view"
                            title="Mobile view"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                        <button
                          onClick={handleCloseProductModal}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          aria-label="Close"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Modal Body */}
                    <div
                      className="relative overflow-y-auto"
                      style={{ height: "calc(100% - 72px)" }}
                    >
                      {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#44c57e]"></div>
                            <p className="mt-4 text-gray-600">Loading product details...</p>
                          </div>
                        </div>
                      )}
                      {productDetails ? (
                        <div className="p-4">
                          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4">
                            {/* Product Image */}
                            <div className="space-y-4">
                              {/* Main Image */}
                              <div className="relative h-80 rounded-lg overflow-hidden bg-white shadow-inner">
                                {productDetails.productResults.thumbnails &&
                                productDetails.productResults.thumbnails.length > 0 ? (
                                  <>
                                    <div className="absolute inset-0 image-gradient-overlay z-10 pointer-events-none" />
                                    <Image
                                      src={
                                        productDetails.productResults.thumbnails![
                                          selectedThumbnailIndex
                                        ]
                                      }
                                      alt={productDetails.productResults.title}
                                      fill
                                      className="object-contain p-4"
                                      unoptimized
                                    />
                                  </>
                                ) : productDetails.productResults.image ||
                                  selectedProduct.imageUrl ||
                                  productDetails.relatedSearches?.[0]?.image ? (
                                  <>
                                    <div className="absolute inset-0 image-gradient-overlay z-10 pointer-events-none" />
                                    <Image
                                      src={
                                        productDetails.productResults.image ||
                                        selectedProduct.imageUrl ||
                                        productDetails.relatedSearches[0].image
                                      }
                                      alt={productDetails.productResults.title}
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

                              {/* Thumbnails Carousel */}
                              {productDetails.productResults.thumbnails &&
                                productDetails.productResults.thumbnails.length > 1 && (
                                  <div className="overflow-x-auto pb-2 max-w-full [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
                                    <div className="flex gap-2 py-1 px-0.5 min-w-min">
                                      {productDetails.productResults.thumbnails!.map(
                                        (thumbnail, index) => (
                                          <button
                                            key={index}
                                            onClick={() => setSelectedThumbnailIndex(index)}
                                            className={`relative flex-shrink-0 w-14 h-14 rounded-md border-2 transition-all bg-white ${
                                              selectedThumbnailIndex === index
                                                ? "border-[#44c57e] opacity-100 shadow-md"
                                                : "border-gray-300 opacity-80 hover:opacity-100 hover:border-gray-400"
                                            }`}
                                          >
                                            <Image
                                              src={thumbnail}
                                              alt={`${productDetails.productResults.title} - View ${index + 1}`}
                                              fill
                                              className="object-contain p-1.5 rounded-sm"
                                              unoptimized
                                            />
                                          </button>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="space-y-3">
                              <div>
                                <h3 className="text-xl font-bold mb-1">
                                  {productDetails.productResults.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  by {productDetails.productResults.brand}
                                </p>
                              </div>

                              {/* Price */}
                              <div className="text-2xl font-bold text-[#44c57e]">
                                ${selectedProduct.price}
                              </div>

                              {/* Rating */}
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={
                                        i < Math.floor(productDetails.productResults.rating)
                                          ? "text-yellow-500"
                                          : "text-gray-300"
                                      }
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {productDetails.productResults.rating}/5 (
                                  {productDetails.productResults.reviews} reviews)
                                </span>
                              </div>

                              {/* Variants */}
                              {productDetails.productResults.variants.map((variant) => {
                                const isExpanded = expandedVariants[variant.title];
                                const itemsToShow = isExpanded
                                  ? variant.items
                                  : variant.items.slice(0, 8);
                                const hasMore = variant.items.length > 8;

                                return (
                                  <div key={variant.title}>
                                    <h4 className="font-medium mb-2">{variant.title}:</h4>
                                    <div className="relative">
                                      <div
                                        className={`flex flex-wrap gap-2 ${
                                          !isExpanded && hasMore ? "max-h-24 overflow-hidden" : ""
                                        }`}
                                      >
                                        {itemsToShow.map((item) => {
                                          const isAvailable = item.available !== false;
                                          const isSelected =
                                            selectedVariants[variant.title] === item.name;

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
                                      {hasMore && (
                                        <button
                                          onClick={() =>
                                            setExpandedVariants((prev) => ({
                                              ...prev,
                                              [variant.title]: !prev[variant.title],
                                            }))
                                          }
                                          className="mt-2 text-sm text-[#44c57e] hover:text-[#3aaa6a] font-medium flex items-center gap-1"
                                        >
                                          <span>
                                            {isExpanded
                                              ? "Show less"
                                              : `Show ${variant.items.length - 8} more`}
                                          </span>
                                          <svg
                                            className={`w-4 h-4 transition-transform ${
                                              isExpanded ? "rotate-180" : ""
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M19 9l-7 7-7-7"
                                            />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Checkout Buttons */}
                              <div className="pt-4 space-y-3">
                                {checkoutMethod === "cart" && (
                                  <button
                                    onClick={buyNow}
                                    disabled={loadingCheckout}
                                    className="w-full py-3 bg-[#44c57e] text-white rounded-lg font-semibold hover:bg-[#3aaa6a] disabled:opacity-50 transition-colors"
                                  >
                                    {loadingCheckout ? loadingMessage : "Add to Cart & Buy"}
                                  </button>
                                )}

                                {checkoutMethod === "saved-card" && (
                                  <>
                                    {!hasCollectedCard ? (
                                      <button
                                        onClick={collectCard}
                                        disabled={loadingCheckout}
                                        className="w-full py-3 bg-[#44c57e] text-white rounded-lg font-semibold hover:bg-[#3aaa6a] disabled:opacity-50 transition-colors"
                                      >
                                        {loadingCheckout ? loadingMessage : "Save Card First"}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={singleCheckout}
                                        disabled={loadingCheckout}
                                        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                                      >
                                        {loadingCheckout ? loadingMessage : "Buy with Saved Card"}
                                      </button>
                                    )}
                                    {hasCollectedCard && (
                                      <p className="text-sm text-green-600 text-center">
                                        ✓ Card saved successfully
                                      </p>
                                    )}
                                  </>
                                )}

                                {checkoutMethod === "guest" && (
                                  <>
                                    {!hasCollectedCard ? (
                                      <button
                                        onClick={collectGuestCard}
                                        disabled={loadingCheckout}
                                        className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                      >
                                        {loadingCheckout ? loadingMessage : "Guest Card Collection"}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={singleCheckout}
                                        disabled={loadingCheckout}
                                        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                                      >
                                        {loadingCheckout
                                          ? loadingMessage
                                          : "Complete Guest Checkout"}
                                      </button>
                                    )}
                                    {hasCollectedCard && (
                                      <p className="text-sm text-green-600 text-center">
                                        ✓ Card collected successfully
                                      </p>
                                    )}
                                  </>
                                )}

                                {errorMessage && (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">{errorMessage}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : !loading ? (
                        <div className="p-6 text-center py-12 text-gray-500">
                          Unable to load product details
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  /* Checkout Iframe within Modal */
                  <div className="relative h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
                      <h3 className="text-lg font-semibold">
                        {isCardCollection ? "Save Your Card" : "Complete Your Purchase"}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setViewMode("desktop")}
                            className={`p-2 rounded transition-colors ${
                              viewMode === "desktop" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            }`}
                            aria-label="Desktop view"
                            title="Desktop view"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setViewMode("mobile")}
                            className={`p-2 rounded transition-colors ${
                              viewMode === "mobile" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            }`}
                            aria-label="Mobile view"
                            title="Mobile view"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                        <button
                          onClick={handleCloseIframe}
                          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          aria-label="Close"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 relative">
                      {iframeLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#44c57e]"></div>
                            <p className="mt-4 text-gray-600">Loading checkout...</p>
                          </div>
                        </div>
                      )}

                      <iframe
                        src={checkoutIframeUrl ?? undefined}
                        className="w-full h-full"
                        title="Checkout"
                        allow="payment"
                        onLoad={() => setIframeLoading(false)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
