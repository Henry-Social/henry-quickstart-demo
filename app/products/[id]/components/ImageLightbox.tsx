"use client";

import Image from "next/image";
import { useEffect } from "react";

interface ImageLightboxProps {
  imageSrc: string | null;
  onClose: () => void;
}

export function ImageLightbox({ imageSrc, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!imageSrc) {
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
  }, [imageSrc, onClose]);

  if (!imageSrc) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
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
      <div className="relative w-full max-w-3xl aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-2xl">
        <Image
          src={imageSrc}
          alt="Expanded view"
          fill
          className="object-contain bg-black"
          unoptimized
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
