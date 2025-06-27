-- Fix infinite recursion in RLS policies
-- This script removes problematic policies and creates safe ones

-- First, disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can read contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Anyone can create contact messages" ON contact_messages;

-- Create a function to check if user is admin using auth metadata
-- This avoids the circular reference issue
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user has admin role in their JWT claims
  -- This can be set in Supabase auth metadata
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative function that uses a direct query with security definer
-- This bypasses RLS by running with elevated privileges
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Use security definer to bypass RLS for this specific check
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = user_id;
  
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow inserts for authenticated users" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Create policies for orders without recursion
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_user_admin(auth.uid()));

CREATE POLICY "Users can create own orders" ON orders
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow order updates for admins and owners" ON orders
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_user_admin(auth.uid()));

-- For contact messages, enable RLS but with simpler policies
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create contact messages" ON contact_messages
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read contact messages" ON contact_messages
FOR SELECT TO authenticated
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can update contact messages" ON contact_messages
FOR UPDATE TO authenticated
USING (public.is_user_admin(auth.uid()));

-- For product reviews, simple policies
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON product_reviews
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Users can create reviews" ON product_reviews
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews or admins can update any" ON product_reviews
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_user_admin(auth.uid()));

-- Ensure products table has permissive policies for reading
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products" ON products
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage products" ON products
FOR ALL TO authenticated
USING (public.is_user_admin(auth.uid()));

-- Create a more permissive fallback for development
-- You can remove these in production for stricter security

-- Temporary policy to allow admins to read all profiles
-- This uses a different approach to avoid recursion
DO $$
BEGIN
  -- Only create this if no admin exists yet
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
    -- Create a temporary superuser policy for setup
    CREATE POLICY "Temporary setup access" ON profiles
    FOR ALL TO authenticated
    USING (true);
  END IF;
END $$;

-- Function to safely check admin status for the application
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS TABLE(is_admin BOOLEAN, user_role TEXT) AS $$
DECLARE
  current_user_id UUID;
  user_role_value TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'anonymous'::TEXT;
    RETURN;
  END IF;
  
  -- Try to get role from profiles table
  BEGIN
    SELECT role INTO user_role_value 
    FROM profiles 
    WHERE id = current_user_id;
    
    IF user_role_value IS NULL THEN
      user_role_value := 'user';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      user_role_value := 'user';
  END;
  
  RETURN QUERY SELECT (user_role_value = 'admin'), user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
