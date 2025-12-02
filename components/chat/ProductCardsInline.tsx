"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";

type Props = {
  products: Product[];
};

export default function ProductCardsInline({ products }: Props) {
  const router = useRouter();

  const handleProductSelect = (product: Product) => {
    const encodedId = encodeURIComponent(product.id);
    const params = new URLSearchParams();
    if (product.imageUrl) params.set("imageUrl", product.imageUrl);
    if (product.name) params.set("name", product.name);
    params.set("price", product.price.toString());
    if (product.productLink) params.set("productLink", product.productLink);
    router.push(`/products/${encodedId}?${params.toString()}`);
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="my-3 -mx-2 px-2 overflow-x-auto scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-gray-300 hover:scrollbar-track-transparent">
      <div className="flex gap-3 pb-2">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => handleProductSelect(product)}
            type="button"
            className="flex-shrink-0 w-48 bg-white text-left rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group border border-gray-100"
            aria-label={`View details for ${product.name}`}
          >
            {product.imageUrl && (
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
            )}
            <div className="p-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide truncate">
                {product.source}
              </p>
              <h3 className="text-xs text-gray-900 line-clamp-2 h-8 mt-0.5">{product.name}</h3>
              <p className="text-sm font-bold text-black mt-1">${product.price.toFixed(2)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
