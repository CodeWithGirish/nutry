import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Search,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Copy,
  Download,
  ArrowLeft,
  AlertCircle,
  Package2,
  ShoppingBag,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  weight: string;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  shipping_address: any;
  tracking_number?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

const TrackOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get("order") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuestSearch, setShowGuestSearch] = useState(!user);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
    if (initialOrderId) {
      handleTrackOrder();
    }
  }, [user, initialOrderId]);

  const fetchUserOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items(*)
        `,
        )
        .eq("user_id", user.id)
        .neq("status", "delivered") // Only show undelivered orders
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching user orders:", error);
    }
  };

  const handleTrackOrder = async () => {
    if (!orderNumber.trim()) {
      setError("Please enter an order number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items(*)
        `,
        )
        .or(`order_number.eq.${orderNumber},id.eq.${orderNumber}`)
        .single();

      if (error || !data) {
        setError(
          "Order not found. Please check your order number and try again.",
        );
        setOrder(null);
      } else {
        setOrder(data);
        setError("");
      }
    } catch (error: any) {
      console.error("Error tracking order:", error.message || error);
      setError("Failed to track order. Please try again.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "processing":
        return <Package className="h-5 w-5 text-orange-500" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-orange-100 text-orange-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      toast({
        title: "Copied!",
        description: "Order number copied to clipboard",
      });
    }
  };

  const getTrackingSteps = (status: string) => {
    const steps = [
      { key: "pending", label: "Order Placed", completed: true },
      {
        key: "confirmed",
        label: "Order Confirmed",
        completed: status !== "pending",
      },
      {
        key: "processing",
        label: "Processing",
        completed: ["processing", "shipped", "delivered"].includes(status),
      },
      {
        key: "shipped",
        label: "Shipped",
        completed: ["shipped", "delivered"].includes(status),
      },
      {
        key: "delivered",
        label: "Delivered",
        completed: status === "delivered",
      },
    ];

    if (status === "cancelled") {
      return [
        { key: "pending", label: "Order Placed", completed: true },
        { key: "cancelled", label: "Order Cancelled", completed: true },
      ];
    }

    return steps;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
              <Package2 className="h-5 w-5 text-brand-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Track Your Orders
            </h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Search */}
            {(showGuestSearch || !user) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Track Order
                  </CardTitle>
                  <p className="text-gray-600">
                    Enter your order number to track your order status
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="orderNumber">Order Number</Label>
                      <Input
                        id="orderNumber"
                        placeholder="Enter your order number (e.g., NV20241201001)"
                        value={orderNumber}
                        onChange={(e) => {
                          setOrderNumber(e.target.value);
                          if (error) setError("");
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleTrackOrder}
                        disabled={loading}
                        className="bg-brand-600 hover:bg-brand-700"
                      >
                        {loading ? (
                          <>
                            <Package className="h-4 w-4 mr-2 animate-spin" />
                            Tracking...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Track Order
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {user && (
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => setShowGuestSearch(false)}
                        className="text-brand-600"
                      >
                        View My Orders Instead
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            {order && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Details
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyOrderNumber}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Order #
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-medium">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment</p>
                      <Badge
                        variant={
                          order.payment_status === "paid"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Order Status */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div className="flex-1">
                        <p className="font-medium">Current Status</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                      </div>
                      {order.tracking_number && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Tracking Number
                          </p>
                          <p className="font-medium">{order.tracking_number}</p>
                        </div>
                      )}
                    </div>

                    {/* Tracking Timeline */}
                    <div className="space-y-3">
                      {getTrackingSteps(order.status).map((step, index) => (
                        <div key={step.key} className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              step.completed ? "bg-brand-600" : "bg-gray-300"
                            }`}
                          />
                          <div className="flex-1">
                            <p
                              className={`text-sm ${
                                step.completed
                                  ? "text-gray-900 font-medium"
                                  : "text-gray-500"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                          {step.completed &&
                            index ===
                              getTrackingSteps(order.status).findIndex(
                                (s) => s.completed,
                              ) && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(order.updated_at)}
                                </p>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Order Items</h3>
                    {order.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                          {item.product_image || "📦"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-600">
                            {item.weight} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">
                        {order.shipping_address?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shipping_address?.address}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shipping_address?.city},{" "}
                        {order.shipping_address?.state}{" "}
                        {order.shipping_address?.pincode}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shipping_address?.phone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Orders */}
            {user && !showGuestSearch && userOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Your Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userOrders.map((userOrder) => (
                      <div
                        key={userOrder.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-brand-200 transition-colors cursor-pointer"
                        onClick={() => {
                          setOrder(userOrder);
                          setOrderNumber(userOrder.order_number);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(userOrder.status)}
                          <div>
                            <p className="font-medium">
                              #{userOrder.order_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(userOrder.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(userOrder.total_amount)}
                          </p>
                          <Badge className={getStatusColor(userOrder.status)}>
                            {userOrder.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Customer Support</p>
                  <p className="text-sm text-gray-600">
                    <Phone className="h-4 w-4 inline mr-1" />
                    +91 1234567890
                  </p>
                  <p className="text-sm text-gray-600">
                    <Mail className="h-4 w-4 inline mr-1" />
                    support@nutrivault.com
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Business Hours</p>
                  <p className="text-sm text-gray-600">
                    Mon-Fri: 9:00 AM - 6:00 PM
                  </p>
                  <p className="text-sm text-gray-600">
                    Sat-Sun: 10:00 AM - 4:00 PM
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/contact")}
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            {/* FAQ Card */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    How long does delivery take?
                  </p>
                  <p className="text-sm text-gray-600">
                    Usually 3-7 business days
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Can I modify my order?</p>
                  <p className="text-sm text-gray-600">
                    Only before it's shipped
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    What if my order is delayed?
                  </p>
                  <p className="text-sm text-gray-600">
                    Contact our support team
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/products")}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/contact")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                {order && (
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
