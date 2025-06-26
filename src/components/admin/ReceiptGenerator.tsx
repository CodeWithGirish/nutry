import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { formatPrice, formatDate, formatOrderId } from "@/lib/utils";
import type { Order } from "@/lib/supabase";

interface ReceiptGeneratorProps {
  order: Order & { user_name: string; user_email: string };
  onClose?: () => void;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  order,
  onClose,
}) => {
  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${formatOrderId(order.id)}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
              color: #333;
              line-height: 1.6;
            }
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              background: #fff;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              overflow: hidden;
            }
            .receipt-header {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .receipt-header h1 {
              margin: 0;
              font-size: 2.5rem;
              font-weight: bold;
            }
            .receipt-header .subtitle {
              margin: 10px 0 0 0;
              font-size: 1.1rem;
              opacity: 0.9;
            }
            .receipt-body {
              padding: 30px;
            }
            .receipt-section {
              margin-bottom: 25px;
              padding-bottom: 20px;
              border-bottom: 1px solid #f3f4f6;
            }
            .receipt-section:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .section-title {
              font-size: 1.2rem;
              font-weight: bold;
              color: #374151;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
            }
            .section-title::before {
              content: "";
              width: 4px;
              height: 20px;
              background: #f97316;
              margin-right: 10px;
              border-radius: 2px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 10px;
              background: #f9fafb;
              border-radius: 6px;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
            }
            .info-value {
              font-weight: bold;
              color: #111827;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th {
              background: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #e5e7eb;
            }
            .items-table td {
              padding: 12px;
              border-bottom: 1px solid #f3f4f6;
            }
            .items-table tr:last-child td {
              border-bottom: none;
            }
            .total-section {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 1.1rem;
            }
            .total-final {
              font-size: 1.4rem;
              font-weight: bold;
              color: #f97316;
              border-top: 2px solid #e5e7eb;
              padding-top: 15px;
              margin-top: 15px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 0.875rem;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-confirmed { background: #dbeafe; color: #1e40af; }
            .status-shipped { background: #e0e7ff; color: #3730a3; }
            .status-delivered { background: #d1fae5; color: #065f46; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 0.875rem;
            }
            .footer strong {
              color: #374151;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .receipt-container { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h1>🥜 NutriVault</h1>
              <p class="subtitle">Premium Dry Fruits & Healthy Snacks</p>
            </div>

            <div class="receipt-body">
              <!-- Order Information -->
              <div class="receipt-section">
                <h2 class="section-title">Order Information</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Order ID:</span>
                    <span class="info-value">${formatOrderId(order.id)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Order Date:</span>
                    <span class="info-value">${formatDate(order.created_at)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Payment Method:</span>
                    <span class="info-value">${order.payment_method === "cod" ? "Cash on Delivery" : "Credit Card"}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span class="status-badge status-${order.status}">${order.status}</span>
                  </div>
                </div>
              </div>

              <!-- Customer Information -->
              <div class="receipt-section">
                <h2 class="section-title">Customer Information</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${order.user_name}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${order.user_email}</span>
                  </div>
                </div>
                ${
                  order.shipping_address
                    ? `
                  <div style="margin-top: 15px; padding: 15px; background: #f9fafb; border-radius: 6px;">
                    <strong>Shipping Address:</strong><br>
                    ${order.shipping_address.fullName || order.user_name}<br>
                    ${order.shipping_address.address || ""}<br>
                    ${order.shipping_address.city || ""}, ${order.shipping_address.state || ""} ${order.shipping_address.zipCode || ""}<br>
                    ${order.shipping_address.country || ""}
                  </div>
                `
                    : ""
                }
              </div>

              <!-- Order Items -->
              <div class="receipt-section">
                <h2 class="section-title">Order Items</h2>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Weight</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(order.order_items || [])
                      .map(
                        (item: any) => `
                      <tr>
                        <td><strong>${item.product_name}</strong></td>
                        <td>${item.weight}</td>
                        <td>${item.quantity}</td>
                        <td>${formatPrice(item.price)}</td>
                        <td><strong>${formatPrice(item.price * item.quantity)}</strong></td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>

              <!-- Totals -->
              <div class="total-section">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>${formatPrice(order.total_amount)}</span>
                </div>
                <div class="total-row">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div class="total-row">
                  <span>Tax:</span>
                  <span>Included</span>
                </div>
                <div class="total-row total-final">
                  <span>Total Amount:</span>
                  <span>${formatPrice(order.total_amount)}</span>
                </div>
              </div>

              ${
                order.is_gift
                  ? `
                <div class="receipt-section">
                  <h2 class="section-title">🎁 Gift Order</h2>
                  <div style="padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                    <strong>Gift Message:</strong><br>
                    ${order.gift_message || "No message provided"}
                  </div>
                </div>
              `
                  : ""
              }
            </div>

            <div class="footer">
              <p><strong>Thank you for choosing NutriVault!</strong></p>
              <p>For support, contact us at info@nutrivault.com or +1 (555) 123-4567</p>
              <p>123 Health Street, Los Angeles, CA 90210</p>
              <p style="margin-top: 15px; font-size: 0.75rem;">
                This receipt was generated on ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const downloadReceipt = () => {
    const receiptHTML = generateReceiptHTML();
    const blob = new Blob([receiptHTML], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${formatOrderId(order.id)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const printReceipt = () => {
    const receiptHTML = generateReceiptHTML();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={downloadReceipt}
        title="Download Professional Receipt"
      >
        <Download className="h-3 w-3 mr-1" />
        Receipt
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={printReceipt}
        title="Print Receipt"
      >
        <Printer className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default ReceiptGenerator;
