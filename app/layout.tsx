import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Henry Quickstart Demo",
  description: "Complete buy-now flow with Henry API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}