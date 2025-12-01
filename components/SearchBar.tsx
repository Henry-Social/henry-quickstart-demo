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
  icon?: "search" | "star";
  showSubmitButton?: boolean;
  disabled?: boolean;
};

function SearchIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <title>Search</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
      <title>AI</title>
      <path d="M12 1L9 9L1 12L9 15L12 23L15 15L23 12L15 9L12 1Z" />
    </svg>
  );
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  inputRef,
  className = "",
  variant = "default",
  icon = "search",
  showSubmitButton = false,
  disabled = false,
}: Props) {
  const isHeaderVariant = variant === "header";
  const inputClasses = [
    "w-full",
    "pl-11",
    showSubmitButton ? "pr-14" : "pr-4",
    "py-3",
    "text-base",
    "bg-white",
    "border",
    "border-gray-200",
    "rounded-full",
    "focus:outline-none",
    "focus:border-brand-primary",
    isHeaderVariant ? "focus:ring-2" : "focus:ring-2",
    "focus:ring-brand-primary/20",
    "transition-all",
    "duration-200",
    "shadow-none",
  ].join(" ");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {icon === "star" ? <StarIcon /> : <SearchIcon />}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (!disabled) onSubmit();
          }
        }}
        placeholder={placeholder}
        className={inputClasses}
        disabled={disabled}
      />
      {showSubmitButton && (
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary text-white p-2 rounded-full hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Send</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </form>
  );
}
