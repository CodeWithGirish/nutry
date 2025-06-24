import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Mail, Package } from "lucide-react";
import { useParams } from "react-router-dom";

const OrderConfirmation = () => {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-6">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h1>
            <p className="text-gray-600 mb-8">
              Thank you for your order. We've received your payment and will
              start processing your order shortly.
            </p>

            <Card className="mb-8 text-left">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Order Number:</span>
                    <Badge className="bg-brand-100 text-brand-700">
                      #{orderId || "ORD-2024-001"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Payment Status:</span>
                    <Badge className="bg-green-100 text-green-700">Paid</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Order Status:</span>
                    <Badge className="bg-blue-100 text-blue-700">
                      Processing
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Estimated Delivery:</span>
                    <span>3-5 business days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                📧 A confirmation email has been sent to your email address
              </p>
              <p className="text-sm text-gray-600">
                📱 You'll receive SMS updates about your order status
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
              <Button
                onClick={() => (window.location.href = "/track-order")}
                className="bg-brand-600 hover:bg-brand-700"
              >
                <Package className="mr-2 h-4 w-4" />
                Track Order
              </Button>
              <Button variant="outline" className="border-brand-300">
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
              <Button
                onClick={() => (window.location.href = "/products")}
                variant="outline"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
