-- Setup Order History Cleanup System
-- This script ensures the order history system is properly configured

-- First, create the order_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_order_id UUID NOT NULL, -- Reference to original order ID
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'delivered',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
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

-- Create order_history_items table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_history_user_id ON order_history(user_id);
CREATE INDEX IF NOT EXISTS idx_order_history_delivered_date ON order_history(delivered_date);
CREATE INDEX IF NOT EXISTS idx_order_history_original_order_id ON order_history(original_order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_moved_at ON order_history(moved_to_history_at);

-- Create indexes for order history items
CREATE INDEX IF NOT EXISTS idx_order_history_items_order_history_id ON order_history_items(order_history_id);
CREATE INDEX IF NOT EXISTS idx_order_history_items_product_id ON order_history_items(product_id);

-- Function to move delivered order to history
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

-- Enable RLS on order_history tables
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_history
DROP POLICY IF EXISTS "Users can view their own order history" ON order_history;
CREATE POLICY "Users can view their own order history" ON order_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all order history" ON order_history;
CREATE POLICY "Admins can view all order history" ON order_history
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- RLS Policies for order_history_items
DROP POLICY IF EXISTS "Users can view their own order history items" ON order_history_items;
CREATE POLICY "Users can view their own order history items" ON order_history_items
    FOR SELECT USING (
        order_history_id IN (
            SELECT id FROM order_history WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all order history items" ON order_history_items;
CREATE POLICY "Admins can view all order history items" ON order_history_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON order_history TO authenticated;
GRANT SELECT, INSERT, DELETE ON order_history_items TO authenticated;
GRANT EXECUTE ON FUNCTION move_order_to_history(UUID) TO authenticated;

-- Add a function to get order history with user details for admin dashboard
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
        p.full_name as user_name,
        p.email as user_email,
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

GRANT EXECUTE ON FUNCTION get_order_history_with_details() TO authenticated;
