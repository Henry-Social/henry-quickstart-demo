"use client";

import Image from "next/image";
import HenryWordmark from "@/assets/henry-wordmark";
import { useBrand } from "@/lib/brand-context";

interface BrandLogoClientProps {
  className?: string;
  height?: number;
}

// Client component - uses context for brand info
export default function BrandLogoClient({ className = "", height = 32 }: BrandLogoClientProps) {
  const { logoUrl, brandName } = useBrand();

  // If no logo URL is configured, fall back to the built-in Henry SVG
  if (!logoUrl) {
    return <HenryWordmark className={className} />;
  }

  // Calculate approximate width based on typical logo aspect ratios (3:1)
  const width = Math.round(height * 3);

  return (
    <Image
      src={logoUrl}
      alt={`${brandName} logo`}
      width={width}
      height={height}
      className={className}
      priority
      unoptimized // CDN handles optimization
    />
  );
}
