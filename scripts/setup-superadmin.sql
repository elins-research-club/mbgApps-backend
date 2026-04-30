-- ============================================
-- CREATE SUPER ADMIN - Complete Setup
-- ============================================
-- Run this in Supabase SQL Editor to create a super admin
-- ============================================

-- STEP 1: Create a user in Supabase Auth first
-- Go to: Authentication > Users > Add user
-- Create: admin@test.com / admin123
-- Copy the User ID that appears

-- STEP 2: Insert or update Userext with super admin privileges
-- This will automatically find the user by email and set is_super_admin = true

INSERT INTO "public"."Userext" (id, full_name, role, is_super_admin, created_at, updated_at)
SELECT 
  u.id,                                    -- Use actual auth user ID
  'Super Admin' as full_name,
  'SuperAdmin' as role,
  true as is_super_admin,                  -- THIS IS THE KEY FLAG!
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Super Admin',
  role = 'SuperAdmin',
  is_super_admin = true;

-- STEP 3: Verify the super admin was created
SELECT 
  e.id,
  e.full_name,
  e.role,
  e.is_super_admin,
  u.email
FROM "public"."Userext" e
JOIN auth.users u ON e.id = u.id
WHERE e.is_super_admin = true;

-- STEP 4: Quick test - check if admin can be found
SELECT 
  u.id,
  u.email,
  e.full_name,
  e.is_super_admin
FROM auth.users u
LEFT JOIN "public"."Userext" e ON u.id = e.id
WHERE u.email = 'admin@test.com';

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If is_super_admin is still false after running above:
UPDATE "public"."Userext"
SET is_super_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);

-- Check what's in Userext table
SELECT * FROM "public"."Userext" ORDER BY created_at DESC LIMIT 5;

-- Check RLS policies (should allow reading own profile)
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'Userext';
