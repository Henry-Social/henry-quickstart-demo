"use client";

import Image from "next/image";
import type { ProductDetails } from "@/lib/types";
import { CARD_HOVER_CLASSES } from "./constants";

type Discussions = NonNullable<ProductDetails["productResults"]["discussionsAndForums"]>;

interface DiscussionsCarouselProps {
  discussions: Discussions;
}

type Discussion = Discussions[number];

export function DiscussionsCarousel({ discussions }: DiscussionsCarouselProps) {
  if (!discussions.length) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Community Discussions</h2>
        <p className="text-sm text-gray-600">What other shoppers are saying</p>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {discussions.map((discussion) => {
            const discussionKey =
              discussion.link ??
              `${discussion.title ?? discussion.source ?? "discussion"}-${discussion.date ?? discussion.comments ?? ""}`;

            return discussion.link ? (
              <a
                key={`discussion-${discussionKey}`}
                href={discussion.link}
                target="_blank"
                rel="noreferrer"
                className={`${CARD_HOVER_CLASSES} flex-shrink-0 p-4 w-80`}
              >
                <DiscussionCardContent discussion={discussion} />
              </a>
            ) : (
              <div
                key={`discussion-${discussionKey}`}
                className={`${CARD_HOVER_CLASSES} flex-shrink-0 p-4 w-80`}
              >
                <DiscussionCardContent discussion={discussion} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DiscussionCardContent({ discussion }: { discussion: Discussion }) {
  return (
    <div className="flex flex-col gap-3">
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
          <p className="text-sm font-semibold text-gray-900 line-clamp-2">{discussion.title}</p>
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
              item.link ?? `${item.snippet ?? "discussion-snippet"}-${discussion.title ?? "topic"}`;
            return (
              <li key={itemKey} className="rounded-md bg-gray-50 p-2">
                <p className="line-clamp-3">{item.snippet}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {[item.topAnswer ? "Top answer" : null, item.votes && `${item.votes} votes`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-gray-500">Tap to open thread</p>
    </div>
  );
}
