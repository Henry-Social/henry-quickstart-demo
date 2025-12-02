import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { generateBrandCSS, getBrandConfig, getClientBrandConfig } from "@/lib/brand-config";
import { BrandProvider } from "@/lib/brand-context";

const brandConfig = getBrandConfig();

export const metadata: Metadata = {
  title: `${brandConfig.brand.name} Quickstart Demo`,
  description: brandConfig.brand.description,
  manifest: "/manifest.webmanifest",
  themeColor: "#ffffff",
  icons: {
    icon: brandConfig.assets.iconUrl || "/icon.png",
    apple: brandConfig.assets.appleTouchIconUrl || "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: generateBrandCSS() }} />
      </head>
      <body className="bg-white">
        <BrandProvider config={getClientBrandConfig()}>{children}</BrandProvider>
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
