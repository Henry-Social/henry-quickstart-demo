"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import SearchPageShell from "@/components/SearchPageShell";
import { useCartCount } from "@/lib/useCartCount";
import { usePersistentUserId } from "@/lib/usePersistentUserId";
import { getValidImageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CartItem = {
  productId: string;
  name: string;
  price: string | number;
  quantity: number;
  productImageLink?: string;
  productLink?: string;
  metadata?: Record<string, string>;
};

function CartPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const userId = usePersistentUserId();
  const { cartCount, setCartCountValue } = useCartCount(userId);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/henry/cart/items", {
        headers: {
          "x-user-id": userId,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to load cart");
      }

      const products = data.data?.products ?? [];
      setItems(products);
      setCartCountValue(products.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load cart";
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId, setCartCountValue]);

  useEffect(() => {
    if (userId) {
      fetchItems();
    }
  }, [userId, fetchItems]);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      router.push("/");
      return;
    }
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  }, [router, searchQuery]);

  // Prices come back as strings with currency symbols; normalize them once.
  const normalizePrice = useCallback((price: CartItem["price"]) => {
    if (typeof price === "number") {
      return price;
    }
    const parsed = Number.parseFloat(String(price).replace(/[^0-9.]/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + normalizePrice(item.price) * (item.quantity ?? 1), 0);
  }, [items, normalizePrice]);

  const handleCheckout = async () => {
    if (!userId || items.length === 0) return;

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/henry/cart/checkout", {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.data?.checkout_url) {
        throw new Error(data.message || data.error || "Failed to initiate checkout");
      }

      const returnURL = window.location.origin;

      const checkoutUrl = new URL(data.data.checkout_url);
      checkoutUrl.searchParams.set("returnUrl", returnURL);

      window.location.href = checkoutUrl.toString();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initiate checkout";
      setError(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Remove an item then optimistically sync local state + badge.
  const handleRemoveItem = async (productId: string) => {
    if (!userId) return;
    setRemovingId(productId);
    setError(null);
    try {
      const response = await fetch(`/api/henry/cart/items/${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to remove item");
      }

      setItems((prev) => prev.filter((item) => item.productId !== productId));
      setCartCountValue((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove item";
      setError(message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <SearchPageShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={handleSearchSubmit}
      placeholder="Search products"
      cartCount={cartCount}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">Cart</p>
            <h1 className="text-3xl font-bold text-gray-900">Your Items</h1>
          </div>
          <button
            type="button"
            onClick={fetchItems}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 w-10 h-10 text-brand-dark hover:border-brand-dark hover:text-brand-dark disabled:opacity-40"
            aria-label="Refresh cart"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <title>Loading</title>
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <title>Refresh</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {items.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500 bg-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand-dark">
              <svg
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <title>Cart</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13l-1.3 5.3a1 1 0 00.97 1.2H19M7 13l-2-8H3"
                />
                <circle cx="9" cy="20" r="1" />
                <circle cx="17" cy="20" r="1" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">Your cart is empty</p>
            <p className="text-sm mt-2">Search for products to start adding items.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y">
            {loading ? (
              <div className="p-6 text-gray-500 text-center">Loading cart items...</div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.name}`}
                  className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6"
                >
                  <div className="relative w-full sm:w-24 h-40 sm:h-24 rounded-2xl bg-gray-50 flex-shrink-0 overflow-hidden">
                    {item.productImageLink ? (
                      <Image
                        src={getValidImageUrl(item.productImageLink)}
                        alt={item.name}
                        fill
                        className="object-contain p-6"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                        <svg
                          className="w-8 h-8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <title>Product placeholder</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 7h18M3 7l2 12h14l2-12M5 7l1.5-4.5h11L19 7"
                          />
                        </svg>
                        <span className="text-xs font-semibold">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold text-gray-900 text-lg">{item.name}</p>
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.metadata).map(([key, value]) => (
                            <span
                              key={`${item.productId}-${key}`}
                              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                            >
                              <span className="text-gray-400">{key}:</span> {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">
                          {normalizePrice(item.price).toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </span>
                        <span className="mx-2 text-gray-300" aria-hidden="true">
                          •
                        </span>
                        Qty {item.quantity}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={removingId === item.productId}
                          className="inline-flex items-center justify-center rounded-full border border-red-100 w-10 h-10 text-red-600 hover:border-red-300 disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          {removingId === item.productId ? (
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <title>Removing</title>
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <title>Remove item</title>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M6 6h12M9 6v12m6-12v12M5 6l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 6V4h6v2"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
            <span>Subtotal</span>
            <span>
              {subtotal.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </span>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            Taxes and shipping calculated during checkout.
          </p>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutLoading || items.length === 0}
            className="w-full py-4 bg-brand-primary text-white rounded-full text-lg font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors"
          >
            {checkoutLoading ? "Preparing checkout..." : "Continue to Checkout"}
          </button>
        </div>
      </div>
    </SearchPageShell>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <CartPageContent />
    </Suspense>
  );
}
