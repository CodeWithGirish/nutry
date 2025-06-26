import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Download,
  Mail,
  Package,
  Truck,
  MapPin,
  Clock,
  CreditCard,
  Phone,
  User,
  Printer,
  Share2,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  supabase,
  type Order,
  type OrderItem,
  type Product,
} from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { formatPrice, formatDate, formatOrderId } from "@/lib/utils";

interface EnrichedOrderItem extends OrderItem {
  product?: Product;
}

interface OrderWithItems extends Omit<Order, "items"> {
  items: EnrichedOrderItem[];
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError("No order ID provided");
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      if (!orderData) {
        throw new Error("Order not found");
      }

      // Check if user has permission to view this order
      if (user && orderData.user_id !== user.id) {
        throw new Error("You don't have permission to view this order");
      }

      // Fetch order items
      const { data: orderItemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // Fetch product details for order items
      const productIds = orderItemsData?.map((item) => item.product_id) || [];
      let productsData: Product[] = [];

      if (productIds.length > 0) {
        const { data: fetchedProducts, error: productsError } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        if (!productsError) {
          productsData = fetchedProducts || [];
        }
      }

      // Create product map for efficient lookup
      const productMap = productsData.reduce(
        (acc, product) => {
          acc[product.id] = product;
          return acc;
        },
        {} as Record<string, Product>,
      );

      // Enrich order items with product data
      const enrichedItems: EnrichedOrderItem[] = (orderItemsData || []).map(
        (item) => ({
          ...item,
          product: productMap[item.product_id],
        }),
      );

      // Combine order with enriched items
      const completeOrder: OrderWithItems = {
        ...orderData,
        items: enrichedItems,
      };

      setOrder(completeOrder);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      setError(error.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!order) return;

    setDownloadingReceipt(true);
    try {
      // Generate receipt HTML
      const receiptHtml = generateReceiptHtml(order);

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }

      toast({
        title: "Receipt ready",
        description: "Your receipt is ready for printing or saving as PDF",
      });
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast({
        title: "Error",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handleShareOrder = async () => {
    if (!order) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `NutriVault Order ${formatOrderId(order)}`,
          text: `Order confirmed! Total: ${formatPrice(order.total_amount)}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Order link copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Error sharing order:", error);
      toast({
        title: "Error",
        description: "Failed to share order details",
        variant: "destructive",
      });
    }
  };

  const generateReceiptHtml = (order: OrderWithItems): string => {
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shipping = order.total_amount > 50 ? 0 : 8.99;
    const tax = ((order.total_amount - shipping) * 0.08) / 1.08; // Approximate tax calculation

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NutriVault Receipt - Order ${formatOrderId(order)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #16a34a;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #16a34a;
              margin-bottom: 5px;
            }
            .order-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-section {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 8px;
            }
            .info-title {
              font-weight: bold;
              margin-bottom: 10px;
              color: #16a34a;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th, .items-table td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            .items-table th {
              background-color: #16a34a;
              color: white;
            }
            .totals {
              margin-left: auto;
              width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
            }
            .total-final {
              font-weight: bold;
              font-size: 18px;
              border-top: 2px solid #16a34a;
              padding-top: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">🌰 NutriVault</div>
            <div>Premium Dry Fruits & Nuts</div>
            <div>Order Receipt</div>
          </div>

          <div class="order-info">
            <div class="info-section">
              <div class="info-title">Order Information</div>
              <div><strong>Order ID:</strong> ${formatOrderId(order)}</div>
              <div><strong>Date:</strong> ${formatDate(order.created_at)}</div>
              <div><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</div>
              <div><strong>Payment:</strong> ${order.payment_method === "stripe" ? "Credit Card" : "Cash on Delivery"}</div>
            </div>

            <div class="info-section">
              <div class="info-title">Shipping Address</div>
              <div><strong>Name:</strong> ${order.shipping_address?.fullName || "N/A"}</div>
              <div><strong>Address:</strong> ${order.shipping_address?.address || "N/A"}</div>
              <div>${order.shipping_address?.city || ""}, ${order.shipping_address?.state || ""} ${order.shipping_address?.zipCode || ""}</div>
              <div>${order.shipping_address?.country || ""}</div>
              <div><strong>Phone:</strong> ${order.shipping_address?.phone || "N/A"}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Weight</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.weight}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.price)}</td>
                  <td>${formatPrice(item.price * item.quantity)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>${shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span>${formatPrice(tax)}</span>
            </div>
            <div class="total-row total-final">
              <span>Total:</span>
              <span>${formatPrice(order.total_amount)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with NutriVault!</p>
            <p>For questions about your order, contact us at support@nutrivault.com</p>
            <p>Visit us at www.nutrivault.com</p>
          </div>
        </body>
      </html>
    `;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEstimatedDelivery = (status: string, createdAt: string) => {
    const orderDate = new Date(createdAt);
    let deliveryDays = 5; // Default

    switch (status) {
      case "pending":
        deliveryDays = 5;
        break;
      case "confirmed":
        deliveryDays = 4;
        break;
      case "shipped":
        deliveryDays = 2;
        break;
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
    }

    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);

    return estimatedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-16">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-brand-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading order details...
            </h2>
            <p className="text-gray-600">
              Please wait while we fetch your order information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-16">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Order Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              {error || "We couldn't find the order you're looking for."}
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => navigate("/track-order")}
                variant="outline"
              >
                Track Another Order
              </Button>
              <Button
                onClick={() => navigate("/products")}
                className="bg-brand-600 hover:bg-brand-700"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = order.total_amount > 50 ? 0 : 8.99;
  const tax = order.total_amount - subtotal - shipping;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="flex items-center gap-2 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="text-brand-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </div>

          {/* Success header */}
          <div className="text-center py-8 mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-6">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h1>
            <p className="text-gray-600 mb-4">
              Thank you for your order. We've received your payment and will
              start processing your order shortly.
            </p>
            <Badge className="bg-brand-100 text-brand-700 text-lg px-4 py-2">
              {formatOrderId(order)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-brand-600" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Payment Status:</span>
                      <Badge
                        className={getPaymentStatusColor(order.payment_status)}
                      >
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Order Status:</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Payment Method:</span>
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {order.payment_method === "stripe"
                          ? "Credit Card"
                          : "Cash on Delivery"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Estimated Delivery:</span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {getEstimatedDelivery(order.status, order.created_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {(() => {
                            // Use first image from images array or fallback to image_url
                            const primaryImage =
                              item.product?.images &&
                              item.product.images.length > 0
                                ? item.product.images[0]
                                : item.product?.image_url;

                            if (!primaryImage) {
                              return (
                                <Package className="h-8 w-8 text-gray-400" />
                              );
                            }

                            return primaryImage?.startsWith("http") ||
                              primaryImage?.startsWith("blob:") ? (
                              <img
                                src={primaryImage}
                                alt={item.product_name}
                                className="w-full h-full object-cover rounded-lg"
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
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {item.product_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Weight: {item.weight}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatPrice(item.price)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-brand-600" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {order.shipping_address?.fullName}
                    </p>
                    <p>{order.shipping_address?.address}</p>
                    <p>
                      {order.shipping_address?.city},{" "}
                      {order.shipping_address?.state}{" "}
                      {order.shipping_address?.zipCode}
                    </p>
                    <p>{order.shipping_address?.country}</p>
                    {order.shipping_address?.phone && (
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {order.shipping_address.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {shipping === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          formatPrice(shipping)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() =>
                        navigate(`/track-order?orderId=${order.id}`)
                      }
                      className="w-full bg-brand-600 hover:bg-brand-700"
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      Track Order
                    </Button>

                    <Button
                      onClick={handleDownloadReceipt}
                      disabled={downloadingReceipt}
                      variant="outline"
                      className="w-full"
                    >
                      {downloadingReceipt ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download Receipt
                    </Button>

                    <Button
                      onClick={handleShareOrder}
                      variant="outline"
                      className="w-full"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Order
                    </Button>

                    <Button
                      onClick={() => navigate("/products")}
                      variant="ghost"
                      className="w-full"
                    >
                      Continue Shopping
                    </Button>
                  </div>

                  <Separator />

                  {/* Notifications */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Confirmation email sent
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      SMS updates enabled
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Need help?</strong> If you have any questions about your
                order, please contact our support team at{" "}
                <a
                  href="mailto:support@nutrivault.com"
                  className="text-brand-600 hover:underline"
                >
                  support@nutrivault.com
                </a>{" "}
                or call{" "}
                <a
                  href="tel:+1-555-123-4567"
                  className="text-brand-600 hover:underline"
                >
                  +1 (555) 123-4567
                </a>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
