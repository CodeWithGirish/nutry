# Stock Management Setup Instructions

This project now includes comprehensive stock management functionality. To complete the setup, you need to apply the database functions to your Supabase database.

## Database Setup

1. **Apply the stock management functions** to your Supabase database by running the SQL in `db/stock-management-functions.sql`. You can do this by:

   - Opening the Supabase dashboard
   - Going to SQL Editor
   - Copying and pasting the contents of `db/stock-management-functions.sql`
   - Running the SQL

2. **Verify the setup** by checking that your products table has the `stock_quantity` field. If it doesn't exist, add it:
   ```sql
   ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
   ```

## Features Implemented

### 1. Stock Display on Product Pages

- Shows current stock quantity with color-coded indicators:
  - Green: More than 10 items available
  - Orange: 1-10 items available (low stock warning)
  - Red: Out of stock
- Displays "Limited stock!" warning when ≤ 10 items remain

### 2. Stock Validation in Cart

- Prevents users from adding more items than available in stock
- Shows appropriate error messages when stock limits are exceeded
- Automatically validates against current stock levels
- Updates quantity controls to respect stock limits

### 3. Stock Management in Admin Dashboard

- Admin can set stock quantities when creating/editing products
- Shows low stock alerts in admin statistics
- Displays stock levels in product tables with warning icons for low stock

### 4. Automatic Stock Updates on Orders

- Stock quantities automatically decrease when orders are placed
- Uses atomic database functions to prevent race conditions
- Updates `in_stock` status automatically based on remaining quantity

## Database Functions

The following functions are available for stock management:

- `decrement_product_stock(product_id, quantity)` - Safely decreases stock
- `increment_product_stock(product_id, quantity)` - Increases stock (for admin use)
- `set_product_stock(product_id, quantity)` - Sets exact stock quantity (for admin use)

## Testing the Implementation

1. **Test stock display**: Visit any product page to see stock information
2. **Test stock limits**: Try to add more items than available to cart
3. **Test order processing**: Place an order and verify stock decreases
4. **Test admin functions**: Use admin dashboard to manage stock levels

## Notes

- Stock quantities cannot go below 0
- Products are automatically marked as "out of stock" when quantity reaches 0
- All stock operations use database functions for data integrity
- The UI provides clear visual feedback for all stock states
