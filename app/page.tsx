"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HenryWordmark from "@/assets/henry-wordmark";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import SearchBar from "@/components/SearchBar";
import SearchPageShell from "@/components/SearchPageShell";
import type { Product } from "@/lib/types";
import { usePersistentUserId } from "@/lib/usePersistentUserId";
import { useCartCount } from "@/lib/useCartCount";

const placeholders = [
  "Yoga mats with good grip",
  "Nike shoes",
  "Summer dresses",
  "Wireless headphones",
  "Organic skincare",
  "Running gear",
];

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const userId = usePersistentUserId();
  const { cartCount } = useCartCount(userId);
  const [heroView, setHeroView] = useState(true);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentQueryParam = searchParams.get("q") ?? "";

  const searchProducts = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setHeroView(false);
    setLoading(true);

    try {
      const response = await fetch("/api/henry/products/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: trimmedQuery,
        }),
      });

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setProducts(result.data);
      } else {
        setProducts([]);
      }
    } catch (_error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      router.replace("/");
      setHeroView(true);
      setProducts([]);
      return;
    }

    if (trimmed === currentQueryParam) {
      searchProducts(trimmed);
    } else {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    }
  }, [currentQueryParam, router, searchProducts, searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentQueryParam) {
      setSearchQuery(currentQueryParam);
      searchProducts(currentQueryParam);
    } else if (!currentQueryParam && !heroView) {
      setHeroView(true);
      setProducts([]);
    }
  }, [currentQueryParam, heroView, searchProducts]);

  const handleProductSelect = useCallback(
    (product: Product) => {
      const encodedId = encodeURIComponent(product.id);
      router.push(`/products/${encodedId}`);
    },
    [router],
  );

  if (heroView) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="min-h-screen flex flex-col">
          <Header cartCount={cartCount} />
          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-32">
            <HenryWordmark className="h-16 text-[#44c57e] mb-4" />
            <div className="w-full max-w-2xl">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
                loading={loading}
                placeholder={placeholders[placeholderIndex]}
                inputRef={searchInputRef}
              />
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
      loading={loading}
      placeholder={placeholders[placeholderIndex]}
      inputRef={searchInputRef}
      cartCount={cartCount}
    >
      <ProductGrid products={products} loading={loading} onSelect={handleProductSelect} />
    </SearchPageShell>
  );
}
