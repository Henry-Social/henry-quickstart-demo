"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * Keeps a shared cart count in sync so every page can render the badge consistently.
 * Fetching is skipped until a user id exists.
 */
export function useCartCount(userId: string) {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCartCount = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/henry/cart/items", {
        headers: {
          ...DEFAULT_HEADERS,
          "x-user-id": userId,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCartCount(data.data?.products?.length ?? 0);
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const setCartCountValue = useCallback((value: number | ((prev: number) => number)) => {
    setCartCount((prev) => (typeof value === "function" ? value(prev) : value));
  }, []);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  return {
    cartCount,
    cartCountLoading: loading,
    refreshCartCount,
    setCartCountValue,
  };
}
