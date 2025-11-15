"use client";

import Image from "next/image";
import type { ProductDetails } from "@/lib/types";

type UserReviews = NonNullable<ProductDetails["productResults"]["userReviews"]>;

interface ReviewsModalProps {
  open: boolean;
  reviews: UserReviews;
  onClose: () => void;
}

export function ReviewsModal({ open, reviews, onClose }: ReviewsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">All Reviews</h3>
            <p className="text-sm text-gray-500">
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto divide-y divide-gray-100">
          {reviews.map((review) => {
            const reviewKey = `${review.userName ?? "review"}-${review.date ?? review.title ?? review.source ?? review.text ?? "entry"}`;
            return (
              <div key={reviewKey} className="p-4 space-y-2">
                <div className="flex items-center gap-1 text-yellow-500 text-lg">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={`${reviewKey}-star-${star}`}
                      className={
                        typeof review.rating === "number" && star <= Math.round(review.rating || 0)
                          ? ""
                          : "text-gray-300"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {review.userName || "Verified buyer"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {[review.date, review.source].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {review.text && <p className="text-sm text-gray-700">{review.text}</p>}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2">
                    {review.images.map((image) => {
                      const imageKey = `${image ?? "review-image"}-${review.userName ?? "buyer"}-${
                        review.date ?? review.source ?? "source"
                      }`;
                      return (
                        <div
                          key={imageKey}
                          className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
                        >
                          <Image
                            src={image}
                            alt="Review photo"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
