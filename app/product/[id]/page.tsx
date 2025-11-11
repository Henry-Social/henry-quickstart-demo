"use client";

import { useSearchParams } from "next/navigation";
import type { ProductDetails } from "@/lib/types";
import { getValidImageUrl } from "@/lib/utils";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  buildDefaultVariantSelections,
  getVariantPriority,
  findVariantSelection,
} from "@/lib/variants";
import Image from "next/image";

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;

  // Get product data from URL parameters (passed from mobile redirect)
  const urlImageUrl = searchParams.get("imageUrl") || "";
  const urlPrice = searchParams.get("price");
  const urlName = searchParams.get("name") || "";
  const urlProductLink = searchParams.get("productLink") || "";

  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCheckoutIframe, setShowCheckoutIframe] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [checkoutIframeUrl, setCheckoutIframeUrl] = useState<string | null>(
    null
  );
  const [userId] = useState(`user_${Math.random().toString(36).substring(7)}`);
  const [productPrice, setProductPrice] = useState<number>(
    urlPrice ? parseFloat(urlPrice) : 0
  );
  const [productName, setProductName] = useState<string>(urlName);
  const [productImage, setProductImage] = useState<string>(urlImageUrl);
  const [productLink, setProductLink] = useState<string>(urlProductLink);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});

  const handleVariantSelection = useCallback(
    (variantTitle: string, optionName: string) => {
      setSelectedVariants((prev) => {
        if (prev[variantTitle] === optionName) {
          return prev;
        }
        return {
          ...prev,
          [variantTitle]: optionName,
        };
      });
    },
    []
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

  // Handle closing the iframe
  const handleCloseIframe = useCallback(() => {
    setShowCheckoutIframe(false);
    setCheckoutIframeUrl(null);
  }, []);

  // Fetch product details
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product details
        const response = await fetch(
          `/api/henry/products/details?productId=${productId}`
        );
        const productResult = await response.json();

        // Process product details
        if (productResult?.success && productResult.data) {
          setProductDetails(productResult.data);
          setSelectedVariants(
            buildDefaultVariantSelections(productResult.data)
          );
          setSelectedThumbnailIndex(0);

          if (productResult.data.productResults) {
            setProductName(productResult.data.productResults.title);

            const firstStore = productResult.data.productResults.stores?.[0];
            if (firstStore?.price) {
              const price = parseFloat(
                firstStore.price.replace(/[^0-9.]/g, "")
              );
              setProductPrice(price || 0);
            }

            setProductImage(
              urlImageUrl || productResult.data.productResults.image || ""
            );

            const storeLink = firstStore?.link;
            if (storeLink) {
              setProductLink(storeLink);
            } else {
              setProductLink(urlProductLink || "");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // Buy now flow (cart checkout)
  const buyNow = async () => {
    if (!productDetails) return;

    setLoadingCheckout(true);
    setLoadingMessage("Processing...");

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
              productId: productId,
              name: productDetails.productResults.title,
              price: productPrice.toString(),
              quantity: 1,
              productLink:
                productDetails.productResults.stores[0]?.link || productLink,
              productImageLink: getValidImageUrl(productImage),
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
        // Open in same tab for mobile checkout
        window.location.href = checkoutResult.data.checkout_url;
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
  };

  return (
    <main className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="font-semibold text-[#44c57e]">Henry</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        {loading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#44c57e]"></div>
          </div>
        ) : !showCheckoutIframe ? (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 overflow-x-hidden">
            {productDetails ? (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="space-y-4 max-w-full overflow-hidden">
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
                          alt={
                            productDetails.productResults.title || productName
                          }
                          fill
                          className="object-contain p-4"
                          unoptimized
                        />
                      </>
                    ) : productDetails.productResults.image || productImage ? (
                      <>
                        <div className="absolute inset-0 image-gradient-overlay z-10 pointer-events-none" />
                        <Image
                          src={
                            productDetails.productResults.image || productImage
                          }
                          alt={
                            productDetails.productResults.title || productName
                          }
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
                                className={`relative flex-shrink-0 w-16 h-16 rounded-md border-2 transition-all bg-white ${
                                  selectedThumbnailIndex === index
                                    ? "border-[#44c57e] opacity-100 shadow-md"
                                    : "border-gray-300 opacity-80 hover:opacity-100 hover:border-gray-400"
                                }`}
                              >
                                <Image
                                  src={thumbnail}
                                  alt={`${
                                    productDetails.productResults.title ||
                                    productName
                                  } - View ${index + 1}`}
                                  fill
                                  className="object-contain p-1.5 rounded-sm"
                                  unoptimized
                                />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {productDetails.productResults.title || productName}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      by {productDetails.productResults.brand}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-4xl font-bold text-[#44c57e]">
                    ${productPrice.toFixed(2)}
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
                    <span className="text-gray-600">
                      {productDetails.productResults.rating}/5 (
                      {productDetails.productResults.reviews} reviews)
                    </span>
                  </div>

                  {/* Variants */}
                  {(primarySelections.size || primarySelections.color) && (
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
                      <h4 className="font-medium mb-3 text-lg">
                        {variant.title}:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {variant.items.map((item) => {
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
                                  handleVariantSelection(
                                    variant.title,
                                    item.name
                                  );
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
                      onClick={buyNow}
                      disabled={loadingCheckout}
                      className="w-full py-3 bg-[#44c57e] text-white rounded-lg font-semibold hover:bg-[#3aaa6a] disabled:opacity-50 transition-colors"
                    >
                      {loadingCheckout ? loadingMessage : "Add to Cart & Buy"}
                    </button>

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
        ) : (
          /* Checkout Iframe */
          <div
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            style={{ height: "80vh" }}
          >
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">
                {"Complete Your Purchase"}
              </h3>
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

            <div className="relative h-full">
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
    </main>
  );
}
