-- Simple Database Setup for NutriVault (No Foreign Key Issues)
-- This script avoids foreign key constraint problems by not pre-inserting demo profiles

-- Clean up any existing problematic setup
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Disable RLS temporarily to avoid issues
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cart DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_reviews DISABLE ROW LEVEL SECURITY;

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table WITHOUT foreign key constraints
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create other essential tables
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  prices JSONB NOT NULL,
  original_price DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  is_organic BOOLEAN DEFAULT FALSE,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_weight TEXT NOT NULL,
  selected_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, selected_weight)
);

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  is_gift BOOLEAN DEFAULT FALSE,
  gift_message TEXT,
  gift_box_price DECIMAL(10,2),
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  weight TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  product_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers for tables that need them
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample products only (no demo profiles to avoid foreign key issues)
INSERT INTO products (name, description, category, image_url, prices, original_price, rating, review_count, in_stock, is_organic, features) VALUES
('Premium California Almonds', 'Raw, unsalted almonds packed with protein and healthy fats. Perfect for snacking or cooking.', 'Nuts', '🌰', '[{"weight": "250g", "price": 24.99}, {"weight": "500g", "price": 45.99}, {"weight": "1kg", "price": 89.99}]', 29.99, 4.8, 245, true, true, '["Raw & Unsalted", "High in Protein", "Rich in Vitamin E"]'),
('Dried Turkish Apricots', 'Sweet and tangy dried apricots, naturally sun-dried to preserve nutrients and flavor.', 'Dried Fruits', '🍑', '[{"weight": "250g", "price": 18.99}, {"weight": "500g", "price": 35.99}, {"weight": "1kg", "price": 69.99}]', 22.99, 4.6, 189, true, false, '["Sun Dried", "No Added Sugar", "High in Fiber"]'),
('Mixed Premium Nuts', 'Carefully selected mix of almonds, walnuts, and cashews for the perfect healthy snack.', 'Mixed Nuts', '🥜', '[{"weight": "250g", "price": 32.99}, {"weight": "500g", "price": 62.99}, {"weight": "1kg", "price": 119.99}]', 39.99, 4.9, 312, true, true, '["Premium Mix", "Energy Boosting", "Omega-3 Rich"]'),
('Medjool Dates', 'Large, soft, and naturally sweet premium dates from the finest palm trees.', 'Dates', '🍯', '[{"weight": "250g", "price": 28.99}, {"weight": "500g", "price": 54.99}, {"weight": "1kg", "price": 105.99}]', null, 4.7, 156, false, true, '["Large Size", "Natural Sweetener", "High Energy"]'),
('Roasted Cashews', 'Lightly salted roasted cashews with a perfect crunch and rich flavor.', 'Nuts', '🥔', '[{"weight": "250g", "price": 26.99}, {"weight": "500g", "price": 51.99}, {"weight": "1kg", "price": 99.99}]', 31.99, 4.5, 203, true, false, '["Lightly Salted", "Perfect Crunch", "Rich Flavor"]'),
('Dried Cranberries', 'Tart and sweet dried cranberries, perfect for baking or trail mix.', 'Dried Fruits', '🍇', '[{"weight": "250g", "price": 16.99}, {"weight": "500g", "price": 31.99}, {"weight": "1kg", "price": 61.99}]', null, 4.4, 178, true, true, '["Antioxidant Rich", "Perfect for Baking", "Low Sugar"]'),
('Pumpkin Seeds', 'Roasted pumpkin seeds with sea salt, rich in magnesium and healthy fats.', 'Seeds', '🌻', '[{"weight": "250g", "price": 19.99}, {"weight": "500g", "price": 37.99}, {"weight": "1kg", "price": 72.99}]', null, 4.6, 134, true, true, '["Sea Salt Roasted", "High in Magnesium", "Healthy Fats"]'),
('Trail Mix Supreme', 'Premium trail mix with nuts, dried fruits, and dark chocolate pieces.', 'Trail Mix', '🥨', '[{"weight": "250g", "price": 29.99}, {"weight": "500g", "price": 56.99}, {"weight": "1kg", "price": 109.99}]', 34.99, 4.8, 267, true, false, '["Premium Mix", "Energy Boost", "Dark Chocolate"]');

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_in_stock ON products(in_stock);

-- Note: Demo profiles will be created automatically by the app when demo accounts are created
-- This avoids foreign key constraint issues

-- Verify the setup
SELECT 'Database setup complete!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
SELECT 'Products available:' as info;
SELECT COUNT(*) as product_count FROM products;
