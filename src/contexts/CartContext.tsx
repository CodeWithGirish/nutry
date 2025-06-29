import { createContext, useContext, useEffect, useState } from "react";
import { supabase, type Product, type CartItem } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { isDatabaseError, mockProducts } from "@/lib/fallback";
import { toast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: (CartItem & { product: Product })[];
  loading: boolean;
  addToCart: (
    productId: string,
    weight: string,
    price: number,
  ) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin } = useAuth();
  const [cartItems, setCartItems] = useState<
    (CartItem & { product: Product })[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      // Load from localStorage for guest users
      loadLocalCart();
    }
  }, [user]);

  const loadLocalCart = () => {
    try {
      const localCart = localStorage.getItem("nutrivault_cart");
      if (localCart) {
        setCartItems(JSON.parse(localCart));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Error loading local cart:", error);
      setCartItems([]);
    }
  };

  const saveLocalCart = (items: any[]) => {
    try {
      localStorage.setItem("nutrivault_cart", JSON.stringify(items));
    } catch (error) {
      console.error("Error saving local cart:", error);
    }
  };

  const fetchCartItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch cart items first
      const { data: cartData, error: cartError } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", user.id);

      if (cartError) throw cartError;

      if (!cartData || cartData.length === 0) {
        setCartItems([]);
        return;
      }

      // Get unique product IDs to fetch product details
      const productIds = [...new Set(cartData.map((item) => item.product_id))];

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (productsError) {
        console.warn(
          "Could not fetch product details for cart:",
          productsError.message || productsError,
        );
        // Continue with cart items but without product details
        setCartItems(cartData.map((item) => ({ ...item, product: null })));
        return;
      }

      // Create product map for efficient lookup
      const productMap = (productsData || []).reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});

      // Enrich cart items with product data
      const enrichedCartItems = cartData.map((item: any) => {
        const product = productMap[item.product_id];
        if (!product) {
          console.warn(`Product not found for cart item: ${item.product_id}`);
        }
        return {
          ...item,
          product: product || null,
        };
      });

      // Filter out cart items without valid products (optional)
      const validCartItems = enrichedCartItems.filter(
        (item) => item.product !== null,
      );

      setCartItems(validCartItems);
    } catch (error: any) {
      console.error("Error fetching cart items - Details:", {
        message: error?.message || "Unknown error",
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        status: error?.status,
      });
      console.error("Error fetching cart items - Full error object:", error);
      console.error(
        "Error fetching cart items - Stringified:",
        JSON.stringify(error, null, 2),
      );

      if (
        isDatabaseError(error) ||
        error.status === 404 ||
        error.message?.includes("Failed to fetch")
      ) {
        console.log("Using local cart due to database connection error");
        loadLocalCart();
        toast({
          title: "Database Unavailable",
          description:
            "Using local cart data. Some features may be limited until connection is restored.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cart Load Error",
          description: error.code
            ? `Database error (${error.code}): ${error.message}`
            : `Failed to load cart items: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (
    productId: string,
    weight: string,
    price: number,
    quantity: number = 1,
  ) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    if (isAdmin) {
      toast({
        title: "Admin Account Restriction",
        description:
          "Admin accounts cannot add items to cart or make purchases",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, fetch the product to check stock availability
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("stock_quantity, name, in_stock, prices")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      if (!productData) {
        toast({
          title: "Product not found",
          description: "The requested product could not be found",
          variant: "destructive",
        });
        return;
      }

      // Find the specific weight's stock
      const weightData = productData.prices?.find(
        (p: any) => p.weight === weight,
      );
      const weightStock = weightData?.stock_quantity || 0;

      if (!productData.in_stock || weightStock === 0) {
        toast({
          title: "Out of stock",
          description: `${productData.name} (${weight}) is currently out of stock`,
          variant: "destructive",
        });
        return;
      }

      // Check if item already exists in cart
      const existingItem = cartItems.find(
        (item) =>
          item.product_id === productId && item.selected_weight === weight,
      );

      let totalRequestedQuantity = quantity;
      if (existingItem) {
        totalRequestedQuantity = existingItem.quantity + quantity;
      }

      // Check if requested quantity exceeds available stock for this weight
      if (totalRequestedQuantity > weightStock) {
        const availableQuantity = weightStock - (existingItem?.quantity || 0);
        toast({
          title: "Insufficient stock",
          description: `Only ${availableQuantity} items available for ${weight}. You currently have ${existingItem?.quantity || 0} in your cart.`,
          variant: "destructive",
        });
        return;
      }

      if (existingItem) {
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Add new item - use upsert to handle potential race conditions
        const { data: cartItem, error } = await supabase
          .from("cart")
          .upsert(
            {
              user_id: user.id,
              product_id: productId,
              quantity: quantity,
              selected_weight: weight,
              selected_price: price,
            },
            {
              onConflict: "user_id,product_id,selected_weight",
            },
          )
          .select("*")
          .single();

        if (error) {
          // If upsert fails due to constraint, try to update existing item
          if (
            error.code === "23505" ||
            error.message.includes("duplicate key")
          ) {
            console.log("Item exists, updating quantity instead");
            // Fetch the existing item and update it
            const { data: existingCartItem, error: fetchError } = await supabase
              .from("cart")
              .select("*")
              .eq("user_id", user.id)
              .eq("product_id", productId)
              .eq("selected_weight", weight)
              .single();

            if (!fetchError && existingCartItem) {
              await updateQuantity(
                existingCartItem.id,
                existingCartItem.quantity + quantity,
              );
              return;
            }
          }
          throw error;
        }

        // Fetch product details separately
        const { data: productData } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        // Add to cart items with product data
        const enrichedCartItem = {
          ...cartItem,
          product: productData || null,
        };

        // Check if item already exists in state (to avoid duplicates)
        const existingInState = cartItems.find(
          (item) =>
            item.product_id === productId && item.selected_weight === weight,
        );

        if (existingInState) {
          // Update existing item in state
          setCartItems((prev) =>
            prev.map((item) =>
              item.product_id === productId && item.selected_weight === weight
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            ),
          );
        } else {
          // Add new item to state
          setCartItems((prev) => [...prev, enrichedCartItem]);
        }

        // Refresh cart to ensure UI is in sync with database
        await fetchCartItems();

        toast({
          title: "Added to cart",
          description: "Item has been added to your cart",
        });
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error.message || error);

      // Handle specific constraint violation errors
      if (error.code === "23505" || error.message.includes("duplicate key")) {
        console.log("Handling duplicate key constraint violation");

        // Try to fetch and update the existing item as a fallback
        try {
          const { data: existingCartItem, error: fetchError } = await supabase
            .from("cart")
            .select("*")
            .eq("user_id", user.id)
            .eq("product_id", productId)
            .eq("selected_weight", weight)
            .single();

          if (!fetchError && existingCartItem) {
            await updateQuantity(
              existingCartItem.id,
              existingCartItem.quantity + quantity,
            );
            return;
          }
        } catch (fallbackError) {
          console.error("Fallback update failed:", fallbackError);
        }

        // If all else fails, refresh cart to sync with database
        await fetchCartItems();
        toast({
          title: "Item updated",
          description: "Cart has been refreshed and item quantity updated",
        });
        return;
      }

      if (isDatabaseError(error)) {
        // If database is unavailable, save to localStorage
        console.log("Adding to local cart due to database error");

        const mockProduct = mockProducts.find((p) => p.id === productId) || {
          id: productId,
          name: "Product",
          image_url: "📦",
          prices: [{ weight, price }],
        };

        const localCartItem = {
          id: `local_${Date.now()}`,
          user_id: user?.id || "guest",
          product_id: productId,
          quantity,
          selected_weight: weight,
          selected_price: price,
          created_at: new Date().toISOString(),
          product: mockProduct,
        };

        const updatedCartItems = [...cartItems, localCartItem];
        setCartItems(updatedCartItems);

        if (!user) {
          saveLocalCart(updatedCartItems);
        }

        toast({
          title: "Added to local cart",
          description: "Item saved locally - will sync when online",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to add item to cart: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (isAdmin) {
      toast({
        title: "Admin Account Restriction",
        description: "Admin accounts cannot modify cart",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("cart")
        .delete()
        .eq("id", cartItemId);

      if (error) throw error;

      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    } catch (error: any) {
      console.error("Error removing from cart:", error.message || error);

      if (isDatabaseError(error)) {
        // If database is unavailable, remove from local state
        console.log("Removing from local cart due to database error");
        const updatedCartItems = cartItems.filter(
          (item) => item.id !== cartItemId,
        );
        setCartItems(updatedCartItems);

        if (!user) {
          saveLocalCart(updatedCartItems);
        }

        toast({
          title: "Removed from local cart",
          description: "Item removed locally - will sync when online",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to remove item from cart: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (isAdmin) {
      toast({
        title: "Admin Account Restriction",
        description: "Admin accounts cannot modify cart",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      // Find the cart item to get product info
      const cartItem = cartItems.find((item) => item.id === cartItemId);
      if (!cartItem) {
        toast({
          title: "Error",
          description: "Cart item not found",
          variant: "destructive",
        });
        return;
      }

      // Check stock availability before updating
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("stock_quantity, name, in_stock, prices")
        .eq("id", cartItem.product_id)
        .single();

      if (productError) throw productError;

      // Find the specific weight's stock
      const weightData = productData.prices?.find(
        (p: any) => p.weight === cartItem.selected_weight,
      );
      const weightStock = weightData?.stock_quantity || 0;

      if (!productData.in_stock || weightStock === 0) {
        toast({
          title: "Out of stock",
          description: `${productData.name} (${cartItem.selected_weight}) is currently out of stock`,
          variant: "destructive",
        });
        return;
      }

      if (quantity > weightStock) {
        toast({
          title: "Insufficient stock",
          description: `Only ${weightStock} items available for ${productData.name} (${cartItem.selected_weight})`,
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("cart")
        .update({ quantity })
        .eq("id", cartItemId)
        .select("*")
        .single();

      if (error) throw error;

      // Refresh cart items to ensure sync
      await fetchCartItems();

      toast({
        title: "Cart updated",
        description: "Item quantity has been updated",
      });
    } catch (error: any) {
      console.error("Error updating quantity:", error.message || error);

      if (isDatabaseError(error)) {
        // If database is unavailable, update local state only
        console.log("Updating local cart quantity due to database error");
        const updatedCartItems = cartItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity: quantity } : item,
        );
        setCartItems(updatedCartItems);

        if (!user) {
          saveLocalCart(updatedCartItems);
        }

        toast({
          title: "Updated locally",
          description: "Quantity updated locally - will sync when online",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to update quantity: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    }
  };

  const clearCart = async () => {
    if (!user) return;

    if (isAdmin) {
      toast({
        title: "Admin Account Restriction",
        description: "Admin accounts cannot modify cart",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("cart")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setCartItems([]);
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error: any) {
      console.error("Error clearing cart:", error.message || error);

      if (isDatabaseError(error)) {
        // If database is unavailable, clear local state
        console.log("Clearing local cart due to database error");
        setCartItems([]);

        if (!user) {
          localStorage.removeItem("nutrivault_cart");
        }

        toast({
          title: "Cart cleared locally",
          description: "Cart cleared locally - will sync when online",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to clear cart: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.selected_price * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
