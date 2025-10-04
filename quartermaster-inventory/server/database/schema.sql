CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('semi_user', 'user', 'admin', 'super_admin');
CREATE TYPE item_category AS ENUM ('consumable', 'non_consumable', 'sensitive', 'capital_asset');
CREATE TYPE receipt_status AS ENUM ('draft', 'submitted', 'verified', 'approved', 'rejected');
CREATE TYPE workflow_action AS ENUM ('submitted', 'verified', 'approved', 'rejected');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    rank VARCHAR(50),
    service_number VARCHAR(50),
    role user_role NOT NULL DEFAULT 'user',
    email VARCHAR(100) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Items master table
CREATE TABLE items_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    nomenclature VARCHAR(200) NOT NULL,
    category item_category NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Stock receipts table
CREATE TABLE stock_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_number VARCHAR(20) UNIQUE NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    challan_number VARCHAR(100) NOT NULL,
    challan_date DATE NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    vehicle_number VARCHAR(50),
    received_by UUID NOT NULL REFERENCES users(id),
    status receipt_status NOT NULL DEFAULT 'draft',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT receipt_date_check CHECK (receipt_date <= CURRENT_DATE),
    CONSTRAINT challan_date_check CHECK (challan_date <= receipt_date)
);

-- Receipt items table
CREATE TABLE receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES stock_receipts(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items_master(id),
    challan_quantity DECIMAL(10,2) NOT NULL,
    received_quantity DECIMAL(10,2) NOT NULL,
    variance DECIMAL(10,2) GENERATED ALWAYS AS (received_quantity - challan_quantity) STORED,
    unit_rate DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(12,2) GENERATED ALWAYS AS (received_quantity * unit_rate) STORED,
    condition_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_quantities CHECK (challan_quantity >= 0 AND received_quantity >= 0),
    CONSTRAINT positive_rate CHECK (unit_rate >= 0)
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES stock_receipts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Approval workflow table
CREATE TABLE approval_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES stock_receipts(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id),
    action workflow_action NOT NULL,
    comments TEXT,
    action_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(receipt_id, action)
);

-- Create indexes for better performance
CREATE INDEX idx_stock_receipts_status ON stock_receipts(status);
CREATE INDEX idx_stock_receipts_receipt_date ON stock_receipts(receipt_date);
CREATE INDEX idx_stock_receipts_received_by ON stock_receipts(received_by);
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_item_id ON receipt_items(item_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_approval_workflow_receipt_id ON approval_workflow(receipt_id);
CREATE INDEX idx_approval_workflow_approver_id ON approval_workflow(approver_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_items_master_category ON items_master(category);
CREATE INDEX idx_items_master_is_active ON items_master(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_master_updated_at BEFORE UPDATE ON items_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_receipts_updated_at BEFORE UPDATE ON stock_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate GRN number
CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.grn_number IS NULL THEN
        NEW.grn_number := 'GRN/' || TO_CHAR(CURRENT_DATE, 'YYYY') || '/' ||
                         LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(grn_number FROM '[0-9]+$') AS INTEGER)), 0) + 1)::TEXT, 4, '0')
                         FROM stock_receipts WHERE grn_number LIKE 'GRN/' || TO_CHAR(CURRENT_DATE, 'YYYY') || '/%';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate GRN number
CREATE TRIGGER generate_grn_number_trigger
    BEFORE INSERT ON stock_receipts
    FOR EACH ROW
    EXECUTE FUNCTION generate_grn_number();

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Get the table name
    CASE TG_TABLE_NAME
        WHEN 'users' THEN
            IF TG_OP = 'INSERT' THEN
                new_data := row_to_json(NEW)::JSONB;
                INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
                VALUES (NEW.id, 'create', TG_TABLE_NAME, NEW.id, new_data);
            ELSIF TG_OP = 'UPDATE' THEN
                old_data := row_to_json(OLD)::JSONB;
                new_data := row_to_json(NEW)::JSONB;
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value)
                VALUES (NEW.id, 'update', TG_TABLE_NAME, NEW.id, old_data, new_data);
            ELSIF TG_OP = 'DELETE' THEN
                old_data := row_to_json(OLD)::JSONB;
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value)
                VALUES (OLD.id, 'delete', TG_TABLE_NAME, OLD.id, old_data);
            END IF;

        WHEN 'stock_receipts' THEN
            IF TG_OP = 'INSERT' THEN
                new_data := row_to_json(NEW)::JSONB - 'created_at' - 'updated_at';
                INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
                VALUES (NEW.received_by, 'create', TG_TABLE_NAME, NEW.id, new_data);
            ELSIF TG_OP = 'UPDATE' THEN
                old_data := row_to_json(OLD)::JSONB - 'created_at' - 'updated_at';
                new_data := row_to_json(NEW)::JSONB - 'created_at' - 'updated_at';
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value)
                VALUES (NEW.received_by, 'update', TG_TABLE_NAME, NEW.id, old_data, new_data);
            END IF;

        WHEN 'receipt_items' THEN
            IF TG_OP = 'INSERT' THEN
                new_data := row_to_json(NEW)::JSONB - 'created_at' - 'variance' - 'total_value';
                INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
                VALUES ((SELECT received_by FROM stock_receipts WHERE id = NEW.receipt_id), 'create', TG_TABLE_NAME, NEW.id, new_data);
            ELSIF TG_OP = 'UPDATE' THEN
                old_data := row_to_json(OLD)::JSONB - 'created_at' - 'variance' - 'total_value';
                new_data := row_to_json(NEW)::JSONB - 'created_at' - 'variance' - 'total_value';
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value)
                VALUES ((SELECT received_by FROM stock_receipts WHERE id = NEW.receipt_id), 'update', TG_TABLE_NAME, NEW.id, old_data, new_data);
            END IF;

        WHEN 'items_master' THEN
            IF TG_OP = 'INSERT' THEN
                new_data := row_to_json(NEW)::JSONB - 'created_at' - 'updated_at';
                INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
                VALUES (NEW.created_by, 'create', TG_TABLE_NAME, NEW.id, new_data);
            ELSIF TG_OP = 'UPDATE' THEN
                old_data := row_to_json(OLD)::JSONB - 'created_at' - 'updated_at';
                new_data := row_to_json(NEW)::JSONB - 'created_at' - 'updated_at';
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value)
                VALUES (NEW.created_by, 'update', TG_TABLE_NAME, NEW.id, old_data, new_data);
            END IF;
    END CASE;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_stock_receipts_trigger
    AFTER INSERT OR UPDATE ON stock_receipts
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_receipt_items_trigger
    AFTER INSERT OR UPDATE ON receipt_items
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_items_master_trigger
    AFTER INSERT OR UPDATE ON items_master
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Note: Initial data (admin user and sample records) are inserted via the seed script
-- Run: npm run db:seed after migrations to populate initial data
