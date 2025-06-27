-- Function to safely decrement product stock for specific weight
CREATE OR REPLACE FUNCTION decrement_product_stock(
  product_id UUID,
  weight_variant TEXT,
  quantity_to_subtract INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_prices JSONB;
  updated_prices JSONB;
  price_item JSONB;
  has_stock BOOLEAN := FALSE;
BEGIN
  -- Get current prices array
  SELECT prices INTO current_prices
  FROM products
  WHERE id = product_id;

  -- If no prices found, product doesn't exist
  IF current_prices IS NULL THEN
    RAISE EXCEPTION 'Product with ID % not found', product_id;
  END IF;

  -- Update the stock for the specific weight
  updated_prices := '[]'::jsonb;

  FOR price_item IN SELECT * FROM jsonb_array_elements(current_prices)
  LOOP
    IF price_item->>'weight' = weight_variant THEN
      -- Update stock for this weight variant, ensuring it doesn't go below 0
      price_item := jsonb_set(
        price_item,
        '{stock_quantity}',
        to_jsonb(GREATEST(0, (price_item->>'stock_quantity')::INTEGER - quantity_to_subtract))
      );
    END IF;

    -- Check if any variant has stock
    IF (price_item->>'stock_quantity')::INTEGER > 0 THEN
      has_stock := TRUE;
    END IF;

    updated_prices := updated_prices || price_item;
  END LOOP;

  -- Update the product with new prices and in_stock status
  UPDATE products
  SET
    prices = updated_prices,
    in_stock = has_stock,
    updated_at = NOW()
  WHERE id = product_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment product stock for specific weight
CREATE OR REPLACE FUNCTION increment_product_stock(
  product_id UUID,
  weight_variant TEXT,
  quantity_to_add INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_prices JSONB;
  updated_prices JSONB;
  price_item JSONB;
  has_stock BOOLEAN := FALSE;
BEGIN
  -- Get current prices array
  SELECT prices INTO current_prices
  FROM products
  WHERE id = product_id;

  -- If no prices found, product doesn't exist
  IF current_prices IS NULL THEN
    RAISE EXCEPTION 'Product with ID % not found', product_id;
  END IF;

  -- Update the stock for the specific weight
  updated_prices := '[]'::jsonb;

  FOR price_item IN SELECT * FROM jsonb_array_elements(current_prices)
  LOOP
    IF price_item->>'weight' = weight_variant THEN
      -- Update stock for this weight variant
      price_item := jsonb_set(
        price_item,
        '{stock_quantity}',
        to_jsonb((price_item->>'stock_quantity')::INTEGER + quantity_to_add)
      );
    END IF;

    -- Check if any variant has stock
    IF (price_item->>'stock_quantity')::INTEGER > 0 THEN
      has_stock := TRUE;
    END IF;

    updated_prices := updated_prices || price_item;
  END LOOP;

  -- Update the product with new prices and in_stock status
  UPDATE products
  SET
    prices = updated_prices,
    in_stock = has_stock,
    updated_at = NOW()
  WHERE id = product_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set exact stock quantity for specific weight (for admin use)
CREATE OR REPLACE FUNCTION set_product_stock(
  product_id UUID,
  weight_variant TEXT,
  new_quantity INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_prices JSONB;
  updated_prices JSONB;
  price_item JSONB;
  has_stock BOOLEAN := FALSE;
BEGIN
  -- Ensure quantity is not negative
  IF new_quantity < 0 THEN
    RAISE EXCEPTION 'Stock quantity cannot be negative';
  END IF;

  -- Get current prices array
  SELECT prices INTO current_prices
  FROM products
  WHERE id = product_id;

  -- If no prices found, product doesn't exist
  IF current_prices IS NULL THEN
    RAISE EXCEPTION 'Product with ID % not found', product_id;
  END IF;

  -- Update the stock for the specific weight
  updated_prices := '[]'::jsonb;

  FOR price_item IN SELECT * FROM jsonb_array_elements(current_prices)
  LOOP
    IF price_item->>'weight' = weight_variant THEN
      -- Set stock for this weight variant
      price_item := jsonb_set(
        price_item,
        '{stock_quantity}',
        to_jsonb(new_quantity)
      );
    END IF;

    -- Check if any variant has stock
    IF (price_item->>'stock_quantity')::INTEGER > 0 THEN
      has_stock := TRUE;
    END IF;

    updated_prices := updated_prices || price_item;
  END LOOP;

  -- Update the product with new prices and in_stock status
  UPDATE products
  SET
    prices = updated_prices,
    in_stock = has_stock,
    updated_at = NOW()
  WHERE id = product_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
