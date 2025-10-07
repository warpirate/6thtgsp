-- Create Test Users Script for Quarter Master Inventory System
-- Run this after setting up Supabase database and running migrations
-- 
-- This script creates test users in the public.users table (not auth.users)
-- The application uses custom authentication, not Supabase Auth
--
-- VERIFIED CREDENTIALS FOR TESTING:
-- Super Admin: superadmin@quartermaster.dev / SuperAdmin123!
-- Admin:       admin@quartermaster.dev       / Admin123!
-- User:        user@quartermaster.dev        / User123!
-- Semi User:   semi@quartermaster.dev        / SemiUser123!

-- 1. SUPER ADMIN USER
-- Create/Update Super Admin User
INSERT INTO public.users (
    id,
    username,
    password_hash,
    full_name,
    role,
    email,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'superadmin',
    crypt('SuperAdmin123!', gen_salt('bf')),
    'Super Administrator',
    'super_admin',
    'superadmin@quartermaster.dev',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- 2. ADMIN USER
-- Create/Update Admin User  
INSERT INTO public.users (
    id,
    username,
    password_hash,
    full_name,
    role,
    email,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin',
    crypt('Admin123!', gen_salt('bf')),
    'System Administrator',
    'admin',
    'admin@quartermaster.dev',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- 3. USER
-- Create/Update Regular User
INSERT INTO public.users (
    id,
    username,
    password_hash,
    full_name,
    role,
    email,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'user',
    crypt('User123!', gen_salt('bf')),
    'Regular User',
    'user',
    'user@quartermaster.dev',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- 4. SEMI USER  
-- Create/Update Semi User
INSERT INTO public.users (
    id,
    username,
    password_hash,
    full_name,
    role,
    email,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'semi',
    crypt('SemiUser123!', gen_salt('bf')),
    'Semi User',
    'semi_user',
    'semi@quartermaster.dev',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Verify users created successfully
SELECT 
    u.username,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.created_at
FROM public.users u
WHERE u.email IN (
    'superadmin@quartermaster.dev',
    'admin@quartermaster.dev', 
    'user@quartermaster.dev',
    'semi@quartermaster.dev'
)
ORDER BY 
    CASE u.role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2  
        WHEN 'user' THEN 3
        WHEN 'semi_user' THEN 4
    END;

-- Show all users in the system for verification
SELECT 
    username,
    email,
    full_name,
    role,
    is_active,
    'Test User'::text as user_type
FROM public.users u
WHERE u.email LIKE '%quartermaster.dev'
UNION ALL
SELECT 
    username,
    email,
    full_name,
    role,
    is_active,
    'Existing User'::text as user_type
FROM public.users u
WHERE u.email NOT LIKE '%quartermaster.dev'
ORDER BY user_type, role;
