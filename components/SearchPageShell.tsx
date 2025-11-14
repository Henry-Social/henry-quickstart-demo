"use client";

import Link from "next/link";
import type { RefObject, ReactNode } from "react";
import HenryWordmark from "@/assets/henry-wordmark";
import SearchBar from "@/components/SearchBar";

type Props = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  loading?: boolean;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement>;
  children: ReactNode;
  cartCount?: number;
};

export default function SearchPageShell({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  loading = false,
  placeholder,
  inputRef,
  children,
  cartCount = 0,
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid items-center gap-4 grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto]">
            <Link
              href="/"
              className="justify-self-start inline-flex items-center"
              aria-label="Go to Henry home"
            >
              <HenryWordmark className="h-10 text-[#44c57e]" />
            </Link>
            <div className="w-full min-w-[200px] md:w-[60%] lg:w-1/2 md:justify-self-center md:mx-auto">
              <SearchBar
                value={searchValue}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
                loading={loading}
                placeholder={placeholder}
                inputRef={inputRef}
                className="w-full"
                variant="header"
              />
            </div>
            <div className="justify-self-end flex items-center gap-3 text-sm text-gray-500">
              <Link
                href="/cart"
                className="relative inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#44c57e] hover:text-[#1b8451] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>Cart</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13l-1.3 5.3a1 1 0 00.97 1.2H19M7 13l-2-8H3"
                  />
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="17" cy="20" r="1" />
                </svg>
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-[#44c57e] text-white text-xs font-semibold h-5 min-w-[1.5rem] px-1.5 border-2 border-white shadow-sm">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
