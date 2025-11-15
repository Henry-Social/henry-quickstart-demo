"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";

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
  const [heroView, setHeroView] = useState(() => !initialQuery);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [executedQuery, setExecutedQuery] = useState(initialQuery.trim());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetSearch = useCallback(() => {
    abortControllerRef.current?.abort();
    setProducts([]);
    setNextCursor(null);
    setExecutedQuery("");
    setHeroView(true);
    setLoading(false);
    setLoadingMore(false);
    setError(null);
  }, []);

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
        setProducts([]);
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
        setProducts((prev) =>
          isAppend ? (newProducts.length ? [...prev, ...newProducts] : prev) : newProducts,
        );
        setNextCursor(payload.pagination?.nextCursor ?? null);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (!isAppend) {
          setProducts([]);
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
    [resetSearch],
  );

  const loadMore = useCallback(() => {
    if (!nextCursor || !executedQuery || loading || loadingMore) {
      return;
    }
    void runSearch(executedQuery, { append: true, cursor: nextCursor });
  }, [executedQuery, loading, loadingMore, nextCursor, runSearch]);

  useEffect(() => {
    setSearchQuery(initialQuery);
    if (initialQuery) {
      void runSearch(initialQuery);
    } else {
      resetSearch();
    }
  }, [initialQuery, resetSearch, runSearch]);

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
