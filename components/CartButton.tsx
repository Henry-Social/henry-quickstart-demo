"use client";

import Link from "next/link";

type Props = {
  count?: number;
  className?: string;
};

/**
 * Shared cart button so badge behavior stays consistent everywhere.
 */
export default function CartButton({ count = 0, className = "" }: Props) {
  return (
    <Link
      href="/cart"
      className={`relative inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#44c57e] hover:text-[#1b8451] transition-colors ${className}`}
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
      {count > 0 && (
        <span className="absolute -top-1 -right-1 translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-[#44c57e] text-white text-xs font-semibold h-5 min-w-[1.5rem] px-1.5 border-2 border-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
