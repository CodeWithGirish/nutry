// Fallback utilities for when database is unavailable
import { type Product } from "@/lib/supabase";

export const mockProducts: Product[] = [
  {
    id: "mock-1",
    name: "Premium California Almonds",
    description: "Raw, unsalted almonds packed with protein and healthy fats",
    category: "Nuts",
    image_url: "🌰",
    images: [],
    prices: [
      { weight: "250g", price: 299 },
      { weight: "500g", price: 599 },
      { weight: "1kg", price: 1199 },
    ],
    original_price: 1399,
    rating: 4.5,
    review_count: 127,
    in_stock: true,
    is_organic: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    name: "Organic Cashews",
    description: "Buttery, creamy cashews perfect for snacking",
    category: "Nuts",
    image_url: "🥜",
    images: [],
    prices: [
      { weight: "250g", price: 399 },
      { weight: "500g", price: 799 },
      { weight: "1kg", price: 1599 },
    ],
    rating: 4.7,
    review_count: 89,
    in_stock: true,
    is_organic: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    name: "Premium Dates",
    description: "Sweet and nutritious Medjool dates",
    category: "Dates",
    image_url: "🍯",
    images: [],
    prices: [
      { weight: "250g", price: 199 },
      { weight: "500g", price: 399 },
      { weight: "1kg", price: 799 },
    ],
    rating: 4.3,
    review_count: 65,
    in_stock: true,
    is_organic: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-4",
    name: "Mixed Dried Fruits",
    description: "A delicious mix of dried fruits for healthy snacking",
    category: "Dried Fruits",
    image_url: "🍇",
    images: [],
    prices: [
      { weight: "250g", price: 249 },
      { weight: "500g", price: 499 },
      { weight: "1kg", price: 999 },
    ],
    rating: 4.4,
    review_count: 143,
    in_stock: true,
    is_organic: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const isDatabaseError = (error: any): boolean => {
  return (
    error?.message?.includes("Failed to fetch") ||
    error?.name === "AuthRetryableFetchError" ||
    error?.code === "ECONNREFUSED" ||
    error?.message?.includes("Network request failed")
  );
};

export const getErrorMessage = (error: any): string => {
  if (isDatabaseError(error)) {
    return "Unable to connect to the database. Showing demo data.";
  }
  return error?.message || "An unexpected error occurred.";
};
