import { readFileSync } from "fs";
import { parse } from "yaml";
import { join } from "path";

export interface BrandConfig {
  brand: {
    name: string;
    shortName: string;
    description: string;
  };
  assets: {
    logoUrl: string;
    iconUrl: string;
    appleTouchIconUrl: string;
  };
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primaryHover: string;
  };
}

let cachedConfig: BrandConfig | null = null;

export function getBrandConfig(): BrandConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = join(process.cwd(), "brand.config.yaml");
  const fileContents = readFileSync(configPath, "utf8");
  cachedConfig = parse(fileContents) as BrandConfig;

  // Apply defaults for optional fields
  if (!cachedConfig.colors.primaryHover) {
    cachedConfig.colors.primaryHover = cachedConfig.colors.primary;
  }

  return cachedConfig;
}

// For client-side usage - exports serializable config
export function getClientBrandConfig() {
  const config = getBrandConfig();
  return {
    brandName: config.brand.name,
    logoUrl: config.assets.logoUrl || null,
    iconUrl: config.assets.iconUrl || null,
  };
}

// Generate CSS custom properties from brand config
export function generateBrandCSS(): string {
  const { colors } = getBrandConfig();
  return `
:root {
  --color-primary: #${colors.primary};
  --color-primary-dark: #${colors.primaryDark};
  --color-primary-light: #${colors.primaryLight};
  --color-primary-hover: #${colors.primaryHover};
  --color-primary-rgb: ${hexToRgb(colors.primary)};
}
`.trim();
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
