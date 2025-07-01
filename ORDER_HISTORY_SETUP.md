# Order History Setup Instructions

This document explains how to set up the automatic order history system.

## What is Order History?

The order history system automatically moves delivered orders to a separate history table after 24 hours. This keeps the main orders table clean and improves performance while preserving all order data.

## Database Setup

### Option 1: Run the Setup Script (Recommended)

Execute the SQL script in your Supabase SQL editor:

```sql
-- Run this script in Supabase SQL Editor
-- File: db/setup-order-history-cleanup.sql
```

Copy and paste the contents of `db/setup-order-history-cleanup.sql` into your Supabase SQL editor and run it.

### Option 2: Manual Setup

If you prefer to set up manually, the system requires:

1. **order_history table** - Stores completed orders
2. **order_history_items table** - Stores items for completed orders
3. **move_order_to_history() function** - Moves orders to history
4. **get_order_history_with_details() function** - Retrieves history with user details
5. **RLS policies** - Proper security policies

## How It Works

### Automatic Operation

- **Daily Check**: System checks once per day when admin dashboard loads
- **24-Hour Rule**: Only moves orders delivered more than 24 hours ago
- **Safe Transfer**: Preserves all order data and relationships
- **UI Update**: Orders disappear from management tabs and appear in history

### Manual Operation

- **Test Button**: "Run Cleanup Now" button in Order History tab
- **Force Cleanup**: Can trigger cleanup manually for testing
- **Status Feedback**: Shows how many orders were moved

## Troubleshooting

### "Error fetching order history" Message

This usually means the database functions aren't set up yet. The system will:

- Fall back to querying tables directly
- Show a message about database setup being required
- Continue working with current orders

### Orders Not Moving Automatically

Check that:

1. Orders are marked as "delivered"
2. Orders are more than 24 hours old
3. Database functions are properly installed
4. Admin loads the dashboard (triggers the check)

### Manual Cleanup Not Working

If the "Run Cleanup Now" button doesn't work:

1. Check browser console for detailed error messages
2. Verify database functions are installed
3. Check that delivered orders exist and are old enough

## Benefits

- **Performance**: Keeps active order tables smaller
- **Organization**: Separates active orders from completed ones
- **Preservation**: Maintains complete order history
- **Automatic**: No manual intervention required
- **Safe**: Non-destructive data transfer

## Data Structure

### order_history table

- Complete copy of original order data
- Additional tracking fields (moved_to_history_at, delivered_date)
- Links to original order ID for reference

### order_history_items table

- Complete copy of order items
- Links to order_history record
- Preserves all product and pricing information

## Security

- **RLS Enabled**: Row Level Security protects data
- **User Access**: Users can only see their own order history
- **Admin Access**: Admins can see all order history
- **Same Permissions**: Uses existing authentication system
