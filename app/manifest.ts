import type { MetadataRoute } from "next";
import { getBrandConfig } from "@/lib/brand-config";

export default function manifest(): MetadataRoute.Manifest {
  const config = getBrandConfig();

  return {
    name: `${config.brand.name} Quickstart Demo`,
    short_name: config.brand.shortName,
    description: config.brand.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: config.assets.iconUrl || "/icon.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: config.assets.appleTouchIconUrl || "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
