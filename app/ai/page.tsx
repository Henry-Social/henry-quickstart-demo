"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isDataUIPart,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import HenryWordmark from "@/assets/henry-wordmark";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import SearchBar from "@/components/SearchBar";
import type { Product } from "@/lib/types";
import { useCartCount } from "@/lib/useCartCount";
import { usePersistentUserId } from "@/lib/usePersistentUserId";

export const dynamic = "force-dynamic";

const placeholders = [
  "Yoga mats with good grip",
  "Nike shoes",
  "Summer dresses",
  "Wireless headphones",
  "Organic skincare",
  "Running gear",
];

function normalizePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.,-]/g, "").replace(/,/g, "");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  if (typeof value === "object" && value && "amount" in (value as Record<string, unknown>)) {
    return normalizePrice((value as Record<string, unknown>).amount);
  }
  return null;
}

function extractProductArray(raw: unknown): unknown[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const candidates = ["products", "items", "results", "data", "matches"];

  for (const key of candidates) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const nested = extractProductArray(obj[key]);
    if (nested) return nested;
  }

  if ("toolResult" in obj) {
    return extractProductArray((obj as Record<string, unknown>).toolResult);
  }

  if ("result" in obj) {
    return extractProductArray((obj as Record<string, unknown>).result);
  }

  return null;
}

function normalizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id =
    value.id ??
    value.productId ??
    value.product_id ??
    value.sku ??
    value.uid ??
    value.slug ??
    value.handle;
  const name = value.name ?? value.title ?? value.productName ?? value.handle;

  if (!id || !name) return null;

  const price =
    normalizePrice(
      value.price ??
        value.priceValue ??
        value.extractedPrice ??
        value.priceUsd ??
        value.current_price ??
        value.salePrice ??
        (typeof value.price_cents === "number" ? value.price_cents / 100 : undefined),
    ) ?? 0;

  const imageUrl =
    (typeof value.imageUrl === "string" && value.imageUrl) ||
    (typeof value.image === "string" && value.image) ||
    (typeof value.thumbnail === "string" && value.thumbnail) ||
    (typeof value.thumbnailUrl === "string" && value.thumbnailUrl) ||
    (Array.isArray(value.thumbnails) && typeof value.thumbnails[0] === "string"
      ? value.thumbnails[0]
      : "") ||
    "";

  const productLink =
    (typeof value.productLink === "string" && value.productLink) ||
    (typeof value.url === "string" && value.url) ||
    (typeof value.link === "string" && value.link) ||
    (typeof value.href === "string" && value.href) ||
    "";

  const source =
    (typeof value.source === "string" && value.source) ||
    (typeof value.merchant === "string" && value.merchant) ||
    (typeof value.store === "string" && value.store) ||
    (typeof value.retailer === "string" && value.retailer) ||
    "Henry";

  return {
    id: String(id),
    name: String(name),
    price,
    imageUrl,
    productLink,
    source,
  };
}

function extractProductsFromMessage(message: UIMessage): Product[] {
  const products: Product[] = [];

  for (const part of message.parts) {
    if (isToolUIPart(part)) {
      if (part.state === "output-available") {
        const candidateProducts = extractProductArray((part as { output?: unknown }).output);
        if (candidateProducts) {
          const normalized = candidateProducts
            .map(normalizeProduct)
            .filter((item): item is Product => Boolean(item));
          products.push(...normalized);
        }
      }
      continue;
    }

    if (isDataUIPart(part) && part.type === "data-products") {
      const candidateProducts = extractProductArray(part.data);
      if (candidateProducts) {
        const normalized = candidateProducts
          .map(normalizeProduct)
          .filter((item): item is Product => Boolean(item));
        products.push(...normalized);
      }
    }
  }

  return products;
}

function getTextFromMessage(message: UIMessage) {
  return message.parts
    .filter((part) => isTextUIPart(part))
    .map((part) => (part as { text: string }).text)
    .join("")
    .trim();
}

function hasPendingTool(message: UIMessage) {
  return message.parts.some(
    (part) => isToolUIPart(part) && part.state !== "output-available" && part.state !== "output-error",
  );
}

export default function AIPage() {
  const router = useRouter();
  const userId = usePersistentUserId();
  const { cartCount } = useCartCount(userId);

  const [input, setInput] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [heroMode, setHeroMode] = useState(true);
  const [lastQuery, setLastQuery] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/ai" }), []);

  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length > 0 && heroMode) {
      setHeroMode(false);
    }
  }, [messages.length, heroMode]);

  useEffect(() => {
    if (!heroMode) {
      searchInputRef.current?.focus();
    }
  }, [heroMode]);

  useEffect(() => {
    if (!heroMode && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, heroMode]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setHeroMode(false);
    setLastQuery(trimmed);
    setInput("");
    await sendMessage({ text: trimmed });
  };

  const handleProductSelect = (product: Product) => {
    const encodedId = encodeURIComponent(product.id);
    const params = new URLSearchParams();
    if (lastQuery) {
      params.set("q", lastQuery);
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
  };

  const renderMessages = () =>
    messages
      .filter((message) => message.role !== "system")
      .map((message) => {
        const text = getTextFromMessage(message);
        const products = extractProductsFromMessage(message);
        const waitingOnTool = hasPendingTool(message);
        const isUser = message.role === "user";

        return (
          <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-2xl w-full rounded-2xl px-4 py-3 shadow-sm ${
                isUser ? "bg-[#44c57e] text-white" : "bg-gray-50 text-gray-900"
              }`}
            >
              {text && <p className="whitespace-pre-wrap text-base leading-relaxed">{text}</p>}
              {waitingOnTool && !products.length && (
                <p className="text-sm text-gray-500 mt-2">Searching Henry for options…</p>
              )}
              {products.length > 0 && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <ProductGrid products={products} loading={false} onSelect={handleProductSelect} />
                </div>
              )}
            </div>
          </div>
        );
      });

  if (heroMode) {
    return (
      <main className="min-h-screen bg-white">
        <div className="min-h-screen flex flex-col">
          <Header cartCount={cartCount} showLogo={false} />
          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-32">
            <HenryWordmark className="h-16 text-[#44c57e] mb-4" />
            <div className="w-full max-w-2xl">
              <SearchBar
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
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
    <main className="min-h-screen bg-white flex flex-col">
      <Header cartCount={cartCount} />
      <div className="flex-1 flex flex-col">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4">
          <div className="max-w-3xl mx-auto w-full space-y-4 py-6">
            {renderMessages()}
            {(status === "submitted" || status === "streaming") && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-50 px-4 py-3 shadow-sm text-gray-600">
                  Henry is thinking…
                </div>
              </div>
            )}
            {error && (
              <div className="text-red-600 text-sm" role="alert">
                {error.message}
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="max-w-3xl mx-auto w-full px-4 py-4">
            <SearchBar
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder="Ask Henry to find products"
              inputRef={searchInputRef}
            />
            <p className="mt-2 text-xs text-gray-500">
              Powered by Claude 3.5 Sonnet with Henry Labs MCP tools.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
