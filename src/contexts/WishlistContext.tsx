import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { isDatabaseError } from "@/lib/fallback";
import { toast } from "@/hooks/use-toast";

interface WishlistItem {
  id: string;
  user_id?: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  product_price?: number;
  created_at: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  loading: boolean;
  addToWishlist: (
    productId: string,
    productName: string,
    productImage: string,
    productPrice: number,
  ) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  getWishlistCount: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      // Load from localStorage for non-logged users
      loadLocalWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Join with products table to get product details
      const { data, error } = await supabase
        .from("wishlist")
        .select(
          `
          id,
          user_id,
          product_id,
          created_at,
          products (
            name,
            image_url,
            prices
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to include product details
      const enrichedItems = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        created_at: item.created_at,
        product_name: item.products?.name || "Unknown Product",
        product_image: item.products?.image_url || "📦",
        product_price: item.products?.prices?.[0]?.price || 0,
      }));

      setWishlistItems(enrichedItems);
    } catch (error: any) {
      console.error("Error loading wishlist - Details:", {
        message: error?.message || "Unknown error",
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        status: error?.status,
      });
      console.error("Error loading wishlist - Full error object:", error);
      console.error(
        "Error loading wishlist - Stringified:",
        JSON.stringify(error, null, 2),
      );

      if (
        isDatabaseError(error) ||
        error.status === 404 ||
        error.message?.includes("Failed to fetch")
      ) {
        console.log("Using local wishlist due to database connection error");
        loadLocalWishlist();
        toast({
          title: "Database Unavailable",
          description:
            "Using local wishlist data. Some features may be limited until connection is restored.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Wishlist Load Error",
          description: error.code
            ? `Database error (${error.code}): ${error.message}`
            : "Failed to load wishlist data",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLocalWishlist = () => {
    try {
      const localWishlist = localStorage.getItem("nutrivault_wishlist");
      if (localWishlist) {
        setWishlistItems(JSON.parse(localWishlist));
      }
    } catch (error: any) {
      console.error("Error loading local wishlist:", error.message || error);
    }
  };

  const saveLocalWishlist = (items: WishlistItem[]) => {
    try {
      localStorage.setItem("nutrivault_wishlist", JSON.stringify(items));
    } catch (error: any) {
      console.error("Error saving local wishlist:", error.message || error);
    }
  };

  const addToWishlist = async (
    productId: string,
    productName: string,
    productImage: string,
    productPrice: number,
  ) => {
    try {
      // Check if already in wishlist
      if (isInWishlist(productId)) {
        toast({
          title: "Already in wishlist",
          description: "This item is already in your wishlist",
        });
        return;
      }

      const newItem: WishlistItem = {
        id: `temp_${Date.now()}`,
        product_id: productId,
        product_name: productName,
        product_image: productImage,
        product_price: productPrice,
        created_at: new Date().toISOString(),
      };

      if (user) {
        // Save to database (simplified schema)
        const { data, error } = await supabase
          .from("wishlist")
          .insert({
            user_id: user.id,
            product_id: productId,
          })
          .select()
          .single();

        if (error) throw error;

        // Create enriched item for local state
        const enrichedItem = {
          ...data,
          product_name: productName,
          product_image: productImage,
          product_price: productPrice,
        };

        setWishlistItems((prev) => [enrichedItem, ...prev]);
      } else {
        // Save to localStorage
        const updatedItems = [newItem, ...wishlistItems];
        setWishlistItems(updatedItems);
        saveLocalWishlist(updatedItems);
      }

      toast({
        title: "Added to wishlist",
        description: `${productName} has been added to your wishlist`,
      });
    } catch (error: any) {
      console.error("Error adding to wishlist:", error.message || error);

      if (isDatabaseError(error)) {
        // If database is unavailable, save to localStorage only
        console.log("Saving to local wishlist due to database error");
        const updatedItems = [newItem, ...wishlistItems];
        setWishlistItems(updatedItems);
        saveLocalWishlist(updatedItems);

        toast({
          title: "Added to local wishlist",
          description: `${productName} saved locally - will sync when online`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add item to wishlist",
          variant: "destructive",
        });
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      if (user) {
        // Remove from database
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);

        if (error) throw error;
      }

      // Remove from local state
      const updatedItems = wishlistItems.filter(
        (item) => item.product_id !== productId,
      );
      setWishlistItems(updatedItems);

      if (!user) {
        saveLocalWishlist(updatedItems);
      }

      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist",
      });
    } catch (error: any) {
      console.error("Error removing from wishlist:", error.message || error);

      if (isDatabaseError(error)) {
        // If database is unavailable, remove from localStorage only
        console.log("Removing from local wishlist due to database error");
        const updatedItems = wishlistItems.filter(
          (item) => item.product_id !== productId,
        );
        setWishlistItems(updatedItems);
        saveLocalWishlist(updatedItems);

        toast({
          title: "Removed from local wishlist",
          description: "Item removed locally - will sync when online",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove item from wishlist",
          variant: "destructive",
        });
      }
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some((item) => item.product_id === productId);
  };

  const clearWishlist = async () => {
    try {
      if (user) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id);

        if (error) throw error;
      }

      setWishlistItems([]);

      if (!user) {
        localStorage.removeItem("nutrivault_wishlist");
      }

      toast({
        title: "Wishlist cleared",
        description: "All items have been removed from your wishlist",
      });
    } catch (error: any) {
      console.error("Error clearing wishlist:", error.message || error);
      toast({
        title: "Error",
        description: "Failed to clear wishlist",
        variant: "destructive",
      });
    }
  };

  const getWishlistCount = (): number => {
    return wishlistItems.length;
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    getWishlistCount,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
