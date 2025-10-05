# 🔧 Authentication Fix - Login Loop Issue

## 🔴 **Problem Identified**

You're experiencing a login loop because there's a **UUID mismatch** between:
- `auth.users` table (Supabase Auth)
- `public.users` table (Your application users)

When you log in, Supabase Auth creates a session with one UUID, but your app tries to load a profile with a different UUID, causing the profile lookup to fail and forcing you back to login.

## 🎯 **Root Cause**

The system has two separate user tables:
1. **`auth.users`** - Supabase's built-in authentication (UUIDs: `2fb9c7d9-...`, `d69f841b-...`, etc.)
2. **`public.users`** - Your application's user data (UUIDs: `fd6f668e-...`, `c39f8481-...`, etc.)

These UUIDs don't match, so authentication fails.

## ✅ **Solution Options**

### Option 1: Sync UUIDs (Recommended for Production)

Update your `public.users` table to match the `auth.users` UUIDs:

```sql
-- Step 1: Create a mapping of email to auth UUID
CREATE TEMP TABLE user_mapping AS
SELECT 
  pu.id as old_id,
  pu.email,
  au.id as new_id
FROM public.users pu
JOIN auth.users au ON pu.email = au.email;

-- Step 2: Update foreign key constraints to CASCADE
ALTER TABLE requisitions DROP CONSTRAINT IF EXISTS requisitions_requester_id_fkey;
ALTER TABLE requisitions ADD CONSTRAINT requisitions_requester_id_fkey 
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE;

-- Repeat for all tables with user_id foreign keys

-- Step 3: Update all user IDs
UPDATE public.users pu
SET id = um.new_id
FROM user_mapping um
WHERE pu.id = um.old_id;

-- Step 4: Update all foreign key references
UPDATE requisitions r
SET requester_id = um.new_id
FROM user_mapping um
WHERE r.requester_id = um.old_id;

-- Repeat for: approved_by, issued_by, returned_by, accepted_by, created_by, etc.
```

### Option 2: Quick Fix - Create Auth Users (Fastest)

Create matching Supabase Auth users for your existing users:

```sql
-- For each user, you need to:
-- 1. Sign them up via Supabase Auth
-- 2. Update their UUID in public.users

-- Example for 'semi' user:
-- Password: quartermaster123 (change this!)
```

I'll create a script to do this automatically.

### Option 3: Custom Auth (Alternative)

Switch to custom username/password authentication without Supabase Auth.

## 🚀 **Quick Fix Implementation**

Let me create auth users that match your existing users:

