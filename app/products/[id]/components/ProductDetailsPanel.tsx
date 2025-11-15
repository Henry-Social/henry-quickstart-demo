"use client";

import Image from "next/image";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ProductDetails } from "@/lib/types";
import { buildStoreKey, type ProductStore } from "../utils";

interface ProductDetailsPanelProps {
  productDetails: ProductDetails | null;
  productName: string;
  productPrice: number;
  productLink: string;
  selectedStore: ProductStore | null;
  selectedStoreKey: string | null;
  onStoreChange: (storeKey: string) => void;
  sortedVariants: NonNullable<ProductDetails["productResults"]["variants"]>;
  selectedVariants: Record<string, string>;
  onVariantSelect: (variantTitle: string, optionName: string) => void;
  quantity: number;
  onIncrementQuantity: () => void;
  onDecrementQuantity: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  addingToCart: boolean;
  addedToCartSuccess: boolean;
  loadingCheckout: boolean;
  loadingMessage: string;
  errorMessage: string | null;
  productId: string;
}

export function ProductDetailsPanel({
  productDetails,
  productName,
  productPrice,
  productLink,
  selectedStore,
  selectedStoreKey,
  onStoreChange,
  sortedVariants,
  selectedVariants,
  onVariantSelect,
  quantity,
  onIncrementQuantity,
  onDecrementQuantity,
  onAddToCart,
  onBuyNow,
  addingToCart,
  addedToCartSuccess,
  loadingCheckout,
  loadingMessage,
  errorMessage,
  productId,
}: ProductDetailsPanelProps) {
  const aboutInfo = productDetails?.productResults?.aboutTheProduct;

  return (
    <div className="space-y-6">
      <div>
        {productDetails ? (
          <>
            <MerchantHeader
              productDetails={productDetails}
              selectedStore={selectedStore}
              selectedStoreKey={selectedStoreKey}
              onStoreChange={onStoreChange}
            />
            <h1 className="text-3xl font-bold mb-1">
              {productDetails.productResults.title || productName}
            </h1>
            {productDetails.productResults.reviews > 0 && (
              <RatingSummary
                rating={productDetails.productResults.rating}
                reviews={productDetails.productResults.reviews}
              />
            )}
          </>
        ) : (
          <SkeletonHeader />
        )}
      </div>

      {productDetails ? (
        <PriceDisplay
          priceLabel={
            selectedStore?.price ||
            (productPrice ? `$${productPrice.toFixed(2)}` : "Price unavailable")
          }
          priceRange={productDetails.productResults.priceRange}
        />
      ) : (
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
      )}

      <VariantSelectorList
        variants={sortedVariants}
        selectedVariants={selectedVariants}
        onVariantSelect={onVariantSelect}
      />

      <QuantitySelector
        quantity={quantity}
        onDecrement={onDecrementQuantity}
        onIncrement={onIncrementQuantity}
      />

      <ActionButtons
        canSubmit={Boolean(productDetails)}
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
        addingToCart={addingToCart}
        addedToCartSuccess={addedToCartSuccess}
        loadingCheckout={loadingCheckout}
        loadingMessage={loadingMessage}
        errorMessage={errorMessage}
      />

      {aboutInfo && (
        <ProductDescriptionCard
          key={`description-${productId}`}
          aboutInfo={aboutInfo}
          merchantName={selectedStore?.name}
          merchantLink={selectedStore?.link || productLink}
        />
      )}
    </div>
  );
}

interface MerchantHeaderProps {
  productDetails: ProductDetails;
  selectedStore: ProductStore | null;
  selectedStoreKey: string | null;
  onStoreChange: (storeKey: string) => void;
}

function MerchantHeader({
  productDetails,
  selectedStore,
  selectedStoreKey,
  onStoreChange,
}: MerchantHeaderProps) {
  const aboutInfo = productDetails.productResults.aboutTheProduct;
  const stores = productDetails.productResults.stores ?? [];

  if (stores.length > 1 && selectedStore) {
    return (
      <div className="mb-3">
        <label className="relative inline-flex w-full max-w-sm items-center justify-between gap-4 rounded-full px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3 pointer-events-none">
            {selectedStore.logo || aboutInfo?.icon ? (
              <span className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden flex items-center justify-center bg-white">
                <Image
                  src={selectedStore.logo || aboutInfo?.icon || ""}
                  alt={selectedStore.name || "Merchant logo"}
                  width={40}
                  height={40}
                  className="object-cover"
                  unoptimized
                />
              </span>
            ) : (
              <span className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-semibold">
                {(selectedStore.name || "M").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="flex flex-col">
              <span className="text-xs uppercase font-semibold text-gray-500">Merchant</span>
              <span className="text-lg font-semibold text-gray-900">{selectedStore.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-700 pointer-events-none">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <title>Change merchant</title>
              <path d="M7 10l5 5 5-5" />
            </svg>
          </div>
          <select
            aria-label="Select merchant"
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            value={selectedStoreKey ?? buildStoreKey(selectedStore)}
            onChange={(event) => onStoreChange(event.target.value)}
          >
            {stores.map((store) => {
              const optionKey = buildStoreKey(store);
              return (
                <option key={optionKey} value={optionKey}>
                  {store.name}
                </option>
              );
            })}
          </select>
        </label>
      </div>
    );
  }

  if (stores.length === 1 && stores[0]) {
    const store = stores[0];
    return (
      <div className="flex items-center gap-3 mb-3">
        {store.logo ? (
          <Image
            src={store.logo}
            alt={store.name || "Merchant"}
            width={40}
            height={40}
            className="rounded-full object-cover border border-gray-300 p-0.5 bg-white"
            unoptimized
          />
        ) : (
          <span className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-semibold">
            {(store.name || "M").slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="text-lg font-semibold text-gray-900">{store.name}</span>
      </div>
    );
  }

  if (productDetails.productResults.brand) {
    return (
      <div className="mb-3 text-lg font-semibold text-gray-900">
        {productDetails.productResults.brand}
      </div>
    );
  }

  return null;
}

function RatingSummary({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex text-lg">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-gray-600 text-sm sm:text-base">
        {rating}/5 ({reviews} reviews)
      </span>
    </div>
  );
}

function SkeletonHeader() {
  return (
    <>
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
      <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
    </>
  );
}

function PriceDisplay({ priceLabel, priceRange }: { priceLabel: string; priceRange?: string }) {
  return (
    <div className="space-y-2">
      <div className="text-4xl font-bold text-[#44c57e]">{priceLabel}</div>
      {priceRange && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#ebf8f1] text-[#1b8451]">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <title>Price tag</title>
              <path d="M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9z" />
              <circle cx="9" cy="9" r="1.5" />
            </svg>
          </span>
          <span>
            <span className="font-semibold text-gray-900">Typical Price:</span> {priceRange}
          </span>
        </div>
      )}
    </div>
  );
}

interface VariantSelectorListProps {
  variants: NonNullable<ProductDetails["productResults"]["variants"]>;
  selectedVariants: Record<string, string>;
  onVariantSelect: (variantTitle: string, optionName: string) => void;
}

function VariantSelectorList({
  variants,
  selectedVariants,
  onVariantSelect,
}: VariantSelectorListProps) {
  const MAX_VISIBLE_ROWS = 3;
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});
  const [variantLayout, setVariantLayout] = useState<
    Record<string, { hiddenCount: number; collapseHeight: number }>
  >({});
  const variantOptionRefs = useRef<Record<string, Record<string, HTMLButtonElement | null>>>({});

  const recalcVariantLayout = useCallback(() => {
    if (!variants.length) {
      setVariantLayout({});
      return;
    }

    const nextLayout: Record<string, { hiddenCount: number; collapseHeight: number }> = {};

    variants.forEach((variant) => {
      const optionRefs = variantOptionRefs.current[variant.title];
      if (!optionRefs) {
        nextLayout[variant.title] = { hiddenCount: 0, collapseHeight: 0 };
        return;
      }

      const buttons = Object.values(optionRefs).filter((button): button is HTMLButtonElement =>
        Boolean(button),
      );

      if (!buttons.length) {
        nextLayout[variant.title] = { hiddenCount: 0, collapseHeight: 0 };
        return;
      }

      const rowTops: number[] = [];
      const rowBottoms: number[] = [];
      let hiddenCount = 0;

      buttons.forEach((button) => {
        const top = button.offsetTop;
        const height = button.offsetHeight;
        let rowIndex = rowTops.findIndex((value) => Math.abs(value - top) < 4);
        if (rowIndex === -1) {
          rowIndex = rowTops.length;
          rowTops.push(top);
        }
        rowBottoms[rowIndex] = Math.max(rowBottoms[rowIndex] ?? 0, top + height);
        if (rowIndex >= MAX_VISIBLE_ROWS) {
          hiddenCount += 1;
        }
      });

      const visibleRowIndex = Math.min(MAX_VISIBLE_ROWS - 1, rowBottoms.length - 1);
      const baseHeight = visibleRowIndex >= 0 ? rowBottoms[visibleRowIndex] : 0;
      const collapseHeight = baseHeight > 0 ? baseHeight + 8 : 0;

      nextLayout[variant.title] = { hiddenCount, collapseHeight };
    });

    setVariantLayout(nextLayout);
  }, [variants]);

  useLayoutEffect(() => {
    recalcVariantLayout();
  }, [recalcVariantLayout]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleResize = () => {
      recalcVariantLayout();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [recalcVariantLayout]);

  useEffect(() => {
    setExpandedVariants((previous) => {
      const next = { ...previous };
      const validTitles = new Set(variants.map((variant) => variant.title));
      Object.keys(next).forEach((title) => {
        if (!validTitles.has(title)) {
          delete next[title];
        }
      });
      return next;
    });
  }, [variants]);

  if (!variants.length) {
    return null;
  }

  return (
    <>
      {variants.map((variant) => {
        const layoutInfo = variantLayout[variant.title];
        const isCollapsed = !expandedVariants[variant.title] && (layoutInfo?.hiddenCount ?? 0) > 0;
        const collapseStyles: CSSProperties | undefined =
          isCollapsed && layoutInfo?.collapseHeight
            ? {
                maxHeight: `${layoutInfo.collapseHeight}px`,
                overflow: "hidden",
              }
            : undefined;

        return (
          <div key={variant.title}>
            <h4 className="font-medium mb-3 text-lg">{variant.title}:</h4>
            <div className="flex flex-wrap gap-2" style={collapseStyles}>
              {variant.items.map((item) => {
                const isAvailable = item.available !== false;
                const isSelected = selectedVariants[variant.title] === item.name;
                const optionLabel = item.name?.trim() ?? "";
                const isCompactOption = optionLabel.length <= 2;
                const shapeClasses = isCompactOption
                  ? "w-12 h-12 rounded-full"
                  : "px-5 py-2 rounded-full";
                const stateClasses = isSelected
                  ? "bg-[#44c57e] text-white border-[#44c57e] shadow-sm"
                  : isAvailable
                    ? "bg-white hover:bg-gray-50 border-gray-300 text-gray-800"
                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";

                return (
                  <button
                    key={item.name}
                    ref={(element) => {
                      if (!variantOptionRefs.current[variant.title]) {
                        variantOptionRefs.current[variant.title] = {};
                      }
                      if (element) {
                        variantOptionRefs.current[variant.title]![item.name] = element;
                      } else {
                        delete variantOptionRefs.current[variant.title]![item.name];
                      }
                    }}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => {
                      if (isAvailable) {
                        onVariantSelect(variant.title, item.name);
                      }
                    }}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-center border text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#44c57e]/40 ${shapeClasses} ${stateClasses}`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
            {isCollapsed && layoutInfo?.hiddenCount ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedVariants((prev) => ({
                    ...prev,
                    [variant.title]: true,
                  }))
                }
                className="mt-2 inline-flex items-center px-4 py-2 rounded-full border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                +{layoutInfo.hiddenCount} more
              </button>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

interface QuantitySelectorProps {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

function QuantitySelector({ quantity, onDecrement, onIncrement }: QuantitySelectorProps) {
  return (
    <div>
      <p className="font-medium text-lg mb-2">Quantity</p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
        <button
          type="button"
          onClick={onDecrement}
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-xl leading-none text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          -
        </button>
        <span className="text-xl font-semibold tabular-nums min-w-[2ch] text-center text-gray-900">
          {quantity}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          aria-label="Increase quantity"
          disabled={quantity >= 99}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-xl leading-none text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}

interface ActionButtonsProps {
  canSubmit: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  addingToCart: boolean;
  addedToCartSuccess: boolean;
  loadingCheckout: boolean;
  loadingMessage: string;
  errorMessage: string | null;
}

function ActionButtons({
  canSubmit,
  onAddToCart,
  onBuyNow,
  addingToCart,
  addedToCartSuccess,
  loadingCheckout,
  loadingMessage,
  errorMessage,
}: ActionButtonsProps) {
  return (
    <div className="pt-4 space-y-3">
      <button
        type="button"
        onClick={onAddToCart}
        disabled={addingToCart || !canSubmit}
        className="w-full py-4 bg-[#44c57e] text-white rounded-full text-lg font-semibold shadow-lg hover:bg-[#3aaa6a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {addingToCart ? (
          "Adding..."
        ) : addedToCartSuccess ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <title>Added to cart</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Added to Cart
          </span>
        ) : (
          "Add to Cart"
        )}
      </button>
      <button
        type="button"
        onClick={onBuyNow}
        disabled={loadingCheckout || !canSubmit}
        className="w-full py-4 border border-[#1b8451] text-[#1b8451] rounded-full text-lg font-semibold shadow-md hover:bg-[#ebf8f1] disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white"
      >
        {loadingCheckout ? loadingMessage : "Buy Now"}
      </button>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

interface ProductDescriptionCardProps {
  aboutInfo: NonNullable<ProductDetails["productResults"]["aboutTheProduct"]>;
  merchantName?: string | null;
  merchantLink?: string | null;
}

function ProductDescriptionCard({
  aboutInfo,
  merchantLink,
  merchantName,
}: ProductDescriptionCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const extractFeatureParts = useCallback((value: unknown): string[] => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      const text = String(value).trim();
      return text.length ? [text] : [];
    }
    if (Array.isArray(value)) {
      return value.flatMap(extractFeatureParts);
    }
    if (value && typeof value === "object") {
      return Object.values(value).flatMap(extractFeatureParts);
    }
    return [];
  }, []);

  const descriptionText = aboutInfo.description?.trim();
  const aboutFeatures = Array.isArray(aboutInfo.features)
    ? aboutInfo.features
        .map((feature) => {
          const parts = extractFeatureParts(feature);
          if (!parts.length) {
            return null;
          }
          const [first, ...rest] = parts;
          return rest.length ? `${first}: ${rest.join(" ")}` : first;
        })
        .filter((feature): feature is string => Boolean(feature))
    : [];
  const hasContent = Boolean(descriptionText || aboutFeatures.length);
  if (!hasContent) {
    return null;
  }

  const shouldShowDescriptionToggle =
    (descriptionText?.length ?? 0) > 320 || aboutFeatures.length > 3;
  const visibleFeatures = showFullDescription ? aboutFeatures : aboutFeatures.slice(0, 3);
  const displayedDescription =
    descriptionText && !showFullDescription && shouldShowDescriptionToggle
      ? `${descriptionText.slice(0, 320)}…`
      : descriptionText;

  return (
    <div className="mt-2 border border-gray-100 rounded-2xl p-4 bg-gray-50">
      <div className="flex items-center gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">Description</p>
        </div>
      </div>
      {displayedDescription && <p className="text-sm text-gray-700">{displayedDescription}</p>}
      {visibleFeatures.length > 0 && (
        <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-1">
          {visibleFeatures.map((feature) => (
            <li key={`${feature}-${aboutInfo.title ?? "feature"}`}>{feature}</li>
          ))}
        </ul>
      )}
      {shouldShowDescriptionToggle && (
        <button
          type="button"
          onClick={() => setShowFullDescription((prev) => !prev)}
          className="mt-3 text-sm font-semibold text-[#1b8451]"
        >
          {showFullDescription ? "View less" : "View more"}
        </button>
      )}
      {merchantLink && (
        <a
          href={merchantLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          <span aria-hidden="true">🔗</span>
          <span>More details at {merchantName || "this merchant"}</span>
        </a>
      )}
    </div>
  );
}
