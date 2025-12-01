"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, useMemo } from "react";
import HenryWordmark from "@/assets/henry-wordmark";
import Header from "@/components/Header";
import ChatMessage from "@/components/chat/ChatMessage";
import { useCartCount } from "@/lib/useCartCount";
import { usePersistentUserId } from "@/lib/usePersistentUserId";

const placeholders = [
  "Find me running shoes under $100",
  "What's a good yoga mat?",
  "Show me wireless headphones",
  "I need a summer dress",
  "Best organic skincare products",
];

export default function AIChat() {
  const userId = usePersistentUserId();
  const { cartCount } = useCartCount(userId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");

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
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const placeholderIndex = Math.floor(Date.now() / 3000) % placeholders.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  // Hero View - centered input, no messages
  if (!hasMessages) {
    return (
      <main className="min-h-screen bg-white">
        <div className="min-h-screen flex flex-col">
          <Header cartCount={cartCount} showLogo={false} />
          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-32">
            <HenryWordmark className="h-16 text-[#44c57e] mb-2" />
            <p className="text-gray-500 mb-6 text-center">AI Shopping Assistant</p>
            <div className="w-full max-w-2xl">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>Search</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholders[placeholderIndex]}
                    className="w-full pl-12 pr-20 py-4 text-lg bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#44c57e] focus:ring-4 focus:ring-[#44c57e]/20 transition-all duration-200"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#44c57e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#3bb36e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Ask
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Chat View - messages above, input at bottom
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <Header cartCount={cartCount} showLogo={true} />
        <button
          onClick={clearChat}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear Chat
        </button>
      </div>

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
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Message</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products..."
                className="w-full pl-11 pr-16 py-3 text-base bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-[#44c57e] focus:ring-2 focus:ring-[#44c57e]/20 focus:bg-white transition-all duration-200"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#44c57e] text-white p-2 rounded-full hover:bg-[#3bb36e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>Send</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
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
