"use client";

import Image from "next/image";
import type { ProductDetails } from "@/lib/types";

type Videos = NonNullable<ProductDetails["productResults"]["videos"]>;
type Discussions = NonNullable<ProductDetails["productResults"]["discussionsAndForums"]>;
export type VideoItem = Videos[number];
export type DiscussionItem = Discussions[number];

export const buildVideoKey = (video: VideoItem) => {
  return (
    video.link ??
    `${video.title ?? video.channel ?? video.source ?? "video"}-${
      video.thumbnail ?? video.duration ?? "thumb"
    }`
  );
};

export const buildDiscussionKey = (discussion: DiscussionItem) => {
  return (
    discussion.link ??
    `${discussion.title ?? discussion.source ?? "discussion"}-${
      discussion.date ?? discussion.comments ?? ""
    }`
  );
};

export function VideoCardContent({ video }: { video: VideoItem }) {
  return (
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
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{video.title}</p>
        <p className="text-xs text-gray-500 mt-1">
          {[video.channel, video.source].filter(Boolean).join(" · ")}
        </p>
      </div>
    </>
  );
}

export function DiscussionCardContent({ discussion }: { discussion: DiscussionItem }) {
  return (
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
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <title>Discussion icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 5h16a2 2 0 012 2v7a2 2 0 01-2 2h-5l-4 4v-4H4a2 2 0 01-2-2V7a2 2 0 012-2z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5" />
            </svg>
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
              item.link ??
              `${item.snippet ?? "discussion"}-${discussion.title ?? "topic"}-${item.votes ?? 0}`;
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
      <p className="text-xs text-gray-500">Tap to open thread</p>
    </>
  );
}
