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

  // Buy now flow
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
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Henry Quickstart Demo</h1>
          <p className="text-gray-600">Complete buy-now flow with Henry API</p>
          <p className="text-sm text-gray-500 mt-2">User ID: {userId}</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchProducts()}
              placeholder="Search for products (e.g., nike shoes, running shoes)"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchProducts}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Products List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            {products.length === 0 ? (
              <div className="text-gray-500 text-center py-8 border rounded-lg">
                No products found. Try searching for something!
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => getProductDetails(product)}
                    className={`p-4 border rounded-lg cursor-pointer hover:shadow-lg transition ${
                      selectedProduct?.id === product.id
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      {product.imageUrl && (
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-2xl font-bold text-green-600">
                          ${product.price}
                        </p>
                        <p className="text-sm text-gray-500">
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
          <div>
            <h2 className="text-xl font-semibold mb-4">Product Details</h2>
            {!selectedProduct ? (
              <div className="text-gray-500 text-center py-8 border rounded-lg">
                Select a product to view details
              </div>
            ) : loading ? (
              <div className="text-center py-8 border rounded-lg">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Loading details...</p>
              </div>
            ) : loadingCheckout ? (
              <div className="text-center py-8 border rounded-lg">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Fetching checkout link...</p>
              </div>
            ) : productDetails ? (
              <div className="border rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-2">
                  {productDetails.productResults.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  by {productDetails.productResults.brand}
                </p>

                {/* Product Image */}
                {(productDetails.productResults.image ||
                  (productDetails.relatedSearches &&
                    productDetails.relatedSearches[0]?.image)) && (
                  <div className="relative w-full aspect-square mb-4">
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
                <div className="flex items-center gap-2 mb-4">
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
                  <span className="text-gray-600">
                    {productDetails.productResults.rating}/5 (
                    {productDetails.productResults.reviews} reviews)
                  </span>
                </div>

                {/* Variants */}
                {productDetails.productResults.variants.map((variant) => (
                  <div key={variant.title} className="mb-4">
                    <h4 className="font-medium mb-2">{variant.title}:</h4>
                    <div className="flex flex-wrap gap-2">
                      {variant.items.map((item) => (
                        <span
                          key={item.name}
                          className={`px-3 py-1 border rounded ${
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

                {/* Buy Now Button */}
                <button
                  onClick={buyNow}
                  disabled={loadingCheckout}
                  className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  {loadingCheckout ? loadingMessage : "Buy Now with Henry"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
