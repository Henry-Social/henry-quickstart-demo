"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";

const CACHE_TTL_MS = 1000 * 60 * 5;

type SearchCacheEntry = {
  products: Product[];
  nextCursor: string | null;
  timestamp: number;
};

const SEARCH_CACHE = new Map<string, SearchCacheEntry>();

const getCacheKey = (query: string) => query.trim();

function readCache(query: string) {
  const key = getCacheKey(query);
  if (!key) {
    return null;
  }
  const entry = SEARCH_CACHE.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    SEARCH_CACHE.delete(key);
    return null;
  }
  return entry;
}

function writeCache(query: string, products: Product[], nextCursor: string | null) {
  const key = getCacheKey(query);
  if (!key) {
    return;
  }
  SEARCH_CACHE.set(key, { products, nextCursor, timestamp: Date.now() });
}

type SearchResponse = {
  success?: boolean;
  data?: Product[];
  pagination?: {
    nextCursor?: string | null;
  };
  error?: string;
  message?: string;
};

type SearchOptions = {
  append?: boolean;
  cursor?: string | null;
};

export function useProductSearch(initialQuery: string) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const productsRef = useRef<Product[]>([]);
  const [heroView, setHeroView] = useState(() => !initialQuery);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [executedQuery, setExecutedQuery] = useState(initialQuery.trim());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const applyProducts = useCallback((next: Product[]) => {
    productsRef.current = next;
    setProducts(next);
  }, []);

  const resetSearch = useCallback(() => {
    abortControllerRef.current?.abort();
    applyProducts([]);
    setNextCursor(null);
    setExecutedQuery("");
    setHeroView(true);
    setLoading(false);
    setLoadingMore(false);
    setError(null);
  }, [applyProducts]);

  const runSearch = useCallback(
    async (query: string, options: SearchOptions = {}) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        resetSearch();
        setSearchQuery("");
        return;
      }

      const isAppend = Boolean(options.append);
      const cursor = options.cursor ?? null;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setHeroView(false);
      setError(null);

      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setExecutedQuery(trimmedQuery);
        setNextCursor(null);
        applyProducts([]);
      }

      const requestId = ++requestIdRef.current;

      try {
        const response = await fetch("/api/henry/products/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: trimmedQuery,
            cursor: cursor ?? undefined,
          }),
          signal: controller.signal,
        });

        const payload = (await response.json()) as SearchResponse;
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || payload.error || "Search failed");
        }

        const newProducts = Array.isArray(payload.data) ? (payload.data as Product[]) : [];
        let updatedProducts = newProducts;
        if (isAppend) {
          updatedProducts =
            newProducts.length > 0 ? [...productsRef.current, ...newProducts] : productsRef.current;
        }
        applyProducts(updatedProducts);
        const nextCursorValue = payload.pagination?.nextCursor ?? null;
        setNextCursor(nextCursorValue);
        writeCache(trimmedQuery, updatedProducts, nextCursorValue);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (!isAppend) {
          applyProducts([]);
        }
        setNextCursor(null);
        const message = error instanceof Error ? error.message : "Unable to load results";
        setError(message);
      } finally {
        if (requestId === requestIdRef.current) {
          if (isAppend) {
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
        }
      }
    },
    [applyProducts, resetSearch],
  );

  const loadMore = useCallback(() => {
    if (!nextCursor || !executedQuery || loading || loadingMore) {
      return;
    }
    void runSearch(executedQuery, { append: true, cursor: nextCursor });
  }, [executedQuery, loading, loadingMore, nextCursor, runSearch]);

  useEffect(() => {
    const trimmed = initialQuery.trim();
    setSearchQuery(initialQuery);
    if (!trimmed) {
      resetSearch();
      return;
    }
    const cached = readCache(trimmed);
    if (cached) {
      setHeroView(false);
      setExecutedQuery(trimmed);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
      setNextCursor(cached.nextCursor ?? null);
      applyProducts(cached.products);
      return;
    }
    void runSearch(trimmed);
  }, [applyProducts, initialQuery, resetSearch, runSearch]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    products,
    heroView,
    nextCursor,
    executedQuery,
    loading,
    loadingMore,
    error,
    runSearch,
    loadMore,
    resetSearch,
  };
}
