"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import HenryWordmark from "@/assets/henry-wordmark";
import CartButton from "@/components/CartButton";
import SearchBar from "@/components/SearchBar";

function StarIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <title>AI</title>
      <path d="M12 1L9 9L1 12L9 15L12 23L15 15L23 12L15 9L12 1Z" />
    </svg>
  );
}

type Props = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement>;
  children: ReactNode;
  cartCount?: number;
};

export default function SearchPageShell({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  placeholder,
  inputRef,
  children,
  cartCount = 0,
}: Props) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <div className="flex items-center justify-between md:justify-start">
              <Link href="/" className="inline-flex items-center" aria-label="Go to Henry home">
                <HenryWordmark className="h-10 text-[#44c57e]" />
              </Link>
              <div className="flex items-center gap-2 md:hidden">
                <CartButton count={cartCount} />
                <Link
                  href="/ai"
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2.5 text-gray-700 hover:border-[#44c57e] hover:text-[#1b8451] transition-colors"
                  aria-label="Go to AI chat"
                >
                  <StarIcon />
                </Link>
              </div>
            </div>
            <div className="w-full min-w-[200px] md:w-[60%] lg:w-1/2 md:justify-self-center md:mx-auto">
              <SearchBar
                value={searchValue}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
                placeholder={placeholder}
                inputRef={inputRef}
                className="w-full"
                variant="header"
              />
            </div>
            <div className="hidden md:flex md:items-center md:gap-2">
              <CartButton count={cartCount} />
              <Link
                href="/ai"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2.5 text-gray-700 hover:border-[#44c57e] hover:text-[#1b8451] transition-colors"
                aria-label="Go to AI chat"
              >
                <StarIcon />
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">{children}</main>
    </div>
  );
}
