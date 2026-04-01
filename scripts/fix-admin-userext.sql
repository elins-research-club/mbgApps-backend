-- ============================================
-- FIX: Create Userext record for admin user
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check what user ID exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@test.com';

-- Step 2: Check if Userext record exists
SELECT * FROM "public"."Userext" 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');

-- Step 3: Create or update Userext record with is_super_admin = true
INSERT INTO "public"."Userext" (id, full_name, role, is_super_admin, created_at, updated_at)
SELECT 
  u.id,                                    -- Use the ACTUAL auth user ID
  COALESCE(e.full_name, 'Super Admin') as full_name,
  COALESCE(e.role, 'SuperAdmin') as role,
  true as is_super_admin,                  -- ← THIS IS THE KEY!
  COALESCE(e.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN "public"."Userext" e ON u.id = e.id
WHERE u.email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(e.full_name, 'Super Admin'),
  role = COALESCE(e.role, 'SuperAdmin'),
  is_super_admin = true,
  updated_at = NOW();

-- Step 4: Verify it was created/updated
SELECT 
  e.id,
  e.full_name,
  e.role,
  e.is_super_admin,
  e.created_at,
  e.updated_at,
  u.email
FROM "public"."Userext" e
JOIN auth.users u ON e.id = u.id
WHERE u.email = 'admin@test.com';

-- Step 5: Also create organization for the admin user (if not exists)
INSERT INTO "public"."Organizations" (id, name, description, owner_id, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Admin Organization',
  'System administrator organization',
  u.id,
  'active',  -- Admin org is always active
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'admin@test.com'
AND NOT EXISTS (
  SELECT 1 FROM "public"."Organizations" o WHERE o.owner_id = u.id
);

-- Step 6: Create membership linking admin to organization
INSERT INTO "public"."Membership" (org_id, user_id, status, invite_method, created_at)
SELECT 
  o.id,
  u.id,
  'active',
  'owner',
  NOW()
FROM auth.users u
JOIN "public"."Organizations" o ON o.owner_id = u.id
WHERE u.email = 'admin@test.com'
AND NOT EXISTS (
  SELECT 1 FROM "public"."Membership" m WHERE m.user_id = u.id AND m.org_id = o.id
);

-- Final verification - should show is_super_admin = true
SELECT 
  'Userext' as table_name,
  e.id,
  e.full_name,
  e.role,
  e.is_super_admin,
  u.email
FROM "public"."Userext" e
JOIN auth.users u ON e.id = u.id
WHERE u.email = 'admin@test.com'

UNION ALL

SELECT 
  'Organizations' as table_name,
  o.id,
  o.name as full_name,
  null as role,
  null as is_super_admin,
  u.email
FROM "public"."Organizations" o
JOIN auth.users u ON o.owner_id = u.id
WHERE u.email = 'admin@test.com';
