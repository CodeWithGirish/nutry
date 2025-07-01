-- ============================================================================
-- COMPLETE ORDER HISTORY DATABASE SETUP
-- ============================================================================
-- This script sets up the complete order history system for automatic
-- daily cleanup and management of delivered orders.
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Go to your Supabase Dashboard > SQL Editor
-- 3. Paste and run this script
-- 4. Refresh your admin dashboard to see "Connected" status
-- ============================================================================

BEGIN;

-- Step 1: Create order_history table
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_order_id UUID NOT NULL UNIQUE, -- Reference to original order ID
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'delivered',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'cod', 'upi')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  is_gift BOOLEAN DEFAULT FALSE,
  gift_message TEXT,
  gift_box_price DECIMAL(10,2),
  order_created_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Original order creation date
  order_updated_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When order was last updated
  delivered_date TIMESTAMP WITH TIME ZONE, -- When order was delivered
  moved_to_history_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- When moved to history
);

-- Step 2: Create order_history_items table
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_history_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_history_id UUID REFERENCES order_history(id) ON DELETE CASCADE,
  original_order_item_id UUID NOT NULL, -- Reference to original order item ID
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  weight TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  product_name TEXT NOT NULL
);

-- Step 3: Create indexes for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_order_history_user_id ON order_history(user_id);
CREATE INDEX IF NOT EXISTS idx_order_history_delivered_date ON order_history(delivered_date);
CREATE INDEX IF NOT EXISTS idx_order_history_original_order_id ON order_history(original_order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_moved_at ON order_history(moved_to_history_at);
CREATE INDEX IF NOT EXISTS idx_order_history_payment_method ON order_history(payment_method);

CREATE INDEX IF NOT EXISTS idx_order_history_items_order_history_id ON order_history_items(order_history_id);
CREATE INDEX IF NOT EXISTS idx_order_history_items_product_id ON order_history_items(product_id);

-- Step 4: Function to move delivered order to history
-- ============================================================================
CREATE OR REPLACE FUNCTION move_order_to_history(order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    order_record RECORD;
    new_history_id UUID;
    item_record RECORD;
BEGIN
    -- Check if order exists and is delivered
    SELECT * INTO order_record FROM orders WHERE id = order_id AND status = 'delivered';
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Order % not found or not delivered', order_id;
        RETURN FALSE;
    END IF;
    
    -- Check if order is already in history
    IF EXISTS (SELECT 1 FROM order_history WHERE original_order_id = order_id) THEN
        RAISE NOTICE 'Order % already in history', order_id;
        RETURN FALSE;
    END IF;
    
    -- Insert order into order_history
    INSERT INTO order_history (
        original_order_id,
        user_id,
        status,
        payment_method,
        payment_status,
        total_amount,
        shipping_address,
        is_gift,
        gift_message,
        gift_box_price,
        order_created_at,
        order_updated_at,
        delivered_date
    ) VALUES (
        order_record.id,
        order_record.user_id,
        order_record.status,
        order_record.payment_method,
        order_record.payment_status,
        order_record.total_amount,
        order_record.shipping_address,
        order_record.is_gift,
        order_record.gift_message,
        order_record.gift_box_price,
        order_record.created_at,
        order_record.updated_at,
        order_record.updated_at -- Use updated_at as delivery date
    ) RETURNING id INTO new_history_id;
    
    -- Move order items to order_history_items
    FOR item_record IN 
        SELECT * FROM order_items WHERE order_id = order_record.id
    LOOP
        INSERT INTO order_history_items (
            order_history_id,
            original_order_item_id,
            product_id,
            quantity,
            weight,
            price,
            product_name
        ) VALUES (
            new_history_id,
            item_record.id,
            item_record.product_id,
            item_record.quantity,
            item_record.weight,
            item_record.price,
            item_record.product_name
        );
    END LOOP;
    
    -- Delete order items first (due to foreign key constraint)
    DELETE FROM order_items WHERE order_id = order_record.id;
    
    -- Delete the original order
    DELETE FROM orders WHERE id = order_record.id;
    
    RAISE NOTICE 'Order % moved to history successfully', order_id;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error moving order % to history: %', order_id, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Function to get order history with user details
-- ============================================================================
CREATE OR REPLACE FUNCTION get_order_history_with_details()
RETURNS TABLE (
    id UUID,
    original_order_id UUID,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    status TEXT,
    payment_method TEXT,
    payment_status TEXT,
    total_amount DECIMAL(10,2),
    shipping_address JSONB,
    is_gift BOOLEAN,
    gift_message TEXT,
    gift_box_price DECIMAL(10,2),
    order_created_at TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    moved_to_history_at TIMESTAMP WITH TIME ZONE,
    order_items JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oh.id,
        oh.original_order_id,
        oh.user_id,
        COALESCE(p.full_name, 'Unknown User') as user_name,
        COALESCE(p.email, 'No email') as user_email,
        oh.status,
        oh.payment_method,
        oh.payment_status,
        oh.total_amount,
        oh.shipping_address,
        oh.is_gift,
        oh.gift_message,
        oh.gift_box_price,
        oh.order_created_at,
        oh.delivered_date,
        oh.moved_to_history_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ohi.id,
                    'product_id', ohi.product_id,
                    'quantity', ohi.quantity,
                    'weight', ohi.weight,
                    'price', ohi.price,
                    'product_name', ohi.product_name
                )
            ) FILTER (WHERE ohi.id IS NOT NULL),
            '[]'::jsonb
        ) as order_items
    FROM order_history oh
    LEFT JOIN profiles p ON oh.user_id = p.id
    LEFT JOIN order_history_items ohi ON oh.id = ohi.order_history_id
    GROUP BY oh.id, p.full_name, p.email
    ORDER BY oh.moved_to_history_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history_items ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies for order_history
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own order history" ON order_history;
CREATE POLICY "Users can view their own order history" ON order_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all order history" ON order_history;
CREATE POLICY "Admins can manage all order history" ON order_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()
        )
    );

-- Step 8: Create RLS Policies for order_history_items
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own order history items" ON order_history_items;
CREATE POLICY "Users can view their own order history items" ON order_history_items
    FOR SELECT USING (
        order_history_id IN (
            SELECT id FROM order_history WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all order history items" ON order_history_items;
CREATE POLICY "Admins can manage all order history items" ON order_history_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()
        )
    );

-- Step 9: Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, DELETE ON order_history TO authenticated;
GRANT SELECT, INSERT, DELETE ON order_history_items TO authenticated;
GRANT EXECUTE ON FUNCTION move_order_to_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_history_with_details() TO authenticated;

-- Step 10: Grant permissions to specific roles if they exist
-- ============================================================================
DO $$ 
BEGIN
    -- Grant to anon role if it exists
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT SELECT ON order_history TO anon;
        GRANT SELECT ON order_history_items TO anon;
        GRANT EXECUTE ON FUNCTION get_order_history_with_details() TO anon;
    END IF;
    
    -- Grant to service_role if it exists
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT ALL ON order_history TO service_role;
        GRANT ALL ON order_history_items TO service_role;
        GRANT EXECUTE ON FUNCTION move_order_to_history(UUID) TO service_role;
        GRANT EXECUTE ON FUNCTION get_order_history_with_details() TO service_role;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- ✅ What was created:
-- 1. order_history table - stores completed orders
-- 2. order_history_items table - stores items for completed orders  
-- 3. Indexes for better performance
-- 4. move_order_to_history() function - moves orders to history
-- 5. get_order_history_with_details() function - retrieves history data
-- 6. RLS policies for security
-- 7. Proper permissions
--
-- 🔄 Next steps:
-- 1. Refresh your admin dashboard
-- 2. Go to Order History tab
-- 3. You should see "Connected" in green
-- 4. Test with "Test Connection" button
-- 5. Try "Run Cleanup Now" to move any delivered orders
--
-- 📊 How it works:
-- - Delivered orders older than 24 hours automatically move to history
-- - Orders disappear from Order Management tabs
-- - Orders appear in Order History tab
-- - All data is preserved safely
--
-- ============================================================================

SELECT 'Order History Database Setup Complete! 🎉' as message;
