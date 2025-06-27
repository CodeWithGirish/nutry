-- Function to safely decrement product stock
CREATE OR REPLACE FUNCTION decrement_product_stock(
  product_id UUID,
  quantity_to_subtract INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update stock quantity, ensuring it doesn't go below 0
  UPDATE products 
  SET 
    stock_quantity = GREATEST(0, stock_quantity - quantity_to_subtract),
    updated_at = NOW()
  WHERE id = product_id;
  
  -- Update in_stock status based on remaining quantity
  UPDATE products 
  SET in_stock = (stock_quantity > 0)
  WHERE id = product_id;
  
  -- If no rows were affected, the product doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with ID % not found', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment product stock (for admin stock management)
CREATE OR REPLACE FUNCTION increment_product_stock(
  product_id UUID,
  quantity_to_add INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update stock quantity
  UPDATE products 
  SET 
    stock_quantity = stock_quantity + quantity_to_add,
    updated_at = NOW()
  WHERE id = product_id;
  
  -- Update in_stock status based on new quantity
  UPDATE products 
  SET in_stock = (stock_quantity > 0)
  WHERE id = product_id;
  
  -- If no rows were affected, the product doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with ID % not found', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set exact stock quantity (for admin use)
CREATE OR REPLACE FUNCTION set_product_stock(
  product_id UUID,
  new_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Ensure quantity is not negative
  IF new_quantity < 0 THEN
    RAISE EXCEPTION 'Stock quantity cannot be negative';
  END IF;

  -- Update stock quantity
  UPDATE products 
  SET 
    stock_quantity = new_quantity,
    in_stock = (new_quantity > 0),
    updated_at = NOW()
  WHERE id = product_id;
  
  -- If no rows were affected, the product doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with ID % not found', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
