"use client";

import Image from "next/image";
import type { ProductDetails } from "@/lib/types";
import { CARD_HOVER_CLASSES } from "./constants";

type MoreOptions = NonNullable<ProductDetails["productResults"]["moreOptions"]>;

interface MoreOptionsCarouselProps {
  options: MoreOptions;
  onSelect: (optionId?: string) => void;
}

export function MoreOptionsCarousel({ options, onSelect }: MoreOptionsCarouselProps) {
  if (!options.length) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-2xl p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Similar Products</h2>
        <p className="text-sm text-gray-600">Other listings you might like</p>
      </div>
      <div className="overflow-x-auto pb-2 pr-1">
        <div className="flex gap-4 min-w-max">
          {options.map((option, index) => {
            const trimmedPrice = option.price?.trim();
            const fallbackPrice =
              !trimmedPrice && typeof option.extractedPrice === "number"
                ? `$${option.extractedPrice.toFixed(2)}`
                : null;
            const displayPrice = trimmedPrice || fallbackPrice || "See price";
            const showOriginal =
              option.originalPrice &&
              option.originalPrice.trim().length > 0 &&
              option.originalPrice !== trimmedPrice;

            return (
              <button
                type="button"
                onClick={() => onSelect(option.id)}
                key={option.id || option.title || index}
                className={`${CARD_HOVER_CLASSES} flex-shrink-0 flex flex-col gap-3 w-64 p-4 text-left transition-all`}
              >
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {option.thumbnail ? (
                      <Image
                        src={option.thumbnail}
                        alt={option.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-8 h-8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <title>Product image</title>
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <path d="M3 16l5-5 4 4 5-6 4 4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                      {option.title}
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="text-lg font-bold text-gray-900">{displayPrice}</div>
                      {(showOriginal || option.discount) && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {showOriginal && (
                            <span className="line-through text-gray-400">
                              {option.originalPrice}
                            </span>
                          )}
                          {option.discount && (
                            <span className="inline-flex items-center rounded-full bg-brand-light px-2 py-0.5 font-semibold text-brand-dark">
                              {option.discount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {(option.rating || option.reviews) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {option.rating && (
                          <span className="text-yellow-500 font-semibold">{option.rating} ★</span>
                        )}
                        {option.reviews
                          ? ` ${option.rating ? "· " : ""}${option.reviews} reviews`
                          : null}
                      </p>
                    )}
                  </div>
                </div>
                {option.link && (
                  <a
                    href={option.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-brand-dark hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Open listing
                  </a>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
