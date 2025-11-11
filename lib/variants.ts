import type { ProductDetails } from "./types";

export const buildDefaultVariantSelections = (details: ProductDetails): Record<string, string> => {
  const variants = details.productResults.variants;
  if (!variants || variants.length === 0) {
    return {};
  }

  return variants.reduce<Record<string, string>>((acc, variant) => {
    const selectedItem =
      variant.items.find((item) => item.selected && item.available !== false) ||
      variant.items.find((item) => item.available !== false) ||
      variant.items[0];

    if (selectedItem) {
      acc[variant.title] = selectedItem.name;
    }

    return acc;
  }, {});
};

export const getVariantPriority = (title: string) => {
  const normalized = title.toLowerCase();
  if (normalized.includes("size")) return 2;
  if (normalized.includes("color")) return 1;
  return 0;
};

export const findVariantSelection = (
  variants: ProductDetails["productResults"]["variants"],
  selected: Record<string, string>,
  keyword: string,
) => {
  const match = variants.find((variant) => variant.title.toLowerCase().includes(keyword));
  if (!match) return null;
  return {
    title: match.title,
    value: selected[match.title],
  };
};
