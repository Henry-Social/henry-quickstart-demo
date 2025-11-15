"use client";

import type { ProductDetails } from "@/lib/types";
import { CARD_HOVER_CLASSES } from "./constants";
import {
  buildDiscussionKey,
  buildVideoKey,
  DiscussionCardContent,
  VideoCardContent,
} from "./ReviewCommunityCards";

type Videos = NonNullable<ProductDetails["productResults"]["videos"]>;
type Discussions = NonNullable<ProductDetails["productResults"]["discussionsAndForums"]>;

interface CommunityReviewsSectionProps {
  videos: Videos;
  discussions: Discussions;
}

export function CommunityReviewsSection({ videos, discussions }: CommunityReviewsSectionProps) {
  if (!videos.length && !discussions.length) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Community Reviews</h2>
        <p className="text-sm text-gray-600">See how creators and shoppers feel about this item</p>
      </div>

      {videos.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Video Reviews</h3>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-max">
              {videos.map((video) => {
                const videoKey = buildVideoKey(video);
                const card = <VideoCardContent key={`video-card-${videoKey}`} video={video} />;
                return video.link ? (
                  <a
                    key={`video-${videoKey}`}
                    href={video.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`${CARD_HOVER_CLASSES} block p-3 flex-shrink-0 w-72`}
                  >
                    {card}
                  </a>
                ) : (
                  <div
                    key={`video-${videoKey}`}
                    className={`${CARD_HOVER_CLASSES} p-3 flex-shrink-0 w-72`}
                  >
                    {card}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {discussions.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Discussion Forums</h3>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-max">
              {discussions.map((discussion) => {
                const discussionKey = buildDiscussionKey(discussion);
                const card = (
                  <DiscussionCardContent
                    key={`discussion-card-${discussionKey}`}
                    discussion={discussion}
                  />
                );
                return discussion.link ? (
                  <a
                    key={`discussion-${discussionKey}`}
                    href={discussion.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`${CARD_HOVER_CLASSES} flex-shrink-0 p-4 w-80 flex flex-col gap-3`}
                  >
                    {card}
                  </a>
                ) : (
                  <div
                    key={`discussion-${discussionKey}`}
                    className={`${CARD_HOVER_CLASSES} flex-shrink-0 p-4 w-80 flex flex-col gap-3`}
                  >
                    {card}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
