"use client";

import Image from "next/image";
import { useMemo } from "react";
import CheckoutModal from "@/components/CheckoutModal";
import type { Product, ProductDetails } from "@/lib/types";
import { getVariantPriority } from "@/lib/variants";

export type ViewMode = "desktop" | "mobile";

type PrimarySelections = {
  size: { title: string; value?: string } | null;
  color: { title: string; value?: string } | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  detailsLoading: boolean;
  loadingCheckout: boolean;
  loadingMessage: string;
  productDetails: ProductDetails | null;
  selectedProduct: Product | null;
  selectedThumbnailIndex: number;
  setSelectedThumbnailIndex: (i: number) => void;
  selectedVariants: Record<string, string>;
  onSelectVariant: (variantTitle: string, optionName: string) => void;
  primarySelections: PrimarySelections;
  buyNow: () => void;
  errorMessage: string | null;
  showCheckoutIframe: boolean;
  checkoutIframeUrl: string | null;
  onCloseIframe: () => void;
};

export default function ProductModal({
  isOpen,
  onClose,
  viewMode,
  setViewMode,
  detailsLoading,
  loadingCheckout,
  loadingMessage,
  productDetails,
  selectedProduct,
  selectedThumbnailIndex,
  setSelectedThumbnailIndex,
  selectedVariants,
  onSelectVariant,
  primarySelections,
  buyNow,
  errorMessage,
  showCheckoutIframe,
  checkoutIframeUrl,
  onCloseIframe,
}: Props) {
  const sortedVariants = useMemo(() => {
    const variants = productDetails?.productResults?.variants;
    if (!variants || variants.length === 0) {
      return [];
    }
    return [...variants].sort((a, b) => getVariantPriority(b.title) - getVariantPriority(a.title));
  }, [productDetails]);

  if (!isOpen || !selectedProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 modal-overlay"
        onClick={() => !showCheckoutIframe && onClose()}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl modal-content overflow-hidden transition-all duration-300 ${
          viewMode === "desktop" ? "w-[min(1512px,90vw)] h-[min(982px,90%)]" : "w-[430px] h-[100%]"
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2z"
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="relative overflow-y-auto" style={{ height: "calc(100% - 72px)" }}>
              {detailsLoading && (
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
                                productDetails.productResults.thumbnails![selectedThumbnailIndex]
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
                                productDetails.relatedSearches![0].image!
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
                              {productDetails.productResults.thumbnails!.map((thumbnail, index) => (
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
                                    alt={`${
                                      productDetails.productResults.title
                                    } - View ${index + 1}`}
                                    fill
                                    className="object-contain p-1.5 rounded-sm"
                                    unoptimized
                                  />
                                </button>
                              ))}
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
                          {productDetails.productResults.rating} (
                          {productDetails.productResults.reviews} reviews)
                        </span>
                      </div>

                      {/* Selected Variant Summary */}
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

                      {/* Variants */}
                      {sortedVariants?.map((variant) => (
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
                                    if (isAvailable) onSelectVariant(variant.title, item.name);
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

                      {/* Checkout Button */}
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
                </div>
              ) : !detailsLoading ? (
                <div className="p-6 text-center py-12 text-gray-500">
                  Unable to load product details
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <CheckoutModal url={checkoutIframeUrl} onClose={onCloseIframe} />
        )}
      </div>
    </div>
  );
}
