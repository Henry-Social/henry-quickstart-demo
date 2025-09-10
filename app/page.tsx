"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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

type CheckoutMethod = 'cart' | 'saved-card' | 'guest';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");
  const [userId, setUserId] = useState("demo_user");
  const [checkoutMethod, setCheckoutMethod] = useState<CheckoutMethod>('cart');
  const [hasCollectedCard, setHasCollectedCard] = useState(false);
  const [checkoutResponse, setCheckoutResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate user ID only on client side
  useEffect(() => {
    setUserId(`user_${Math.random().toString(36).substring(7)}`);
  }, []);

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

    try {
      const response = await fetch(
        `/api/henry/products/details?productId=${product.id}`,
      );
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
        // Set the response to show the link
        setCheckoutResponse({
          ...result,
          instruction: "Click the link below to save your card:",
          modal_url: result.data.modal_url
        });
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
  
  // Handle card collection link click
  const handleCardCollectionClick = (url: string) => {
    window.open(url, "_blank");
    // After 3 seconds, mark as collected
    setTimeout(() => {
      setHasCollectedCard(true);
      setCheckoutResponse(null);
    }, 3000);
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
        // Set the response to show the link
        setCheckoutResponse({
          ...result,
          instruction: "Click the link below to save your card as guest:",
          modal_url: result.data.modal_url
        });
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
              productDetails.productResults.stores[0]?.link ||
              selectedProduct.productLink,
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
                productDetails.productResults.stores[0]?.link ||
                selectedProduct.productLink,
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
        // Open checkout in new tab
        window.open(checkoutResult.data.checkout_url, "_blank");
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
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Henry Checkout Flows Demo</h1>
          <p className="text-sm md:text-base text-gray-600">Showcase of different checkout methods with Henry API</p>
          <p className="text-xs md:text-sm text-gray-500 mt-2">User ID: {userId}</p>
        </div>

        {/* Checkout Method Tabs */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-center">
            <div className="inline-flex flex-col sm:flex-row w-full sm:w-auto rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => {
                  setCheckoutMethod('cart');
                  setHasCollectedCard(false);
                  setCheckoutResponse(null);
                  setErrorMessage(null);
                }}
                className={`px-3 py-2 text-sm md:text-base md:px-4 rounded-md transition ${
                  checkoutMethod === 'cart'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cart Checkout
              </button>
              <button
                onClick={() => {
                  setCheckoutMethod('saved-card');
                  setHasCollectedCard(false);
                  setCheckoutResponse(null);
                  setErrorMessage(null);
                }}
                className={`px-3 py-2 text-sm md:text-base md:px-4 rounded-md transition ${
                  checkoutMethod === 'saved-card'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Saved Card
              </button>
              <button
                onClick={() => {
                  setCheckoutMethod('guest');
                  setHasCollectedCard(false);
                  setCheckoutResponse(null);
                  setErrorMessage(null);
                }}
                className={`px-3 py-2 text-sm md:text-base md:px-4 rounded-md transition ${
                  checkoutMethod === 'guest'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Guest Checkout
              </button>
            </div>
          </div>
          <div className="text-center mt-4 text-xs md:text-sm text-gray-600 px-4">
            {checkoutMethod === 'cart' && (
              <p>Add products to cart, then checkout all at once<br className="sm:hidden"/> (uses /cart/checkout)</p>
            )}
            {checkoutMethod === 'saved-card' && (
              <p>Save your card first, then checkout single products<br className="sm:hidden"/> (uses /wallet/card-collect + /checkout/single)</p>
            )}
            {checkoutMethod === 'guest' && (
              <p>Guest card collection, then checkout single products<br className="sm:hidden"/> (uses /wallet/card-collect-guest + /checkout/single)</p>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchProducts()}
              placeholder="Search for products (e.g., nike shoes)"
              className="flex-1 px-3 py-2 text-sm md:text-base md:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchProducts}
              disabled={loading}
              className="px-4 py-2 text-sm md:text-base md:px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Products List */}
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Search Results</h2>
            {products.length === 0 ? (
              <div className="text-sm md:text-base text-gray-500 text-center py-6 md:py-8 border rounded-lg">
                No products found. Try searching for something!
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => getProductDetails(product)}
                    className={`p-3 md:p-4 border rounded-lg cursor-pointer hover:shadow-lg transition ${
                      selectedProduct?.id === product.id
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3 md:gap-4">
                      {product.imageUrl && (
                        <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm md:text-base line-clamp-2">{product.name}</h3>
                        <p className="text-xl md:text-2xl font-bold text-green-600">
                          ${product.price}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500">
                          from {product.source}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="order-first lg:order-last">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Product Details</h2>
            {!selectedProduct ? (
              <div className="text-sm md:text-base text-gray-500 text-center py-6 md:py-8 border rounded-lg">
                Select a product to view details
              </div>
            ) : loading ? (
              <div className="text-center py-6 md:py-8 border rounded-lg">
                <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-sm md:text-base text-gray-600">Loading details...</p>
              </div>
            ) : loadingCheckout ? (
              <div className="text-center py-6 md:py-8 border rounded-lg">
                <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-sm md:text-base text-gray-600">Fetching checkout link...</p>
              </div>
            ) : productDetails ? (
              <div className="border rounded-lg p-4 md:p-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2">
                  {productDetails.productResults.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                  by {productDetails.productResults.brand}
                </p>

                {/* Product Image */}
                {(productDetails.productResults.image ||
                  (productDetails.relatedSearches &&
                    productDetails.relatedSearches[0]?.image)) && (
                  <div className="relative w-full aspect-square mb-3 md:mb-4">
                    <Image
                      src={
                        productDetails.productResults.image ||
                        productDetails.relatedSearches[0].image
                      }
                      alt={productDetails.productResults.title}
                      fill
                      className="object-cover rounded"
                      unoptimized
                    />
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="flex text-sm md:text-base">
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
                  <span className="text-xs md:text-sm text-gray-600">
                    {productDetails.productResults.rating}/5 (
                    {productDetails.productResults.reviews} reviews)
                  </span>
                </div>

                {/* Variants */}
                {productDetails.productResults.variants.map((variant) => (
                  <div key={variant.title} className="mb-3 md:mb-4">
                    <h4 className="font-medium text-sm md:text-base mb-2">{variant.title}:</h4>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {variant.items.map((item) => (
                        <span
                          key={item.name}
                          className={`px-2 py-1 md:px-3 text-xs md:text-sm border rounded ${
                            item.selected
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100"
                          } ${!item.available ? "opacity-50 line-through" : ""}`}
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Checkout Buttons based on selected method */}
                {checkoutMethod === 'cart' && (
                  <button
                    onClick={buyNow}
                    disabled={loadingCheckout}
                    className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                  >
                    {loadingCheckout ? loadingMessage : "Add to Cart & Checkout"}
                  </button>
                )}

                {checkoutMethod === 'saved-card' && (
                  <div className="space-y-2">
                    {!hasCollectedCard ? (
                      <button
                        onClick={collectCard}
                        disabled={loadingCheckout}
                        className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
                      >
                        {loadingCheckout ? loadingMessage : "Step 1: Save Your Card"}
                      </button>
                    ) : (
                      <button
                        onClick={singleCheckout}
                        disabled={loadingCheckout}
                        className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                      >
                        {loadingCheckout ? loadingMessage : "Step 2: Checkout with Saved Card"}
                      </button>
                    )}
                    {hasCollectedCard && (
                      <p className="text-sm text-green-600 text-center">✓ Card collected successfully</p>
                    )}
                    {errorMessage && (
                      <div className="mt-3 p-3 bg-red-100 rounded-lg">
                        <p className="text-xs md:text-sm text-red-700">{errorMessage}</p>
                      </div>
                    )}
                    {checkoutResponse && (
                      <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-100 rounded-lg">
                        {checkoutResponse.instruction ? (
                          <>
                            <p className="text-xs md:text-sm font-semibold mb-2">{checkoutResponse.instruction}</p>
                            <button 
                              onClick={() => handleCardCollectionClick(checkoutResponse.modal_url)}
                              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                              Open Card Collection
                            </button>
                            <p className="text-xs text-gray-600 mt-2">After clicking, wait 3 seconds to proceed to checkout</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs md:text-sm font-semibold mb-2">API Response:</p>
                            <pre className="text-xs bg-white p-2 rounded overflow-x-auto max-h-64">
                              {JSON.stringify(checkoutResponse, null, 2)}
                            </pre>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {checkoutMethod === 'guest' && (
                  <div className="space-y-2">
                    {!hasCollectedCard ? (
                      <button
                        onClick={collectGuestCard}
                        disabled={loadingCheckout}
                        className="w-full py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 disabled:opacity-50"
                      >
                        {loadingCheckout ? loadingMessage : "Step 1: Guest Card Collection"}
                      </button>
                    ) : (
                      <button
                        onClick={singleCheckout}
                        disabled={loadingCheckout}
                        className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                      >
                        {loadingCheckout ? loadingMessage : "Step 2: Complete Guest Checkout"}
                      </button>
                    )}
                    {errorMessage && (
                      <div className="mt-3 p-3 bg-red-100 rounded-lg">
                        <p className="text-xs md:text-sm text-red-700">{errorMessage}</p>
                      </div>
                    )}
                    {checkoutResponse && (
                      <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-100 rounded-lg">
                        {checkoutResponse.instruction ? (
                          <>
                            <p className="text-xs md:text-sm font-semibold mb-2">{checkoutResponse.instruction}</p>
                            <button 
                              onClick={() => handleCardCollectionClick(checkoutResponse.modal_url)}
                              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                              Open Card Collection
                            </button>
                            <p className="text-xs text-gray-600 mt-2">After clicking, wait 3 seconds to proceed to checkout</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs md:text-sm font-semibold mb-2">API Response:</p>
                            <pre className="text-xs bg-white p-2 rounded overflow-x-auto max-h-64">
                              {JSON.stringify(checkoutResponse, null, 2)}
                            </pre>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
