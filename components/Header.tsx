"use client";

import Link from "next/link";
import BrandLogoClient from "@/components/BrandLogoClient";
import CartButton from "@/components/CartButton";

type Props = {
  cartCount?: number;
  showLogo?: boolean;
  mode?: "search" | "ai";
  onNewChat?: () => void;
};

function StarIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <title>AI</title>
      <path d="M12 1L9 9L1 12L9 15L12 23L15 15L23 12L15 9L12 1Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const Header = ({ cartCount = 0, showLogo = true, mode = "search", onNewChat }: Props) => {
  const isAiMode = mode === "ai";

  return (
    <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {showLogo ? (
            isAiMode && onNewChat ? (
              <button
                onClick={onNewChat}
                className="inline-flex items-center"
                aria-label="Start new AI chat"
              >
                <BrandLogoClient className="h-8 text-brand-primary" height={32} />
              </button>
            ) : (
              <Link href="/" className="inline-flex items-center" aria-label="Go to Henry home">
                <BrandLogoClient className="h-8 text-brand-primary" height={32} />
              </Link>
            )
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <CartButton count={cartCount} />
            {isAiMode ? (
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2.5 text-gray-700 hover:border-brand-primary hover:text-brand-dark transition-colors"
                aria-label="Go to product search"
              >
                <SearchIcon />
              </Link>
            ) : (
              <Link
                href="/ai"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2.5 text-gray-700 hover:border-brand-primary hover:text-brand-dark transition-colors"
                aria-label="Go to AI chat"
              >
                <StarIcon />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
