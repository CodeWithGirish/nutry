import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ProductReviews from "@/components/ProductReviews";
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

  const selectedPrice =
    product?.prices.find((p) => p.weight === selectedWeight)?.price || 0;

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
      for (let i = 0; i < quantity; i++) {
        await addToCart(product.id, selectedWeight, selectedPrice);
      }
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

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-1 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </button>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-warm-50 to-brand-50 flex items-center justify-center">
                  <span className="text-9xl">{product.image_url}</span>
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Images - placeholder for future multiple images */}
            <div className="flex gap-4 mt-4">
              {[product.image_url, product.image_url, product.image_url].map(
                (img, index) => (
                  <Card
                    key={index}
                    className="w-20 h-20 cursor-pointer hover:ring-2 hover:ring-brand-500"
                  >
                    <CardContent className="p-0 w-full h-full flex items-center justify-center">
                      <span className="text-2xl">{img}</span>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-brand-100 text-brand-700">
                  {product.category}
                </Badge>
                {product.is_organic && (
                  <Badge className="bg-green-100 text-green-700">Organic</Badge>
                )}
                {!product.in_stock && (
                  <Badge className="bg-red-100 text-red-700">
                    Out of Stock
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300",
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.review_count} reviews)
                </span>
              </div>

              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-brand-600">
                  ${selectedPrice.toFixed(2)}
                </span>
                {product.original_price &&
                  product.original_price > selectedPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ${product.original_price.toFixed(2)}
                      </span>
                      <Badge className="bg-red-100 text-red-700">
                        {discountPercentage}% Off
                      </Badge>
                    </>
                  )}
              </div>
              <p className="text-sm text-gray-500">per {selectedWeight}</p>
            </div>

            {/* Weight Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Select Weight:</h3>
              <div className="flex gap-3">
                {product.prices.map((price) => (
                  <button
                    key={price.weight}
                    onClick={() => setSelectedWeight(price.weight)}
                    className={cn(
                      "px-4 py-2 border rounded-lg text-sm font-medium transition-colors",
                      selectedWeight === price.weight
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-300 hover:border-gray-400",
                    )}
                  >
                    {price.weight}
                    <span className="block text-xs text-gray-500">
                      ${price.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Quantity:</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-brand-600 hover:bg-brand-700"
                  disabled={!product.in_stock || addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {product.in_stock ? "Add to Cart" : "Notify Me"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isWishlisted ? "fill-red-500 text-red-500" : "",
                    )}
                  />
                </Button>
              </div>

              {product.in_stock && (
                <Button
                  onClick={handleBuyNow}
                  variant="outline"
                  className="w-full border-brand-300 text-brand-700 hover:bg-brand-50"
                  disabled={addingToCart}
                >
                  Buy Now
                </Button>
              )}

              <Button variant="outline" className="w-full">
                <Gift className="mr-2 h-4 w-4" />
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
