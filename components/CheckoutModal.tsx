"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface CheckoutModalProps {
  url: string | null;
  onClose: () => void;
  title?: string;
}

export default function CheckoutModal({ url, onClose, title = "Complete Your Purchase" }: CheckoutModalProps) {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const allowedOrigin = useMemo(() => {
    try {
      return url ? new URL(url).origin : null;
    } catch {
      return null;
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;

    const handleMessage = (event: MessageEvent) => {
      if (!allowedOrigin || event.origin !== allowedOrigin) return;
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;
      const { action } = (event.data || {}) as { action?: string };
      if (action === "checkoutClosed") {
        onClose();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [url, allowedOrigin, onClose]);

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#44c57e]"></div>
              <p className="mt-4 text-gray-600">Loading checkout...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url ?? undefined}
          className="w-full h-full"
          title="Checkout"
          allow="payment *; clipboard-read; clipboard-write"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}

