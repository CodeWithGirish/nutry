-- Create Order History Table for Delivered Orders
-- This table will store completed/delivered orders separately from active orders

-- Create order_history table (mirrors orders structure but for delivered orders)
CREATE TABLE IF NOT EXISTS order_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_order_id UUID NOT NULL, -- Reference to original order ID
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'delivered' CHECK (status = 'delivered'), -- Only delivered orders
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'cod')),
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'failed')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  is_gift BOOLEAN DEFAULT FALSE,
  gift_message TEXT,
  gift_box_price DECIMAL(10,2),
  tracking_number TEXT,
  delivered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When it was delivered
  order_created_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Original order creation date
  order_updated_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When order was last updated
  moved_to_history_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- When moved to history
);

-- Create order_history_items table (mirrors order_items for delivered orders)
CREATE TABLE IF NOT EXISTS order_history_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_history_id UUID REFERENCES order_history(id) ON DELETE CASCADE,
  original_order_item_id UUID NOT NULL, -- Reference to original order item ID
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  weight TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  product_name TEXT NOT NULL,
  original_created_at TIMESTAMP WITH TIME ZONE NOT NULL -- Original item creation date
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_history_user_id ON order_history(user_id);
CREATE INDEX IF NOT EXISTS idx_order_history_delivered_date ON order_history(delivered_date);
CREATE INDEX IF NOT EXISTS idx_order_history_original_order_id ON order_history(original_order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_payment_method ON order_history(payment_method);

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
        tracking_number,
        delivered_date,
        order_created_at,
        order_updated_at
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
        order_record.tracking_number,
        NOW(), -- delivered_date
        order_record.created_at,
        order_record.updated_at
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
            product_name,
            original_created_at
        ) VALUES (
            new_history_id,
            item_record.id,
            item_record.product_id,
            item_record.quantity,
            item_record.weight,
            item_record.price,
            item_record.product_name,
            item_record.created_at
        );
    END LOOP;
    
    -- Delete order items first (foreign key constraint)
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

-- Trigger to automatically move orders to history when status changes to delivered
CREATE OR REPLACE FUNCTION auto_move_delivered_orders()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to 'delivered'
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        -- Use a delayed job or immediate execution
        PERFORM move_order_to_history(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (optional - can be enabled/disabled as needed)
-- DROP TRIGGER IF EXISTS trigger_auto_move_delivered_orders ON orders;
-- CREATE TRIGGER trigger_auto_move_delivered_orders
--     AFTER UPDATE ON orders
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_move_delivered_orders();

-- Enable RLS on order_history tables
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_history
CREATE POLICY "Users can view their own order history" ON order_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all order history" ON order_history
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for order_history_items
CREATE POLICY "Users can view their own order history items" ON order_history_items
    FOR SELECT USING (
        order_history_id IN (
            SELECT id FROM order_history WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all order history items" ON order_history_items
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON order_history TO authenticated;
GRANT SELECT, INSERT, DELETE ON order_history_items TO authenticated;
GRANT EXECUTE ON FUNCTION move_order_to_history(UUID) TO authenticated;
