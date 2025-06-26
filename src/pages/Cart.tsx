import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Gift,
  Truck,
  ArrowLeft,
  ArrowRight,
  Tag,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [selectedGiftBox, setSelectedGiftBox] = useState<string | null>(null);

  const giftBoxOptions = [
    { id: "standard", name: "Standard Gift Box", price: 5.99 },
    { id: "premium", name: "Premium Gift Box", price: 12.99 },
    { id: "luxury", name: "Luxury Gift Box", price: 19.99 },
  ];

  const validCoupons = [
    { code: "WELCOME10", discount: 10 },
    { code: "SAVE20", discount: 20 },
    { code: "HEALTHY15", discount: 15 },
  ];

  const subtotal = getCartTotal();
  const couponDiscount = appliedCoupon
    ? (subtotal * appliedCoupon.discount) / 100
    : 0;
  const giftBoxPrice = selectedGiftBox
    ? giftBoxOptions.find((box) => box.id === selectedGiftBox)?.price || 0
    : 0;
  const shippingCost = subtotal > 50 ? 0 : 8.99;
  const tax = (subtotal - couponDiscount + giftBoxPrice) * 0.08;
  const total = subtotal - couponDiscount + giftBoxPrice + shippingCost + tax;

  const handleApplyCoupon = () => {
    const coupon = validCoupons.find(
      (c) => c.code === couponCode.toUpperCase(),
    );
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponCode("");
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-8">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Sign In Required
                </h2>
                <p className="text-gray-600 mb-6">
                  Please sign in to view your cart and continue shopping.
                </p>
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="p-12">
                <div className="text-6xl mb-6">🛒</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Your cart is empty
                </h2>
                <p className="text-gray-600 mb-8">
                  Looks like you haven't added any items to your cart yet.
                  Browse our delicious selection of premium nuts and dried
                  fruits!
                </p>
                <Button
                  onClick={() => navigate("/products")}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">
            Shopping Cart
          </h1>
          <Badge className="bg-brand-100 text-brand-700 text-sm sm:text-base lg:text-lg px-3 py-1 sm:px-4 sm:py-2 mx-auto sm:mx-0">
            {getCartCount()} {getCartCount() === 1 ? "Item" : "Items"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg sm:text-xl">Cart Items</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Clear Cart</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg"
                  >
                    {/* Mobile Layout */}
                    <div className="flex sm:hidden gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gradient-to-br from-warm-50 to-brand-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {(() => {
                          const primaryImage =
                            item.product?.images &&
                            item.product.images.length > 0
                              ? item.product.images[0]
                              : item.product?.image_url || "🥜";

                          return primaryImage?.startsWith("http") ||
                            primaryImage?.startsWith("blob:") ? (
                            <img
                              src={primaryImage}
                              alt={item.product?.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-2xl">${primaryImage}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-2xl">{primaryImage}</span>
                          );
                        })()}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                          {item.product?.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">
                          {item.selected_weight}
                        </p>
                        <div className="flex items-center gap-1 mb-2">
                          {item.product?.is_organic && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Organic
                            </Badge>
                          )}
                          <Badge className="bg-gray-100 text-gray-700 text-xs">
                            {item.product?.category}
                          </Badge>
                        </div>

                        {/* Mobile Price and Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1 || loading}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center font-medium text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={loading}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-gray-900 text-sm">
                              $
                              {(item.selected_price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${item.selected_price.toFixed(2)} each
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex sm:items-center sm:gap-4 w-full">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-warm-50 to-brand-50 rounded-lg flex items-center justify-center overflow-hidden">
                        {(() => {
                          const primaryImage =
                            item.product?.images &&
                            item.product.images.length > 0
                              ? item.product.images[0]
                              : item.product?.image_url || "🥜";

                          return primaryImage?.startsWith("http") ||
                            primaryImage?.startsWith("blob:") ? (
                            <img
                              src={primaryImage}
                              alt={item.product?.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-3xl">${primaryImage}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-3xl">{primaryImage}</span>
                          );
                        })()}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.product?.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.selected_weight}
                        </p>
                        <div className="flex items-center gap-2">
                          {item.product?.is_organic && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Organic
                            </Badge>
                          )}
                          <Badge className="bg-gray-100 text-gray-700 text-xs">
                            {item.product?.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1 || loading}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={loading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(item.selected_price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${item.selected_price.toFixed(2)} each
                        </p>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Gift Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-brand-600" />
                  Gift Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isGift"
                    checked={isGift}
                    onCheckedChange={setIsGift}
                  />
                  <label htmlFor="isGift" className="font-medium">
                    This is a gift
                  </label>
                </div>

                {isGift && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Gift Message (Optional)
                      </label>
                      <textarea
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Write a personal message..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Gift Box
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {giftBoxOptions.map((box) => (
                          <div
                            key={box.id}
                            className={cn(
                              "p-3 border rounded-lg cursor-pointer transition-colors",
                              selectedGiftBox === box.id
                                ? "border-brand-500 bg-brand-50"
                                : "border-gray-300 hover:border-gray-400",
                            )}
                            onClick={() => setSelectedGiftBox(box.id)}
                          >
                            <div className="font-medium text-sm">
                              {box.name}
                            </div>
                            <div className="text-brand-600 font-semibold">
                              +${box.price.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coupon Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Coupon Code</label>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      variant="outline"
                      size="sm"
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">
                        {appliedCoupon.code} applied
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAppliedCoupon(null)}
                        className="h-auto p-0 text-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal ({getCartCount()} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.discount}%)</span>
                      <span>-${couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {isGift && selectedGiftBox && (
                    <div className="flex justify-between">
                      <span>
                        Gift Box (
                        {
                          giftBoxOptions.find(
                            (box) => box.id === selectedGiftBox,
                          )?.name
                        }
                        )
                      </span>
                      <span>+${giftBoxPrice.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `$${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {/* Free Shipping Notice */}
                {subtotal < 50 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Truck className="h-4 w-4" />
                      <span className="text-sm">
                        Add ${(50 - subtotal).toFixed(2)} more for free
                        shipping!
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    size="lg"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => navigate("/products")}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
