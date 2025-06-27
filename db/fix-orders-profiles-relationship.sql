-- Fix the relationship between orders and profiles tables
-- Run this SQL in your Supabase SQL editor to enable proper joins

-- First, ensure the profiles table exists and has the correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the orders table has the user_id column as UUID
-- If it doesn't exist or has wrong type, this will help fix it
DO $$
BEGIN
  -- Check if user_id column exists and has correct type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'user_id' 
    AND data_type = 'uuid'
  ) THEN
    -- Add or modify user_id column
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID;
    
    -- If the column exists but wrong type, you may need to recreate it
    -- This is a safe approach that won't lose data
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'user_id' 
      AND data_type != 'uuid'
    ) THEN
      -- Create a new column with correct type
      ALTER TABLE orders ADD COLUMN user_id_new UUID;
      -- You'll need to manually migrate data here if needed
      -- UPDATE orders SET user_id_new = user_id::uuid WHERE user_id IS NOT NULL;
      -- Then drop old column and rename new one
      -- ALTER TABLE orders DROP COLUMN user_id;
      -- ALTER TABLE orders RENAME COLUMN user_id_new TO user_id;
    END IF;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_user_id_fkey' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Enable Row Level Security on both tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders" ON orders
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Insert/update trigger for profiles to sync with auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample data for testing (optional)
-- Insert a test profile if it doesn't exist
INSERT INTO profiles (id, full_name, email, role) 
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Admin',
  'admin@test.com',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- Insert a test user profile if it doesn't exist
INSERT INTO profiles (id, full_name, email, role) 
SELECT 
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Test User',
  'user@test.com',
  'user'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000002'::uuid
);
