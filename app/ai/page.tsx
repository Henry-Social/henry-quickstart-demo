"use client";

import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import HenryWordmark from "@/assets/henry-wordmark";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import type { Product } from "@/lib/types";
import { useCartCount } from "@/lib/useCartCount";
import { usePersistentUserId } from "@/lib/usePersistentUserId";

export const dynamic = "force-dynamic";

const placeholders = [
  "Find me a great gift for a coffee lover",
  "Compare the best noise-cancelling headphones",
  "Show me sustainable running shoes",
  "What are the top rated yoga mats?",
];

export default function AiPage() {
  const router = useRouter();
  const userId = usePersistentUserId();
  const { cartCount } = useCartCount(userId);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const { messages, append } = useChat({
    api: "/api/chat",
  } as any) as any;
  
  const [input, setInput] = useState("");

  // Cycle placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleProductSelect = useCallback(
    (product: Product) => {
      const encodedId = encodeURIComponent(product.id);
      const params = new URLSearchParams();
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
    [router],
  );

  const handleSearchSubmit = () => {
    if (!input.trim()) return;
    append({ role: "user", content: input });
    setInput("");
  };

  const isChatStarted = messages.length > 0;

  // Render Tool Invocation Results
  const renderToolResult = (toolInvocation: any) => {
    if (toolInvocation.state !== 'result') return null;

    // Check if the result looks like a product list or search result
    const result = toolInvocation.result;
    let products: Product[] = [];

    if (Array.isArray(result)) {
      products = result.filter(item => item && typeof item === 'object' && 'id' in item && 'name' in item);
    } else if (result && typeof result === 'object') {
       // Handle cases where the result might be wrapped (e.g. { products: [...] })
       if (Array.isArray(result.products)) {
         products = result.products;
       } else if (Array.isArray(result.results)) {
         products = result.results;
       }
    }

    if (products.length > 0) {
      return (
        <div className="mt-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductSelect} />
            ))}
            </div>
        </div>
      );
    }

    // Fallback for non-product results or if parsing failed
    return (
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs mt-2">
            {JSON.stringify(result, null, 2)}
        </pre>
    );
  };

  if (!isChatStarted) {
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
                onSubmit={handleSearchSubmit} // We use our custom submit wrapper
                placeholder={placeholders[placeholderIndex]}
                inputRef={inputRef}
              />
              <div className="mt-4 flex justify-center gap-2">
                 <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">Powered by Henry Labs MCP</span>
                 <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">Claude 3.5 Sonnet</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Header cartCount={cartCount} showLogo={true} />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-32 pt-4 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    m.role === 'user' 
                    ? 'bg-[#44c57e] text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                
                {/* Tool Invocations */}
                {m.toolInvocations?.map((toolInvocation: any) => (
                   <div key={toolInvocation.toolCallId} className="w-full mt-2">
                      {renderToolResult(toolInvocation)}
                   </div>
                ))}
              </div>
            </div>
          ))}
          {/* Loading Indicator for Assistant */}
          {messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-none px-5 py-3">
                      <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-10">
        <div className="max-w-3xl mx-auto">
             <SearchBar
                value={input}
                onChange={setInput}
                onSubmit={handleSearchSubmit}
                placeholder="Ask follow up..."
                inputRef={inputRef}
                variant="default" // Keep default or maybe slightly different
                className="shadow-lg"
              />
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400">AI can make mistakes. Please verify important information.</span>
              </div>
        </div>
      </div>
    </main>
  );
}