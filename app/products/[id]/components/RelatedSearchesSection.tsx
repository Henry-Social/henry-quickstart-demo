"use client";

import Image from "next/image";
import type { ProductDetails } from "@/lib/types";

type RelatedSearches = ProductDetails["relatedSearches"];

interface RelatedSearchesSectionProps {
  relatedSearches: RelatedSearches;
  onSelect?: (query: string) => void;
}

export function RelatedSearchesSection({ relatedSearches, onSelect }: RelatedSearchesSectionProps) {
  if (!relatedSearches.length) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Related Searches</h2>
        <p className="text-sm text-gray-600">Explore similar styles</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {relatedSearches.map((search, index) => {
          const fallbackLink =
            search.link || `https://www.google.com/search?q=${encodeURIComponent(search.query)}`;
          const handleClick = () => {
            if (onSelect) {
              onSelect(search.query);
            } else {
              window.location.href = fallbackLink;
            }
          };
          return (
            <button
              type="button"
              key={search.query || index}
              onClick={handleClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-brand-primary hover:text-brand-dark transition-colors"
            >
              {search.image && (
                <Image
                  src={search.image}
                  alt={search.query}
                  width={28}
                  height={28}
                  className="rounded-full object-cover"
                  unoptimized
                />
              )}
              <span className="text-sm font-medium text-gray-700">{search.query}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
