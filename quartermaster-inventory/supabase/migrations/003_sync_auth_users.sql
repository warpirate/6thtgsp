-- Sync Auth Users with Public Users
-- This fixes the UUID mismatch causing login loops

-- Step 1: Create temporary mapping table
CREATE TEMP TABLE IF NOT EXISTS user_id_mapping AS
SELECT 
  pu.id as old_id,
  pu.email,
  pu.username,
  au.id as new_id
FROM public.users pu
LEFT JOIN auth.users au ON LOWER(pu.email) = LOWER(au.email)
WHERE au.id IS NOT NULL;

-- Step 2: Update public.users to use auth.users UUIDs
UPDATE public.users pu
SET id = um.new_id
FROM user_id_mapping um
WHERE pu.id = um.old_id;

-- Step 3: Update all foreign key references

-- Update requisitions
UPDATE requisitions
SET requester_id = um.new_id
FROM user_id_mapping um
WHERE requester_id = um.old_id;

UPDATE requisitions
SET approved_by = um.new_id
FROM user_id_mapping um
WHERE approved_by = um.old_id;

UPDATE requisitions
SET issued_by = um.new_id
FROM user_id_mapping um
WHERE issued_by = um.old_id;

-- Update issuances
UPDATE issuances
SET issued_by = um.new_id
FROM user_id_mapping um
WHERE issued_by = um.old_id;

UPDATE issuances
SET issued_to = um.new_id
FROM user_id_mapping um
WHERE issued_to = um.old_id;

-- Update returns
UPDATE returns
SET returned_by = um.new_id
FROM user_id_mapping um
WHERE returned_by = um.old_id;

UPDATE returns
SET accepted_by = um.new_id
FROM user_id_mapping um
WHERE accepted_by = um.old_id;

-- Update item_allocations
UPDATE item_allocations
SET allocated_to = um.new_id
FROM user_id_mapping um
WHERE allocated_to = um.old_id;

-- Update items_master
UPDATE items_master
SET created_by = um.new_id
FROM user_id_mapping um
WHERE created_by = um.old_id;

-- Update stock_receipts
UPDATE stock_receipts
SET received_by = um.new_id
FROM user_id_mapping um
WHERE received_by = um.old_id;

UPDATE stock_receipts
SET verified_by = um.new_id
FROM user_id_mapping um
WHERE verified_by = um.old_id;

UPDATE stock_receipts
SET approved_by = um.new_id
FROM user_id_mapping um
WHERE approved_by = um.old_id;

-- Update documents
UPDATE documents
SET uploaded_by = um.new_id
FROM user_id_mapping um
WHERE uploaded_by = um.old_id;

-- Update audit_logs
UPDATE audit_logs
SET user_id = um.new_id
FROM user_id_mapping um
WHERE user_id = um.old_id;

-- Update approval_workflow
UPDATE approval_workflow
SET approver_id = um.new_id
FROM user_id_mapping um
WHERE approver_id = um.old_id;

-- Update stock_movements
UPDATE stock_movements
SET performed_by = um.new_id
FROM user_id_mapping um
WHERE performed_by = um.old_id;

SELECT 'Auth users synced successfully. Old IDs mapped to new auth.users IDs.' as result;
