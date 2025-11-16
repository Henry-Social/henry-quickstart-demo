"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import SearchPageShell from "@/components/SearchPageShell";
import { useCartCount } from "@/lib/useCartCount";
import { usePersistentUserId } from "@/lib/usePersistentUserId";
import {
  ImageLightbox,
  MoreOptionsCarousel,
  ProductDetailsPanel,
  ProductMediaSection,
  RelatedSearchesSection,
  ReviewInsightsCard,
  ReviewsModal,
} from "./components";
import { useProductDetailsController } from "./useProductDetailsController";

export const dynamic = "force-dynamic";

function ProductPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawProductId = params.id as string;
  const productId = decodeURIComponent(rawProductId);

  const urlImageUrl = searchParams.get("imageUrl") || "";
  const urlPrice = searchParams.get("price");
  const urlName = searchParams.get("name") || "";
  const urlProductLink = searchParams.get("productLink") || "";

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const userId = usePersistentUserId();
  const { cartCount, refreshCartCount } = useCartCount(userId);

  const urlDefaults = useMemo(
    () => ({
      imageUrl: urlImageUrl,
      price: urlPrice ? parseFloat(urlPrice) : 0,
      name: urlName,
      productLink: urlProductLink,
    }),
    [urlImageUrl, urlPrice, urlName, urlProductLink],
  );

  const controller = useProductDetailsController({
    productId,
    urlDefaults,
    userId,
    refreshCartCount,
  });

  const {
    productDetails,
    activeProductId,
    loading,
    showMediaSkeleton,
    productName,
    productPrice,
    productImage,
    productLink,
    selectedStore,
    selectedStoreKey,
    setSelectedStoreKey,
    sortedVariants,
    selectedVariants,
    onVariantSelect,
    selectedThumbnailIndex,
    onThumbnailSelect,
    quantity,
    incrementQuantity,
    decrementQuantity,
    onAddToCart,
    buyNow,
    addingToCart,
    addedToCartSuccess,
    loadingCheckout,
    loadingMessage,
    errorMessage,
    handleMoreOptionSelect,
    relatedData,
  } = controller;

  const {
    ratingDistribution,
    totalRatingsCount,
    reviewImages,
    allUserReviews,
    highlightedUserReviews,
    videos,
    discussions,
    relatedSearches,
  } = relatedData;

  const handleRelatedSearchSelect = useCallback(
    (query: string) => {
      setSearchQuery(query);
      router.push(`/?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  const handleImageOpen = useCallback((src: string) => {
    setLightboxImage(src);
  }, []);

  const handleLightboxClose = useCallback(() => {
    setLightboxImage(null);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  }, [router, searchQuery]);

  return (
    <SearchPageShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={handleSearchSubmit}
      placeholder="Search for products"
      inputRef={searchInputRef}
      cartCount={cartCount}
    >
      <div className="overflow-visible">
        <div className="bg-white rounded-3xl p-4 sm:p-6">
          <div className="grid gap-8 md:grid-cols-[minmax(0,60%)_minmax(40%,1fr)]">
            <div className="space-y-4 max-w-full overflow-visible min-w-0">
              <ProductMediaSection
                productDetails={productDetails}
                productName={productName}
                fallbackImage={productImage}
                selectedThumbnailIndex={selectedThumbnailIndex}
                onThumbnailSelect={onThumbnailSelect}
                showSkeleton={showMediaSkeleton}
                onImageClick={handleImageOpen}
              />
              <div className="hidden md:block">
                <ReviewInsightsCard
                  productDetails={productDetails}
                  ratingDistribution={ratingDistribution}
                  totalRatingsCount={totalRatingsCount}
                  highlightedUserReviews={highlightedUserReviews}
                  reviewImages={reviewImages}
                  allUserReviews={allUserReviews}
                  onOpenReviews={() => setShowReviewsModal(true)}
                  onImageClick={handleImageOpen}
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="min-w-0">
              <ProductDetailsPanel
                productDetails={productDetails}
                productName={productName}
                productPrice={productPrice}
                productLink={productLink}
                selectedStore={selectedStore}
                selectedStoreKey={selectedStoreKey}
                onStoreChange={(storeKey) => setSelectedStoreKey(storeKey)}
                sortedVariants={sortedVariants}
                selectedVariants={selectedVariants}
                onVariantSelect={onVariantSelect}
                quantity={quantity}
                onIncrementQuantity={incrementQuantity}
                onDecrementQuantity={decrementQuantity}
                onAddToCart={onAddToCart}
                onBuyNow={buyNow}
                addingToCart={addingToCart}
                addedToCartSuccess={addedToCartSuccess}
                loadingCheckout={loadingCheckout}
                loadingMessage={loadingMessage}
                errorMessage={errorMessage}
                productId={activeProductId}
              />
            </div>
          </div>

          {!productDetails && !loading && (
            <div className="text-center py-6 text-gray-500">Unable to load product details</div>
          )}
        </div>

        <div className="mt-6 md:hidden">
          <ReviewInsightsCard
            productDetails={productDetails}
            ratingDistribution={ratingDistribution}
            totalRatingsCount={totalRatingsCount}
            highlightedUserReviews={highlightedUserReviews}
            reviewImages={reviewImages}
            allUserReviews={allUserReviews}
            onOpenReviews={() => setShowReviewsModal(true)}
            onImageClick={handleImageOpen}
          />
        </div>

        {relatedData.moreOptions.length > 0 && (
          <MoreOptionsCarousel
            options={relatedData.moreOptions}
            onSelect={handleMoreOptionSelect}
          />
        )}

        {relatedSearches.length > 0 && (
          <RelatedSearchesSection
            relatedSearches={relatedSearches}
            onSelect={handleRelatedSearchSelect}
          />
        )}
      </div>

      <ReviewsModal
        open={showReviewsModal}
        reviews={allUserReviews}
        videos={videos}
        discussions={discussions}
        onClose={() => setShowReviewsModal(false)}
        onImageClick={handleImageOpen}
      />
      <ImageLightbox imageSrc={lightboxImage} onClose={handleLightboxClose} />
    </SearchPageShell>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <ProductPageContent />
    </Suspense>
  );
}
