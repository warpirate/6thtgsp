# Requisition System Implementation Guide

## ✅ Completed

### 1. Database Migration
- **File**: `supabase/migrations/002_requisition_system.sql`
- **Status**: ✅ Created
- **What it includes**:
  - Item Categories table
  - Items Master (catalog) table
  - Requisitions table
  - Requisition Items table
  - Issuances table
  - Returns table
  - Item Allocations table
  - Stock Movements table
  - Weapon Register table
  - All necessary triggers and functions
  - Sample data

### 2. TypeScript Types
- **File**: `src/types/requisition.types.ts`
- **Status**: ✅ Created
- **Exports**: All types for requisition system

### 3. Pages Created
- **Catalog Page**: `src/pages/catalog/CatalogPage.tsx` ✅
- **Create Requisition**: `src/pages/requisitions/CreateRequisitionPage.tsx` ✅

### 4. Auth Provider Updated
- **File**: `src/lib/auth/AuthProvider.tsx`
- **Status**: ✅ Updated with new permissions

## 🚧 Next Steps (To Complete the Implementation)

### Step 1: Run Database Migration
```bash
# Apply the new migration
supabase db push

# Or if using Supabase CLI locally
supabase migration up
```

### Step 2: Create Remaining Pages

#### A. Requisitions List Page
**File**: `src/pages/requisitions/RequisitionsPage.tsx`
- List all requisitions with filters
- Status-based views
- Search and pagination

#### B. Requisition Detail Page
**File**: `src/pages/requisitions/RequisitionDetailPage.tsx`
- View requisition details
- Approve/reject actions (for admin)
- Track status changes
- View items and history

#### C. Issuance Management Page (Store Keeper)
**File**: `src/pages/issuance/IssuancePage.tsx`
- List approved requisitions ready for issue
- Issue items with serial numbers/asset tags
- Generate delivery challan
- Generate gate pass

#### D. Returns Management Page
**File**: `src/pages/returns/ReturnsPage.tsx`
- Accept returns from users
- Check condition
- Update stock
- Handle damaged items

#### E. My Allocations Page (Requester)
**File**: `src/pages/allocations/MyAllocationsPage.tsx`
- View items allocated to user
- Request returns
- View overdue items

#### F. Weapon Register Page (Armory Officer)
**File**: `src/pages/weapons/WeaponRegisterPage.tsx`
- View all weapons
- Track check-out/check-in
- Maintenance tracking
- Special approval workflow

### Step 3: Update Dashboard for Each Role

#### A. Requester Dashboard
**Updates needed in**: `src/pages/dashboard/DashboardPage.tsx`
- Show pending requisitions
- Show ready for pickup
- Show my allocations
- Show overdue returns

#### B. Store Keeper Dashboard
- Show ready to issue
- Show pending returns
- Show stock levels
- Show urgent requests

#### C. Admin Dashboard
- Show pending approvals
- Show department-wise stats
- Show budget tracking
- Show recent activities

#### D. Armory Officer Dashboard
- Show weapon requisitions
- Show checked-out weapons
- Show overdue returns
- Show maintenance due

### Step 4: Update Navigation

**File**: `src/components/layout/Sidebar.tsx`

Add new menu items:
```typescript
// For all users
{ path: '/catalog', label: 'Item Catalog', icon: Package }
{ path: '/requisitions', label: 'My Requisitions', icon: FileText }
{ path: '/allocations', label: 'My Items', icon: Briefcase }

// For Store Keeper (user role)
{ path: '/issuance', label: 'Issue Items', icon: Send }
{ path: '/returns', label: 'Returns', icon: RotateCcw }
{ path: '/stock', label: 'Stock Management', icon: Package }

// For Admin
{ path: '/approvals', label: 'Approve Requisitions', icon: CheckCircle }

// For Armory Officer
{ path: '/weapons', label: 'Weapon Register', icon: Shield }
```

### Step 5: Update Routing

**File**: `src/App.tsx`

Add new routes:
```typescript
// Catalog
<Route path="/catalog" element={<CatalogPage />} />

// Requisitions
<Route path="/requisitions" element={<RequisitionsPage />} />
<Route path="/requisitions/create" element={<CreateRequisitionPage />} />
<Route path="/requisitions/:id" element={<RequisitionDetailPage />} />

// Issuance (Store Keeper)
<Route path="/issuance" element={
  <ProtectedRoute requiredPermission="issue_items">
    <IssuancePage />
  </ProtectedRoute>
} />

// Returns
<Route path="/returns" element={<ReturnsPage />} />

// Allocations
<Route path="/allocations" element={<MyAllocationsPage />} />

// Weapons (Armory Officer)
<Route path="/weapons" element={
  <ProtectedRoute requiredPermission="manage_weapons">
    <WeaponRegisterPage />
  </ProtectedRoute>
} />
```

### Step 6: Create API Helper Functions

**File**: `src/lib/api/requisitions.ts`

```typescript
export const requisitionAPI = {
  // List requisitions
  list: async (filters) => { ... },
  
  // Get single requisition
  get: async (id) => { ... },
  
  // Create requisition
  create: async (data) => { ... },
  
  // Approve requisition
  approve: async (id, comments) => { ... },
  
  // Reject requisition
  reject: async (id, reason) => { ... },
  
  // Issue items
  issue: async (data) => { ... },
  
  // Accept return
  acceptReturn: async (data) => { ... }
}
```

### Step 7: Update User Table

The migration already adds the `role` column directly to the `users` table. You need to:

1. Update existing users to have the correct role
2. Remove the old `user_roles` junction table approach if needed

```sql
-- Update existing users
UPDATE users SET role = 'semi_user' WHERE role IS NULL;

-- Optionally migrate from user_roles table
UPDATE users u
SET role = r.name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE u.id = ur.user_id;
```

## 📋 Testing Checklist

### Requester Flow
- [ ] Browse catalog
- [ ] Add items to cart
- [ ] Create requisition
- [ ] View requisition status
- [ ] Receive notification when approved
- [ ] Pick up items
- [ ] View allocated items
- [ ] Request return

### Store Keeper Flow
- [ ] View approved requisitions
- [ ] Issue items with serial numbers
- [ ] Generate delivery challan
- [ ] Accept returns
- [ ] Check item condition
- [ ] Update stock levels

### Admin Flow
- [ ] View pending requisitions
- [ ] Approve/reject requisitions
- [ ] Modify quantities
- [ ] View reports
- [ ] Track budget

### Armory Officer Flow
- [ ] View weapon requisitions
- [ ] Verify authorization
- [ ] Issue weapons
- [ ] Track check-out/check-in
- [ ] Maintain weapon register

## 🎨 UI Components Needed

### Reusable Components
1. **RequisitionCard** - Display requisition summary
2. **ItemCard** - Display item in catalog
3. **StatusBadge** - Show requisition/item status
4. **ApprovalTimeline** - Show approval workflow
5. **StockIndicator** - Show stock levels
6. **SerialNumberInput** - Input for serial numbers
7. **AssetTagScanner** - Barcode/QR scanner
8. **DeliveryChallan** - Printable challan
9. **GatePass** - Printable gate pass

## 🔧 Configuration

### Environment Variables
Already configured in `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Feature Flags
Add to `.env.local` if needed:
```
VITE_ENABLE_WEAPON_MODULE=true
VITE_ENABLE_BARCODE_SCANNING=true
VITE_AUTO_APPROVE_THRESHOLD=5000
```

## 📊 Reports to Implement

1. **Requisition Report** - All requisitions by date range
2. **Issuance Report** - Items issued by date range
3. **Stock Report** - Current stock levels
4. **Allocation Report** - Who has what
5. **Weapon Register Report** - Weapon tracking
6. **Department-wise Report** - Requisitions by department
7. **Budget Report** - Spending by category

## 🚀 Deployment Steps

1. **Database**:
   ```bash
   supabase db push
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Test**:
   - Test all user flows
   - Test permissions
   - Test edge cases

4. **Deploy**:
   ```bash
   # Deploy to your hosting platform
   ```

## 📝 Documentation Updates Needed

1. Update README.md with new features
2. Create user manual for each role
3. Create admin guide
4. Create API documentation
5. Create troubleshooting guide

## 🎯 Priority Order

### Phase 1 (Critical - Week 1)
1. ✅ Database migration
2. ✅ TypeScript types
3. ✅ Catalog page
4. ✅ Create requisition page
5. 🚧 Requisitions list page
6. 🚧 Requisition detail page
7. 🚧 Update dashboard
8. 🚧 Update navigation

### Phase 2 (Important - Week 2)
1. Issuance management
2. Returns management
3. My allocations page
4. Approval workflow
5. Notifications

### Phase 3 (Enhanced - Week 3)
1. Weapon register
2. Barcode scanning
3. Reports and analytics
4. Bulk operations
5. Advanced filters

### Phase 4 (Polish - Week 4)
1. Mobile responsiveness
2. Performance optimization
3. User training
4. Documentation
5. Testing and bug fixes

## 🐛 Known Issues to Address

1. Need to handle concurrent requisitions for same item
2. Need to implement stock reservation during approval
3. Need to handle partial issuance
4. Need to implement notification system
5. Need to add email notifications

## 💡 Future Enhancements

1. Mobile app
2. Barcode/QR code generation
3. Auto-reorder based on reorder level
4. Budget approval workflow
5. Integration with accounting system
6. SMS notifications
7. Biometric authentication for weapon issuance
8. RFID tracking
9. Predictive analytics
10. Vendor management

---

**Status**: 30% Complete
**Next Action**: Create Requisitions List Page and Detail Page
**Estimated Time to Complete**: 2-3 weeks for full implementation
