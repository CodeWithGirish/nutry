-- Migration to add 'packed' status to orders table
-- This fixes the constraint that prevents selecting 'packed' status

-- First, drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new constraint with 'packed' included
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'));

-- Verify the constraint was added
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'orders_status_check';
