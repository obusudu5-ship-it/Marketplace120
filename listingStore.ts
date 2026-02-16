import { create } from 'zustand';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: 'product' | 'service' | 'rental' | 'digital';
  images: string[];
  location?: string;
  city?: string;
  state?: string;
  rating: number;
  reviewCount: number;
  views: number;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    rating: number;
  };
  createdAt: string;
}

interface ListingState {
  listings: Listing[];
  selectedListing: Listing | null;
  isLoading: boolean;
  setListings: (listings: Listing[]) => void;
  setSelectedListing: (listing: Listing | null) => void;
}

export const useListingStore = create<ListingState>((set) => ({
  listings: [],
  selectedListing: null,
  isLoading: false,

  setListings: (listings) => set({ listings }),
  setSelectedListing: (selectedListing) => set({ selectedListing }),
}));