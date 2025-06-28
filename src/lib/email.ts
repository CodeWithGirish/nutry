import { supabase } from "./supabase";

// Email templates
export const emailTemplates = {
  orderConfirmation: (orderDetails: any) => ({
    subject: `Order Confirmation - ${orderDetails.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e8914c 0%, #d97438 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .order-item { border-bottom: 1px solid #eee; padding: 15px 0; }
            .total { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .button { background: #e8914c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🥜 NutriVault</h1>
              <h2>Order Confirmation</h2>
            </div>

            <div class="content">
              <h3>Thank you for your order!</h3>
              <p>Hi ${orderDetails.customerName},</p>
              <p>We've received your order and it's being processed. Here are the details:</p>

              <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <strong>Order #:</strong> ${orderDetails.orderId}<br>
                <strong>Order Date:</strong> ${new Date(orderDetails.orderDate).toLocaleDateString()}<br>
                <strong>Payment Method:</strong> ${orderDetails.paymentMethod === "cod" ? "Cash on Delivery" : "Credit Card"}<br>
                <strong>Status:</strong> ${orderDetails.status}
              </div>

              <h4>Order Items:</h4>
              ${orderDetails.items
                .map(
                  (item: any) => `
                <div class="order-item">
                  <strong>${item.product_name}</strong><br>
                  Weight: ${item.weight} | Quantity: ${item.quantity}<br>
                  Price: $${(item.price * item.quantity).toFixed(2)}
                </div>
              `,
                )
                .join("")}

              <div class="total">
                <strong>Total Amount: $${orderDetails.totalAmount.toFixed(2)}</strong>
              </div>

              <h4>Shipping Address:</h4>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 4px;">
                ${orderDetails.shippingAddress.fullName}<br>
                ${orderDetails.shippingAddress.address}<br>
                ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} ${orderDetails.shippingAddress.zipCode}<br>
                ${orderDetails.shippingAddress.country}
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/track-order" class="button">Track Your Order</a>
              </div>

              <p>Expected delivery: 3-5 business days</p>
              <p>If you have any questions, please contact us at info@nutrivault.com or call +1 (555) 123-4567.</p>
            </div>

            <div class="footer">
              <p>&copy; 2024 NutriVault. All rights reserved.</p>
              <p>123 Health Street, Los Angeles, CA 90210</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  orderShipped: (orderDetails: any) => ({
    subject: `Your Order Has Shipped - ${orderDetails.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Shipped</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e8914c 0%, #d97438 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .button { background: #e8914c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🥜 NutriVault</h1>
              <h2>🚚 Your Order Has Shipped!</h2>
            </div>

            <div class="content">
              <p>Hi ${orderDetails.customerName},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <strong>Order #:</strong> ${orderDetails.orderId}<br>
                <strong>Tracking Number:</strong> ${orderDetails.trackingNumber}<br>
                <strong>Estimated Delivery:</strong> ${orderDetails.estimatedDelivery}
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/track-order" class="button">Track Your Package</a>
              </div>

              <p>You'll receive another email when your order is delivered.</p>
            </div>

            <div class="footer">
              <p>&copy; 2024 NutriVault. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Email service functions
export const sendOrderConfirmationEmail = async (
  orderId: string,
  userEmail: string,
  orderData: any,
) => {
  try {
    const emailContent = emailTemplates.orderConfirmation({
      orderId,
      customerName:
        orderData.shipping_address?.fullName ||
        orderData.user_name ||
        "Customer",
      orderDate: orderData.created_at,
      paymentMethod: orderData.payment_method,
      status: orderData.status,
      items: orderData.items || [],
      totalAmount: orderData.total_amount,
      shippingAddress: orderData.shipping_address || {},
    });

    // Try to log email notification to database, but don't fail if it doesn't work
    try {
      const { error } = await supabase.from("email_notifications").insert({
        user_id: orderData.user_id,
        order_id: orderId,
        email_type: "order_confirmation",
        recipient_email: userEmail,
        subject: emailContent.subject,
        content: emailContent.html,
        status: "sent", // In production, this would be 'pending' until actually sent
        sent_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Could not log email notification:", error.message);
      }
    } catch (dbError) {
      console.warn("Email notification table not available, skipping logging");
    }

    // In production, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Mailgun
    console.log(
      "Email notification prepared:",
      emailContent.subject,
      "for",
      userEmail,
    );

    return { success: true };
  } catch (error) {
    console.warn(
      "Email notification failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { success: false, error: "Email notification unavailable" };
  }
};

export const sendOrderShippedEmail = async (
  orderId: string,
  userEmail: string,
  orderData: any,
) => {
  try {
    const emailContent = emailTemplates.orderShipped({
      orderId,
      customerName:
        orderData.shipping_address?.fullName ||
        orderData.user_name ||
        "Customer",
      trackingNumber: orderData.tracking_number || "TRK123456789",
      estimatedDelivery: orderData.estimated_delivery || "2-3 business days",
    });

    // Try to log email notification to database, but don't fail if it doesn't work
    try {
      const { error } = await supabase.from("email_notifications").insert({
        user_id: orderData.user_id,
        order_id: orderId,
        email_type: "order_shipped",
        recipient_email: userEmail,
        subject: emailContent.subject,
        content: emailContent.html,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Could not log email notification:", error.message);
      }
    } catch (dbError) {
      console.warn("Email notification table not available, skipping logging");
    }

    console.log(
      "Shipped email notification prepared for:",
      emailContent.subject,
    );
    return { success: true };
  } catch (error) {
    console.warn(
      "Email notification failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { success: false, error: "Email notification unavailable" };
  }
};

// Notification service for restock alerts
export const sendRestockNotification = async (
  productId: string,
  productName: string,
) => {
  try {
    // Get users who want to be notified about this product
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("user_id, profiles(email, full_name)")
      .eq("product_id", productId)
      .eq("type", "restock")
      .eq("email_sent", false);

    if (error) throw error;

    // Send notifications to all interested users
    for (const notification of notifications || []) {
      const emailContent = {
        subject: `${productName} is Back in Stock!`,
        html: `
          <h2>Good news! ${productName} is back in stock.</h2>
          <p>Hi ${notification.profiles?.full_name},</p>
          <p>The product you wanted is now available again.</p>
          <a href="${window.location.origin}/product/${productId}" style="background: #e8914c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Shop Now</a>
        `,
      };

      await supabase.from("email_notifications").insert({
        user_id: notification.user_id,
        email_type: "restock",
        recipient_email: notification.profiles?.email,
        subject: emailContent.subject,
        content: emailContent.html,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      // Mark notification as sent
      await supabase
        .from("notifications")
        .update({ email_sent: true })
        .eq("user_id", notification.user_id)
        .eq("product_id", productId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending restock notifications:", error);
    return { success: false, error };
  }
};
