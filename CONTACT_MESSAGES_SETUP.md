# Contact Messages Setup Instructions

This document explains how to set up the contact messages feature in your admin dashboard.

## Overview

The contact messages feature allows:

- Customers to send messages through the contact form
- Admins to view and manage messages in the admin dashboard
- Tracking of message status (unread/read/replied)
- Direct reply functionality via email/phone

## Database Setup

### 1. Create the Contact Messages Table

Run the SQL script provided in `db/create-contact-messages-table.sql` in your Supabase SQL editor:

```bash
# Navigate to your Supabase project dashboard
# Go to SQL Editor
# Copy and paste the contents of db/create-contact-messages-table.sql
# Click "Run" to execute the script
```

### 2. Verify Table Creation

After running the script, verify the table was created by checking:

- Table name: `contact_messages`
- Columns: id, name, email, phone, subject, category, message, status, created_at, updated_at
- Policies: Proper RLS policies for admin access and public form submissions

## Troubleshooting

### "relation does not exist" Error

If you see the error: `relation "public.contact_messages" does not exist`

**Solution:** Run the SQL script from step 1 above.

### Network "Failed to fetch" Errors

If you see `TypeError: Failed to fetch` errors:

**Possible causes:**

1. **Internet connectivity issues** - Check your connection
2. **Supabase project is paused** - Unpause your project in Supabase dashboard
3. **Invalid Supabase credentials** - Verify URL and anon key in `src/lib/supabase.ts`
4. **CORS issues** - Check if your domain is allowed in Supabase project settings

**Solutions:**

1. Check Supabase project status in dashboard
2. Verify project URL and keys are correct
3. Ensure project is not paused due to inactivity
4. Check browser network tab for specific error details

### Permission Errors

If admins cannot view messages:

**Solution:** Ensure the user has `role = 'admin'` in the `profiles` table.

### Contact Form Not Saving Messages

The contact form will still work even if the table doesn't exist - it will show a warning in the console but allow form submission. To enable full functionality, create the table using the SQL script.

## Features

### Admin Dashboard Features

- View all contact messages with status indicators
- Mark messages as read automatically when viewing
- Reply directly via email or phone
- Filter by unread/read status
- View message details in modal dialog

### Contact Form Features

- Categorized message types
- Required field validation
- Success confirmation
- Graceful fallback if database table doesn't exist

## File Locations

- Contact form: `src/pages/Contact.tsx`
- Admin dashboard: `src/pages/AdminDashboard.tsx` (Users tab)
- Database types: `src/lib/supabase.ts`
- SQL setup script: `db/create-contact-messages-table.sql`

## Testing

1. Visit `/contact` page and submit a test message
2. Go to admin dashboard `/admin-dashboard`
3. Navigate to "Users" tab
4. View the "Contact Messages" section
5. Click on a message to view details and mark as read
