"use client";

import {
  isToolOrDynamicToolUIPart,
  type UIMessage,
  type UIMessagePart,
  type UIDataTypes,
  type UITools,
} from "ai";
import ReactMarkdown from "react-markdown";
import type { Product } from "@/lib/types";
import ProductCardsInline from "./ProductCardsInline";

type Props = {
  message: UIMessage;
};

function extractProductsFromToolOutput(output: unknown): Product[] {
  if (!output || typeof output !== "object") return [];

  // Handle different possible response structures from MCP
  const data = output as Record<string, unknown>;

  // Handle MCP content array format: { content: [{ type: "text", text: '{"products": [...]}' }] }
  if (Array.isArray(data.content)) {
    for (const item of data.content) {
      if (item && typeof item === "object") {
        const contentItem = item as Record<string, unknown>;
        if (contentItem.type === "text" && typeof contentItem.text === "string") {
          try {
            const parsed = JSON.parse(contentItem.text);
            const extracted = extractProductsFromToolOutput(parsed);
            if (extracted.length > 0) return extracted;
          } catch {
            // Not JSON, continue
          }
        }
      }
    }
  }

  // Check for products array directly
  if (Array.isArray(data.products)) {
    return normalizeProducts(data.products);
  }

  // Check for data.products
  if (data.data && typeof data.data === "object") {
    const innerData = data.data as Record<string, unknown>;
    if (Array.isArray(innerData.products)) {
      return normalizeProducts(innerData.products);
    }
  }

  // Check for results array
  if (Array.isArray(data.results)) {
    return normalizeProducts(data.results);
  }

  // Check if output itself is an array
  if (Array.isArray(output)) {
    return normalizeProducts(output);
  }

  return [];
}

function normalizeProducts(items: unknown[]): Product[] {
  return items
    .filter((item): item is Record<string, unknown> => {
      return item !== null && typeof item === "object";
    })
    .map((item) => ({
      id: String(item.id || item.productId || ""),
      name: String(item.name || item.title || ""),
      price: Number(item.price || item.extractedPrice || 0),
      imageUrl: String(item.imageUrl || item.image || item.thumbnail || ""),
      productLink: String(item.productLink || item.link || item.url || ""),
      source: String(item.source || item.merchant || item.store || ""),
    }))
    .filter((p) => p.id && p.name);
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  // User messages: just render text
  if (isUser) {
    const textContent =
      message.parts
        ?.filter(
          (p): p is Extract<UIMessagePart<UIDataTypes, UITools>, { type: "text" }> =>
            p.type === "text",
        )
        .map((p) => p.text)
        .join("") || "";
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-[#44c57e] text-white px-4 py-2 rounded-2xl rounded-br-md">
          <p className="text-sm whitespace-pre-wrap">{textContent}</p>
        </div>
      </div>
    );
  }

  // Assistant messages: render parts in order to preserve sequence
  // (text -> tool results -> text)
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[95%] space-y-2">
        {message.parts?.map((part, index) => {
          // Text part
          if (part.type === "text" && part.text) {
            return (
              <div
                key={index}
                className="w-fit max-w-[85%] bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md prose prose-sm prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-gray-800"
              >
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            );
          }

          // Tool part with products
          if (isToolOrDynamicToolUIPart(part) && part.state === "output-available") {
            const products = extractProductsFromToolOutput(part.output);
            if (products.length > 0) {
              return <ProductCardsInline key={index} products={products} />;
            }
          }

          return null;
        })}
      </div>
    </div>
  );
}
