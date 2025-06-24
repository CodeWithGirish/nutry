# Authentication Fix Instructions

## The Issue

The demo accounts (user@nutrivault.com and admin@nutrivault.com) don't exist in the Supabase authentication system, causing "Invalid login credentials" errors.

## Solution

### Step 1: Run the Database Setup

In your Supabase dashboard, go to the SQL Editor and run the `database-simple-fix.sql` script:

1. Open Supabase Dashboard
2. Go to "SQL Editor"
3. Copy and paste the contents of `database-simple-fix.sql`
4. Click "Run"

This will:

- Clean up any problematic database setup
- Create proper table structure WITHOUT foreign key constraints that cause issues
- Set up sample products
- Prepare the database for demo account creation (profiles will be created by the app)

### Step 2: Use the Application

After running the database script:

1. Go to the Login page
2. Click "Create Demo Accounts & Sign In" button
3. This will:
   - Create authentication entries for demo accounts in Supabase
   - Link them to the profiles in the database
   - Sign you in automatically

### Step 3: Manual Demo Account Creation (Alternative)

If the automatic creation doesn't work:

1. Go to Sign Up page
2. Click "Create Demo" button in the Quick Start section
3. This will create both demo accounts
4. Then go to Login page and use the demo account buttons

### Demo Account Credentials

After setup:

- **User Account**: user@nutrivault.com / user123
- **Admin Account**: admin@nutrivault.com / admin123

## What Was Fixed

### AuthContext.tsx

- Improved demo account creation logic
- Better error handling and fallback profiles
- More robust profile creation process
- Added upsert operations to handle existing accounts

### Login.tsx

- Added "Create Demo Accounts & Sign In" button for one-click setup
- Better error messages and troubleshooting guidance
- Clearer demo account access options
- Improved user experience for testing

### SignUp.tsx

- Simplified demo account creation process
- Better error handling (most "errors" are just accounts already existing)
- Clearer success messaging

### Database Setup

- Removed problematic triggers that were causing "Database error saving new user"
- Simplified table structure without complex RLS policies
- Added proper indexes and constraints
- Ensured demo profiles exist in database

## Testing the Fix

1. **Run database-working-fix.sql** in Supabase
2. **Clear browser data** (localStorage/cookies) to start fresh
3. **Go to Login page** and click "Create Demo Accounts & Sign In"
4. **Verify login works** and you can access admin/user features
5. **Test signup** with new accounts to ensure it works

This should resolve all authentication issues and provide a smooth demo experience.
