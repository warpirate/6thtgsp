-- Quarter Master Inventory Management System
-- Requisition/Issuance System Migration
-- Version: 2.0.0
-- This adds the complete requisition workflow on top of existing receipt system

-- =============================================
-- ITEM CATEGORIES TABLE
-- =============================================
CREATE TABLE item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    code VARCHAR(20) UNIQUE NOT NULL,
    icon VARCHAR(50),
    requires_serial_number BOOLEAN DEFAULT false,
    is_returnable BOOLEAN DEFAULT false,
    requires_authorization BOOLEAN DEFAULT false,
    is_weapon BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO item_categories (name, code, description, icon, requires_serial_number, is_returnable, requires_authorization, is_weapon) VALUES
('Weapons & Ammunition', 'WEAPON', 'Firearms, ammunition, tear gas, etc.', '🔫', true, true, true, true),
('Office Furniture', 'FURNITURE', 'Chairs, desks, tables, cabinets', '🪑', false, false, false, false),
('Electronics & Appliances', 'ELECTRONICS', 'Computers, monitors, printers, ACs', '💻', true, true, false, false),
('Stationery & Consumables', 'STATIONERY', 'Pens, papers, files, toners', '📚', false, false, false, false),
('General Equipment', 'EQUIPMENT', 'Tools, safety gear, uniforms', '⚙️', false, true, false, false),
('Uniforms & Clothing', 'UNIFORM', 'Official uniforms, boots, accessories', '👕', false, false, false, false);

-- =============================================
-- ITEMS MASTER TABLE (Catalog)
-- =============================================
CREATE TABLE items_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES item_categories(id) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2),
    reorder_level INTEGER DEFAULT 10,
    current_stock INTEGER DEFAULT 0,
    allocated_stock INTEGER DEFAULT 0,
    available_stock INTEGER GENERATED ALWAYS AS (current_stock - allocated_stock) STORED,
    location VARCHAR(100),
    specifications JSONB,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequence for item codes
CREATE SEQUENCE item_code_seq START 1000;

-- Function to generate item codes
CREATE OR REPLACE FUNCTION generate_item_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
        NEW.item_code := 'ITEM-' || LPAD(nextval('item_code_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate item codes
CREATE TRIGGER trigger_generate_item_code
    BEFORE INSERT ON items_master
    FOR EACH ROW EXECUTE FUNCTION generate_item_code();

-- Indexes for items_master
CREATE INDEX idx_items_master_category ON items_master(category_id);
CREATE INDEX idx_items_master_active ON items_master(active);
CREATE INDEX idx_items_master_name ON items_master(name);
CREATE INDEX idx_items_master_item_code ON items_master(item_code);

-- =============================================
-- REQUISITIONS TABLE
-- =============================================
CREATE TABLE requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    requester_id UUID REFERENCES users(id) NOT NULL,
    department VARCHAR(100),
    request_type VARCHAR(20) DEFAULT 'self' CHECK (request_type IN ('self', 'department', 'bulk')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
    purpose TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'ready', 'issued', 'completed', 'rejected', 'cancelled')),
    total_value DECIMAL(12,2) DEFAULT 0,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_comments TEXT,
    issued_by UUID REFERENCES users(id),
    issued_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    authorization_document TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequence for requisition numbers
CREATE SEQUENCE requisition_number_seq START 1000;

-- Function to generate requisition numbers
CREATE OR REPLACE FUNCTION generate_requisition_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.requisition_number IS NULL OR NEW.requisition_number = '' THEN
        NEW.requisition_number := 'REQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('requisition_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate requisition numbers
CREATE TRIGGER trigger_generate_requisition_number
    BEFORE INSERT ON requisitions
    FOR EACH ROW EXECUTE FUNCTION generate_requisition_number();

-- Indexes for requisitions
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_requester ON requisitions(requester_id);
CREATE INDEX idx_requisitions_created_at ON requisitions(created_at);
CREATE INDEX idx_requisitions_number ON requisitions(requisition_number);
CREATE INDEX idx_requisitions_department ON requisitions(department);

-- =============================================
-- REQUISITION ITEMS TABLE
-- =============================================
CREATE TABLE requisition_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID REFERENCES requisitions(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES items_master(id) NOT NULL,
    quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
    quantity_approved INTEGER,
    quantity_issued INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(quantity_approved, quantity_requested) * COALESCE(unit_price, 0)) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for requisition_items
CREATE INDEX idx_requisition_items_requisition ON requisition_items(requisition_id);
CREATE INDEX idx_requisition_items_item ON requisition_items(item_id);

-- =============================================
-- ISSUANCE TABLE
-- =============================================
CREATE TABLE issuances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issuance_number VARCHAR(50) UNIQUE NOT NULL,
    requisition_id UUID REFERENCES requisitions(id) NOT NULL,
    requisition_item_id UUID REFERENCES requisition_items(id) NOT NULL,
    item_id UUID REFERENCES items_master(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    serial_numbers TEXT[],
    asset_tags TEXT[],
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'damaged')),
    issued_by UUID REFERENCES users(id) NOT NULL,
    issued_to UUID REFERENCES users(id) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_return_date DATE,
    gate_pass_number VARCHAR(50),
    delivery_challan_number VARCHAR(50),
    receiver_signature TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequence for issuance numbers
CREATE SEQUENCE issuance_number_seq START 1000;

-- Function to generate issuance numbers
CREATE OR REPLACE FUNCTION generate_issuance_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.issuance_number IS NULL OR NEW.issuance_number = '' THEN
        NEW.issuance_number := 'ISS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('issuance_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate issuance numbers
CREATE TRIGGER trigger_generate_issuance_number
    BEFORE INSERT ON issuances
    FOR EACH ROW EXECUTE FUNCTION generate_issuance_number();

-- Indexes for issuances
CREATE INDEX idx_issuances_requisition ON issuances(requisition_id);
CREATE INDEX idx_issuances_item ON issuances(item_id);
CREATE INDEX idx_issuances_issued_to ON issuances(issued_to);
CREATE INDEX idx_issuances_issued_at ON issuances(issued_at);

-- =============================================
-- RETURNS TABLE
-- =============================================
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(50) UNIQUE NOT NULL,
    issuance_id UUID REFERENCES issuances(id) NOT NULL,
    item_id UUID REFERENCES items_master(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    serial_numbers TEXT[],
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('good', 'fair', 'damaged', 'lost')),
    return_reason TEXT,
    damage_description TEXT,
    damage_charge DECIMAL(10,2) DEFAULT 0,
    returned_by UUID REFERENCES users(id) NOT NULL,
    accepted_by UUID REFERENCES users(id),
    returned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequence for return numbers
CREATE SEQUENCE return_number_seq START 1000;

-- Function to generate return numbers
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
        NEW.return_number := 'RET-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('return_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate return numbers
CREATE TRIGGER trigger_generate_return_number
    BEFORE INSERT ON returns
    FOR EACH ROW EXECUTE FUNCTION generate_return_number();

-- Indexes for returns
CREATE INDEX idx_returns_issuance ON returns(issuance_id);
CREATE INDEX idx_returns_item ON returns(item_id);
CREATE INDEX idx_returns_returned_by ON returns(returned_by);
CREATE INDEX idx_returns_status ON returns(status);

-- =============================================
-- ITEM ALLOCATIONS TABLE (Track who has what)
-- =============================================
CREATE TABLE item_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items_master(id) NOT NULL,
    issuance_id UUID REFERENCES issuances(id) NOT NULL,
    allocated_to UUID REFERENCES users(id) NOT NULL,
    serial_number VARCHAR(100),
    asset_tag VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'lost', 'damaged')),
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    returned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for item_allocations
CREATE INDEX idx_item_allocations_item ON item_allocations(item_id);
CREATE INDEX idx_item_allocations_user ON item_allocations(allocated_to);
CREATE INDEX idx_item_allocations_status ON item_allocations(status);
CREATE INDEX idx_item_allocations_serial ON item_allocations(serial_number);

-- =============================================
-- STOCK MOVEMENTS TABLE (Complete audit trail)
-- =============================================
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items_master(id) NOT NULL,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('receipt', 'issue', 'return', 'adjustment', 'transfer', 'damage', 'loss')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    performed_by UUID REFERENCES users(id) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for stock_movements
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- =============================================
-- WEAPON REGISTER TABLE (Special tracking for weapons)
-- =============================================
CREATE TABLE weapon_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items_master(id) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    weapon_type VARCHAR(100) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    caliber VARCHAR(50),
    manufacture_year INTEGER,
    license_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'issued', 'maintenance', 'damaged', 'decommissioned')),
    current_holder UUID REFERENCES users(id),
    last_issued_at TIMESTAMP WITH TIME ZONE,
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    condition_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for weapon_register
CREATE INDEX idx_weapon_register_item ON weapon_register(item_id);
CREATE INDEX idx_weapon_register_serial ON weapon_register(serial_number);
CREATE INDEX idx_weapon_register_status ON weapon_register(status);
CREATE INDEX idx_weapon_register_holder ON weapon_register(current_holder);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to update stock on issuance
CREATE OR REPLACE FUNCTION update_stock_on_issuance()
RETURNS TRIGGER AS $$
BEGIN
    -- Reduce available stock
    UPDATE items_master
    SET allocated_stock = allocated_stock + NEW.quantity
    WHERE id = NEW.item_id;
    
    -- Create stock movement record
    INSERT INTO stock_movements (
        item_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        performed_by,
        notes
    ) VALUES (
        NEW.item_id,
        'issue',
        -NEW.quantity,
        'issuance',
        NEW.id,
        NEW.issued_by,
        'Issued via ' || NEW.issuance_number
    );
    
    -- Create allocation record
    INSERT INTO item_allocations (
        item_id,
        issuance_id,
        allocated_to,
        quantity,
        status
    ) VALUES (
        NEW.item_id,
        NEW.id,
        NEW.issued_to,
        NEW.quantity,
        'active'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock update on issuance
CREATE TRIGGER trigger_update_stock_on_issuance
    AFTER INSERT ON issuances
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_issuance();

-- Function to update stock on return
CREATE OR REPLACE FUNCTION update_stock_on_return()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' THEN
        -- Increase available stock
        UPDATE items_master
        SET allocated_stock = allocated_stock - NEW.quantity,
            current_stock = CASE 
                WHEN NEW.condition IN ('good', 'fair') THEN current_stock
                ELSE current_stock - NEW.quantity
            END
        WHERE id = NEW.item_id;
        
        -- Create stock movement record
        INSERT INTO stock_movements (
            item_id,
            movement_type,
            quantity,
            reference_type,
            reference_id,
            performed_by,
            notes
        ) VALUES (
            NEW.item_id,
            'return',
            NEW.quantity,
            'return',
            NEW.id,
            NEW.accepted_by,
            'Returned via ' || NEW.return_number || ' - Condition: ' || NEW.condition
        );
        
        -- Update allocation record
        UPDATE item_allocations
        SET status = CASE 
                WHEN NEW.condition = 'lost' THEN 'lost'
                WHEN NEW.condition = 'damaged' THEN 'damaged'
                ELSE 'returned'
            END,
            returned_at = NEW.accepted_at
        WHERE issuance_id = (SELECT id FROM issuances WHERE id = NEW.issuance_id)
          AND allocated_to = NEW.returned_by;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock update on return
CREATE TRIGGER trigger_update_stock_on_return
    AFTER UPDATE ON returns
    FOR EACH ROW 
    WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
    EXECUTE FUNCTION update_stock_on_return();

-- Function to calculate requisition total
CREATE OR REPLACE FUNCTION calculate_requisition_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE requisitions
    SET total_value = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM requisition_items
        WHERE requisition_id = NEW.requisition_id
    )
    WHERE id = NEW.requisition_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate requisition total
CREATE TRIGGER trigger_calculate_requisition_total
    AFTER INSERT OR UPDATE ON requisition_items
    FOR EACH ROW EXECUTE FUNCTION calculate_requisition_total();

-- =============================================
-- UPDATE EXISTING USERS TABLE
-- =============================================

-- Add role column directly to users table (as per QUICKSTART.md)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'semi_user' 
    CHECK (role IN ('semi_user', 'user', 'admin', 'super_admin', 'armory_officer'));

-- Add badge/employee ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);

-- Create index on role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =============================================
-- AUDIT TRIGGERS FOR NEW TABLES
-- =============================================

CREATE TRIGGER audit_requisitions
    AFTER INSERT OR UPDATE OR DELETE ON requisitions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_issuances
    AFTER INSERT OR UPDATE OR DELETE ON issuances
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_returns
    AFTER INSERT OR UPDATE OR DELETE ON returns
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- UPDATE TRIGGERS FOR NEW TABLES
-- =============================================

CREATE TRIGGER update_items_master_updated_at
    BEFORE UPDATE ON items_master
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_requisitions_updated_at
    BEFORE UPDATE ON requisitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_item_categories_updated_at
    BEFORE UPDATE ON item_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_weapon_register_updated_at
    BEFORE UPDATE ON weapon_register
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for available items
CREATE OR REPLACE VIEW v_available_items AS
SELECT 
    i.*,
    c.name as category_name,
    c.code as category_code,
    c.is_weapon,
    c.requires_authorization,
    CASE 
        WHEN i.available_stock <= i.reorder_level THEN 'low'
        WHEN i.available_stock = 0 THEN 'out_of_stock'
        ELSE 'available'
    END as stock_status
FROM items_master i
JOIN item_categories c ON i.category_id = c.id
WHERE i.active = true;

-- View for pending requisitions
CREATE OR REPLACE VIEW v_pending_requisitions AS
SELECT 
    r.*,
    u.full_name as requester_name,
    u.department as requester_department,
    u.badge_number,
    COUNT(ri.id) as item_count,
    SUM(ri.total_price) as total_value
FROM requisitions r
JOIN users u ON r.requester_id = u.id
LEFT JOIN requisition_items ri ON r.id = ri.requisition_id
WHERE r.status IN ('pending', 'approved', 'ready')
GROUP BY r.id, u.full_name, u.department, u.badge_number;

-- View for user allocations
CREATE OR REPLACE VIEW v_user_allocations AS
SELECT 
    ia.*,
    i.name as item_name,
    i.item_code,
    c.name as category_name,
    u.full_name as user_name,
    u.department,
    iss.issued_at,
    iss.expected_return_date,
    CASE 
        WHEN iss.expected_return_date < CURRENT_DATE AND ia.status = 'active' THEN true
        ELSE false
    END as is_overdue
FROM item_allocations ia
JOIN items_master i ON ia.item_id = i.id
JOIN item_categories c ON i.category_id = c.id
JOIN users u ON ia.allocated_to = u.id
JOIN issuances iss ON ia.issuance_id = iss.id;

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample items
INSERT INTO items_master (name, description, category_id, unit, unit_price, current_stock, location) VALUES
('Office Chair (Revolving)', 'Ergonomic office chair with adjustable height', (SELECT id FROM item_categories WHERE code = 'FURNITURE'), 'piece', 3500.00, 50, 'Store Room A'),
('Desktop Computer - Dell OptiPlex', 'Dell OptiPlex 7090, i5, 8GB RAM, 256GB SSD', (SELECT id FROM item_categories WHERE code = 'ELECTRONICS'), 'piece', 45000.00, 25, 'Store Room B'),
('A4 Paper Ream', 'White A4 size paper, 500 sheets per ream', (SELECT id FROM item_categories WHERE code = 'STATIONERY'), 'ream', 250.00, 200, 'Store Room C'),
('Service Rifle', 'Standard issue service rifle', (SELECT id FROM item_categories WHERE code = 'WEAPON'), 'piece', 0, 100, 'Armory'),
('Ballpoint Pen (Blue)', 'Blue ink ballpoint pen', (SELECT id FROM item_categories WHERE code = 'STATIONERY'), 'piece', 10.00, 1000, 'Store Room C'),
('Monitor 24 inch', 'Dell 24 inch LED monitor', (SELECT id FROM item_categories WHERE code = 'ELECTRONICS'), 'piece', 12000.00, 30, 'Store Room B'),
('Keyboard & Mouse Set', 'Wireless keyboard and mouse combo', (SELECT id FROM item_categories WHERE code = 'ELECTRONICS'), 'set', 1500.00, 40, 'Store Room B'),
('Filing Cabinet', '4-drawer steel filing cabinet', (SELECT id FROM item_categories WHERE code = 'FURNITURE'), 'piece', 8500.00, 20, 'Store Room A'),
('Desk Lamp', 'LED desk lamp with adjustable brightness', (SELECT id FROM item_categories WHERE code = 'ELECTRONICS'), 'piece', 800.00, 50, 'Store Room B'),
('Uniform Shirt', 'Official uniform shirt', (SELECT id FROM item_categories WHERE code = 'UNIFORM'), 'piece', 450.00, 150, 'Store Room D');

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE item_categories IS 'Item categories with special handling rules';
COMMENT ON TABLE items_master IS 'Master catalog of all items available for requisition';
COMMENT ON TABLE requisitions IS 'Item requisition requests from users';
COMMENT ON TABLE requisition_items IS 'Individual items in a requisition';
COMMENT ON TABLE issuances IS 'Record of items issued to users';
COMMENT ON TABLE returns IS 'Record of items returned by users';
COMMENT ON TABLE item_allocations IS 'Track which items are allocated to which users';
COMMENT ON TABLE stock_movements IS 'Complete audit trail of all stock movements';
COMMENT ON TABLE weapon_register IS 'Special register for weapon tracking';

-- Migration completed successfully
SELECT 'Requisition system migration completed successfully' as result;
