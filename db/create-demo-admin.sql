-- Create demo admin account manually
-- Run this AFTER running the main database setup

-- Insert demo admin profile (you'll need to sign up first with this email)
-- Email: admin@nutrivault.com
-- Password: admin123

-- After signup, run this to make them admin:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@nutrivault.com';

-- Or create the profile manually if needed:
-- INSERT INTO profiles (id, email, full_name, role)
-- VALUES (
--   'your-user-id-here',  -- Replace with actual user ID after signup
--   'admin@nutrivault.com',
--   'Admin User',
--   'admin'
-- ) ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verify the admin account:
SELECT * FROM profiles WHERE email = 'admin@nutrivault.com';
