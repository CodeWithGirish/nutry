# Weight-Specific Stock Management Setup Instructions

This project now includes comprehensive **weight-specific stock management** functionality. Each product weight variant (250g, 500g, 1kg, etc.) can have its own independent stock levels.

## Database Setup

1. **Apply the stock management functions** to your Supabase database by running the SQL in `db/stock-management-functions.sql`. You can do this by:

   - Opening the Supabase dashboard
   - Going to SQL Editor
   - Copying and pasting the contents of `db/stock-management-functions.sql`
   - Running the SQL

2. **Update your existing product data** to include stock_quantity in the prices array. Example migration:
   ```sql
   -- Update existing products to add stock_quantity to each weight variant
   UPDATE products
   SET prices = (
     SELECT jsonb_agg(
       jsonb_set(price_item, '{stock_quantity}', '50')
     )
     FROM jsonb_array_elements(prices) AS price_item
   )
   WHERE prices IS NOT NULL;
   ```

## Features Implemented

### 1. Weight-Specific Stock Display on Product Pages

- Shows current stock quantity **per weight variant** with color-coded indicators:
  - Green: More than 10 items available for that weight
  - Orange: 1-10 items available (low stock warning)
  - Red: Out of stock for that weight
- Weight selection buttons show individual stock levels
- Displays "Limited stock!" warning when ≤ 10 items remain for selected weight
- Out-of-stock weight variants are disabled and visually distinct

### 2. Weight-Specific Stock Validation in Cart

- Prevents users from adding more items than available for the specific weight
- Shows appropriate error messages with weight information
- Automatically validates against current stock levels for selected weight
- Updates quantity controls to respect weight-specific stock limits

### 3. Enhanced Stock Management in Admin Dashboard

- Admin can set stock quantities **for each weight variant individually**
- Shows low stock alerts considering all weight variants
- Displays stock levels per weight in product management
- Bulk stock operations for different weight variants

### 4. Automatic Weight-Specific Stock Updates on Orders

- Stock quantities automatically decrease for the **specific weight ordered**
- Uses atomic database functions to prevent race conditions
- Updates `in_stock` status based on **any weight variant** having stock
- Maintains separate inventory for each weight variant

## Database Functions

The following functions are available for weight-specific stock management:

- `decrement_product_stock(product_id, weight_variant, quantity)` - Safely decreases stock for specific weight
- `increment_product_stock(product_id, weight_variant, quantity)` - Increases stock for specific weight (admin use)
- `set_product_stock(product_id, weight_variant, quantity)` - Sets exact stock quantity for specific weight (admin use)

All functions automatically update the product's `in_stock` status based on whether any weight variant has stock available.

## Testing the Implementation

1. **Test weight-specific stock display**: Visit any product page to see stock per weight variant
2. **Test weight selection**: Select different weights and observe stock changes
3. **Test stock limits**: Try to add more items than available for a specific weight
4. **Test cross-weight independence**: Verify that out-of-stock for one weight doesn't affect others
5. **Test order processing**: Place an order and verify only the ordered weight's stock decreases
6. **Test admin functions**: Use admin dashboard to set different stock levels per weight

## Notes

- Stock quantities cannot go below 0 for any weight variant
- Products are automatically marked as "out of stock" only when ALL weight variants reach 0
- Each weight variant maintains independent stock levels
- All stock operations use database functions for data integrity
- The UI provides clear visual feedback for each weight variant's stock state
- Cart validation ensures users cannot exceed stock limits for their selected weight
- Order processing only affects the stock of the specific weight variant ordered

## Data Structure

The `prices` field in the products table should now include `stock_quantity`:

```json
[
  {
    "weight": "250g",
    "price": 24.99,
    "stock_quantity": 50
  },
  {
    "weight": "500g",
    "price": 45.99,
    "stock_quantity": 30
  },
  {
    "weight": "1kg",
    "price": 89.99,
    "stock_quantity": 0
  }
]
```
