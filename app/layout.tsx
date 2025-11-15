import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Henry Quickstart Demo",
  description: "Complete buy-now flow with Henry API",
  manifest: "/manifest.webmanifest",
  themeColor: "#ffffff",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white">
        {children}
        <Script strategy="afterInteractive">
          {`if ("serviceWorker" in navigator) {
            const registerServiceWorker = () => {
              navigator.serviceWorker
                .register("/sw.js")
                .catch((error) => console.error("SW registration failed:", error));
            };
            if (document.readyState === "complete") {
              registerServiceWorker();
            } else {
              window.addEventListener("load", registerServiceWorker, { once: true });
            }
          }`}
        </Script>
      </body>
    </html>
  );
}
