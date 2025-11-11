"use client";

import { RefObject } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  loading = false,
  placeholder,
  inputRef,
  className = "",
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
        className="w-full pl-12 pr-20 py-4 text-lg bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#44c57e] focus:ring-4 focus:ring-[#44c57e]/20 transition-all duration-200 shadow-lg"
      />
      <button
        onClick={onSubmit}
        disabled={loading}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-[#44c57e] text-white rounded-full hover:bg-[#3aaa6a] disabled:opacity-50 transition-colors duration-200"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M12 2a10 10 0 00-10 10h4a6 6 0 016-6V2zM2 12a10 10 0 0010 10v-4a6 6 0 01-6-6H2z"
            ></path>
          </svg>
        ) : (
          "Search"
        )}
      </button>
    </div>
  );
}
