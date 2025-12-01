"use client";

import Image from "next/image";
import type { ProductDetails } from "@/lib/types";

type RatingDistribution = NonNullable<ProductDetails["productResults"]["ratings"]>;
type UserReviews = NonNullable<ProductDetails["productResults"]["userReviews"]>;

interface ReviewInsightsCardProps {
  productDetails: ProductDetails | null;
  ratingDistribution?: RatingDistribution;
  totalRatingsCount: number;
  highlightedUserReviews: UserReviews;
  reviewImages: string[];
  allUserReviews: UserReviews;
  onOpenReviews: () => void;
  onImageClick?: (src: string) => void;
}

export function ReviewInsightsCard({
  productDetails,
  ratingDistribution = [],
  totalRatingsCount,
  highlightedUserReviews,
  reviewImages,
  allUserReviews,
  onOpenReviews,
  onImageClick,
}: ReviewInsightsCardProps) {
  if (!productDetails) {
    return null;
  }

  const hasInsights =
    ratingDistribution.length > 0 || highlightedUserReviews.length > 0 || totalRatingsCount > 0;

  if (!hasInsights) {
    return null;
  }

  const roundedAverage = productDetails.productResults.rating.toFixed(1);
  const totalReviewCount = totalRatingsCount || productDetails.productResults.reviews || 0;
  const renderHighlightedReview = (review: UserReviews[number]) => (
    <>
      {typeof review.rating === "number" && (
        <div className="flex items-center gap-1 text-yellow-500 text-lg">
          {Array.from({ length: 5 }).map((_, starIndex) => (
            <span
              key={`${review.title || "highlighted"}-${starIndex}`}
              className={starIndex < Math.round(review.rating || 0) ? "" : "text-gray-300"}
            >
              ★
            </span>
          ))}
        </div>
      )}
      <div className="mt-2">
        <p className="text-sm font-semibold text-gray-900">{review.userName || "Verified buyer"}</p>
        <p className="text-xs text-gray-500">
          {[review.date, review.source].filter(Boolean).join(" · ")}
        </p>
      </div>
      {review.text && <p className="text-sm text-gray-700 mt-2 line-clamp-4">{review.text}</p>}
    </>
  );

  return (
    <div className="bg-white rounded-lg p-4 space-y-4">
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm text-gray-500">Ratings &amp; Reviews</p>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-gray-900">{roundedAverage}</span>
            <span className="text-yellow-500 text-2xl" aria-hidden="true">
              ★
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenReviews}
          className="text-left text-sm font-medium text-brand-dark hover:underline"
        >
          {totalReviewCount.toLocaleString()} ratings
        </button>
      </div>

      {ratingDistribution.length > 0 && (
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const entry = ratingDistribution.find((rating) => rating.stars === star);
            const amount = entry?.amount ?? 0;
            const percentage = totalRatingsCount
              ? Math.min(100, Math.round((amount / totalRatingsCount) * 100))
              : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-4">{star}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-primary" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">{amount}</span>
              </div>
            );
          })}
        </div>
      )}

      {reviewImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {reviewImages.map((src, index) => (
            <button
              type="button"
              key={src || `review-image-${index}`}
              onClick={() => {
                if (src) {
                  onImageClick?.(src);
                }
              }}
              className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
            >
              <Image src={src} alt="Customer photo" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}

      {highlightedUserReviews.length > 0 && (
        <>
          <div className="flex gap-4 overflow-x-auto sm:hidden pb-2 -mx-1 px-1">
            {highlightedUserReviews.map((review, index) => (
              <div
                key={`${review.userName || review.title || "highlighted"}-mobile-${index}`}
                className="min-w-[70%] flex-1 border border-gray-100 rounded-2xl p-4 bg-gray-50 flex-shrink-0"
              >
                {renderHighlightedReview(review)}
              </div>
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 gap-4">
            {highlightedUserReviews.map((review, index) => (
              <div
                key={`${review.userName || review.title || "highlighted"}-${index}`}
                className="border border-gray-100 rounded-2xl p-4 bg-gray-50"
              >
                {renderHighlightedReview(review)}
              </div>
            ))}
          </div>
        </>
      )}

      {allUserReviews.length > 0 && (
        <button
          type="button"
          onClick={onOpenReviews}
          className="w-full text-center py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Read more reviews
        </button>
      )}
    </div>
  );
}
