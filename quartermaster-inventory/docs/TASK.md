# Quartermaster Inventory System - Bug Fixes & Improvements Task List

**Generated:** October 9, 2025
**Status:** In Progress

---

## CRITICAL BUGS (Fix Immediately) 🚨

### 1. ApprovalsPage is Non-Functional - SHOWSTOPPER
**Priority:** P0 - CRITICAL
**Status:** 🔴 Not Started
**File:** `src/pages/approvals/ApprovalsPage.tsx` (lines 1-78)

**Problem:**
- Approvals page is a placeholder with hardcoded empty states
- No data loading logic
- No requisition approval functionality
- Badge count hardcoded to "0"

**Impact:**
- Breaks entire workflow: Requester → Admin Approval → Watchman Issuance
- Admins cannot approve requisitions
- Watchmen cannot issue items

**Fix Required:**
```typescript
// Load pending requisitions for approval
useEffect(() => {
  loadPendingRequisitions()
  loadPendingReceipts()
}, [])

const loadPendingRequisitions = async () => {
  const { data, error } = await supabase
    .from('requisitions')
    .select(`
      *,
      requester:users!requester_id(*),
      items:requisition_items(
        *,
        item:items_master(*)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    toast.error('Failed to load requisitions')
    return
  }
  setRequisitions(data)
}

const loadPendingReceipts = async () => {
  const { data, error } = await supabase
    .from('stock_receipts')
    .select('*, items:receipt_items(*)')
    .eq('status', 'verified')
    .order('created_at', { ascending: false })

  if (error) {
    toast.error('Failed to load receipts')
    return
  }
  setReceipts(data)
}

// Add approve/reject handlers
const handleApprove = async (requisitionId: string) => {
  const { error } = await supabase
    .from('requisitions')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', requisitionId)

  if (error) {
    toast.error('Failed to approve requisition')
    return
  }

  toast.success('Requisition approved successfully')
  loadPendingRequisitions()
}
```

---

### 2. Sidebar Permission Mismatch
**Priority:** P0 - CRITICAL
**Status:** 🔴 Not Started
**File:** `src/components/layout/Sidebar.tsx` (line 81)

**Problem:**
```typescript
{
  name: 'Approvals',
  href: '/approvals',
  icon: CheckCircle,
  requiredRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN], // ❌ Wrong!
},
```

- `UserRole.USER` (watchman) should NOT see approvals
- Only admins can approve requisitions
- Creates role confusion

**Fix Required:**
```typescript
{
  name: 'Approvals',
  href: '/approvals',
  icon: CheckCircle,
  requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  requiredPermission: 'approve_requisition',
},
```

**Also check:** `src/App.tsx` (lines 214-219) - same issue in routing

---

### 3. Stock Update Logic Error in IssuancePage
**Priority:** P0 - CRITICAL
**Status:** 🔴 Not Started
**File:** `src/pages/issuance/IssuancePage.tsx` (lines 148-157)

**Problem:**
```typescript
const { error: stockError } = await (supabase as any)
  .from('items_master')
  .update({
    allocated_stock: (item.item as any).allocated_stock + issuanceData[item.id].quantity  // ❌ WRONG!
  })
  .eq('id', item.item_id)
```

- When issuing items, it INCREASES `allocated_stock`
- Doesn't decrease `available_stock`
- Inventory counts become incorrect

**Fix Required:**
```typescript
// First, verify available stock
const { data: itemData } = await supabase
  .from('items_master')
  .select('current_stock, allocated_stock')
  .eq('id', item.item_id)
  .single()

const availableStock = itemData.current_stock - itemData.allocated_stock

if (availableStock < issuanceData[item.id].quantity) {
  toast.error(`Insufficient stock for ${item.item.name}`)
  return
}

// Then update stock
const { error: stockError } = await supabase
  .from('items_master')
  .update({
    allocated_stock: itemData.allocated_stock + issuanceData[item.id].quantity
  })
  .eq('id', item.item_id)
```

---

### 4. Returns Stock Logic Error
**Priority:** P0 - CRITICAL
**Status:** 🔴 Not Started
**File:** `src/pages/returns/ReturnsPage.tsx` (lines 110-121)

**Problem:**
```typescript
const { error: stockError } = await (supabase as any)
  .from('items_master')
  .update({
    allocated_stock: (returnItem.item as any).allocated_stock - returnItem.quantity,
    current_stock: returnItem.condition === 'lost'
      ? (returnItem.item as any).current_stock - returnItem.quantity  // Only handles 'lost'
      : (returnItem.item as any).current_stock  // Ignores good/fair/damaged
  })
  .eq('id', returnItem.item_id)
```

**Issues:**
1. 'lost' items: Decreases current_stock (correct)
2. 'damaged' items: No action (may be wrong)
3. 'good'/'fair' items: Should go back to available stock

**Fix Required:**
```typescript
// Calculate stock changes based on condition
let stockUpdate: any = {
  allocated_stock: (returnItem.item as any).allocated_stock - returnItem.quantity
}

switch (returnItem.condition) {
  case 'good':
  case 'fair':
    // Item is usable - goes back to available stock
    // allocated_stock decreases (item returned)
    // current_stock stays same (item still exists)
    break

  case 'damaged':
    // Item unusable but exists - may need repair
    stockUpdate.current_stock = (returnItem.item as any).current_stock
    // Consider adding 'damaged_stock' column
    break

  case 'lost':
    // Item gone forever
    stockUpdate.current_stock = (returnItem.item as any).current_stock - returnItem.quantity
    break
}

const { error: stockError } = await supabase
  .from('items_master')
  .update(stockUpdate)
  .eq('id', returnItem.item_id)
```

---

## HIGH PRIORITY (Fix Soon) ⚠️

### 5. No Partial Quantity Approval
**Priority:** P1 - HIGH
**Status:** 🔴 Not Started
**File:** `src/pages/requisitions/RequisitionDetailPage.tsx` (lines 83-112)

**Problem:**
- Admin can only approve/reject entire requisition
- Cannot approve partial quantities
- Example: Requester asks for 100, only 50 available → must reject entire request

**Fix Required:**
- Add quantity input field in approval modal
- Allow admin to modify approved quantity per item
- Update requisition_items with approved_quantity column
- Show original vs approved quantity

---

### 6. No Serial Number Validation
**Priority:** P1 - HIGH
**Status:** 🔴 Not Started
**File:** `src/pages/issuance/IssuancePage.tsx` (lines 320-334)

**Problem:**
- Requires serial numbers but doesn't validate
- No check for duplicate serial numbers
- No verification that serial number count matches quantity
- No format validation

**Fix Required:**
```typescript
// Before issuing
const serialNumbers = serialNumbersInput.split(',').map(s => s.trim()).filter(Boolean)

// Validate count
if (serialNumbers.length !== issuanceData[item.id].quantity) {
  toast.error(`Please provide exactly ${issuanceData[item.id].quantity} serial numbers`)
  return
}

// Check for duplicates in input
const uniqueSerials = new Set(serialNumbers)
if (uniqueSerials.size !== serialNumbers.length) {
  toast.error('Duplicate serial numbers detected')
  return
}

// Check for duplicates in database
const { data: existingSerials } = await supabase
  .from('issued_items')
  .select('serial_number')
  .in('serial_number', serialNumbers)

if (existingSerials && existingSerials.length > 0) {
  toast.error('Serial number already exists in system')
  return
}
```

---

### 7. No Stock Availability Check Before Issuing
**Priority:** P1 - HIGH
**Status:** 🔴 Not Started
**File:** `src/pages/issuance/IssuancePage.tsx`

**Problem:**
- Doesn't verify stock exists before issuing
- Could issue more items than available
- Race condition if multiple users issue simultaneously

**Fix Required:**
- Check available stock before each issuance
- Use database transactions or triggers
- Show real-time stock availability

---

### 8. Missing Notification System
**Priority:** P1 - HIGH
**Status:** 🔴 Not Started

**Problem:**
- No email notifications when requisition approved/rejected
- No alerts for watchmen when items ready to issue
- No low stock alerts
- No overdue return notifications

**Fix Required:**
- Implement email service (Supabase Auth email or SendGrid)
- Add notification preferences to user profile
- Create notification triggers in database
- Add in-app notification center

---

## MEDIUM PRIORITY (Important but not breaking) 📋

### 9. Poor Error Messages Throughout
**Priority:** P2 - MEDIUM
**Status:** 🔴 Not Started

**Files affected:**
- `src/pages/requisitions/CreateRequisitionPage.tsx` (lines 120-135)
- `src/pages/issuance/IssuancePage.tsx`
- `src/pages/returns/ReturnsPage.tsx`
- `src/pages/users/UsersPage.tsx`

**Current approach:**
```typescript
toast.error(error.message || 'Failed to create requisition')
```

**Better approach:**
```typescript
// Map error codes to user-friendly messages
const getErrorMessage = (error: any, context: string) => {
  const errorMap: Record<string, string> = {
    'PGRST116': 'Item not found. Please select a valid item.',
    '23503': 'Invalid item selection. Please check your inputs.',
    '23505': 'This record already exists.',
    'PGRST301': 'Session expired. Please log in again.',
  }

  if (error.code && errorMap[error.code]) {
    return errorMap[error.code]
  }

  return error.message || `Failed to ${context}`
}

// Usage
toast.error(getErrorMessage(error, 'create requisition'))
```

---

### 10. Confusing Role Names in UI
**Priority:** P2 - MEDIUM
**Status:** 🔴 Not Started
**File:** `src/lib/auth/AuthProvider.tsx` (lines 456-512)

**Problem:**
- Backend: "semi_user", "user", "admin", "super_admin"
- UI shows same names - confusing
- "Semi User" doesn't explain what they do

**Fix Required:**
```typescript
// Create display name mapping
export const ROLE_DISPLAY_NAMES: Record<UserRoleName, string> = {
  semi_user: 'Requester',
  user: 'Store Keeper',
  admin: 'Approver',
  super_admin: 'Super Admin'
}

export const ROLE_DESCRIPTIONS: Record<UserRoleName, string> = {
  semi_user: 'Can create requisitions and view their own requests',
  user: 'Can issue approved items and manage stock',
  admin: 'Can approve requisitions and manage inventory',
  super_admin: 'Full system access including user management'
}
```

Use these in UI components for clarity.

---

### 11. No Workflow Status Indicators
**Priority:** P2 - MEDIUM
**Status:** 🔴 Not Started

**Problem:**
- Users don't understand where they are in workflow
- No visual guide showing: Create → Approve → Issue → Return

**Fix Required:**
- Add workflow stepper component
- Show current step for each requisition
- Add status badge explanations with tooltips
- Create visual workflow diagram on dashboard

---

### 12. Missing Help Text and Tooltips
**Priority:** P2 - MEDIUM
**Status:** 🔴 Not Started

**Problem:**
- No tooltips explaining fields
- No inline help for first-time users
- No contextual guidance

**Fix Required:**
- Add Tooltip component from Radix UI (already installed)
- Add help text to forms
- Create onboarding tour for new users
- Add "?" icons with explanations

---

### 13. No Empty State Guidance
**Priority:** P2 - MEDIUM
**Status:** 🔴 Not Started
**File:** `src/pages/catalog/CatalogPage.tsx` (lines 227-232)

**Current:**
```typescript
<EmptyState message="No items found" />
```

**Better:**
```typescript
<EmptyState
  message="No items found"
  description="Contact your administrator to add items to the catalog, or try adjusting your search filters."
  action={
    hasPermission('manage_inventory') && (
      <Button onClick={() => navigate('/inventory')}>
        Add Items
      </Button>
    )
  }
/>
```

---

### 14. Inconsistent Permission Names
**Priority:** P2 - MEDIUM
**Status:** 🔴 Not Started
**File:** `src/lib/auth/AuthProvider.tsx` (lines 455-515)

**Problem:**
- `view_approved_requisitions` permission defined but not consistently used
- Some checks use role, some use permission
- Inconsistent naming conventions

**Fix Required:**
- Standardize all permission names
- Document permission structure
- Use permissions consistently across app
- Create permission constants file

---

### 15. No Bulk Operations
**Priority:** P2 - MEDIUM
**Status:** 🔴 Not Started

**Problem:**
- Cannot bulk approve requisitions
- Cannot bulk issue items
- Cannot bulk accept returns
- Inefficient for high-volume operations

**Fix Required:**
- Add checkbox selection to tables
- Add "Select All" functionality
- Add bulk action buttons
- Implement batch API calls

---

## LOW PRIORITY (Nice to have) 💡

### 16. No Breadcrumb Navigation
**Priority:** P3 - LOW
**Status:** 🔴 Not Started

**Problem:**
- Users can't see hierarchy
- Unclear where they are in app

**Fix Required:**
- Add breadcrumb component
- Show path: Home > Requisitions > REQ-001
- Make breadcrumbs clickable

---

### 17. Cart Workflow Unclear
**Priority:** P3 - LOW
**Status:** 🔴 Not Started
**File:** `src/pages/catalog/CatalogPage.tsx`

**Problem:**
- Cart sidebar doesn't explain next steps
- Missing: "Your requisition will be sent to Admin for approval"

**Fix Required:**
- Add explanatory text in cart
- Show workflow preview
- Add estimated approval time

---

### 18. Missing Duplicate Prevention
**Priority:** P3 - LOW
**Status:** 🔴 Not Started

**Problem:**
- No check for duplicate requisition creation
- User could accidentally submit twice

**Fix Required:**
- Implement debounce on submit button
- Check for recent similar requisitions
- Add confirmation dialog

---

### 19. Inconsistent Back Button Behavior
**Priority:** P3 - LOW
**Status:** 🔴 Not Started

**Examples:**
- CreateRequisitionPage: Uses `navigate('/catalog')` (line 34)
- RequisitionDetailPage: Uses `navigate('/requisitions')` (line 158)

**Fix Required:**
- Standardize back navigation
- Use browser back where appropriate
- Add breadcrumbs for complex navigation

---

### 20. No Item Search in Issuance
**Priority:** P3 - LOW
**Status:** 🔴 Not Started
**File:** `src/pages/issuance/IssuancePage.tsx` (lines 205-211)

**Problem:**
- Search only works on requisition number
- Cannot search by item name
- Hard to find specific items

**Fix Required:**
```typescript
const filteredRequisitions = requisitions.filter(req => {
  const matchesSearch =
    req.requisition_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.items.some(item =>
      item.item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  return matchesSearch
})
```

---

## TESTING CHECKLIST ✅

### Critical Flow Testing
- [ ] **Requisition Creation Flow**
  - [ ] Semi_user creates requisition
  - [ ] Verify it appears in Approvals for Admin
  - [ ] Verify semi_user sees "Pending" status

- [ ] **Approval Flow**
  - [ ] Admin sees requisition in Approvals page
  - [ ] Admin can approve requisition
  - [ ] Verify status changes to "Approved"
  - [ ] Verify USER (watchman) sees it in Issuance

- [ ] **Issuance Flow**
  - [ ] USER sees approved requisition
  - [ ] USER can issue items with details
  - [ ] Verify stock decreases correctly
  - [ ] Verify semi_user receives items

- [ ] **Returns Flow**
  - [ ] Semi_user can return items
  - [ ] Verify stock increases for good/fair items
  - [ ] Verify stock decreases for lost items
  - [ ] Verify damaged items handled correctly

### Validation Testing
- [ ] **Serial Number Validation**
  - [ ] Cannot issue with wrong serial count
  - [ ] Cannot use duplicate serial numbers
  - [ ] Cannot reuse existing serial numbers

- [ ] **Stock Validation**
  - [ ] Cannot issue more than available
  - [ ] Cannot approve more than in stock
  - [ ] Stock calculations are correct

### Permission Testing
- [ ] **Role Access**
  - [ ] Semi_user CANNOT access Approvals
  - [ ] USER (watchman) CANNOT access Approvals
  - [ ] Admin CAN access Approvals
  - [ ] Super_admin has full access

### Edge Cases
- [ ] Test with weapon items (authorization required)
- [ ] Test with serial-tracked items
- [ ] Test with items at 0 stock
- [ ] Test concurrent issuance by multiple users
- [ ] Test requisition editing after submission
- [ ] Test approval after item deleted

---

## IMPLEMENTATION PLAN

### Phase 1: Critical Bugs (Week 1)
**Must fix to have working system**
1. Implement ApprovalsPage functionality
2. Fix sidebar permissions
3. Fix stock calculation logic
4. Fix returns stock logic

### Phase 2: High Priority (Week 2)
**Important for production use**
5. Add partial quantity approval
6. Implement serial number validation
7. Add stock availability checks
8. Basic notification system (email)

### Phase 3: Medium Priority (Week 3-4)
**Improves UX significantly**
9. Improve all error messages
10. Fix role name display
11. Add workflow indicators
12. Add help text and tooltips
13. Better empty states
14. Standardize permissions
15. Bulk operations

### Phase 4: Low Priority (Week 5+)
**Polish and refinements**
16. Breadcrumb navigation
17. Clarify cart workflow
18. Duplicate prevention
19. Standardize navigation
20. Enhanced search

---

## NOTES

- All line numbers reference current codebase state
- Some issues may have dependencies (fix in order)
- Test thoroughly after each fix
- Document any database schema changes needed
- Consider creating migration scripts for data fixes

---

**Last Updated:** October 9, 2025
**Next Review:** After Phase 1 completion
