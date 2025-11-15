"use client";

import Image from "next/image";
import type { ProductDetails } from "@/lib/types";
import { CARD_HOVER_CLASSES } from "./constants";

type Videos = NonNullable<ProductDetails["productResults"]["videos"]>;
type Video = Videos[number];

interface VideosCarouselProps {
  videos: Videos;
}

export function VideosCarousel({ videos }: VideosCarouselProps) {
  if (!videos.length) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Videos &amp; Reviews</h2>
        <p className="text-sm text-gray-600">See the shoe in action</p>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {videos.map((video) => {
            const videoKey =
              video.link ??
              `${video.title ?? video.channel ?? video.source ?? "video"}-${
                video.thumbnail ?? video.duration ?? "thumb"
              }`;

            return video.link ? (
              <a
                key={`video-${videoKey}`}
                href={video.link}
                target="_blank"
                rel="noreferrer"
                className={`${CARD_HOVER_CLASSES} block p-3 flex-shrink-0 w-72`}
              >
                <VideoCardContent video={video} />
              </a>
            ) : (
              <div
                key={`video-${videoKey}`}
                className={`${CARD_HOVER_CLASSES} p-3 flex-shrink-0 w-72`}
              >
                <VideoCardContent video={video} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VideoCardContent({ video }: { video: Video }) {
  return (
    <div className="w-72">
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
    </div>
  );
}
