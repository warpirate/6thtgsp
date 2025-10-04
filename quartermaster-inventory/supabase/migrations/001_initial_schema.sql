-- Quarter Master Inventory Management System
-- Initial Database Schema Migration
-- Version: 1.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ROLES TABLE
-- =============================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('semi_user', 'Can create and edit draft receipts', 
 '{"create_receipt": true, "edit_own_draft": true}'::jsonb),
('user', 'Can verify submitted receipts', 
 '{"create_receipt": true, "edit_own_draft": true, "verify_receipt": true}'::jsonb),
('admin', 'Can approve verified receipts and manage inventory', 
 '{"create_receipt": true, "edit_own_draft": true, "verify_receipt": true, "approve_receipt": true, "view_reports": true}'::jsonb),
('super_admin', 'Full system access including user management', 
 '{"all": true}'::jsonb);

-- =============================================
-- USERS TABLE (extends auth.users)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_department ON users(department);

-- =============================================
-- USER_ROLES TABLE (junction table)
-- =============================================
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- Indexes for user_roles table
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- =============================================
-- RECEIPTS TABLE
-- =============================================
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2),
    total_value DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    supplier VARCHAR(255),
    purchase_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'verified', 'approved', 'rejected')),
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequence for receipt numbers
CREATE SEQUENCE receipt_number_seq START 1000;

-- Function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := 'REC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('receipt_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate receipt numbers
CREATE TRIGGER trigger_generate_receipt_number
    BEFORE INSERT ON receipts
    FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

-- Indexes for receipts table
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_created_by ON receipts(created_by);
CREATE INDEX idx_receipts_created_at ON receipts(created_at);
CREATE INDEX idx_receipts_receipt_number ON receipts(receipt_number);

-- =============================================
-- RECEIPT_APPROVALS TABLE
-- =============================================
CREATE TABLE receipt_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE NOT NULL,
    approver_id UUID REFERENCES users(id) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('submit', 'verify', 'approve', 'reject', 'return')),
    comments TEXT,
    previous_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for receipt_approvals table
CREATE INDEX idx_receipt_approvals_receipt_id ON receipt_approvals(receipt_id);
CREATE INDEX idx_receipt_approvals_approver_id ON receipt_approvals(approver_id);
CREATE INDEX idx_receipt_approvals_created_at ON receipt_approvals(created_at);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    storage_bucket VARCHAR(100) DEFAULT 'receipt-documents',
    uploaded_by UUID REFERENCES users(id) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for documents table
CREATE INDEX idx_documents_receipt_id ON documents(receipt_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- =============================================
-- AUDIT_LOGS TABLE
-- =============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs table
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(
    user_uuid UUID,
    permission_name VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT COALESCE(r.permissions, '{}'::jsonb) INTO user_permissions
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    LIMIT 1;
    
    -- If no role found, return false
    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Super admin has all permissions
    IF user_permissions ? 'all' THEN
        RETURN TRUE;
    END IF;
    
    -- Check specific permission
    RETURN user_permissions ? permission_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    role_name VARCHAR(50);
BEGIN
    SELECT r.name INTO role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    ORDER BY r.id DESC
    LIMIT 1;
    
    RETURN COALESCE(role_name, 'none');
END;
$$ LANGUAGE plpgsql;

-- Function to validate status transitions
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
    
    -- Users can verify submitted receipts or return to draft
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

-- Function to update receipt status with approval
CREATE OR REPLACE FUNCTION update_receipt_status(
    receipt_uuid UUID,
    new_status VARCHAR(20),
    approval_comments TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(20);
    user_role VARCHAR(50);
BEGIN
    -- Get current status
    SELECT status INTO current_status FROM receipts WHERE id = receipt_uuid;
    
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Receipt not found';
    END IF;
    
    -- Get user role
    SELECT get_user_role(auth.uid()) INTO user_role;
    
    -- Validate status transition
    IF NOT validate_status_transition(current_status, new_status, user_role) THEN
        RAISE EXCEPTION 'Invalid status transition from % to % for role %', current_status, new_status, user_role;
    END IF;
    
    -- Update receipt status
    UPDATE receipts SET 
        status = new_status,
        updated_at = NOW()
    WHERE id = receipt_uuid;
    
    -- Insert approval record
    INSERT INTO receipt_approvals (
        receipt_id,
        approver_id,
        action,
        comments,
        previous_status,
        new_status
    ) VALUES (
        receipt_uuid,
        auth.uid(),
        CASE 
            WHEN new_status = 'submitted' THEN 'submit'
            WHEN new_status = 'verified' THEN 'verify'
            WHEN new_status = 'approved' THEN 'approve'
            WHEN new_status = 'rejected' THEN 'reject'
            ELSE 'update'
        END,
        approval_comments,
        current_status,
        new_status
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AUDIT TRIGGERS
-- =============================================

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        table_name,
        operation,
        record_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        auth.uid(),
        TG_TABLE_NAME,
        TG_OP,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN NULL
            ELSE to_jsonb(NEW)
        END,
        NOW()
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_receipts
    AFTER INSERT OR UPDATE OR DELETE ON receipts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_receipt_approvals
    AFTER INSERT OR UPDATE OR DELETE ON receipt_approvals
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    
    -- Assign default role (semi_user)
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, (SELECT id FROM roles WHERE name = 'semi_user'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- STORAGE BUCKET SETUP
-- =============================================

-- Create storage bucket for receipt documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipt-documents',
    'receipt-documents',
    false,
    5242880, -- 5MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policy for receipt documents
CREATE POLICY "Users can upload receipt documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'receipt-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their receipt documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'receipt-documents'
    AND auth.role() = 'authenticated'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR user_has_permission(auth.uid(), 'view_all_receipts')
    )
);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE roles IS 'System roles with permissions';
COMMENT ON TABLE users IS 'Extended user profiles';
COMMENT ON TABLE user_roles IS 'User role assignments';
COMMENT ON TABLE receipts IS 'Stock receipt records';
COMMENT ON TABLE receipt_approvals IS 'Receipt approval workflow';
COMMENT ON TABLE documents IS 'Receipt supporting documents';
COMMENT ON TABLE audit_logs IS 'System audit trail';

COMMENT ON FUNCTION user_has_permission(UUID, VARCHAR) IS 'Check if user has specific permission';
COMMENT ON FUNCTION get_user_role(UUID) IS 'Get user primary role';
COMMENT ON FUNCTION validate_status_transition(VARCHAR, VARCHAR, VARCHAR) IS 'Validate receipt status changes';
COMMENT ON FUNCTION update_receipt_status(UUID, VARCHAR, TEXT) IS 'Update receipt status with approval';
COMMENT ON FUNCTION audit_trigger_function() IS 'Generic audit logging trigger';
COMMENT ON FUNCTION handle_new_user() IS 'Handle new user registration from auth.users';

-- Migration completed successfully
SELECT 'Initial schema migration completed successfully' as result;
