import Image from "next/image";
import { getBrandConfig } from "@/lib/brand-config";
import HenryWordmark from "@/assets/henry-wordmark";

interface BrandLogoProps {
  className?: string;
  height?: number;
}

// Server component - reads config at build time
export default function BrandLogo({ className = "", height = 32 }: BrandLogoProps) {
  const config = getBrandConfig();
  const logoUrl = config.assets.logoUrl;
  const brandName = config.brand.name;

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
