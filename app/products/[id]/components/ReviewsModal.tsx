"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ProductDetails } from "@/lib/types";
import {
  buildDiscussionKey,
  buildVideoKey,
  DiscussionCardContent,
  VideoCardContent,
} from "./ReviewCommunityCards";

type UserReviews = NonNullable<ProductDetails["productResults"]["userReviews"]>;
type Videos = NonNullable<ProductDetails["productResults"]["videos"]>;
type Discussions = NonNullable<ProductDetails["productResults"]["discussionsAndForums"]>;

interface ReviewsModalProps {
  open: boolean;
  reviews: UserReviews;
  videos: Videos;
  discussions: Discussions;
  onClose: () => void;
  onImageClick?: (src: string) => void;
}

export function ReviewsModal({
  open,
  reviews,
  videos,
  discussions,
  onClose,
  onImageClick,
}: ReviewsModalProps) {
  const hasVideos = videos.length > 0;
  const hasForums = discussions.length > 0;
  const tabs = [
    { id: "all", label: "All" },
    { id: "sites", label: "Site Reviews" },
    ...(hasVideos ? [{ id: "videos", label: "Video Reviews" } as const] : []),
    ...(hasForums ? [{ id: "forums", label: "Discussion Forums" } as const] : []),
  ];
  type TabId = (typeof tabs)[number]["id"];
  const [activeTab, setActiveTab] = useState<TabId>("all");

  useEffect(() => {
    if (open) {
      setActiveTab("all");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">All Reviews</h3>
            <p className="text-sm text-gray-500">
              {reviews.length} site review{reviews.length === 1 ? "" : "s"}
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
        <div className="px-4 pt-4">
          <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-sm font-semibold text-gray-600">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[80vh] overflow-y-auto divide-y divide-gray-100">
          {(activeTab === "all" || activeTab === "sites") && (
            <SitesSection reviews={reviews} onImageClick={onImageClick} />
          )}
          {(activeTab === "all" || activeTab === "videos") && <YouTubeSection videos={videos} />}
          {(activeTab === "all" || activeTab === "forums") && (
            <ForumSection discussions={discussions} />
          )}
        </div>
      </div>
    </div>
  );
}

function SitesSection({
  reviews,
  onImageClick,
}: {
  reviews: UserReviews;
  onImageClick?: (src: string) => void;
}) {
  return (
    <section className="p-4 space-y-3">
      <h4 className="text-lg font-semibold text-gray-900">Sites</h4>
      {reviews.length === 0 && <p className="text-sm text-gray-500">No site reviews yet.</p>}
      {reviews.map((review) => {
        const reviewKey = `${review.userName ?? "review"}-${review.date ?? review.title ?? review.source ?? review.text ?? "entry"}`;
        return (
          <div
            key={reviewKey}
            className="space-y-2 rounded-xl border border-gray-100 p-4 bg-gray-50"
          >
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
              <div className="flex gap-2 flex-wrap">
                {review.images.map((image) => {
                  const imageKey = `${image ?? "review-image"}-${review.userName ?? "buyer"}-${review.date ?? review.source ?? "source"}`;
                  return (
                    <button
                      type="button"
                      key={imageKey}
                      className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#44c57e]/40"
                      onClick={() => {
                        if (image) {
                          onImageClick?.(image);
                        }
                      }}
                    >
                      <Image
                        src={image}
                        alt="Review photo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function YouTubeSection({ videos }: { videos: Videos }) {
  return (
    <section className="p-4 space-y-3">
      <h4 className="text-lg font-semibold text-gray-900">YouTube</h4>
      {videos.length === 0 && <p className="text-sm text-gray-500">No video reviews yet.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {videos.map((video) => {
          const videoKey = buildVideoKey(video);
          const content = <VideoCardContent key={`modal-video-${videoKey}`} video={video} />;
          return video.link ? (
            <a
              key={`modal-video-${videoKey}`}
              href={video.link}
              target="_blank"
              rel="noreferrer"
              className="border border-gray-200 rounded-2xl p-3 hover:border-[#44c57e] transition-colors"
            >
              {content}
            </a>
          ) : (
            <div
              key={`modal-video-${videoKey}`}
              className="border border-gray-200 rounded-2xl p-3 text-gray-500"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ForumSection({ discussions }: { discussions: Discussions }) {
  return (
    <section className="p-4 space-y-3">
      <h4 className="text-lg font-semibold text-gray-900">Discussion Forums</h4>
      {discussions.length === 0 && (
        <p className="text-sm text-gray-500">No forum discussions yet.</p>
      )}
      <div className="space-y-3">
        {discussions.map((discussion) => {
          const discussionKey = buildDiscussionKey(discussion);
          const content = (
            <DiscussionCardContent
              key={`modal-discussion-${discussionKey}`}
              discussion={discussion}
            />
          );
          return discussion.link ? (
            <a
              key={`modal-discussion-${discussionKey}`}
              href={discussion.link}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-gray-200 p-4 hover:border-[#44c57e] transition-colors"
            >
              {content}
            </a>
          ) : (
            <div
              key={`modal-discussion-${discussionKey}`}
              className="rounded-2xl border border-gray-200 p-4"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
