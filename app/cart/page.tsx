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

      window.location.href = data.data.checkout_url;
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          <button
            type="button"
            onClick={fetchItems}
            disabled={loading}
            className="text-sm text-[#1b8451] hover:text-[#126539] disabled:opacity-40"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {items.length === 0 && !loading ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
            <p className="text-lg font-medium">Your cart is empty.</p>
            <p className="text-sm mt-2">Search for products to start adding items.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y">
            {loading ? (
              <div className="p-6 text-gray-500 text-center">Loading cart items...</div>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.name}`} className="p-6 flex gap-4">
                  <div className="relative w-20 h-20 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden">
                    {item.productImageLink ? (
                      <Image
                        src={getValidImageUrl(item.productImageLink)}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                          <p className="text-sm text-gray-500">
                            {Object.entries(item.metadata)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" • ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {normalizePrice(item.price).toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.productId)}
                      disabled={removingId === item.productId}
                      className="mt-3 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {removingId === item.productId ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
            <span>Subtotal</span>
            <span>
              {subtotal.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Taxes and shipping will be calculated during checkout.
          </p>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutLoading || items.length === 0}
            className="w-full py-3 bg-[#44c57e] text-white rounded-lg font-semibold hover:bg-[#3aaa6a] disabled:opacity-50 transition-colors"
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
    <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
      <CartPageContent />
    </Suspense>
  );
}
