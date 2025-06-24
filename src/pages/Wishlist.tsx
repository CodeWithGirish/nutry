import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase, type Product } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const Wishlist = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchWishlistItems();
  }, [user, navigate]);

  const fetchWishlistItems = async () => {
    if (!user) return;

    try {
      // For now, we'll simulate wishlist with localStorage
      // In a real app, you'd have a wishlist table in the database
      const wishlistIds = JSON.parse(
        localStorage.getItem(`wishlist_${user.id}`) || "[]",
      );

      if (wishlistIds.length === 0) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", wishlistIds);

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error: any) {
      console.error("Error fetching wishlist:", error.message || error);
      toast({
        title: "Error",
        description: "Failed to load wishlist items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = (productId: string) => {
    if (!user) return;

    const wishlistIds = JSON.parse(
      localStorage.getItem(`wishlist_${user.id}`) || "[]",
    );
    const updatedIds = wishlistIds.filter((id: string) => id !== productId);
    localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(updatedIds));

    setWishlistItems((prev) => prev.filter((item) => item.id !== productId));

    toast({
      title: "Removed from wishlist",
      description: "Item has been removed from your wishlist",
    });
  };

  const moveToCart = async (product: Product) => {
    const firstPrice = product.prices[0];
    if (firstPrice) {
      await addToCart(product.id, firstPrice.weight, firstPrice.price);
      removeFromWishlist(product.id);
      toast({
        title: "Moved to cart",
        description: "Item has been added to your cart",
      });
    }
  };

  const shareWishlist = () => {
    const url = `${window.location.origin}/wishlist/${user?.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Wishlist link copied!",
      description: "You can share this link with friends and family",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600">
                {wishlistItems.length} item
                {wishlistItems.length !== 1 ? "s" : ""} saved for later
              </p>
            </div>
          </div>
          {wishlistItems.length > 0 && (
            <Button onClick={shareWishlist} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Wishlist
            </Button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          /* Empty State */
          <Card className="text-center py-16">
            <CardContent>
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Save items you love for later by clicking the heart icon
              </p>
              <Button
                onClick={() => navigate("/products")}
                className="bg-brand-600 hover:bg-brand-700"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Wishlist Items */
          <div className="space-y-6">
            {/* List View for Wishlist */}
            <div className="grid gap-4">
              {wishlistItems.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
                          {product.image_url}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge
                              variant="outline"
                              className="text-xs text-brand-600 border-brand-200 mb-2"
                            >
                              {product.category}
                            </Badge>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {product.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {product.description}
                            </p>

                            {/* Price */}
                            <div className="flex items-center gap-4 mb-4">
                              <span className="text-xl font-bold text-brand-600">
                                {formatPrice(product.prices[0]?.price || 0)}
                              </span>
                              {product.original_price && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(product.original_price)}
                                </span>
                              )}
                              <Badge
                                variant={
                                  product.in_stock ? "secondary" : "destructive"
                                }
                              >
                                {product.in_stock ? "In Stock" : "Out of Stock"}
                              </Badge>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                              <Button
                                onClick={() => moveToCart(product)}
                                disabled={!product.in_stock}
                                className="bg-brand-600 hover:bg-brand-700"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Move to Cart
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  navigate(`/product/${product.id}`)
                                }
                              >
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeFromWishlist(product.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Continue Shopping */}
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Continue Shopping
                </h3>
                <p className="text-gray-600 mb-4">
                  Discover more premium dry fruits and healthy snacks
                </p>
                <Button
                  onClick={() => navigate("/products")}
                  variant="outline"
                  className="border-brand-300 text-brand-600 hover:bg-brand-50"
                >
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
