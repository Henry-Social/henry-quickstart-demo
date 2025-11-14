"use client";

import type { RefObject, ReactNode } from "react";
import HenryWordmark from "@/assets/henry-wordmark";
import SearchBar from "@/components/SearchBar";

type Props = {
  userId: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  loading?: boolean;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement>;
  children: ReactNode;
};

export default function SearchPageShell({
  userId,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  loading = false,
  placeholder,
  inputRef,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid items-center gap-4 grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto]">
            <HenryWordmark className="h-10 text-[#44c57e] justify-self-start" />
            <div className="w-full min-w-[200px] md:w-[60%] lg:w-1/2 md:justify-self-center md:mx-auto">
              <SearchBar
                value={searchValue}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
                loading={loading}
                placeholder={placeholder}
                inputRef={inputRef}
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-500 truncate justify-self-end">{userId}</div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
