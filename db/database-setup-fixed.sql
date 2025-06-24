-- Enhanced Database Schema for NutriVault eCommerce with Email & Reviews
-- Run this SQL in your Supabase SQL Editor

-- First, let's make sure we can create profiles manually if the trigger fails
-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom user profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table with enhanced features
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  prices JSONB NOT NULL, -- Array of {weight, price} objects
  original_price DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  is_organic BOOLEAN DEFAULT FALSE,
  features TEXT[] DEFAULT '{}',
  nutrition_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_weight TEXT NOT NULL,
  selected_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, selected_weight)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'cod')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  is_gift BOOLEAN DEFAULT FALSE,
  gift_message TEXT,
  gift_box_price DECIMAL(10,2),
  tracking_number TEXT,
  estimated_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  weight TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  product_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('restock', 'new_product', 'order_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('order_confirmation', 'order_shipped', 'order_delivered')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, metric_type)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Product reviews policies
CREATE POLICY "Anyone can view reviews" ON product_reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Cart policies
CREATE POLICY "Users can view own cart" ON cart
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart" ON cart
  FOR ALL USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Wishlist policies
CREATE POLICY "Users can manage own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Email notifications policies (admin only)
CREATE POLICY "Admins can manage email notifications" ON email_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Analytics policies (admin only)
CREATE POLICY "Admins can view analytics" ON analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert analytics" ON analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions and triggers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update product rating when reviews are added/updated
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET 
    rating = (
      SELECT COALESCE(AVG(rating::DECIMAL), 0) 
      FROM product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for product rating updates
DROP TRIGGER IF EXISTS update_product_rating_on_review ON product_reviews;
CREATE TRIGGER update_product_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON product_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample products with enhanced data
INSERT INTO products (name, description, category, image_url, prices, original_price, rating, review_count, in_stock, is_organic, features) VALUES
('Premium California Almonds', 'Raw, unsalted almonds packed with protein and healthy fats. Perfect for snacking or cooking. Sourced from the finest California orchards.', 'Nuts', '🌰', '[{"weight": "250g", "price": 24.99}, {"weight": "500g", "price": 45.99}, {"weight": "1kg", "price": 89.99}]', 29.99, 4.8, 245, true, true, '["Raw & Unsalted", "High in Protein", "Rich in Vitamin E", "Heart Healthy", "Organic Certified"]'),
('Dried Turkish Apricots', 'Sweet and tangy dried apricots, naturally sun-dried to preserve nutrients and flavor. No added sugars or preservatives.', 'Dried Fruits', '🍑', '[{"weight": "250g", "price": 18.99}, {"weight": "500g", "price": 35.99}, {"weight": "1kg", "price": 69.99}]', 22.99, 4.6, 189, true, false, '["Sun Dried", "No Added Sugar", "High in Fiber", "Rich in Vitamin A", "Natural Sweetness"]'),
('Mixed Premium Nuts', 'Carefully selected mix of almonds, walnuts, and cashews for the perfect healthy snack. Ideal for energy boost.', 'Mixed Nuts', '🥜', '[{"weight": "250g", "price": 32.99}, {"weight": "500g", "price": 62.99}, {"weight": "1kg", "price": 119.99}]', 39.99, 4.9, 312, true, true, '["Premium Mix", "Energy Boosting", "Omega-3 Rich", "Antioxidants", "Organic Certified"]'),
('Medjool Dates', 'Large, soft, and naturally sweet premium dates from the finest palm trees. Natural energy source.', 'Dates', '🍯', '[{"weight": "250g", "price": 28.99}, {"weight": "500g", "price": 54.99}, {"weight": "1kg", "price": 105.99}]', null, 4.7, 156, false, true, '["Large Size", "Natural Sweetener", "High Energy", "Rich in Potassium", "Organic Certified"]'),
('Roasted Cashews', 'Lightly salted roasted cashews with a perfect crunch and rich flavor. Great for snacking.', 'Nuts', '🥔', '[{"weight": "250g", "price": 26.99}, {"weight": "500g", "price": 51.99}, {"weight": "1kg", "price": 99.99}]', 31.99, 4.5, 203, true, false, '["Lightly Salted", "Perfect Crunch", "Rich Flavor", "High in Magnesium", "Roasted Fresh"]'),
('Dried Cranberries', 'Tart and sweet dried cranberries, perfect for baking or trail mix. Rich in antioxidants.', 'Dried Fruits', '🍇', '[{"weight": "250g", "price": 16.99}, {"weight": "500g", "price": 31.99}, {"weight": "1kg", "price": 61.99}]', null, 4.4, 178, true, true, '["Antioxidant Rich", "Perfect for Baking", "Low Sugar", "Organic Certified", "Tart & Sweet"]'),
('Pumpkin Seeds', 'Roasted pumpkin seeds with sea salt, rich in magnesium and healthy fats. Crunchy and nutritious.', 'Seeds', '🌻', '[{"weight": "250g", "price": 19.99}, {"weight": "500g", "price": 37.99}, {"weight": "1kg", "price": 72.99}]', null, 4.6, 134, true, true, '["Sea Salt Roasted", "High in Magnesium", "Healthy Fats", "Crunchy Texture", "Organic Certified"]'),
('Trail Mix Supreme', 'Premium trail mix with nuts, dried fruits, and dark chocolate pieces. Perfect energy snack.', 'Trail Mix', '🥨', '[{"weight": "250g", "price": 29.99}, {"weight": "500g", "price": 56.99}, {"weight": "1kg", "price": 109.99}]', 34.99, 4.8, 267, true, false, '["Premium Mix", "Energy Boost", "Dark Chocolate", "Perfect Balance", "Hiking Favorite"]')
ON CONFLICT (id) DO NOTHING;

-- Insert sample reviews
INSERT INTO product_reviews (product_id, user_id, rating, title, comment) 
SELECT 
  p.id,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  5,
  'Excellent Quality!',
  'These are absolutely delicious and fresh. Will definitely order again!'
FROM products p
WHERE p.name = 'Premium California Almonds'
ON CONFLICT (product_id, user_id) DO NOTHING;

-- Create an admin user (you'll need to update this with your actual admin email after signup)
-- First register normally, then run this to make them admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';

-- Create analytics sample data
INSERT INTO analytics (date, metric_type, metric_value) VALUES
(CURRENT_DATE - INTERVAL '7 days', 'daily_revenue', 1250.50),
(CURRENT_DATE - INTERVAL '6 days', 'daily_revenue', 980.25),
(CURRENT_DATE - INTERVAL '5 days', 'daily_revenue', 1450.75),
(CURRENT_DATE - INTERVAL '4 days', 'daily_revenue', 1120.00),
(CURRENT_DATE - INTERVAL '3 days', 'daily_revenue', 1680.30),
(CURRENT_DATE - INTERVAL '2 days', 'daily_revenue', 2100.45),
(CURRENT_DATE - INTERVAL '1 day', 'daily_revenue', 1890.60),
(CURRENT_DATE, 'daily_revenue', 950.25)
ON CONFLICT (date, metric_type) DO NOTHING;
