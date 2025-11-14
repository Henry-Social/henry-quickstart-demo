"use client";

import Image from "next/image";
import type { Product as ProductCard } from "@/lib/types";

const skeletonItemKeys = Array.from({ length: 15 }, (_, idx) => `product-skeleton-${idx}`);

type Props = {
  products: ProductCard[];
  loading: boolean;
  onSelect: (p: ProductCard) => void;
};

export default function ProductGrid({ products, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="product-grid">
        {skeletonItemKeys.map((key) => (
          <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
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
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-gray-500 text-center py-16">
        <svg
          className="mx-auto h-24 w-24 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <title>No products</title>
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
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product)}
          type="button"
          className="w-full bg-white text-left rounded-lg shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden group"
          aria-label={`Open details for ${product.name}`}
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
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{product.source}</p>
            <h3 className="text-sm text-gray-900 line-clamp-2 mb-auto">{product.name}</h3>
            <div className="pt-2">
              <p className="text-base font-bold text-black">${product.price.toFixed(2)}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
