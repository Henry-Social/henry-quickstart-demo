export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  productLink: string;
  source: string;
}

export interface ProductDetails {
  productResults: {
    title: string;
    brand: string;
    reviews: number;
    rating: number;
    image?: string;
    thumbnails?: string[];
    priceRange?: string;
    criticRatings?: Array<{
      source?: string;
      rating?: number;
      score?: number;
    }>;
    stores: Array<{
      name: string;
      link: string;
      price: string;
      shipping?: string;
      total?: string;
      logo?: string;
      title?: string;
      rating?: number;
      reviews?: number;
      paymentMethods?: string;
      detailsAndOffers?: string[];
      discount?: string;
      extractedPrice?: number;
      originalPrice?: string;
      extractedOriginalPrice?: number;
      shippingExtracted?: number;
      extractedTotal?: number;
    }>;
    aboutTheProduct?: {
      title?: string;
      link?: string;
      displayedLink?: string;
      icon?: string;
      description?: string;
      features?: string[];
      logo?: string;
    };
    ratings?: Array<{
      stars: number;
      amount: number;
    }>;
    reviewsImages?: string[];
    videos?: Array<{
      title?: string;
      link?: string;
      source?: string;
      channel?: string;
      duration?: string;
      thumbnail?: string;
      preview?: string;
    }>;
    discussionsAndForums?: Array<{
      title?: string;
      link?: string;
      source?: string;
      icon?: string;
      date?: string;
      comments?: number;
      items?: Array<{
        snippet?: string;
        link?: string;
        topAnswer?: boolean;
        votes?: number;
      }>;
    }>;
    moreOptions?: Array<{
      id?: string;
      title: string;
      thumbnail?: string;
      price?: string;
      extractedPrice?: number;
      originalPrice?: string;
      extractedOriginalPrice?: number;
      reviews?: number;
      rating?: number;
      link?: string;
    }>;
    userReviews?: Array<{
      title?: string;
      text?: string;
      userName?: string;
      source?: string;
      rating?: number;
      date?: string;
      icon?: string;
      images?: string[];
    }>;
    variants: Array<{
      title: string;
      items: Array<{
        name: string;
        selected?: boolean;
        available?: boolean;
        id?: string;
      }>;
    }>;
  };
  relatedSearches: Array<{
    query: string;
    image?: string;
    link?: string;
  }>;
}
