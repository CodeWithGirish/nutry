-- NutriVault Production Database Setup
-- This script creates a complete, production-ready database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing tables (be careful in production!)
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Disable RLS temporarily
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cart DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users DISABLE ROW LEVEL SECURITY;

-- Create profiles table (for regular users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create separate admin_users table for admin portal
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  prices JSONB NOT NULL, -- [{"weight": "250g", "price": 24.99}]
  original_price DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  is_organic BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  features TEXT[] DEFAULT '{}',
  nutritional_info JSONB,
  origin_country TEXT,
  shelf_life TEXT,
  storage_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart table
CREATE TABLE cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_weight TEXT NOT NULL,
  selected_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, selected_weight)
);

-- Create wishlist table
CREATE TABLE wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'cod', 'upi')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  is_gift BOOLEAN DEFAULT FALSE,
  gift_message TEXT,
  gift_box_price DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tracking_number TEXT,
  estimated_delivery DATE,
  delivery_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  weight TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_reviews table
CREATE TABLE product_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id, order_id)
);

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'NV' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number = generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Insert mock admin users for testing
INSERT INTO admin_users (email, full_name, role) VALUES
('admin@nutrivault.com', 'Admin User', 'admin'),
('superadmin@nutrivault.com', 'Super Admin', 'super_admin')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Insert sample products with INR pricing
INSERT INTO products (name, description, category, image_url, prices, original_price, rating, review_count, in_stock, stock_quantity, is_organic, is_featured, features, origin_country, shelf_life, storage_instructions) VALUES
('Premium California Almonds', 'Raw, unsalted almonds packed with protein and healthy fats. Perfect for snacking or cooking.', 'Nuts', '🌰', '[{"weight": "250g", "price": 899}, {"weight": "500g", "price": 1699}, {"weight": "1kg", "price": 3199}]', 999, 4.8, 245, true, 100, true, true, '["Raw & Unsalted", "High in Protein", "Rich in Vitamin E", "Heart Healthy"]', 'USA', '12 months', 'Store in a cool, dry place'),

('Dried Turkish Apricots', 'Sweet and tangy dried apricots, naturally sun-dried to preserve nutrients and flavor.', 'Dried Fruits', '🍑', '[{"weight": "250g", "price": 699}, {"weight": "500g", "price": 1299}, {"weight": "1kg", "price": 2399}]', 799, 4.6, 189, true, 80, false, true, '["Sun Dried", "No Added Sugar", "High in Fiber", "Rich in Iron"]', 'Turkey', '18 months', 'Keep in airtight container'),

('Mixed Premium Nuts', 'Carefully selected mix of almonds, walnuts, and cashews for the perfect healthy snack.', 'Mixed Nuts', '🥜', '[{"weight": "250g", "price": 1199}, {"weight": "500g", "price": 2299}, {"weight": "1kg", "price": 4399}]', 1399, 4.9, 312, true, 50, true, true, '["Premium Mix", "Energy Boosting", "Omega-3 Rich", "Protein Power"]', 'India', '8 months', 'Refrigerate after opening'),

('Medjool Dates', 'Large, soft, and naturally sweet premium dates from the finest palm trees.', 'Dates', '🍯', '[{"weight": "250g", "price": 999}, {"weight": "500g", "price": 1899}, {"weight": "1kg", "price": 3599}]', null, 4.7, 156, false, 0, true, false, '["Large Size", "Natural Sweetener", "High Energy", "No Preservatives"]', 'Saudi Arabia', '24 months', 'Store in cool place'),

('Roasted Cashews', 'Lightly salted roasted cashews with a perfect crunch and rich flavor.', 'Nuts', '🥔', '[{"weight": "250g", "price": 999}, {"weight": "500g", "price": 1899}, {"weight": "1kg", "price": 3699}]', 1199, 4.5, 203, true, 75, false, false, '["Lightly Salted", "Perfect Crunch", "Rich Flavor", "Premium Quality"]', 'Vietnam', '10 months', 'Store in airtight container'),

('Dried Cranberries', 'Tart and sweet dried cranberries, perfect for baking or trail mix.', 'Dried Fruits', '🍇', '[{"weight": "250g", "price": 599}, {"weight": "500g", "price": 1099}, {"weight": "1kg", "price": 2099}]', null, 4.4, 178, true, 120, true, false, '["Antioxidant Rich", "Perfect for Baking", "Low Sugar", "Natural"]', 'Canada', '15 months', 'Keep dry and cool'),

('Pumpkin Seeds', 'Roasted pumpkin seeds with sea salt, rich in magnesium and healthy fats.', 'Seeds', '🌻', '[{"weight": "250g", "price": 699}, {"weight": "500g", "price": 1299}, {"weight": "1kg", "price": 2499}]', null, 4.6, 134, true, 90, true, false, '["Sea Salt Roasted", "High in Magnesium", "Healthy Fats", "Zinc Rich"]', 'India', '12 months', 'Store in dry place'),

('Trail Mix Supreme', 'Premium trail mix with nuts, dried fruits, and dark chocolate pieces.', 'Trail Mix', '🥨', '[{"weight": "250g", "price": 1099}, {"weight": "500g", "price": 2099}, {"weight": "1kg", "price": 3999}]', 1299, 4.8, 267, true, 60, false, true, '["Premium Mix", "Energy Boost", "Dark Chocolate", "Adventure Ready"]', 'Mixed', '6 months', 'Cool and dry storage'),

('Organic Walnuts', 'Premium organic walnuts, perfect for brain health and omega-3 fatty acids.', 'Nuts', '🌰', '[{"weight": "250g", "price": 1299}, {"weight": "500g", "price": 2499}, {"weight": "1kg", "price": 4799}]', 1499, 4.7, 198, true, 45, true, true, '["Organic Certified", "Brain Food", "Omega-3 Rich", "Heart Healthy"]', 'Chile', '10 months', 'Refrigerate for freshness'),

('Dried Mango Strips', 'Sweet and chewy dried mango strips with no added sugar.', 'Dried Fruits', '🥭', '[{"weight": "250g", "price": 799}, {"weight": "500g", "price": 1499}, {"weight": "1kg", "price": 2899}]', null, 4.3, 156, true, 85, true, false, '["No Added Sugar", "Vitamin C Rich", "Natural Sweetness", "Chewy Texture"]', 'India', '12 months', 'Store in cool place');

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_in_stock ON products(in_stock);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Insert some sample orders for testing
INSERT INTO orders (user_id, status, payment_method, payment_status, total_amount, shipping_address) VALUES
('00000000-0000-0000-0000-000000000001', 'delivered', 'stripe', 'paid', 2599.00, '{"name": "John Doe", "phone": "+91 9876543210", "address": "123 Main St", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}'),
('00000000-0000-0000-0000-000000000002', 'shipped', 'cod', 'pending', 1899.00, '{"name": "Jane Smith", "phone": "+91 9876543211", "address": "456 Park Ave", "city": "Delhi", "state": "Delhi", "pincode": "110001"}'),
('00000000-0000-0000-0000-000000000001', 'processing', 'upi', 'paid', 3199.00, '{"name": "John Doe", "phone": "+91 9876543210", "address": "123 Main St", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}');

-- Insert sample reviews
INSERT INTO product_reviews (product_id, user_id, rating, title, comment, verified_purchase)
SELECT
  p.id,
  '00000000-0000-0000-0000-000000000001',
  5,
  'Excellent quality!',
  'Really fresh and tasty. Will definitely order again. Fast delivery and great packaging.',
  true
FROM products p
WHERE p.name = 'Premium California Almonds'
LIMIT 1;

INSERT INTO product_reviews (product_id, user_id, rating, title, comment, verified_purchase)
SELECT
  p.id,
  '00000000-0000-0000-0000-000000000002',
  4,
  'Good value for money',
  'Quality is good but could be better. Overall satisfied with the purchase.',
  true
FROM products p
WHERE p.name = 'Trail Mix Supreme'
LIMIT 1;

-- Final verification
SELECT 'Database setup completed successfully!' as status;
SELECT 'Products created:' as info, COUNT(*) as count FROM products;
SELECT 'Admin users created:' as info, COUNT(*) as count FROM admin_users;
SELECT 'Sample orders created:' as info, COUNT(*) as count FROM orders;
SELECT 'Sample reviews created:' as info, COUNT(*) as count FROM product_reviews;
