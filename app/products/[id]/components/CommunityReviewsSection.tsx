"use client";

import Image from "next/image";
import type { ProductDetails } from "@/lib/types";
import { CARD_HOVER_CLASSES } from "./constants";

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
    <div className="mt-6 bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-6">
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
                const videoKey =
                  video.link ??
                  `${video.title ?? video.channel ?? video.source ?? "video"}-${
                    video.thumbnail ?? video.duration ?? "thumb"
                  }`;
                const content = (
                  <>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                      {video.thumbnail ? (
                        <Image
                          src={video.thumbnail}
                          alt={video.title || "Video thumbnail"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg
                            className="w-10 h-10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <title>Video</title>
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />
                            <rect x="3" y="6" width="12" height="12" rx="2" ry="2" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-gray-900">
                          ▶
                        </span>
                      </div>
                      {video.duration && (
                        <span className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 rounded-full bg-black/70 text-white">
                          {video.duration}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {video.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {[video.channel, video.source].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </>
                );

                return video.link ? (
                  <a
                    key={`video-${videoKey}`}
                    href={video.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`${CARD_HOVER_CLASSES} block p-3 flex-shrink-0 w-72`}
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={`video-${videoKey}`}
                    className={`${CARD_HOVER_CLASSES} p-3 flex-shrink-0 w-72`}
                  >
                    {content}
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
                const discussionKey =
                  discussion.link ??
                  `${discussion.title ?? discussion.source ?? "discussion"}-${
                    discussion.date ?? discussion.comments ?? ""
                  }`;

                const content = (
                  <>
                    <div className="flex items-center gap-3">
                      {discussion.icon ? (
                        <Image
                          src={discussion.icon}
                          alt={discussion.source || "Discussion source"}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                          💬
                        </div>
                      )}
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {discussion.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[
                            discussion.source,
                            discussion.date,
                            discussion.comments && `${discussion.comments} comments`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                    {discussion.items && discussion.items.length > 0 && (
                      <ul className="space-y-2 text-sm text-gray-700">
                        {discussion.items.slice(0, 2).map((item) => {
                          const itemKey =
                            item.link ??
                            `${item.snippet ?? "discussion"}-${discussion.title ?? "topic"}-${item.votes ?? 0}`;
                          return (
                            <li key={itemKey} className="rounded-md bg-gray-50 p-2">
                              <p className="line-clamp-3">{item.snippet}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {[
                                  item.topAnswer ? "Top answer" : null,
                                  item.votes && `${item.votes} votes`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <p className="text-xs text-gray-500">Tap to open thread</p>
                  </>
                );

                return discussion.link ? (
                  <a
                    key={`discussion-${discussionKey}`}
                    href={discussion.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`${CARD_HOVER_CLASSES} flex-shrink-0 p-4 w-80 flex flex-col gap-3`}
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={`discussion-${discussionKey}`}
                    className={`${CARD_HOVER_CLASSES} flex-shrink-0 p-4 w-80 flex flex-col gap-3`}
                  >
                    {content}
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
