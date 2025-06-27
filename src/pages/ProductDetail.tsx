import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ProductReviews from "@/components/ProductReviews";
import ProductImageGallery from "@/components/ProductImageGallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  Truck,
  Shield,
  Award,
  Gift,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, type Product } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  useEffect(() => {
    if (product && product.prices.length > 0) {
      setSelectedWeight(product.prices[0].weight);
    }
  }, [product]);

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Product not found
          navigate("/products");
          return;
        }
        throw error;
      }

      setProduct(data);
    } catch (error: any) {
      console.error("Error fetching product:", error.message || error);
      toast({
        title: "Error loading product",
        description: "Failed to load product details. Please try again.",
        variant: "destructive",
      });
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const selectedPriceData = product?.prices.find(
    (p) => p.weight === selectedWeight,
  );
  const selectedPrice = selectedPriceData?.price || 0;
  const selectedStock = selectedPriceData?.stock_quantity || 0;

  const discountPercentage =
    product?.original_price && selectedPrice
      ? Math.round(
          ((product.original_price - selectedPrice) / product.original_price) *
            100,
        )
      : 0;

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!product || !selectedWeight) {
      toast({
        title: "Please select options",
        description: "Please select a weight option before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product.id, selectedWeight, selectedPrice, quantity);
    } catch (error: any) {
      console.error("Error adding to cart:", error.message || error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    if (user) {
      navigate("/cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The product you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => navigate("/products")}
            className="bg-brand-600 hover:bg-brand-700"
          >
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8 overflow-x-auto">
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-1 hover:text-brand-600 whitespace-nowrap"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Back to Products
          </button>
          <span>/</span>
          <span className="whitespace-nowrap">{product.category}</span>
          <span>/</span>
          <span className="text-gray-900 truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div>
            <ProductImageGallery
              images={
                product.images && product.images.length > 0
                  ? product.images
                  : [product.image_url]
              }
              productName={product.name}
            />
          </div>

          {/* Product Information */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-2">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-brand-100 text-brand-700 text-xs sm:text-sm">
                  {product.category}
                </Badge>
                {product.is_organic && (
                  <Badge className="bg-green-100 text-green-700 text-xs sm:text-sm">
                    Organic
                  </Badge>
                )}
                {!product.in_stock || (product.stock_quantity || 0) === 0 ? (
                  <Badge className="bg-red-100 text-red-700 text-xs sm:text-sm">
                    Out of Stock
                  </Badge>
                ) : (
                  (product.stock_quantity || 0) <= 10 && (
                    <Badge className="bg-orange-100 text-orange-700 text-xs sm:text-sm">
                      Low Stock
                    </Badge>
                  )
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5",
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300",
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-gray-600">
                  {product.rating} ({product.review_count} reviews)
                </span>
              </div>

              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                {product.description}
              </p>
            </div>

            {/* Pricing */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-brand-600">
                  ${selectedPrice.toFixed(2)}
                </span>
                {product.original_price &&
                  product.original_price > selectedPrice && (
                    <>
                      <span className="text-lg sm:text-xl text-gray-500 line-through">
                        ${product.original_price.toFixed(2)}
                      </span>
                      <Badge className="bg-red-100 text-red-700 text-xs sm:text-sm">
                        {discountPercentage}% Off
                      </Badge>
                    </>
                  )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                per {selectedWeight}
              </p>
            </div>

            {/* Weight Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                Select Weight:
              </h3>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {product.prices.map((price) => {
                  const stockLevel = price.stock_quantity || 0;
                  const isOutOfStock = stockLevel === 0;
                  const isLowStock = stockLevel > 0 && stockLevel <= 10;

                  return (
                    <button
                      key={price.weight}
                      onClick={() => setSelectedWeight(price.weight)}
                      disabled={isOutOfStock}
                      className={cn(
                        "px-3 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm font-medium transition-colors relative",
                        selectedWeight === price.weight
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : isOutOfStock
                            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                            : "border-gray-300 hover:border-gray-400",
                      )}
                    >
                      {price.weight}
                      <span className="block text-xs text-gray-500">
                        ${price.price.toFixed(2)}
                      </span>
                      <span
                        className={cn(
                          "block text-xs font-medium",
                          isOutOfStock
                            ? "text-red-500"
                            : isLowStock
                              ? "text-orange-500"
                              : "text-green-600",
                        )}
                      >
                        {isOutOfStock ? "Out of Stock" : `${stockLevel} left`}
                      </span>
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-red-600">
                            N/A
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Stock for {selectedWeight}:
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    selectedStock > 10
                      ? "text-green-600"
                      : selectedStock > 0
                        ? "text-orange-600"
                        : "text-red-600",
                  )}
                >
                  {selectedStock} items available
                </span>
              </div>
              {selectedStock <= 10 && selectedStock > 0 && (
                <p className="text-xs text-orange-600">
                  Limited stock! Only {selectedStock} left for {selectedWeight}
                </p>
              )}
              {selectedStock === 0 && (
                <p className="text-xs text-red-600">
                  {selectedWeight} is currently out of stock
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                Quantity:
              </h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                >
                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <span className="w-12 text-center font-medium text-sm sm:text-base">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuantity(Math.min(selectedStock, quantity + 1))
                  }
                  disabled={quantity >= selectedStock}
                  className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              {quantity >= selectedStock && selectedStock > 0 && (
                <p className="text-xs text-orange-600">
                  Maximum available quantity selected for {selectedWeight}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-3 sm:gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-sm sm:text-base py-2 sm:py-3"
                  disabled={
                    !product.in_stock || selectedStock === 0 || addingToCart
                  }
                >
                  {addingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="hidden sm:inline">Adding...</span>
                      <span className="sm:hidden">Add...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">
                        {product.in_stock && selectedStock > 0
                          ? "Add to Cart"
                          : "Out of Stock"}
                      </span>
                      <span className="sm:hidden">
                        {product.in_stock && selectedStock > 0 ? "Add" : "Out"}
                      </span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="h-10 w-10 sm:h-12 sm:w-12"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5",
                      isWishlisted ? "fill-red-500 text-red-500" : "",
                    )}
                  />
                </Button>
              </div>

              {product.in_stock && selectedStock > 0 && (
                <Button
                  onClick={handleBuyNow}
                  variant="outline"
                  className="w-full border-brand-300 text-brand-700 hover:bg-brand-50 text-sm sm:text-base py-2 sm:py-3"
                  disabled={addingToCart}
                >
                  Buy Now
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full text-sm sm:text-base py-2 sm:py-3"
              >
                <Gift className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Add Gift Wrapping
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex gap-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-brand-600" />
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-600" />
                <span className="text-sm text-gray-600">
                  Quality Guaranteed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-brand-600" />
                <span className="text-sm text-gray-600">Premium Grade</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-16">
          <Card>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Product Details
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                      <span className="text-gray-600">Premium Quality</span>
                    </div>
                    {product.is_organic && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Organic Certified</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                      <span className="text-gray-600">Fresh & Natural</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                      <span className="text-gray-600">Carefully Sourced</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Reviews Section */}
        <div className="mt-12">
          <ProductReviews productId={product.id} productName={product.name} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
