"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import BrandLogoClient from "@/components/BrandLogoClient";
import ChatMessage from "@/components/chat/ChatMessage";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import { useBrand } from "@/lib/brand-context";
import { useCartCount } from "@/lib/useCartCount";
import { usePersistentUserId } from "@/lib/usePersistentUserId";

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function AIChat() {
  const userId = usePersistentUserId();
  const { cartCount } = useCartCount(userId);
  const { placeholders, suggestedQueries } = useBrand();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);

  // Shuffle and sample up to 10 suggested queries once on mount
  const shuffledQueries = useMemo(
    () => shuffleArray(suggestedQueries).slice(0, 10),
    [suggestedQueries],
  );

  const storageKey = `henry-chat-${userId}`;

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/ai/chat" }), []);

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  // Load messages from localStorage on mount (and when userId becomes available)
  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [userId, storageKey, setMessages]);

  // Save messages to localStorage
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [userId, messages, storageKey]);

  // Clear chat history
  const clearChat = () => {
    localStorage.removeItem(storageKey);
    window.location.reload();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleSuggestionClick = (query: string) => {
    if (isLoading) return;
    sendMessage({ text: query });
  };

  // Hero View - centered input, no messages
  if (!hasMessages) {
    return (
      <main className="min-h-screen bg-white">
        <div className="min-h-screen flex flex-col">
          <Header cartCount={cartCount} showLogo={false} mode="ai" />
          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
            <BrandLogoClient className="h-16 text-brand-primary mb-4" height={64} />
            <div className="w-full max-w-2xl">
              <SearchBar
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                inputRef={inputRef}
                icon="star"
                showSubmitButton
                disabled={isLoading}
                placeholder={placeholders.length === 0 ? "Ask about products..." : undefined}
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
                      disabled={isLoading}
                      className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

  // Chat View - messages above, input at bottom
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Header cartCount={cartCount} showLogo={true} mode="ai" onNewChat={clearChat} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-flex h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                  <span className="inline-flex h-2 w-2 rounded-full bg-gray-400 animate-pulse [animation-delay:150ms]" />
                  <span className="inline-flex h-2 w-2 rounded-full bg-gray-400 animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center mb-4">
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                Something went wrong. Please try again.
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input at Bottom */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <title>AI</title>
                  <path d="M12 1L9 9L1 12L9 15L12 23L15 15L23 12L15 9L12 1Z" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products..."
                className="w-full pl-11 pr-14 py-3 text-base bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all duration-200"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary text-white p-2 rounded-full hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>Send</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
