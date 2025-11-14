"use client";

import type { RefObject } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
  variant?: "default" | "header";
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  inputRef,
  className = "",
  variant = "default",
}: Props) {
  const isHeaderVariant = variant === "header";
  const inputClasses = [
    "w-full",
    "pl-12",
    "pr-20",
    "py-4",
    "text-lg",
    "bg-white",
    "border-2",
    "border-gray-200",
    "rounded-full",
    "focus:outline-none",
    "focus:border-[#44c57e]",
    isHeaderVariant ? "focus:ring-2" : "focus:ring-4",
    "focus:ring-[#44c57e]/20",
    "transition-all",
    "duration-200",
    isHeaderVariant ? "shadow-none" : "shadow-lg",
  ].join(" ");

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>Search</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder={placeholder}
        className={inputClasses}
      />
    </div>
  );
}
