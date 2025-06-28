import { createClient } from "@supabase/supabase-js";

// Use direct Supabase URL - proxy approach was causing issues in cloud environment
const supabaseUrl = "https://truzxbzzgmfrifiygmgr.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydXp4Ynp6Z21mcmlmaXlnbWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQ3ODQsImV4cCI6MjA2NjI4MDc4NH0.ec8oCrlnkWOy96uKt9Z_JctKoOwX81z_gO6U3kuIRbc";

console.log("Supabase configuration:", {
  supabaseUrl,
  mode: import.meta.env.MODE,
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

// Create an admin client for bypassing RLS when needed
// Note: In production, you should use service role key only on server side
export const createAdminClient = () => {
  // For now, we'll use the same client but with a flag to disable RLS
  return supabase;
};

// Test database connection with fallback
export const testDatabaseConnection = async () => {
  try {
    console.log("Testing database connection...");
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Database connection test failed:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status: error.status,
      });
      console.warn("Falling back to demo data mode");
      return false;
    }

    console.log("Database connection test successful:", data);
    return true;
  } catch (error) {
    console.error("Database connection test error:", error);
    console.warn("Network error - falling back to demo data mode");
    return false;
  }
};

// Create a wrapper for Supabase queries with error handling
export const safeSupabaseQuery = async (queryFn: () => Promise<any>) => {
  try {
    const result = await queryFn();
    if (result.error) {
      console.error("Supabase query error:", result.error);
      throw new Error(result.error.message);
    }
    return result;
  } catch (error) {
    console.error("Network or connection error:", error);
    throw error;
  }
};

// Database types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  images: string[];
  prices: { weight: string; price: number; stock_quantity: number }[];
  original_price?: number;
  rating: number;
  review_count: number;
  in_stock: boolean;
  stock_quantity: number;
  is_organic: boolean;
  is_featured?: boolean;
  features?: string[];
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  selected_weight: string;
  selected_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status:
    | "pending"
    | "confirmed"
    | "packed"
    | "shipped"
    | "delivered"
    | "cancelled";
  payment_method: "stripe" | "cod";
  payment_status: "pending" | "paid" | "failed";
  total_amount: number;
  shipping_address: any;
  is_gift: boolean;
  gift_message?: string;
  gift_box_price?: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  weight: string;
  price: number;
  product_name: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: string;
  message: string;
  status: "unread" | "read" | "replied";
  created_at: string;
  updated_at: string;
}
