"use client";

import Image from "next/image";
import ProductMediaSkeleton from "@/components/ProductMediaSkeleton";
import type { ProductDetails } from "@/lib/types";

interface ProductMediaSectionProps {
  productDetails: ProductDetails | null;
  productName: string;
  fallbackImage: string;
  selectedThumbnailIndex: number;
  onThumbnailSelect: (index: number) => void;
  showSkeleton: boolean;
  onImageClick?: (src: string) => void;
}

export function ProductMediaSection({
  productDetails,
  productName,
  fallbackImage,
  selectedThumbnailIndex,
  onThumbnailSelect,
  showSkeleton,
  onImageClick,
}: ProductMediaSectionProps) {
  if (!productDetails || showSkeleton) {
    return <ProductMediaSkeleton className="max-w-full" />;
  }

  const productResults = productDetails.productResults;
  const thumbnails = productResults.thumbnails ?? [];
  const activeImage = thumbnails[selectedThumbnailIndex] || productResults.image || fallbackImage;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (activeImage) {
            onImageClick?.(activeImage);
          }
        }}
        className="relative h-80 w-full rounded-lg overflow-hidden bg-white shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
        aria-label="Expand product image"
      >
        {activeImage ? (
          <>
            <div className="absolute inset-0 image-gradient-overlay z-10 pointer-events-none" />
            <Image
              src={activeImage}
              alt={productResults.title || productName}
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
              <title>No image available</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </button>

      {thumbnails.length > 1 && (
        <div className="overflow-x-auto pb-2 max-w-full [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
          <div className="flex gap-2 py-1 px-0.5 min-w-min">
            {thumbnails.map((thumbnail, index) => (
              <button
                key={thumbnail || `thumbnail-${index}`}
                type="button"
                onClick={() => {
                  onThumbnailSelect(index);
                }}
                className={`relative flex-shrink-0 w-16 h-16 rounded-md border-2 transition-all bg-white ${
                  selectedThumbnailIndex === index
                    ? "border-brand-primary opacity-100 shadow-md"
                    : "border-gray-300 opacity-80 hover:opacity-100 hover:border-gray-400"
                }`}
              >
                <Image
                  src={thumbnail}
                  alt={`${productResults.title || productName} - View ${index + 1}`}
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
}
