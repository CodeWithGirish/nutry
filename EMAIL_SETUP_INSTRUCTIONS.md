# Email Configuration Setup Instructions

This guide will help you set up email services for your NutriVault application to handle:

- Order confirmation emails
- Admin notifications for new orders
- Contact form messages
- Password reset emails
- Newsletter and marketing emails

## Option 1: Resend (Recommended for Beginners)

Resend is developer-friendly and has a generous free tier.

### Step 1: Create Resend Account

1. Visit [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get API Key

1. Go to your Resend dashboard
2. Navigate to "API Keys" section
3. Click "Create API Key"
4. Name it "NutriVault Production"
5. Copy the API key (starts with `re_`)

### Step 3: Add Domain (Optional but Recommended)

1. Go to "Domains" in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `nutrivault.com`)
4. Add the provided DNS records to your domain provider
5. Wait for verification (can take up to 48 hours)

### Step 4: Environment Variables

Add these to your `.env` file:

```env
# Resend Configuration
EMAIL_SERVICE=resend
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=orders@nutrivault.com
ADMIN_EMAIL=admin@nutrivault.com
```

### Step 5: Install Resend Package

```bash
npm install resend
```

---

## Option 2: SendGrid (Best for High Volume)

SendGrid is reliable and scales well for production use.

### Step 1: Create SendGrid Account

1. Visit [sendgrid.com](https://sendgrid.com)
2. Sign up for free account (100 emails/day free)
3. Complete email verification

### Step 2: Create API Key

1. Go to Settings > API Keys
2. Click "Create API Key"
3. Choose "Restricted Access"
4. Give permissions for "Mail Send"
5. Copy the API key (starts with `SG.`)

### Step 3: Sender Authentication

1. Go to Settings > Sender Authentication
2. Choose "Single Sender Verification" or "Domain Authentication"
3. For Single Sender: verify an email address
4. For Domain: add DNS records to your domain

### Step 4: Environment Variables

```env
# SendGrid Configuration
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=noreply@nutrivault.com
ADMIN_EMAIL=admin@nutrivault.com
```

### Step 5: Install SendGrid Package

```bash
npm install @sendgrid/mail
```

---

## Option 3: AWS SES (Best for AWS Users)

If you're already using AWS, SES is cost-effective and reliable.

### Step 1: AWS Setup

1. Create AWS account if you don't have one
2. Go to AWS SES console
3. Choose your region (us-east-1 recommended)

### Step 2: Verify Email/Domain

1. Go to "Verified identities"
2. Click "Create identity"
3. Choose email address or domain
4. Follow verification steps

### Step 3: Create IAM User

1. Go to IAM console
2. Create new user for SES
3. Attach policy: `AmazonSESFullAccess`
4. Save Access Key ID and Secret

### Step 4: Environment Variables

```env
# AWS SES Configuration
EMAIL_SERVICE=ses
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
FROM_EMAIL=noreply@nutrivault.com
ADMIN_EMAIL=admin@nutrivault.com
```

### Step 5: Install AWS SDK

```bash
npm install aws-sdk
```

---

## Option 4: Gmail SMTP (For Testing Only)

⚠️ **Not recommended for production** - use only for development/testing.

### Step 1: Enable App Passwords

1. Go to Google Account settings
2. Enable 2-factor authentication
3. Generate an "App Password" for email

### Step 2: Environment Variables

```env
# Gmail SMTP (Testing Only)
EMAIL_SERVICE=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
FROM_EMAIL=your-email@gmail.com
ADMIN_EMAIL=admin@nutrivault.com
```

### Step 3: Install Nodemailer

```bash
npm install nodemailer
```

---

## Implementation Code

After choosing your email service, update your email service file:

### Create Enhanced Email Service

Create or update `src/lib/emailService.ts`:

```typescript
// For Resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "orders@nutrivault.com",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error };
  }
};
```

### For SendGrid Implementation:

```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL || "noreply@nutrivault.com",
      subject,
      html,
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error);
    return { success: false, error };
  }
};
```

---

## Email Templates Setup

### Update Environment Variables for Production

Add these additional variables:

```env
# Email Templates
COMPANY_NAME=NutriVault
COMPANY_ADDRESS=123 Health Street, Los Angeles, CA 90210
SUPPORT_EMAIL=support@nutrivault.com
WEBSITE_URL=https://nutrivault.com

# SMTP Settings (if using SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
```

### Test Email Configuration

Create a test endpoint in your app:

```typescript
// Test email endpoint - remove in production
app.post("/test-email", async (req, res) => {
  try {
    const result = await sendEmail(
      "your-email@example.com",
      "Test Email from NutriVault",
      "<h1>Email Configuration Working!</h1><p>Your email service is properly configured.</p>",
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Production Deployment Checklist

### Before Going Live:

1. ✅ Choose production email service (Resend/SendGrid/SES)
2. ✅ Set up domain authentication
3. ✅ Configure all environment variables
4. ✅ Test email sending functionality
5. ✅ Set up email monitoring/logging
6. ✅ Configure email rate limiting
7. ✅ Add unsubscribe links to marketing emails
8. ✅ Set up bounce and complaint handling

### Security Best Practices:

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Implement rate limiting for email sending
- Validate email addresses before sending
- Use HTTPS for all email-related endpoints
- Monitor for suspicious email activity

### Monitoring Setup:

1. Set up email delivery monitoring
2. Track bounce rates and complaints
3. Monitor API usage and costs
4. Set up alerts for failed deliveries

---

## Troubleshooting Common Issues

### Issue: Emails Going to Spam

**Solutions:**

- Set up SPF, DKIM, and DMARC records
- Use authenticated domains
- Avoid spam trigger words
- Include unsubscribe links
- Maintain good sender reputation

### Issue: API Rate Limits

**Solutions:**

- Implement email queuing
- Batch email sending
- Use appropriate delays between sends
- Monitor API usage

### Issue: Failed Deliveries

**Solutions:**

- Validate email addresses
- Handle bounces properly
- Check sender reputation
- Review email content for spam triggers

---

## Cost Estimates (Monthly)

| Service  | Free Tier      | Paid Plans Start       |
| -------- | -------------- | ---------------------- |
| Resend   | 3,000 emails   | $20/month (50k emails) |
| SendGrid | 100 emails/day | $15/month (40k emails) |
| AWS SES  | 62,000 emails  | $0.10 per 1,000 emails |
| Mailgun  | 5,000 emails   | $35/month (50k emails) |

---

## Quick Start (Recommended: Resend)

1. **Sign up**: Create account at resend.com
2. **Get API key**: Copy from dashboard
3. **Install**: `npm install resend`
4. **Configure**: Add to `.env` file
5. **Test**: Send test email
6. **Deploy**: Update production environment

For immediate setup with minimal configuration, **Resend** is recommended for new projects.

---

## Support

If you encounter issues:

1. Check service status pages
2. Review API documentation
3. Test with simple email first
4. Check environment variables
5. Verify domain authentication
6. Contact service support if needed

Remember to remove any test endpoints and sensitive information before deploying to production!
