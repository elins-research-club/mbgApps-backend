-- ============================================
-- SET SUPER ADMIN - Complete SQL Script
-- ============================================
-- Run this in Supabase SQL Editor after creating your user
-- ============================================

-- STEP 1: Find your user ID by email
-- Run this first to get your User ID
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'admin@test.com';

-- Copy the 'id' value from the result (UUID format)

-- STEP 2: Update or create Userext record with SuperAdmin role
-- Replace 'YOUR_USER_ID_HERE' with the ID from step 1
INSERT INTO "public"."Userext" (id, full_name, role, created_at, updated_at)
VALUES (
  'YOUR_USER_ID_HERE',  -- ← Replace with actual User ID
  'Super Admin',        -- Full name
  'SuperAdmin',         -- Role (this makes them admin!)
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Super Admin',
  role = 'SuperAdmin';

-- ============================================
-- ALTERNATIVE: One-liner (if user exists)
-- ============================================
-- This automatically finds user by email and sets SuperAdmin role

INSERT INTO "public"."Userext" (id, full_name, role, created_at, updated_at)
SELECT 
  id,
  'Super Admin',
  'SuperAdmin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Super Admin',
  role = 'SuperAdmin';

-- ============================================
-- VERIFY: Check if SuperAdmin was set correctly
-- ============================================
SELECT 
  u.id,
  u.email,
  e.full_name,
  e.role,
  e.created_at
FROM auth.users u
LEFT JOIN "public"."Userext" e ON u.id = e.id
WHERE u.email = 'admin@test.com';

-- ============================================
-- LIST: All SuperAdmins in the system
-- ============================================
SELECT 
  e.id,
  e.full_name,
  e.role,
  u.email
FROM "public"."Userext" e
LEFT JOIN auth.users u ON e.id = u.id
WHERE e.role = 'SuperAdmin'
ORDER BY e.created_at DESC;

-- ============================================
-- FIX: If you need to change role later
-- ============================================
-- Make user SuperAdmin:
-- UPDATE "public"."Userext" SET role = 'SuperAdmin' WHERE id = 'YOUR_USER_ID';

-- Remove SuperAdmin (make regular user):
-- UPDATE "public"."Userext" SET role = 'User' WHERE id = 'YOUR_USER_ID';

-- Delete Userext record (user can still login, just no role):
-- DELETE FROM "public"."Userext" WHERE id = 'YOUR_USER_ID';
