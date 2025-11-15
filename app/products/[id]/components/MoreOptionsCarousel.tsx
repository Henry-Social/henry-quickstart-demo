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
    <div className="mt-6 bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">More Options</h2>
        <p className="text-sm text-gray-600">Other listings you might like</p>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {options.map((option, index) => (
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
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{option.title}</p>
                  <div className="mt-2 text-lg font-bold text-gray-900">
                    {option.price ||
                      (typeof option.extractedPrice === "number"
                        ? `$${option.extractedPrice.toFixed(2)}`
                        : "See price")}
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
                  className="text-sm font-semibold text-[#1b8451] hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  Open listing
                </a>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
