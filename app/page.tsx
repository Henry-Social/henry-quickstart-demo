"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useRef } from "react";

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
  };

  // Listen for iframe completion messages
  useEffect(() => {
    if (!showCheckoutIframe) return;

    const handleMessage = (event: MessageEvent) => {
      // Check if message is from iframe with completion status
      if (event.data) {
        const { status, action } = event.data;

        // Check for completion status
        if (status === "complete" || action === "orderCompleted") {
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
    setLoading(true);
    setSelectedProduct(product);
    setShowProductModal(true);

    try {
      const response = await fetch(`/api/henry/products/details?productId=${product.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setProductDetails(result.data);
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
        // Open card collection in iframe popup
        // Add embed=true parameter for iframe context
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
        // Open guest card collection in iframe popup
        // Add embed=true parameter for iframe context
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
      const selectedSize = productDetails.productResults.variants
        .find((v) => v.title === "Size")
        ?.items.find((i) => i.selected)?.name;

      const selectedColor = productDetails.productResults.variants
        .find((v) => v.title === "Color")
        ?.items.find((i) => i.selected)?.name;

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
            productImageLink: selectedProduct.imageUrl,
            metadata: {
              Size: selectedSize || "",
              Color: selectedColor || "",
            },
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
      // Extract selected variants
      const selectedSize = productDetails.productResults.variants
        .find((v) => v.title === "Size")
        ?.items.find((i) => i.selected)?.name;

      const selectedColor = productDetails.productResults.variants
        .find((v) => v.title === "Color")
        ?.items.find((i) => i.selected)?.name;

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
              productImageLink: selectedProduct.imageUrl,
              metadata: {
                Size: selectedSize,
                Color: selectedColor,
              },
            },
          ],
        }),
      });

      const cartResult = await cartResponse.json();

      if (!cartResult.success) {
        throw new Error("Failed to add to cart");
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
        // Open checkout in iframe popup
        // Add embed=true parameter for iframe context
        const url = new URL(checkoutResult.data.checkout_url);
        url.searchParams.set("embed", "true");
        setCheckoutIframeUrl(url.toString());
        setShowCheckoutIframe(true);
      } else {
        throw new Error("Failed to create checkout");
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-blue-600">Henry Labs</h1>
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
                  className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full pl-12 pr-20 py-4 text-lg bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-lg"
            />
            <button
              onClick={searchProducts}
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
                    <p className="text-base font-bold text-black">${product.price.toFixed(2)}</p>
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
                  className="p-6 overflow-y-auto flex flex-col"
                  style={{ maxHeight: "calc(85vh - 80px)" }}
                >
                  {loading ? (
                    <div className="flex-1 flex justify-center items-center min-h-[400px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : productDetails ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Product Image */}
                      <div className="space-y-4">
                        {(productDetails.productResults.image || selectedProduct.imageUrl) && (
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={productDetails.productResults.image || selectedProduct.imageUrl}
                              alt={productDetails.productResults.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">
                            {productDetails.productResults.title}
                          </h3>
                          <p className="text-gray-600">by {productDetails.productResults.brand}</p>
                        </div>

                        {/* Price */}
                        <div className="text-3xl font-bold text-blue-600">
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
                                  {itemsToShow.map((item) => (
                                    <button
                                      key={item.name}
                                      disabled={!item.available}
                                      className={`px-4 py-2 border rounded-lg transition-colors ${
                                        item.selected
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : item.available
                                            ? "bg-white hover:bg-gray-50 border-gray-300"
                                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                      }`}
                                    >
                                      {item.name}
                                    </button>
                                  ))}
                                </div>
                                {hasMore && (
                                  <button
                                    onClick={() =>
                                      setExpandedVariants((prev) => ({
                                        ...prev,
                                        [variant.title]: !prev[variant.title],
                                      }))
                                    }
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
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
                              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
                                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
                                  {loadingCheckout ? loadingMessage : "Complete Guest Checkout"}
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
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Unable to load product details
                    </div>
                  )}
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    </main>
  );
}
