"use client";

import Image from "next/image";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  onClick: (p: Product) => void;
};

export default function ProductCard({ product, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(product)}
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
  );
}
