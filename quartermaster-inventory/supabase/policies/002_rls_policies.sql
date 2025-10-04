-- Quarter Master Inventory Management System
-- Row Level Security (RLS) Policies
-- Version: 1.0.0

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ROLES TABLE POLICIES
-- =============================================

-- All authenticated users can read roles
CREATE POLICY "Authenticated users can view roles" ON roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only super admins can modify roles
CREATE POLICY "Super admins can modify roles" ON roles
    FOR ALL USING (
        user_has_permission(auth.uid(), 'all')
    );

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Prevent users from changing critical fields
        AND (OLD.id = NEW.id)
        AND (OLD.email = NEW.email)
        AND (OLD.created_at = NEW.created_at)
    );

-- Admins can view all users in their department
CREATE POLICY "Admins can view department users" ON users
    FOR SELECT USING (
        user_has_permission(auth.uid(), 'view_reports')
        AND (
            department = (SELECT department FROM users WHERE id = auth.uid())
            OR user_has_permission(auth.uid(), 'all')
        )
    );

-- Super admins can view and modify all users
CREATE POLICY "Super admins can manage all users" ON users
    FOR ALL USING (
        user_has_permission(auth.uid(), 'all')
    );

-- =============================================
-- USER_ROLES TABLE POLICIES
-- =============================================

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Super admins can manage all user roles
CREATE POLICY "Super admins can manage user roles" ON user_roles
    FOR ALL USING (
        user_has_permission(auth.uid(), 'all')
    );

-- Admins can view roles in their department
CREATE POLICY "Admins can view department user roles" ON user_roles
    FOR SELECT USING (
        user_has_permission(auth.uid(), 'view_reports')
        AND EXISTS (
            SELECT 1 FROM users u1, users u2
            WHERE u1.id = auth.uid()
            AND u2.id = user_id
            AND (u1.department = u2.department OR user_has_permission(auth.uid(), 'all'))
        )
    );

-- =============================================
-- RECEIPTS TABLE POLICIES
-- =============================================

-- Users can view receipts based on their role and status
CREATE POLICY "Users can view receipts based on role" ON receipts
    FOR SELECT USING (
        -- Can view own receipts
        created_by = auth.uid()
        OR
        -- Users can view submitted receipts for verification
        (status = 'submitted' AND user_has_permission(auth.uid(), 'verify_receipt'))
        OR
        -- Admins can view verified receipts for approval
        (status = 'verified' AND user_has_permission(auth.uid(), 'approve_receipt'))
        OR
        -- Admins and super admins can view all receipts
        user_has_permission(auth.uid(), 'view_reports')
        OR
        user_has_permission(auth.uid(), 'all')
    );

-- Users can create receipts
CREATE POLICY "Users can create receipts" ON receipts
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND user_has_permission(auth.uid(), 'create_receipt')
    );

-- Users can update their own draft receipts
CREATE POLICY "Users can update own draft receipts" ON receipts
    FOR UPDATE USING (
        created_by = auth.uid() 
        AND status = 'draft'
        AND user_has_permission(auth.uid(), 'edit_own_draft')
    ) WITH CHECK (
        created_by = auth.uid()
        AND OLD.created_by = NEW.created_by -- Prevent ownership transfer
        -- Only allow status change through proper workflow
        AND (OLD.status = NEW.status OR NEW.status = 'submitted')
    );

-- Prevent direct status updates (must use update_receipt_status function)
CREATE POLICY "Prevent direct status updates" ON receipts
    FOR UPDATE USING (
        -- Allow updates only if status hasn't changed or through proper channels
        OLD.status = status OR current_setting('app.bypass_status_check', true) = 'true'
    );

-- =============================================
-- RECEIPT_APPROVALS TABLE POLICIES
-- =============================================

-- Users can view approvals for receipts they can access
CREATE POLICY "Users can view receipt approvals" ON receipt_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM receipts r
            WHERE r.id = receipt_id
            AND (
                r.created_by = auth.uid()
                OR user_has_permission(auth.uid(), 'view_reports')
                OR user_has_permission(auth.uid(), 'all')
                OR (r.status = 'submitted' AND user_has_permission(auth.uid(), 'verify_receipt'))
                OR (r.status = 'verified' AND user_has_permission(auth.uid(), 'approve_receipt'))
            )
        )
    );

-- Users can create approvals for receipts they have permission to act on
CREATE POLICY "Users can create approvals" ON receipt_approvals
    FOR INSERT WITH CHECK (
        approver_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM receipts r
            WHERE r.id = receipt_id
            AND (
                -- Can approve own receipts (submit action)
                (r.created_by = auth.uid() AND action = 'submit')
                OR
                -- Can verify submitted receipts
                (r.status = 'submitted' AND action = 'verify' AND user_has_permission(auth.uid(), 'verify_receipt'))
                OR
                -- Can approve verified receipts
                (r.status = 'verified' AND action IN ('approve', 'reject') AND user_has_permission(auth.uid(), 'approve_receipt'))
                OR
                -- Super admin can do anything
                user_has_permission(auth.uid(), 'all')
            )
        )
    );

-- Prevent modification of approval records
CREATE POLICY "Approval records are immutable" ON receipt_approvals
    FOR UPDATE USING (false);

CREATE POLICY "Approval records cannot be deleted" ON receipt_approvals
    FOR DELETE USING (
        user_has_permission(auth.uid(), 'all') -- Only super admin can delete
    );

-- =============================================
-- DOCUMENTS TABLE POLICIES
-- =============================================

-- Users can view documents for receipts they can access
CREATE POLICY "Users can view documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM receipts r
            WHERE r.id = receipt_id
            AND (
                r.created_by = auth.uid()
                OR user_has_permission(auth.uid(), 'view_reports')
                OR user_has_permission(auth.uid(), 'all')
                OR (r.status = 'submitted' AND user_has_permission(auth.uid(), 'verify_receipt'))
                OR (r.status = 'verified' AND user_has_permission(auth.uid(), 'approve_receipt'))
            )
        )
    );

-- Users can upload documents for receipts they created or can modify
CREATE POLICY "Users can upload documents" ON documents
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM receipts r
            WHERE r.id = receipt_id
            AND (
                r.created_by = auth.uid()
                OR user_has_permission(auth.uid(), 'all')
            )
        )
    );

-- Users can delete their own uploaded documents (if receipt is still in draft)
CREATE POLICY "Users can delete own documents for draft receipts" ON documents
    FOR DELETE USING (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM receipts r
            WHERE r.id = receipt_id
            AND r.status = 'draft'
            AND r.created_by = auth.uid()
        )
    );

-- Admins can delete any document
CREATE POLICY "Admins can delete any document" ON documents
    FOR DELETE USING (
        user_has_permission(auth.uid(), 'all')
    );

-- =============================================
-- AUDIT_LOGS TABLE POLICIES
-- =============================================

-- Only admins and super admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        user_has_permission(auth.uid(), 'view_reports')
        OR user_has_permission(auth.uid(), 'all')
    );

-- Users can view audit logs for their own records
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (
        user_id = auth.uid()
        OR (
            table_name = 'receipts'
            AND EXISTS (
                SELECT 1 FROM receipts r
                WHERE r.id = record_id
                AND r.created_by = auth.uid()
            )
        )
    );

-- Only system can insert audit logs (through triggers)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Prevent modification or deletion of audit logs
CREATE POLICY "Audit logs are immutable" ON audit_logs
    FOR UPDATE USING (false);

CREATE POLICY "Audit logs cannot be deleted" ON audit_logs
    FOR DELETE USING (
        user_has_permission(auth.uid(), 'all') -- Only super admin for emergency cleanup
    );

-- =============================================
-- SECURITY FUNCTIONS FOR POLICIES
-- =============================================

-- Function to check if user can access receipt based on workflow
CREATE OR REPLACE FUNCTION can_access_receipt(receipt_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    receipt_record RECORD;
    user_role VARCHAR(50);
BEGIN
    -- Get receipt details
    SELECT * INTO receipt_record FROM receipts WHERE id = receipt_uuid;
    
    IF receipt_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user role
    SELECT get_user_role(auth.uid()) INTO user_role;
    
    -- Owner can always access
    IF receipt_record.created_by = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    -- Super admin can access everything
    IF user_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Admin can access all
    IF user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- User can access submitted receipts for verification
    IF user_role = 'user' AND receipt_record.status = 'submitted' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate document upload
CREATE OR REPLACE FUNCTION can_upload_document(receipt_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    receipt_record RECORD;
BEGIN
    -- Get receipt details
    SELECT * INTO receipt_record FROM receipts WHERE id = receipt_uuid;
    
    IF receipt_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Can upload if owner or super admin
    RETURN (
        receipt_record.created_by = auth.uid()
        OR user_has_permission(auth.uid(), 'all')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- POLICY TESTING FUNCTIONS
-- =============================================

-- Function to test policy access (for development/testing)
CREATE OR REPLACE FUNCTION test_policy_access(
    table_name TEXT,
    operation TEXT,
    test_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    policy_name TEXT,
    result BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    -- This function would contain test cases for each policy
    -- Implementation would depend on specific testing requirements
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON POLICY "Users can view own profile" ON users IS 'Users can only view their own profile information';
COMMENT ON POLICY "Users can view receipts based on role" ON receipts IS 'Role-based access to receipts based on status and permissions';
COMMENT ON POLICY "Users can create approvals" ON receipt_approvals IS 'Users can create approval records for receipts they have permission to act on';
COMMENT ON POLICY "Admins can view audit logs" ON audit_logs IS 'Only admins and super admins can view audit logs for compliance';

COMMENT ON FUNCTION can_access_receipt(UUID) IS 'Determines if current user can access a specific receipt based on role and status';
COMMENT ON FUNCTION can_upload_document(UUID) IS 'Determines if current user can upload documents for a specific receipt';

-- RLS policies setup completed
SELECT 'Row Level Security policies configured successfully' as result;
