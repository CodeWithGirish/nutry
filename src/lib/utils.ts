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

/**
 * Formats order ID consistently across the application
 * Uses the order_number field if available, otherwise falls back to a formatted UUID
 * @param orderData - Order object with id and optional order_number
 * @returns Formatted order ID string (e.g., "NV202412010001")
 */
export function formatOrderId(orderData: {
  id: string;
  order_number?: string;
}): string {
  // If we have an order_number, use it (this is the primary format)
  if (orderData.order_number) {
    return orderData.order_number;
  }

  // Fallback for legacy orders or when order_number is not available
  // Create a NV-prefixed format using the UUID
  const uuid = orderData.id;
  if (uuid.startsWith("demo-")) {
    // For demo data
    return `NV2024${uuid.split("-")[2]?.padStart(8, "0") || "00000001"}`;
  }

  // For real UUIDs, create a NV format using part of the UUID
  const uuidPart = uuid.replace(/-/g, "").slice(-8).toUpperCase();
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");

  return `NV${dateStr}${uuidPart.slice(-4)}`;
}
