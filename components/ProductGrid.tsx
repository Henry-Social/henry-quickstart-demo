"use client";

import Image from "next/image";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

const skeletonItemKeys = Array.from({ length: 15 }, (_, idx) => `product-skeleton-${idx}`);

type Props = {
  products: Product[];
  loading: boolean;
  onSelect: (p: Product) => void;
};

export default function ProductGrid({ products, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="product-grid">
        {skeletonItemKeys.map((key) => (
          <div key={key} className="bg-white rounded-xl overflow-hidden">
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
        <ProductCard key={product.id} product={product} onClick={onSelect} />
      ))}
    </div>
  );
}
