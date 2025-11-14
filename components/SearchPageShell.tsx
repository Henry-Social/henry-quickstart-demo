"use client";

import Link from "next/link";
import type { RefObject, ReactNode } from "react";
import HenryWordmark from "@/assets/henry-wordmark";
import SearchBar from "@/components/SearchBar";
import CartButton from "@/components/CartButton";

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <div className="flex items-center justify-between md:justify-start">
              <Link href="/" className="inline-flex items-center" aria-label="Go to Henry home">
                <HenryWordmark className="h-10 text-[#44c57e]" />
              </Link>
              <CartButton count={cartCount} className="md:hidden" />
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
            <div className="hidden md:block">
              <CartButton count={cartCount} />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
