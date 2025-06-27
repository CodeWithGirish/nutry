import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Truck,
  Lock,
  MapPin,
  User,
  Mail,
  Phone,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, type Order, type OrderItem } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const Checkout = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [shippingInfo, setShippingInfo] = useState({
    fullName: profile?.full_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getCartTotal();
  const shippingCost = subtotal > 50 ? 0 : 8.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const handleInputChange = (
    section: "shipping" | "payment",
    field: string,
    value: string,
  ) => {
    if (section === "shipping") {
      setShippingInfo((prev) => ({ ...prev, [field]: value }));
    } else {
      setPaymentInfo((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Shipping validation
    if (!shippingInfo.fullName.trim()) newErrors.fullName = "Name is required";
    if (!shippingInfo.email.trim()) newErrors.email = "Email is required";
    if (!shippingInfo.phone.trim()) newErrors.phone = "Phone is required";
    if (!shippingInfo.address.trim()) newErrors.address = "Address is required";
    if (!shippingInfo.city.trim()) newErrors.city = "City is required";
    if (!shippingInfo.state.trim()) newErrors.state = "State is required";
    if (!shippingInfo.zipCode.trim())
      newErrors.zipCode = "Zip code is required";

    // Payment validation (only for credit card)
    if (paymentMethod === "stripe") {
      if (!paymentInfo.cardNumber.trim())
        newErrors.cardNumber = "Card number is required";
      if (!paymentInfo.expiryDate.trim())
        newErrors.expiryDate = "Expiry date is required";
      if (!paymentInfo.cvv.trim()) newErrors.cvv = "CVV is required";
      if (!paymentInfo.nameOnCard.trim())
        newErrors.nameOnCard = "Name on card is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrder = async (): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    // Create order in database
    const orderData = {
      user_id: user.id,
      status: "pending" as const,
      payment_method: paymentMethod as "stripe" | "cod",
      payment_status:
        paymentMethod === "cod" ? ("pending" as const) : ("paid" as const),
      total_amount: total,
      shipping_address: shippingInfo,
      is_gift: false, // This would come from cart context
      gift_message: null,
      gift_box_price: null,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      weight: item.selected_weight,
      price: item.selected_price,
      product_name: item.product?.name || "Unknown Product",
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Update stock quantities for each product weight variant
    for (const item of cartItems) {
      const { error: stockError } = await supabase.rpc(
        "decrement_product_stock",
        {
          product_id: item.product_id,
          weight_variant: item.selected_weight,
          quantity_to_subtract: item.quantity,
        },
      );

      if (stockError) {
        console.error(
          `Failed to update stock for product ${item.product_id} (${item.selected_weight}):`,
          stockError,
        );
        // Continue with other products even if one fails
        // You might want to implement a more sophisticated error handling here
      }
    }

    return order.id;
  };

  const processStripePayment = async (): Promise<boolean> => {
    // In a real app, you would integrate with Stripe here
    // For demo purposes, we'll simulate a successful payment
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 80% success rate
        resolve(Math.random() > 0.2);
      }, 2000);
    });
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Check the form for any missing or invalid information.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let paymentSuccessful = true;

      // Process payment if using Stripe
      if (paymentMethod === "stripe") {
        paymentSuccessful = await processStripePayment();
        if (!paymentSuccessful) {
          throw new Error("Payment failed. Please try again.");
        }
      }

      // Create order in database
      const orderId = await createOrder();

      // Clear cart
      await clearCart();

      // Show success message
      toast({
        title: "Order placed successfully!",
        description:
          paymentMethod === "cod"
            ? "Your order has been placed. You can pay when your order is delivered."
            : "Payment processed successfully. You'll receive a confirmation email shortly.",
      });

      // Redirect to confirmation page
      navigate(`/order-confirmation/${orderId}`);
    } catch (error: any) {
      console.error("Order error:", error);
      toast({
        title: "Order failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/cart")}
              className="text-brand-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-brand-600" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={shippingInfo.fullName}
                        onChange={(e) =>
                          handleInputChange(
                            "shipping",
                            "fullName",
                            e.target.value,
                          )
                        }
                        placeholder="John Doe"
                        className={errors.fullName ? "border-red-500" : ""}
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) =>
                          handleInputChange("shipping", "email", e.target.value)
                        }
                        placeholder="john@example.com"
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) =>
                          handleInputChange("shipping", "phone", e.target.value)
                        }
                        placeholder="(555) 123-4567"
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={shippingInfo.country}
                        onValueChange={(value) =>
                          handleInputChange("shipping", "country", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="United States">
                            United States
                          </SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">
                            United Kingdom
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={shippingInfo.address}
                      onChange={(e) =>
                        handleInputChange("shipping", "address", e.target.value)
                      }
                      placeholder="123 Main Street"
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={shippingInfo.city}
                        onChange={(e) =>
                          handleInputChange("shipping", "city", e.target.value)
                        }
                        placeholder="Los Angeles"
                        className={errors.city ? "border-red-500" : ""}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={shippingInfo.state}
                        onChange={(e) =>
                          handleInputChange("shipping", "state", e.target.value)
                        }
                        placeholder="CA"
                        className={errors.state ? "border-red-500" : ""}
                      />
                      {errors.state && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.state}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={shippingInfo.zipCode}
                        onChange={(e) =>
                          handleInputChange(
                            "shipping",
                            "zipCode",
                            e.target.value,
                          )
                        }
                        placeholder="90210"
                        className={errors.zipCode ? "border-red-500" : ""}
                      />
                      {errors.zipCode && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.zipCode}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-brand-600" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span>Credit/Debit Card</span>
                          <div className="flex gap-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              VISA
                            </span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              MC
                            </span>
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        Cash on Delivery
                        <p className="text-sm text-gray-500 mt-1">
                          Pay when your order is delivered
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "stripe" && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label htmlFor="nameOnCard">Name on Card</Label>
                        <Input
                          id="nameOnCard"
                          value={paymentInfo.nameOnCard}
                          onChange={(e) =>
                            handleInputChange(
                              "payment",
                              "nameOnCard",
                              e.target.value,
                            )
                          }
                          placeholder="John Doe"
                          className={errors.nameOnCard ? "border-red-500" : ""}
                        />
                        {errors.nameOnCard && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.nameOnCard}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          value={paymentInfo.cardNumber}
                          onChange={(e) =>
                            handleInputChange(
                              "payment",
                              "cardNumber",
                              e.target.value,
                            )
                          }
                          placeholder="1234 5678 9012 3456"
                          className={errors.cardNumber ? "border-red-500" : ""}
                        />
                        {errors.cardNumber && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.cardNumber}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            value={paymentInfo.expiryDate}
                            onChange={(e) =>
                              handleInputChange(
                                "payment",
                                "expiryDate",
                                e.target.value,
                              )
                            }
                            placeholder="MM/YY"
                            className={
                              errors.expiryDate ? "border-red-500" : ""
                            }
                          />
                          {errors.expiryDate && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.expiryDate}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            value={paymentInfo.cvv}
                            onChange={(e) =>
                              handleInputChange(
                                "payment",
                                "cvv",
                                e.target.value,
                              )
                            }
                            placeholder="123"
                            className={errors.cvv ? "border-red-500" : ""}
                          />
                          {errors.cvv && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.cvv}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "cod" && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        You can pay with cash when your order is delivered. A
                        small cash on delivery fee may apply.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-gray-500">
                            {item.selected_weight} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(item.selected_price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
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

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-brand-600 hover:bg-brand-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        {paymentMethod === "stripe"
                          ? `Pay $${total.toFixed(2)}`
                          : "Place Order"}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Your payment information is secure and encrypted
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
