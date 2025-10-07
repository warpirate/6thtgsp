-- Quarter Master Inventory Management System
-- Fix Workflow Roles Migration
-- Version: 4.0.0
-- This corrects the workflow to match the proper hierarchy:
-- Semi User (Requester) → Admin (Approver) → User (Watchman/Store Keeper)

-- =============================================
-- UPDATE ROLE PERMISSIONS
-- =============================================

-- Update role permissions to reflect correct workflow
UPDATE roles SET 
    description = 'Can create requisitions and receive approved items',
    permissions = '{"create_requisition": true, "view_own_requisitions": true, "receive_items": true}'::jsonb
WHERE name = 'semi_user';

UPDATE roles SET 
    description = 'Store keeper/watchman - can issue items only after admin approval',
    permissions = '{"view_approved_requisitions": true, "issue_items": true, "accept_returns": true, "verify_receipts": true}'::jsonb
WHERE name = 'user';

UPDATE roles SET 
    description = 'Can approve requisitions and manage inventory',
    permissions = '{"approve_requisitions": true, "reject_requisitions": true, "view_all_requisitions": true, "manage_inventory": true, "view_reports": true}'::jsonb
WHERE name = 'admin';

UPDATE roles SET 
    description = 'Full system access including user management',
    permissions = '{"all": true}'::jsonb
WHERE name = 'super_admin';

-- =============================================
-- UPDATE REQUISITION STATUS WORKFLOW
-- =============================================

-- Add new status for when items are ready to be picked up
ALTER TABLE requisitions DROP CONSTRAINT IF EXISTS requisitions_status_check;
ALTER TABLE requisitions ADD CONSTRAINT requisitions_status_check 
    CHECK (status IN ('draft', 'pending', 'approved', 'ready_for_pickup', 'issued', 'completed', 'rejected', 'cancelled'));

-- =============================================
-- UPDATE WORKFLOW VALIDATION FUNCTION
-- =============================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS validate_requisition_transition(VARCHAR, VARCHAR, VARCHAR);

-- Create new function with correct workflow
CREATE OR REPLACE FUNCTION validate_requisition_transition(
    current_status VARCHAR(20),
    new_status VARCHAR(20),
    user_role VARCHAR(50)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Semi users can only create and submit requisitions
    IF user_role = 'semi_user' THEN
        RETURN (
            (current_status = 'draft' AND new_status = 'pending') OR
            (current_status = 'rejected' AND new_status = 'draft')
        );
    END IF;
    
    -- Users (watchmen) can only issue items that are approved by admin
    IF user_role = 'user' THEN
        RETURN (
            (current_status = 'approved' AND new_status = 'ready_for_pickup') OR
            (current_status = 'ready_for_pickup' AND new_status = 'issued')
        );
    END IF;
    
    -- Admins can approve or reject pending requisitions
    IF user_role IN ('admin', 'super_admin') THEN
        RETURN (
            (current_status = 'pending' AND new_status IN ('approved', 'rejected')) OR
            (current_status = 'approved' AND new_status IN ('ready_for_pickup', 'rejected', 'pending')) OR
            (current_status = 'ready_for_pickup' AND new_status IN ('issued', 'approved')) OR
            (current_status = 'issued' AND new_status = 'completed')
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UPDATE RECEIPT WORKFLOW VALIDATION
-- =============================================

-- Update receipt status validation to clarify user role
DROP FUNCTION IF EXISTS validate_status_transition(VARCHAR, VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION validate_status_transition(
    current_status VARCHAR(20),
    new_status VARCHAR(20),
    user_role VARCHAR(50)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Semi users can only submit drafts
    IF user_role = 'semi_user' THEN
        RETURN (current_status = 'draft' AND new_status = 'submitted');
    END IF;
    
    -- Users (watchmen) can verify submitted receipts
    IF user_role = 'user' THEN
        RETURN (
            (current_status = 'draft' AND new_status = 'submitted') OR
            (current_status = 'submitted' AND new_status IN ('verified', 'draft'))
        );
    END IF;
    
    -- Admins can approve verified receipts
    IF user_role IN ('admin', 'super_admin') THEN
        RETURN (
            (current_status = 'draft' AND new_status = 'submitted') OR
            (current_status = 'submitted' AND new_status IN ('verified', 'draft')) OR
            (current_status = 'verified' AND new_status IN ('approved', 'rejected', 'submitted'))
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CREATE HELPER FUNCTIONS FOR NEW WORKFLOW
-- =============================================

-- Function to check if user can issue items (watchman role)
CREATE OR REPLACE FUNCTION can_issue_items(
    requisition_uuid UUID,
    user_uuid UUID
) RETURNS BOOLEAN AS $$
DECLARE
    req_status VARCHAR(20);
    user_role VARCHAR(50);
BEGIN
    -- Get requisition status
    SELECT status INTO req_status FROM requisitions WHERE id = requisition_uuid;
    
    -- Get user role
    SELECT role INTO user_role FROM users WHERE id = user_uuid;
    
    -- User (watchman) can only issue if status is 'approved' or 'ready_for_pickup'
    IF user_role = 'user' THEN
        RETURN req_status IN ('approved', 'ready_for_pickup');
    END IF;
    
    -- Admin and super admin can issue anytime
    IF user_role IN ('admin', 'super_admin') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can approve requisitions (admin only)
CREATE OR REPLACE FUNCTION can_approve_requisition(
    requisition_uuid UUID,
    user_uuid UUID
) RETURNS BOOLEAN AS $$
DECLARE
    req_status VARCHAR(20);
    user_role VARCHAR(50);
BEGIN
    -- Get requisition status
    SELECT status INTO req_status FROM requisitions WHERE id = requisition_uuid;
    
    -- Get user role
    SELECT role INTO user_role FROM users WHERE id = user_uuid;
    
    -- Only admin and super admin can approve
    IF user_role IN ('admin', 'super_admin') THEN
        RETURN req_status = 'pending';
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UPDATE EXISTING DATA TO MATCH NEW WORKFLOW
-- =============================================

-- Update any requisitions that are in 'ready' status to 'approved'
-- (they need admin approval before user can issue)
UPDATE requisitions 
SET status = 'approved' 
WHERE status = 'ready';

-- =============================================
-- ADD AUDIT TRAIL FOR WORKFLOW CHANGES
-- =============================================

-- Create a workflow_actions table to track who did what
CREATE TABLE IF NOT EXISTS workflow_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID REFERENCES requisitions(id) ON DELETE CASCADE,
    receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'created', 'submitted', 'approved', 'rejected', 
        'ready_for_pickup', 'issued', 'completed', 'cancelled',
        'verified', 'returned'
    )),
    performed_by UUID REFERENCES users(id) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comments TEXT,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for workflow_actions
CREATE INDEX idx_workflow_actions_requisition ON workflow_actions(requisition_id);
CREATE INDEX idx_workflow_actions_receipt ON workflow_actions(receipt_id);
CREATE INDEX idx_workflow_actions_performed_by ON workflow_actions(performed_by);
CREATE INDEX idx_workflow_actions_performed_at ON workflow_actions(performed_at);

-- Trigger to log workflow actions
CREATE OR REPLACE FUNCTION log_workflow_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Log requisition status changes
    IF TG_TABLE_NAME = 'requisitions' AND OLD.status != NEW.status THEN
        INSERT INTO workflow_actions (
            requisition_id,
            action_type,
            performed_by,
            previous_status,
            new_status,
            comments
        ) VALUES (
            NEW.id,
            NEW.status,
            auth.uid(),
            OLD.status,
            NEW.status,
            CASE 
                WHEN NEW.status = 'approved' THEN NEW.approval_comments
                WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                ELSE NULL
            END
        );
    END IF;
    
    -- Log receipt status changes
    IF TG_TABLE_NAME = 'receipts' AND OLD.status != NEW.status THEN
        INSERT INTO workflow_actions (
            receipt_id,
            action_type,
            performed_by,
            previous_status,
            new_status
        ) VALUES (
            NEW.id,
            NEW.status,
            auth.uid(),
            OLD.status,
            NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trigger_log_requisition_workflow ON requisitions;
CREATE TRIGGER trigger_log_requisition_workflow
    AFTER UPDATE ON requisitions
    FOR EACH ROW 
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_workflow_action();

DROP TRIGGER IF EXISTS trigger_log_receipt_workflow ON receipts;
CREATE TRIGGER trigger_log_receipt_workflow
    AFTER UPDATE ON receipts
    FOR EACH ROW 
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_workflow_action();

-- =============================================
-- UPDATE VIEWS FOR NEW WORKFLOW
-- =============================================

-- View for pending approvals (Admin only)
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT 
    r.*,
    u.full_name as requester_name,
    u.department as requester_department,
    u.badge_number,
    u.email as requester_email,
    COUNT(ri.id) as item_count,
    SUM(ri.total_price) as total_value
FROM requisitions r
JOIN users u ON r.requester_id = u.id
LEFT JOIN requisition_items ri ON r.id = ri.requisition_id
WHERE r.status = 'pending'
GROUP BY r.id, u.full_name, u.department, u.badge_number, u.email;

-- View for approved requisitions ready for pickup (User/Watchman)
CREATE OR REPLACE VIEW v_ready_for_issue AS
SELECT 
    r.*,
    u.full_name as requester_name,
    u.department as requester_department,
    u.badge_number,
    u.email as requester_email,
    COUNT(ri.id) as item_count,
    SUM(ri.total_price) as total_value,
    a.full_name as approved_by_name,
    r.approved_at
FROM requisitions r
JOIN users u ON r.requester_id = u.id
LEFT JOIN users a ON r.approved_by = a.id
LEFT JOIN requisition_items ri ON r.id = ri.requisition_id
WHERE r.status IN ('approved', 'ready_for_pickup')
GROUP BY r.id, u.full_name, u.department, u.badge_number, u.email, a.full_name, r.approved_at;

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION validate_requisition_transition(VARCHAR, VARCHAR, VARCHAR) IS 
'Validates requisition status transitions based on user role: semi_user (request) → admin (approve) → user (issue)';

COMMENT ON FUNCTION can_issue_items(UUID, UUID) IS 
'Checks if user (watchman) can issue items - only allowed after admin approval';

COMMENT ON FUNCTION can_approve_requisition(UUID, UUID) IS 
'Checks if user can approve requisitions - only admins can approve';

COMMENT ON TABLE workflow_actions IS 
'Audit trail for all workflow actions showing who performed what action when';

COMMENT ON VIEW v_pending_approvals IS 
'Requisitions pending admin approval';

COMMENT ON VIEW v_ready_for_issue IS 
'Approved requisitions ready for user (watchman) to issue';

-- Migration completed successfully
SELECT 'Workflow roles corrected: semi_user (requester) → admin (approver) → user (watchman/issuer)' as result;
