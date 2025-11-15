import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Henry Quickstart Demo",
    short_name: "Henry",
    description: "Complete buy-now flow with Henry API",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#44c57e",
    icons: [
      {
        src: "/icon.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
