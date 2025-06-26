import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  ShoppingCart,
  Star,
  Eye,
  Gift,
  Scale,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, formatPrice, parsePrices } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import type { Product } from "@/lib/supabase";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [selectedWeight, setSelectedWeight] = useState(
    parsePrices(product.prices)[0]?.weight || "250g",
  );
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all product images (including legacy single image)
  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image_url];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + productImages.length) % productImages.length,
    );
  };

  const isWishlisted = isInWishlist(product.id);

  // Ensure prices are properly parsed
  const prices = parsePrices(product.prices);

  const selectedPrice =
    prices.find((p) => p.weight === selectedWeight)?.price ||
    prices[0]?.price ||
    0;

  const discountPercentage = product.original_price
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
    await addToCart(product.id, selectedWeight, selectedPrice);
  };

  const handleQuickView = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <Card
      className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Product Image Carousel */}
        <div
          className="aspect-square overflow-hidden bg-gradient-to-br from-warm-50 to-brand-50 cursor-pointer relative group"
          onClick={handleQuickView}
        >
          <div className="w-full h-full flex items-center justify-center">
            {productImages[currentImageIndex]?.startsWith("http") ||
            productImages[currentImageIndex]?.startsWith("blob:") ? (
              <img
                src={productImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const emojiDiv = target.nextElementSibling as HTMLDivElement;
                  if (emojiDiv) {
                    emojiDiv.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className={`text-6xl w-full h-full flex items-center justify-center ${
                productImages[currentImageIndex]?.startsWith("http") ||
                productImages[currentImageIndex]?.startsWith("blob:")
                  ? "hidden"
                  : "flex"
              }`}
            >
              {productImages[currentImageIndex] || "📦"}
            </div>
          </div>

          {/* Image Navigation - only show if multiple images */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white"
              >
                <ChevronLeft className="w-3 h-3 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white"
              >
                <ChevronRight className="w-3 h-3 text-gray-700" />
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {productImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      index === currentImageIndex ? "bg-white" : "bg-white/50",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {!product.in_stock && (
            <Badge className="bg-red-500 text-white">Out of Stock</Badge>
          )}
          {product.is_organic && (
            <Badge className="bg-green-500 text-white">Organic</Badge>
          )}
          {discountPercentage > 0 && (
            <Badge className="bg-brand-500 text-white">
              {discountPercentage}% Off
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={cn(
            "absolute top-3 right-3 flex flex-col gap-2 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm"
            onClick={() => {
              if (isWishlisted) {
                removeFromWishlist(product.id);
              } else {
                addToWishlist(
                  product.id,
                  product.name,
                  product.image_url,
                  selectedPrice,
                );
              }
            }}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600",
              )}
            />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm"
            onClick={handleQuickView}
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm"
          >
            <Gift className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Quick Add to Cart (appears on hover) */}
        <div
          className={cn(
            "absolute bottom-3 left-3 right-3 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
        >
          <Button
            className="w-full bg-brand-600 hover:bg-brand-700 text-white"
            disabled={!product.in_stock || isAdmin}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isAdmin
              ? "Admin View"
              : product.in_stock
                ? "Quick Add"
                : "Notify Me"}
          </Button>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Category */}
        <Badge
          variant="outline"
          className="text-xs text-brand-600 border-brand-200"
        >
          {product.category}
        </Badge>

        {/* Product Name */}
        <h3
          className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 cursor-pointer hover:text-brand-600"
          onClick={handleQuickView}
        >
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.floor(product.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300",
                )}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">
            {product.rating} ({product.review_count})
          </span>
        </div>

        {/* Weight Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Scale className="h-3 w-3" />
            <span>Weight:</span>
          </div>
          <div className="flex gap-1">
            {prices.map((weight) => (
              <button
                key={weight.weight}
                onClick={() => setSelectedWeight(weight.weight)}
                className={cn(
                  "px-2 py-1 text-xs rounded border transition-colors",
                  selectedWeight === weight.weight
                    ? "bg-brand-100 border-brand-300 text-brand-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                {weight.weight}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-brand-600">
                {formatPrice(selectedPrice)}
              </span>
              {product.original_price &&
                product.original_price > selectedPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
            </div>
            <span className="text-xs text-gray-500">per {selectedWeight}</span>
          </div>

          <Button
            size="sm"
            className="bg-brand-600 hover:bg-brand-700 text-white"
            disabled={!product.in_stock || isAdmin}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
