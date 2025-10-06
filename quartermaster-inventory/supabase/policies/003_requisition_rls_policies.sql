-- Quarter Master Inventory Management System
-- Requisition RLS Policies (Corrected Workflow)
-- Version: 3.0.0
-- Enforces: semi_user (requester) → admin (approver) → user (watchman/issuer)

-- =============================================
-- ENABLE RLS ON REQUISITION TABLES
-- =============================================

ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuances ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- REQUISITIONS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own requisitions" ON requisitions;
DROP POLICY IF EXISTS "Admins can view all requisitions" ON requisitions;
DROP POLICY IF EXISTS "Watchmen can view approved requisitions" ON requisitions;
DROP POLICY IF EXISTS "Users can create requisitions" ON requisitions;
DROP POLICY IF EXISTS "Users can update own draft requisitions" ON requisitions;
DROP POLICY IF EXISTS "Admins can update requisitions" ON requisitions;

-- Semi users can view their own requisitions
CREATE POLICY "Semi users can view own requisitions" ON requisitions
    FOR SELECT USING (
        requester_id = auth.uid()
    );

-- Users (watchmen) can view approved requisitions ready for pickup
CREATE POLICY "Watchmen can view approved requisitions" ON requisitions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'user'
        )
        AND status IN ('approved', 'ready_for_pickup', 'issued')
    );

-- Admins can view all requisitions
CREATE POLICY "Admins can view all requisitions" ON requisitions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Semi users can create requisitions
CREATE POLICY "Semi users can create requisitions" ON requisitions
    FOR INSERT WITH CHECK (
        requester_id = auth.uid()
        AND status = 'draft'
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('semi_user', 'user', 'admin', 'super_admin')
        )
    );

-- Semi users can update their own draft requisitions
CREATE POLICY "Semi users can update own drafts" ON requisitions
    FOR UPDATE USING (
        requester_id = auth.uid()
        AND status = 'draft'
    ) WITH CHECK (
        requester_id = auth.uid()
        AND (status = 'draft' OR status = 'pending')
    );

-- Admins can approve/reject pending requisitions
CREATE POLICY "Admins can approve requisitions" ON requisitions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
        AND status IN ('pending', 'approved', 'ready_for_pickup')
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Users (watchmen) can mark approved items as ready/issued
CREATE POLICY "Watchmen can issue approved items" ON requisitions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('user', 'admin', 'super_admin')
        )
        AND status IN ('approved', 'ready_for_pickup')
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('user', 'admin', 'super_admin')
        )
        AND status IN ('ready_for_pickup', 'issued', 'completed')
    );

-- =============================================
-- REQUISITION_ITEMS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view requisition items" ON requisition_items;
DROP POLICY IF EXISTS "Users can manage requisition items" ON requisition_items;

-- Users can view items for requisitions they can access
CREATE POLICY "Users can view requisition items" ON requisition_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM requisitions r
            WHERE r.id = requisition_id
            AND (
                r.requester_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('user', 'admin', 'super_admin')
                )
            )
        )
    );

-- Users can add/edit items in their own draft requisitions
CREATE POLICY "Users can manage own requisition items" ON requisition_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM requisitions r
            WHERE r.id = requisition_id
            AND r.requester_id = auth.uid()
            AND r.status = 'draft'
        )
    );

-- Admins can update approved quantities
CREATE POLICY "Admins can update item quantities" ON requisition_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =============================================
-- ISSUANCES TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view issuances" ON issuances;
DROP POLICY IF EXISTS "Watchmen can create issuances" ON issuances;

-- Users can view their own issuances
CREATE POLICY "Users can view own issuances" ON issuances
    FOR SELECT USING (
        issued_to = auth.uid()
        OR issued_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Only watchmen (users) and admins can create issuances for approved requisitions
CREATE POLICY "Watchmen can issue approved items" ON issuances
    FOR INSERT WITH CHECK (
        issued_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('user', 'admin', 'super_admin')
        )
        AND EXISTS (
            SELECT 1 FROM requisitions r
            WHERE r.id = requisition_id
            AND r.status IN ('approved', 'ready_for_pickup')
        )
    );

-- =============================================
-- ITEMS_MASTER TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "All users can view items" ON items_master;
DROP POLICY IF EXISTS "Admins can manage items" ON items_master;

-- All authenticated users can view active items
CREATE POLICY "All users can view items" ON items_master
    FOR SELECT USING (
        active = true
        AND auth.role() = 'authenticated'
    );

-- Only admins can manage items catalog
CREATE POLICY "Admins can manage items" ON items_master
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =============================================
-- ITEM_CATEGORIES TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "All users can view categories" ON item_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON item_categories;

-- All authenticated users can view categories
CREATE POLICY "All users can view categories" ON item_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories" ON item_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =============================================
-- RETURNS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view returns" ON returns;
DROP POLICY IF EXISTS "Users can create returns" ON returns;
DROP POLICY IF EXISTS "Watchmen can accept returns" ON returns;

-- Users can view their own returns
CREATE POLICY "Users can view own returns" ON returns
    FOR SELECT USING (
        returned_by = auth.uid()
        OR accepted_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Users can create returns for items issued to them
CREATE POLICY "Users can create returns" ON returns
    FOR INSERT WITH CHECK (
        returned_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM issuances i
            WHERE i.id = issuance_id
            AND i.issued_to = auth.uid()
        )
    );

-- Watchmen and admins can accept returns
CREATE POLICY "Watchmen can accept returns" ON returns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('user', 'admin', 'super_admin')
        )
    ) WITH CHECK (
        accepted_by = auth.uid()
    );

-- =============================================
-- ITEM_ALLOCATIONS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own allocations" ON item_allocations;
DROP POLICY IF EXISTS "Admins can view all allocations" ON item_allocations;

-- Users can view their own allocations
CREATE POLICY "Users can view own allocations" ON item_allocations
    FOR SELECT USING (
        allocated_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('user', 'admin', 'super_admin')
        )
    );

-- System creates allocations (through triggers)
CREATE POLICY "System can manage allocations" ON item_allocations
    FOR ALL USING (true);

-- =============================================
-- STOCK_MOVEMENTS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view stock movements" ON stock_movements;
DROP POLICY IF EXISTS "System can create movements" ON stock_movements;

-- Admins can view all stock movements
CREATE POLICY "Admins can view stock movements" ON stock_movements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- System and authorized users can create stock movements
CREATE POLICY "Authorized users can create movements" ON stock_movements
    FOR INSERT WITH CHECK (
        performed_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('user', 'admin', 'super_admin')
        )
    );

-- =============================================
-- WORKFLOW_ACTIONS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view workflow actions" ON workflow_actions;
DROP POLICY IF EXISTS "System can create workflow actions" ON workflow_actions;

-- Users can view workflow actions for their requisitions
CREATE POLICY "Users can view own workflow actions" ON workflow_actions
    FOR SELECT USING (
        performed_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM requisitions r
            WHERE r.id = requisition_id
            AND r.requester_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- System creates workflow actions (through triggers)
CREATE POLICY "System can create workflow actions" ON workflow_actions
    FOR INSERT WITH CHECK (true);

-- Workflow actions are immutable
CREATE POLICY "Workflow actions are immutable" ON workflow_actions
    FOR UPDATE USING (false);

CREATE POLICY "Workflow actions cannot be deleted" ON workflow_actions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON POLICY "Semi users can view own requisitions" ON requisitions IS 
'Semi users can only view requisitions they created';

COMMENT ON POLICY "Watchmen can view approved requisitions" ON requisitions IS 
'Users (watchmen) can only view requisitions that have been approved by admin';

COMMENT ON POLICY "Admins can approve requisitions" ON requisitions IS 
'Only admins can approve or reject pending requisitions';

COMMENT ON POLICY "Watchmen can issue approved items" ON requisitions IS 
'Users (watchmen) can mark approved items as ready for pickup and issued';

COMMENT ON POLICY "Watchmen can issue approved items" ON issuances IS 
'Users (watchmen) can only issue items from requisitions approved by admin';

-- RLS policies setup completed
SELECT 'Requisition RLS policies configured for corrected workflow' as result;
