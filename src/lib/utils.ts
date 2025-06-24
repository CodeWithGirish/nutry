import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Utility to safely parse prices from database JSON fields
export function parsePrices(
  prices: any,
): Array<{ weight: string; price: number }> {
  try {
    if (typeof prices === "string") {
      return JSON.parse(prices);
    }
    if (Array.isArray(prices)) {
      return prices;
    }
    // Fallback for invalid data
    return [{ weight: "250g", price: 0 }];
  } catch (error) {
    console.error("Error parsing prices:", error);
    return [{ weight: "250g", price: 0 }];
  }
}

// Utility to get minimum price from price array
export function getMinPrice(
  prices: Array<{ weight: string; price: number }>,
): number {
  if (!prices || prices.length === 0) return 0;
  return Math.min(...prices.map((p) => p.price));
}

// Utility to get maximum price from price array
export function getMaxPrice(
  prices: Array<{ weight: string; price: number }>,
): number {
  if (!prices || prices.length === 0) return 0;
  return Math.max(...prices.map((p) => p.price));
}
