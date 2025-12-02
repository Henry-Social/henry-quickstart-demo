"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandLogoClient from "@/components/BrandLogoClient";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import SearchBar from "@/components/SearchBar";
import SearchPageShell from "@/components/SearchPageShell";
import { useBrand } from "@/lib/brand-context";
import type { Product } from "@/lib/types";
import { useCartCount } from "@/lib/useCartCount";
import { usePersistentUserId } from "@/lib/usePersistentUserId";
import { useProductSearch } from "@/lib/useProductSearch";

export const dynamic = "force-dynamic";

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = usePersistentUserId();
  const { cartCount } = useCartCount(userId);
  const { placeholders, suggestedQueries } = useBrand();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shuffle and sample up to 10 suggested queries once on mount
  const shuffledQueries = useMemo(
    () => shuffleArray(suggestedQueries).slice(0, 10),
    [suggestedQueries]
  );
  const currentQueryParam = searchParams.get("q") ?? "";
  const loadSentinelRef = useRef<HTMLDivElement | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    products,
    heroView,
    executedQuery,
    loading,
    loadingMore,
    nextCursor,
    error,
    runSearch,
    loadMore,
    resetSearch,
  } = useProductSearch(currentQueryParam);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      router.replace("/");
      resetSearch();
      return;
    }

    if (trimmed === currentQueryParam) {
      void runSearch(trimmed);
    } else {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    }
  }, [currentQueryParam, resetSearch, router, runSearch, searchQuery]);

  // Cycle through placeholders every 3 seconds with fade animation
  useEffect(() => {
    if (placeholders.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      setPlaceholderVisible(false);

      // After fade out completes, change text and fade in
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setPlaceholderVisible(true);
      }, 300); // Match the CSS transition duration
    }, 3000);

    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    if (!loadSentinelRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(loadSentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  const handleProductSelect = useCallback(
    (product: Product) => {
      const encodedId = encodeURIComponent(product.id);
      const params = new URLSearchParams();
      if (executedQuery) {
        params.set("q", executedQuery);
      }
      if (product.imageUrl) {
        params.set("imageUrl", product.imageUrl);
      }
      if (product.name) {
        params.set("name", product.name);
      }
      params.set("price", product.price.toString());
      if (product.productLink) {
        params.set("productLink", product.productLink);
      }
      const query = params.toString();
      router.push(`/products/${encodedId}${query ? `?${query}` : ""}`);
    },
    [executedQuery, router],
  );

  const handleSuggestionClick = useCallback(
    (query: string) => {
      router.push(`/?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  if (heroView) {
    return (
      <main className="min-h-screen bg-white">
        <div className="min-h-screen flex flex-col">
          <Header cartCount={cartCount} showLogo={false} />
          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
            <BrandLogoClient className="h-16 text-brand-primary mb-4" height={64} />
            <div className="w-full max-w-2xl">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
                inputRef={searchInputRef}
                placeholder={placeholders.length === 0 ? "Search for products..." : undefined}
                animatedPlaceholder={
                  placeholders.length > 0
                    ? {
                        text: placeholders[placeholderIndex],
                        isVisible: placeholderVisible,
                      }
                    : undefined
                }
              />
              {shuffledQueries.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {shuffledQueries.map((query) => (
                    <button
                      key={query}
                      type="button"
                      onClick={() => handleSuggestionClick(query)}
                      className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <SearchPageShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={handleSearchSubmit}
      placeholder={placeholders[placeholderIndex] || "Search for products..."}
      inputRef={searchInputRef}
      cartCount={cartCount}
    >
      <ProductGrid products={products} loading={loading} onSelect={handleProductSelect} />
      <div ref={loadSentinelRef} className="h-10 w-full" aria-hidden="true" />
      {error && (
        <p className="mt-4 text-center text-sm text-red-600" aria-live="polite">
          {error}
        </p>
      )}
      {loadingMore && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
          <span className="inline-flex h-2 w-2 rounded-full bg-gray-300 animate-pulse delay-150" />
          <span className="inline-flex h-2 w-2 rounded-full bg-gray-300 animate-pulse delay-300" />
          <span>Loading more results...</span>
        </div>
      )}
      {!nextCursor && !loadingMore && products.length > 0 && (
        <p className="text-center text-xs text-gray-400">No more results to load.</p>
      )}
    </SearchPageShell>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}
