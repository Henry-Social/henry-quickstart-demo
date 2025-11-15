import type { ProductDetails } from "@/lib/types";

export type ProductStore = ProductDetails["productResults"]["stores"][number];

export const buildStoreKey = (store: ProductStore) => {
  const namePart = store.name || "store";
  const linkPart = store.link || "";
  return `${namePart}::${linkPart}`;
};

export const parsePriceValue = (rawPrice?: string) => {
  if (!rawPrice) {
    return 0;
  }
  const normalized = parseFloat(rawPrice.replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) ? normalized : 0;
};
