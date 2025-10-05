Got it! Let me create a comprehensive flow based on what I see. You can then tell me what to adjust.

---

# 🏛️ **GOVERNMENT STORES INVENTORY MANAGEMENT SYSTEM**
## *Multi-Category Store with Weapons, Furniture, Electronics & Consumables*

---

## 📦 **ITEM CATEGORIES**

### **Category 1: Weapons & Ammunition** 🔴 CRITICAL
- Rifles, pistols, ammunition, tear gas, etc.
- **Serial number tracking mandatory**
- **Stricter approval workflow**
- **Check-out/Check-in system** (returnable)
- **Authorization certificate required**
- **Gate pass mandatory** for leaving premises
- **Daily register maintenance**
- **Annual audit mandatory**

### **Category 2: Office Furniture**
- Chairs, desks, tables, almirahs, cabinets
- **Asset tagging** (barcode/QR code)
- **Permanent allocation** (not returnable)
- **Transfer tracking** (department to department)
- **Condition monitoring** (new/good/fair/damaged)

### **Category 3: Electronics & Appliances**
- Monitors, keyboards, ACs, fans, printers
- **Serial number tracking**
- **Warranty management**
- **May be returnable** (laptops, projectors) or **permanent** (desktop items)
- **AMC tracking** for repairs

### **Category 4: Stationery & Consumables**
- Pens, papers, files, toners, etc.
- **High volume, quick turnover**
- **Simpler approval** (auto-approve if below threshold)
- **Monthly quota per person/department**

### **Category 5: General Equipment**
- Tools, safety gear, uniforms, misc items
- **May or may not be returnable**
- **Standard approval workflow**

---

## 👥 **USER ROLES & PERMISSIONS**

### **1. REQUESTER (Semi-User)**
**Who**: Regular employees, constables, clerks, officers

**Can Do:**
- Browse available inventory catalog
- Submit requisition requests
- Track request status (Pending → Approved → Ready → Issued → Completed)
- View their requisition history
- Return items (if returnable)
- View their allocated items

**Cannot Do:**
- See total stock quantities (prevents hoarding/leak of info)
- See supplier/pricing details
- Request items they're not authorized for (weapons need special auth)
- Approve their own requests
- Delete or modify after submission

**Special Notes:**
- **For Weapons**: Need authorization certificate/permission letter
- **Payment**: System tracks but doesn't collect (handled separately or free allocation)

---

### **2. STORE KEEPER (User)**
**Who**: Person managing physical store room

**Can Do:**
- Add new stock entries (after receiving goods)
- Enter item details (serial numbers, quantities, etc.)
- Issue approved items to requesters
- Mark items as "Issued"
- Generate delivery challans/gate passes
- Accept returned items
- Update stock levels
- Scan barcodes during issue/return
- Generate stock reports
- Mark damaged/lost items
- Conduct physical stock verification

**Cannot Do:**
- Approve requisitions (segregation of duties)
- Delete transactions
- Approve their own stock entries
- Override system validations

**Special Responsibilities:**
- **Weapons**: Extra verification, gate pass, register entry
- **Daily closing**: Stock tally at end of day
- **Returns processing**: Check condition before accepting

---

### **3. ADMIN / APPROVER**
**Who**: Department head, Store Manager, Section Officer

**Can Do:**
- Approve/Reject requisition requests
- Review justifications
- Set approval thresholds (auto-approve below ₹X)
- Approve stock entries from Store Keeper
- Verify data accuracy
- Handle complaints/disputes
- Approve returns
- Approve item transfers between departments
- Generate department-wise reports
- Mark items for disposal/auction
- Override quantities if needed

**Cannot Do:**
- Issue items directly (Store Keeper's job)
- Create user accounts (Super Admin only)
- Delete audit logs

**Special Authority:**
- **For Weapons**: May need higher authority approval
- **High-value items**: May need additional approver

---

### **4. ARMORY OFFICER** 🔴 (Special Role for Weapons)
**Who**: Licensed officer in charge of weapons

**Can Do:**
- Approve weapon requisitions
- Verify authorization certificates
- Issue weapons personally (or supervise Store Keeper)
- Track weapon check-out/check-in
- Maintain weapons register (daily)
- Generate weapons audit reports
- Approve ammunition issuance
- Handle weapon returns
- Report lost/stolen weapons

**Cannot Do:**
- Approve non-weapon items (not their domain)
- Issue weapons without proper authorization

---

### **5. SUPER ADMIN**
**Who**: IT Admin or Senior Officer

**Can Do:**
- Create/modify/deactivate user accounts
- Assign roles and permissions
- Configure system settings
- Set approval thresholds
- Access complete audit trails
- View all transactions (including weapons)
- Generate compliance reports
- Backup and restore data
- Override any action (with justification logged)
- Configure item categories
- Manage integrations

**Cannot Do:**
- Casually override without valid reason (all overrides logged)

---

## 🔄 **REQUISITION WORKFLOWS**

### **WORKFLOW 1: Standard Items (Furniture, Stationery, Electronics)**

```
┌─────────────────────────────────────────┐
│ STEP 1: REQUEST CREATION                │
├─────────────────────────────────────────┤
│ Requester logs in                       │
│ Browses catalog                         │
│ Adds items to cart                      │
│ Fills form:                             │
│   - Department                          │
│   - Purpose/Justification               │
│   - Quantity needed                     │
│   - Priority (Normal/Urgent)            │
│ Submits request                         │
│                                         │
│ System assigns: REQ-2025-001           │
│ Status: "Pending Approval"             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 2: AUTO-CHECKS                     │
├─────────────────────────────────────────┤
│ • Is stock available?                   │
│ • Is requester authorized?              │
│ • Within department quota?              │
│ • Below auto-approve threshold?         │
│                                         │
│ IF < ₹5,000 value → AUTO-APPROVE       │
│ IF ≥ ₹5,000 value → Needs Admin       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 3: ADMIN APPROVAL                  │
├─────────────────────────────────────────┤
│ Admin receives notification             │
│ Reviews in "Pending Approvals" queue   │
│ Checks:                                 │
│   - Justification valid?                │
│   - Stock available?                    │
│   - Budget available?                   │
│   - Quantity reasonable?                │
│                                         │
│ Decision:                               │
│ ✅ APPROVE → Move to Step 4            │
│ ❌ REJECT → Notify requester           │
│ 🔄 HOLD → Request more info            │
│ ✏️ MODIFY → Adjust quantity & approve  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 4: ISSUANCE                        │
├─────────────────────────────────────────┤
│ Store Keeper sees in "Ready to Issue"  │
│ Physically picks items from store       │
│ Scans barcode (if applicable)           │
│ For serialized items: Enter serial no. │
│ Generates:                              │
│   - Delivery Challan                    │
│   - Gate Pass (if leaving premises)     │
│ Requester signs/acknowledges            │
│ Marks as "Issued" in system            │
│ Stock auto-reduced                      │
│                                         │
│ Status: "Completed"                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 5: ALLOCATION TRACKING             │
├─────────────────────────────────────────┤
│ Item now tracked under requester name   │
│ For assets: Tagged to department        │
│ For consumables: Consumed               │
│                                         │
│ Complete audit trail maintained         │
└─────────────────────────────────────────┘
```

---

### **WORKFLOW 2: Weapons & Ammunition** 🔴 CRITICAL

```
┌─────────────────────────────────────────┐
│ STEP 1: WEAPON REQUISITION              │
├─────────────────────────────────────────┤
│ Authorized Requester only               │
│ Selects weapon type                     │
│ Fills form:                             │
│   - Purpose (Duty/Training/Operation)   │
│   - Duration needed                     │
│   - Authorization letter no.            │
│   - Commanding officer approval         │
│   - Destination (if leaving premises)   │
│ Uploads authorization document          │
│ Submits request                         │
│                                         │
│ Status: "Pending Armory Approval"       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 2: ARMORY OFFICER REVIEW           │
├─────────────────────────────────────────┤
│ Armory Officer verifies:                │
│   - Is requester authorized?            │
│   - Valid authorization letter?         │
│   - Purpose legitimate?                 │
│   - Weapon available?                   │
│   - Return date reasonable?             │
│                                         │
│ IF High-risk operation:                 │
│   → Needs Senior Officer approval too   │
│                                         │
│ Decision: Approve/Reject                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 3: WEAPON ISSUANCE                 │
├─────────────────────────────────────────┤
│ Armory Officer personally issues OR     │
│ Supervises Store Keeper                 │
│                                         │
│ Process:                                │
│ 1. Physical verification of requester   │
│ 2. Check weapon condition               │
│ 3. Record serial number                 │
│ 4. Count ammunition (if issued)         │
│ 5. Enter in Weapons Register (manual)   │
│ 6. Generate:                            │
│    - Weapon Issue Form                  │
│    - Gate Pass (if leaving)             │
│    - Return deadline noted              │
│ 7. Requester signs with ID proof        │
│ 8. System updated: Status "Checked Out" │
│                                         │
│ Weapon now tracked:                     │
│   - Who has it                          │
│   - Serial number                       │
│   - Issue date                          │
│   - Expected return date                │
│   - Purpose                             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 4: WEAPON RETURN                   │
├─────────────────────────────────────────┤
│ Requester returns weapon                │
│ Armory Officer verifies:                │
│   - Serial number matches               │
│   - Weapon condition OK                 │
│   - Ammunition count (if issued)        │
│   - Any damage/issues?                  │
│                                         │
│ Updates system: Status "Returned"       │
│ Manual register updated                 │
│                                         │
│ IF Overdue: Flag for action             │
│ IF Damaged: Create damage report        │
│ IF Ammunition short: Investigation      │
└─────────────────────────────────────────┘
```

---

### **WORKFLOW 3: Bulk Requisition (Department-level)**

```
Department Head requests 20 chairs for new office
        ↓
Submits bulk requisition
        ↓
Admin approves (may need higher approval for bulk)
        ↓
Store Keeper prepares items
        ↓
Delivery scheduled
        ↓
Items delivered to department
        ↓
Department head acknowledges
        ↓
All 20 chairs tagged to that department
```

---

### **WORKFLOW 4: Item Return (for Returnable Items)**

```
Requester has laptop (returnable item)
        ↓
Submits return request via system
        ↓
Store Keeper schedules pickup/drop-off
        ↓
Physical verification:
  - Condition check
  - Accessories complete?
  - Any damage?
        ↓
IF Good condition:
  → Accept return
  → Stock updated (+1)
  → Item status: "Returned - Available"

IF Damaged:
  → Create damage report
  → May charge department
  → Item status: "Returned - Damaged"
  → Send for repair or mark for disposal
```

---

### **WORKFLOW 5: New Stock Entry**

```
New stock arrives at store (Purchase Order)
        ↓
Store Keeper:
  - Verifies against PO
  - Counts quantity
  - Checks quality
  - Takes delivery
        ↓
Enters in system:
  - Item name
  - Category
  - Quantity
  - Supplier
  - PO number
  - Invoice details
  - Unit price
  - Serial numbers (if applicable)
  - Asset tags (if applicable)
        ↓
Status: "Pending Admin Verification"
        ↓
Admin reviews and approves
        ↓
Stock becomes "Available"
        ↓
Requester can now request these items
```

---

## 🎨 **USER INTERFACE DESIGNS**

### **REQUESTER DASHBOARD:**

```
┌─────────────────────────────────────────────────┐
│  🏛️ GOVERNMENT STORES - MY DASHBOARD           │
├─────────────────────────────────────────────────┤
│  Welcome, Constable Ramesh Kumar                │
│  Department: Patrol Division                    │
│                                                 │
│  [🔍 Browse Catalog] [📝 New Request] [📊 My History] │
│                                                 │
│  ⚡ QUICK STATUS:                               │
│  ├─ Pending Approval: 2                        │
│  ├─ Ready for Pickup: 1                        │
│  ├─ Items I Have: 8                            │
│  └─ Overdue Returns: 0                         │
│                                                 │
│  📋 MY RECENT REQUESTS:                         │
│  ┌─────────────────────────────────────────┐   │
│  │ REQ-2025-045 | Office Chair             │   │
│  │ Status: ✅ Approved - Ready for Pickup  │   │
│  │ [Collect from Store]                    │   │
│  ├─────────────────────────────────────────┤   │
│  │ REQ-2025-044 | Desktop Monitor x2       │   │
│  │ Status: ⏳ Pending Admin Approval       │   │
│  │ Submitted: 2 days ago                   │   │
│  ├─────────────────────────────────────────┤   │
│  │ REQ-2025-043 | Stationery Bundle        │   │
│  │ Status: ✓ Completed (3 days ago)       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  🔫 MY CHECKED-OUT WEAPONS:                     │
│  ┌─────────────────────────────────────────┐   │
│  │ Service Rifle - SN: AR-4532             │   │
│  │ Issued: 01-Oct-2025                     │   │
│  │ Return by: 15-Oct-2025 (10 days left)  │   │
│  │ [Request Extension] [Report Issue]      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  📦 MY ALLOCATED ITEMS:                         │
│  • Office Chair (Asset: CH-2301)               │
│  • Desktop Computer (Asset: PC-1156)           │
│  • Keyboard & Mouse                            │
│  • Desk Lamp                                   │
│  [View All 8 Items]                            │
└─────────────────────────────────────────────────┘
```

---

### **NEW REQUISITION FORM:**

```
┌─────────────────────────────────────────────────┐
│  📝 NEW REQUISITION REQUEST                     │
├─────────────────────────────────────────────────┤
│  Requester: Ramesh Kumar (Auto-filled)          │
│  Department: [Patrol Division] ▼                │
│  Request Type: ○ For Self  ○ For Department    │
│  Priority: ○ Normal  ○ Urgent  ○ Emergency     │
│                                                 │
│  ─────────────────────────────────────────      │
│  SEARCH ITEMS:                                  │
│  ┌───────────────────────────────────────┐     │
│  │ [Type to search...] 🔍                │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  BROWSE BY CATEGORY:                            │
│  [📚 Stationery] [🪑 Furniture] [💻 Electronics] │
│  [🔫 Weapons*] [⚙️ Equipment] [👕 Uniforms]     │
│  * Requires authorization                       │
│                                                 │
│  ─────────────────────────────────────────      │
│  SELECTED ITEMS:                                │
│  ┌───────────────────────────────────────────┐ │
│  │ 1. Office Chair (Revolving)               │ │
│  │    Qty: [1] ▼  |  Available: 15          │ │
│  │    Est. Value: ₹5,500                     │ │
│  │    [Remove]                                │ │
│  ├───────────────────────────────────────────┤ │
│  │ 2. Monitor 24" LED                        │ │
│  │    Qty: [2] ▼  |  Available: 8           │ │
│  │    Est. Value: ₹18,000 (₹9,000 each)     │ │
│  │    [Remove]                                │ │
│  └───────────────────────────────────────────┘ │
│  [+ Add More Items]                             │
│                                                 │
│  Total Estimated Value: ₹23,500                │
│  ⚠️ This requires Admin approval (>₹5,000)     │
│                                                 │
│  ─────────────────────────────────────────      │
│  JUSTIFICATION (Required):                      │
│  ┌───────────────────────────────────────────┐ │
│  │ Setting up new workstation as per        │ │
│  │ office expansion plan. Approved by        │ │
│  │ Head Constable via memo HC/2025/034      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  📎 Attach Documents (Optional):                │
│  [Choose Files] memo_approval.pdf ✓            │
│                                                 │
│  Expected Date Needed: [15-Oct-2025] 📅        │
│                                                 │
│  ─────────────────────────────────────────      │
│  [Submit Request] [Save as Draft] [Cancel]      │
└─────────────────────────────────────────────────┘
```

---

### **WEAPON REQUISITION FORM:** 🔴

```
┌─────────────────────────────────────────────────┐
│  🔫 WEAPON REQUISITION REQUEST                  │
├─────────────────────────────────────────────────┤
│  ⚠️ WARNING: Only authorized personnel          │
│                                                 │
│  Requester: Head Constable Suresh Kumar         │
│  Badge No: [HC-1234]                           │
│  Department: [Special Operations] ▼             │
│                                                 │
│  ─────────────────────────────────────────      │
│  WEAPON DETAILS:                                │
│  Weapon Type: [Service Rifle] ▼                │
│     Available: 8 rifles                         │
│                                                 │
│  Ammunition Required: [✓] Yes  [ ] No          │
│  Rounds: [50] (Max: 100 for training)          │
│                                                 │
│  ─────────────────────────────────────────      │
│  PURPOSE:                                       │
│  ○ Duty Assignment                             │
│  ○ Training Exercise                           │
│  ○ Special Operation                           │
│  ○ Range Practice                              │
│                                                 │
│  Detailed Purpose:                              │
│  ┌───────────────────────────────────────────┐ │
│  │ Range practice and qualification test as  │ │
│  │ per annual training schedule. Authorized  │ │
│  │ by Commandant vide order CMD/2025/156     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ─────────────────────────────────────────      │
│  AUTHORIZATION:                                 │
│  Authorization Letter No: [CMD/2025/156]        │
│  Issued By: [Commandant K.S. Reddy]           │
│  Date: [01-Oct-2025] 📅                        │
│                                                 │
│  📎 Upload Authorization Letter (Mandatory):    │
│  [Choose File] authorization.pdf ✓             │
│                                                 │
│  ─────────────────────────────────────────      │
│  DURATION:                                      │
│  Check-out Date: [05-Oct-2025] 📅              │
│  Expected Return: [05-Oct-2025] 📅             │
│  Duration: Same Day / Training                  │
│                                                 │
│  Will weapon leave premises? ○ Yes  ○ No       │
│  If Yes, Destination: [Range Ground, Sector-4] │
│                                                 │
│  ─────────────────────────────────────────      │
│  ACKNOWLEDGMENT:                                │
│  [✓] I understand this weapon is my            │
│      responsibility until returned              │
│  [✓] I will follow all safety protocols         │
│  [✓] I will report any issues immediately       │
│                                                 │
│  ─────────────────────────────────────────      │
│  [Submit for Armory Approval] [Cancel]          │
└─────────────────────────────────────────────────┘
```

---

### **ADMIN APPROVAL DASHBOARD:**

```
┌─────────────────────────────────────────────────┐
│  👔 ADMIN DASHBOARD - Store Manager             │
├─────────────────────────────────────────────────┤
│  [Pending Approvals: 12] [Stock Entry: 3]       │
│  [Reports] [Settings] [Disposal Queue: 5]       │
│                                                 │
│  🔔 ALERTS:                                     │
│  • 3 urgent requests pending >48 hours          │
│  • 5 items below reorder level                  │
│  • 8 overdue weapon returns                     │
│                                                 │
│  ─────────────────────────────────────────      │
│  📋 PENDING APPROVALS (12)                      │
│  [Sort: Priority ▼] [Filter: All ▼]            │
│                                                 │
│  🔴 URGENT (3):                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ REQ-2025-047 | Desktop Computer x1        │ │
│  │ Requester: Inspector Mohan                │ │
│  │ Department: Cyber Crime                   │ │
│  │ Value: ₹45,000 | Pending: 3 days         │ │
│  │ Reason: Existing computer crashed, urgent │ │
│  │         forensic analysis needed          │ │
│  │ Stock: ✓ Available (3 units)             │ │
│  │ Budget: ⚠️ Dept budget 85% used          │ │
│  │                                           │ │
│  │ [✅ Approve] [❌ Reject] [📝 Request Info] │ │
│  │ [💬 Add Note] [📄 View Details]          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ REQ-2025-046 | Office Chairs x5           │ │
│  │ Requester: Head Clerk Sharma              │ │
│  │ Department: Administration                │ │
│  │ Value: ₹27,500 | Pending: 2 days         │ │
│  │ Reason: New recruits joining, need        │ │
│  │         workstation setup                 │ │
│  │ Stock: ✓ Available (15 units)            │ │
│  │ Budget: ✓ Within limits                  │ │
│  │ Attachment: 📎 joining_order.pdf          │ │
│  │                                           │ │
│  │ Quick Actions:                            │ │
│  │ [✅ Approve All] [✏️ Approve 3 only]      │ │
│  │ [❌ Reject] [💬 Message Requester]       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  🟡 NORMAL (9):                                 │
│  [View All Normal Requests]                     │
│                                                 │
│  ─────────────────────────────────────────      │
│  BULK ACTIONS:                                  │
│  [Select All Stationery Requests (5)]           │
│  [✅ Bulk Approve] [❌ Bulk Reject]            │
└─────────────────────────────────────────────────┘
```

---

### **STORE KEEPER DASHBOARD:**

```
┌─────────────────────────────────────────────────┐
│  📦 STORE KEEPER DASHBOARD                      │
├─────────────────────────────────────────────────┤
│  Store Keeper: Rajesh Kumar                     │
│  Today: Sunday, 05-Oct-2025                     │
│                                                 │
│  ⚡ TODAY'S ACTIVITY:                           │
│  • Items Issued: 23                             │
│  • Items Returned: 5                            │
│  • Stock Received: 8 items (new)               │
│  • Pending Issues: 7                            │
│                                                 │
│  🔔 ALERTS:                                     │
│  • 2 urgent requests to issue now               │
│  • 1 overdue return (weapon) - CRITICAL         │
│  • 3 items need physical verification           │
│                                                 │
│  ─────────────────────────────────────────      │
│  📋 READY TO ISSUE (7)                          │
│  [Sort: Priority ▼] [Filter: All ▼]            │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔴 REQ-2025-047 | URGENT                  │ │
│  │ Desktop Computer x1                       │ │
│  │ For: Inspector Mohan (Cyber Crime)        │ │
│  │ Approved by: Admin Verma (2 hrs ago)      │ │
│  │ Serial No: [Enter during issue]           │ │
│  │                                           │ │
│  │ [🎯 Issue Now] [📋 Print Challan]         │ │
│  │ [📍 Check Location] [📞 Call Requester]  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ REQ-2025-046 | Office Chairs x5           │ │
│  │ For: Dept Admin (Bulk Delivery)           │ │
│  │ Approved: 3 only (modified by admin)      │ │
│  │ Approved by: Admin Verma (1 day ago)      │ │
│  │                                           │ │
│  │ Asset Tags: [Scan or Enter]              │ │
│  │ CH-2401 ✓, CH-2402 ✓, CH-2403 [ ]       │ │
│  │                                           │ │
│  │ [🎯 Issue All] [📋 Bulk Scan]            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ─────────────────────────────────────────      │
│  🔙 RETURNS PENDING ACCEPTANCE (3)              │
│  [View Return Queue]                            │
│                                                 │
│  ─────────────────────────────────────────      │
│  📦 NEW STOCK ENTRY                             │
│  [+ Receive New Stock]                          │
│  [📊 View Stock Levels]                         │
│  [🔍 Physical Verification]                     │
│  [📄 Generate Reports]                          │
└─────────────────────────────────────────────────┘
```

---

### **ISSUE ITEM SCREEN (Store Keeper):**

```
┌─────────────────────────────────────────────────┐
│  🎯 ISSUE ITEM                                  │
├─────────────────────────────────────────────────┤
│  Requisition: REQ-2025-047                      │
│  Status: Approved ✓                             │
│                                                 │
│  ─────────────────────────────────────────      │
│  REQUESTER DETAILS:                             │
│  Name: Inspector Mohan Kumar                    │
│  Badge: INS-5678                                │
│  Department: Cyber Crime Unit                   │
│  Contact: +91-9876543210                        │
│                                                 │
│  ─────────────────────────────────────────      │
│  ITEM TO ISSUE:                                 │
│  Desktop Computer - Dell OptiPlex 7090          │
│  Quantity: 1                                    │
│  Category: Electronics                          │
│  Item Type: Returnable Asset                    │
│                                                 │
│  ─────────```
│  ─────────────────────────────────────────      │
│  ITEM DETAILS ENTRY:                            │
│  Serial Number: [Scan or Enter]                 │
│  ┌───────────────────────────────────────┐     │
│  │ PC-2025-1157___________________ 📷🔍  │     │
│  └───────────────────────────────────────┘     │
│  [Scan Barcode] [Manual Entry]                  │
│                                                 │
│  Asset Tag: [Auto-generated]                    │
│  PC-2025-1157                                   │
│                                                 │
│  Condition: ○ New  ● Good  ○ Fair              │
│                                                 │
│  Accessories Included:                          │
│  [✓] Power Cable                                │
│  [✓] Keyboard                                   │
│  [✓] Mouse                                      │
│  [✓] Monitor Cable                              │
│  [ ] Additional Items: _______________          │
│                                                 │
│  ─────────────────────────────────────────      │
│  LOCATION TRACKING:                             │
│  Current Location: Store Room - Rack A3         │
│  New Location: Cyber Crime Office - Desk 12     │
│                                                 │
│  ─────────────────────────────────────────      │
│  EXPECTED RETURN:                               │
│  This is a returnable item                      │
│  Expected Return Date: [N/A - Permanent] ▼      │
│  ○ Permanent Allocation                         │
│  ○ Temporary (Specify date)                     │
│                                                 │
│  ─────────────────────────────────────────      │
│  DELIVERY METHOD:                               │
│  ○ Pickup from Store                            │
│  ● Delivery to Department                       │
│                                                 │
│  Gate Pass Required: [✓] Yes (Leaving building) │
│                                                 │
│  ─────────────────────────────────────────      │
│  DOCUMENTS TO GENERATE:                         │
│  [✓] Delivery Challan                           │
│  [✓] Gate Pass                                  │
│  [✓] Asset Handover Form                        │
│  [ ] Installation Certificate                   │
│                                                 │
│  ─────────────────────────────────────────      │
│  REQUESTER ACKNOWLEDGMENT:                      │
│  Received By: [Signature/OTP]                   │
│  □ Send OTP to mobile                           │
│  □ Digital Signature                            │
│  □ Physical Signature (scan later)              │
│                                                 │
│  Date & Time: [Auto: 05-Oct-2025, 5:45 PM]     │
│                                                 │
│  ─────────────────────────────────────────      │
│  NOTES (Optional):                              │
│  ┌───────────────────────────────────────┐     │
│  │ Delivered to Cyber Crime office       │     │
│  │ Installation done by IT team          │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  ─────────────────────────────────────────      │
│  [✅ Complete Issue] [📄 Print Docs] [Cancel]  │
└─────────────────────────────────────────────────┘
```

---

### **ARMORY OFFICER DASHBOARD:** 🔴

```
┌─────────────────────────────────────────────────┐
│  🔫 ARMORY OFFICER DASHBOARD                    │
├─────────────────────────────────────────────────┤
│  Officer: Major Vikram Singh                    │
│  License No: ARM-2024-456                       │
│  Today: Sunday, 05-Oct-2025                     │
│                                                 │
│  ⚠️ CRITICAL ALERTS:                            │
│  🔴 3 weapons overdue for return!               │
│  🔴 1 ammunition count mismatch reported         │
│  🟡 2 weapons due today                         │
│  🟡 5 maintenance schedules pending              │
│                                                 │
│  📊 QUICK STATS:                                │
│  • Total Weapons: 145                           │
│  • Available: 98                                │
│  • Checked Out: 47                              │
│  • Under Maintenance: 0                         │
│  • Condemned: 0                                 │
│                                                 │
│  ─────────────────────────────────────────      │
│  🚨 OVERDUE RETURNS (3)                         │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔴 CRITICAL - 5 DAYS OVERDUE               │ │
│  │ Service Pistol - SN: P-4521                │ │
│  │ Issued to: Constable Ravi Kumar            │ │
│  │ Due: 30-Sep-2025 | Overdue: 5 days        │ │
│  │ Purpose: Duty Assignment                   │ │
│  │ Contact: +91-9876543210                    │ │
│  │                                            │ │
│  │ [📞 Call Now] [🚨 Send Alert]             │ │
│  │ [📝 File Report] [🔍 Locate]              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ─────────────────────────────────────────      │
│  📋 PENDING APPROVALS (4)                       │
│  ┌───────────────────────────────────────────┐ │
│  │ REQ-WPN-2025-023                           │ │
│  │ Service Rifle x1 + 50 rounds              │ │
│  │ Requester: HC Suresh (Special Ops)         │ │
│  │ Purpose: Range Practice & Qualification    │ │
│  │ Duration: Same day return                  │ │
│  │ Auth: CMD/2025/156 ✓                      │ │
│  │                                            │ │
│  │ Authorization Document:                    │ │
│  │ 📎 authorization.pdf [View]               │ │
│  │                                            │ │
│  │ Verification Checklist:                    │ │
│  │ [✓] Requester authorized                   │ │
│  │ [✓] Valid authorization letter             │ │
│  │ [✓] Purpose legitimate                     │ │
│  │ [✓] Weapon available (8 rifles)           │ │
│  │ [✓] Ammunition available (500 rounds)     │ │
│  │                                            │ │
│  │ [✅ Approve] [❌ Reject] [📝 Request Info] │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ─────────────────────────────────────────      │
│  🎯 READY TO ISSUE (2)                          │
│  [View Approved Weapon Requests]                │
│                                                 │
│  ─────────────────────────────────────────      │
│  🔙 EXPECTED RETURNS TODAY (2)                  │
│  • Rifle AR-3421 - Constable Sharma (4 PM)     │
│  • Pistol P-8765 - Inspector Reddy (6 PM)      │
│                                                 │
│  ─────────────────────────────────────────      │
│  📊 REPORTS & REGISTERS:                        │
│  [📖 Daily Weapons Register]                    │
│  [📊 Monthly Audit Report]                      │
│  [🔍 Ammunition Usage Report]                   │
│  [⚙️ Maintenance Schedule]                      │
│  [📝 Incident Reports]                          │
└─────────────────────────────────────────────────┘
```

---

### **WEAPON ISSUANCE SCREEN (Armory):** 🔴

```
┌─────────────────────────────────────────────────┐
│  🔫 WEAPON ISSUANCE - CRITICAL PROCESS          │
├─────────────────────────────────────────────────┤
│  Requisition: REQ-WPN-2025-023                  │
│  Status: ✅ Approved by Armory Officer          │
│                                                 │
│  ⚠️ SECURITY PROTOCOL ACTIVE                    │
│                                                 │
│  ─────────────────────────────────────────      │
│  REQUESTER VERIFICATION:                        │
│  Name: Head Constable Suresh Kumar              │
│  Badge No: HC-1234                              │
│  Department: Special Operations                 │
│  Contact: +91-9123456789                        │
│                                                 │
│  Photo ID Verification:                         │
│  [📷 Capture Photo] [✓ Photo Verified]         │
│                                                 │
│  Biometric Verification:                        │
│  [👆 Fingerprint Scan] [Pending...]            │
│                                                 │
│  ─────────────────────────────────────────      │
│  WEAPON SELECTION:                              │
│  Type: Service Rifle (INSAS 5.56mm)            │
│  Available Units: 8                             │
│                                                 │
│  Select Weapon by Serial:                       │
│  ┌───────────────────────────────────────┐     │
│  │ ○ AR-4501 | Condition: Excellent      │     │
│  │ ○ AR-4502 | Condition: Good           │     │
│  │ ● AR-4503 | Condition: Excellent      │     │
│  │ ○ AR-4504 | Condition: Good           │     │
│  └───────────────────────────────────────┘     │
│  [Scan Weapon Barcode] 🔍                      │
│                                                 │
│  Selected: AR-4503                              │
│  Last Issued: 20-Sep-2025                       │
│  Last Maintenance: 15-Aug-2025 ✓               │
│                                                 │
│  Physical Verification:                         │
│  [✓] Serial number matches                      │
│  [✓] Weapon clean and functional                │
│  [✓] No visible damage                          │
│  [✓] Safety mechanisms working                  │
│  [✓] Magazine present                           │
│                                                 │
│  ─────────────────────────────────────────      │
│  AMMUNITION ISSUANCE:                           │
│  Type: 5.56mm Ball Ammunition                   │
│  Quantity Approved: 50 rounds                   │
│                                                 │
│  Magazine Load:                                 │
│  Magazine 1: [30] rounds                        │
│  Magazine 2: [20] rounds                        │
│  Total: [50] rounds ✓                          │
│                                                 │
│  Ammunition Count Verification:                 │
│  Counted by Officer: [50] rounds                │
│  Verified by Requester: [50] rounds ✓          │
│                                                 │
│  ─────────────────────────────────────────      │
│  CHECKOUT DETAILS:                              │
│  Purpose: Range Practice & Qualification        │
│  Authorization: CMD/2025/156                    │
│                                                 │
│  Checkout Date/Time: 05-Oct-2025, 6:00 PM      │
│  Expected Return: 05-Oct-2025, 10:00 PM        │
│  Duration: 4 hours (Same day)                   │
│                                                 │
│  Leaving Premises: ● Yes  ○ No                 │
│  Destination: Range Ground, Sector-4            │
│  Supervising Officer: Captain Verma             │
│                                                 │
│  ─────────────────────────────────────────      │
│  SAFETY BRIEFING:                               │
│  [✓] Weapon handling protocols reviewed         │
│  [✓] Safety rules explained                     │
│  [✓] Emergency procedures discussed             │
│  [✓] Return instructions clear                  │
│                                                 │
│  ─────────────────────────────────────────      │
│  REQUESTER ACKNOWLEDGMENT:                      │
│  "I acknowledge receipt of:                     │
│   - Service Rifle (Serial: AR-4503)            │
│   - 50 rounds of 5.56mm ammunition             │
│  I take full responsibility for this weapon     │
│  until its return. I will follow all safety     │
│  protocols and return by specified time."       │
│                                                 │
│  Digital Signature: [Sign Here]                 │
│  □ Signature Pad  ● OTP Verification           │
│                                                 │
│  OTP sent to: +91-91234**789                   │
│  Enter OTP: [______]                            │
│                                                 │
│  ─────────────────────────────────────────      │
│  DOCUMENTS TO GENERATE:                         │
│  [✓] Weapon Issue Form (F-14)                   │
│  [✓] Ammunition Issue Register Entry            │
│  [✓] Gate Pass (Armed Personnel)                │
│  [✓] Daily Weapons Register Entry               │
│                                                 │
│  ─────────────────────────────────────────      │
│  MANUAL REGISTER:                               │
│  Entry No: [WR-2025-1847] (Auto-generated)     │
│  [✅ Mark in Physical Register]                 │
│                                                 │
│  ─────────────────────────────────────────      │
│  [✅ Complete Issue] [📄 Print All Docs]        │
│  [❌ Cancel] [🔙 Back]                          │
│                                                 │
│  ⚠️ This action will be logged in audit trail   │
└─────────────────────────────────────────────────┘
```

---

### **WEAPON RETURN SCREEN (Armory):** 🔴

```
┌─────────────────────────────────────────────────┐
│  🔙 WEAPON RETURN - VERIFICATION PROCESS        │
├─────────────────────────────────────────────────┤
│  Return Entry No: WR-RTN-2025-892               │
│                                                 │
│  ─────────────────────────────────────────      │
│  ORIGINAL ISSUE DETAILS:                        │
│  Issue No: WR-2025-1847                         │
│  Weapon: Service Rifle AR-4503                  │
│  Issued To: HC Suresh Kumar                     │
│  Issue Date: 05-Oct-2025, 6:00 PM              │
│  Expected Return: 05-Oct-2025, 10:00 PM        │
│  Ammunition Issued: 50 rounds                   │
│                                                 │
│  Return Status:                                 │
│  ✅ ON TIME (Returned: 05-Oct-2025, 9:45 PM)   │
│                                                 │
│  ─────────────────────────────────────────      │
│  REQUESTER VERIFICATION:                        │
│  [✓] Identity verified (HC Suresh Kumar)        │
│  [✓] Photo matched                              │
│  [✓] Biometric verified                         │
│                                                 │
│  ─────────────────────────────────────────      │
│  WEAPON INSPECTION:                             │
│  Serial Number Verification:                    │
│  Expected: AR-4503                              │
│  Returned: [Scan/Enter] AR-4503 ✓              │
│  [Scan Barcode] 🔍                             │
│                                                 │
│  Physical Condition Check:                      │
│  [✓] Serial number matches                      │
│  [✓] No visible damage                          │
│  [✓] Weapon clean                               │
│  [✓] All parts present                          │
│  [✓] Safety mechanisms working                  │
│  [✓] Magazine returned                          │
│                                                 │
│  Overall Condition: ● Excellent  ○ Good         │
│                     ○ Fair  ○ Damaged          │
│                                                 │
│  Damage/Issues (if any):                        │
│  ┌───────────────────────────────────────┐     │
│  │ None - Weapon in excellent condition  │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  ─────────────────────────────────────────      │
│  AMMUNITION VERIFICATION:                       │
│  Issued: 50 rounds                              │
│  Used: [35] rounds (for practice)              │
│  Returned: [15] rounds                          │
│  Empty Casings: [35] casings                    │
│                                                 │
│  Verification Status:                           │
│  ✅ Count Matches (50 = 35 used + 15 returned) │
│                                                 │
│  Physical Count by Officer:                     │
│  Unused Rounds: [15] ✓                         │
│  Empty Casings: [35] ✓                         │
│  Total Accounted: [50] ✓                       │
│                                                 │
│  Ammunition Condition:                          │
│  [✓] Returned rounds intact                     │
│  [✓] No damaged ammunition                      │
│                                                 │
│  ─────────────────────────────────────────      │
│  RANGE OFFICER REPORT:                          │
│  Supervising Officer: Capt. Verma               │
│  Practice Rounds Fired: 35                      │
│  Qualification Score: 88/100                    │
│  [📎 Range Report Attached] ✓                  │
│                                                 │
│  ─────────────────────────────────────────      │
│  INCIDENT REPORT (if any):                      │
│  Any Issues During Use?                         │
│  ○ None  ○ Malfunction  ○ Misfire             │
│  ○ Lost/Stolen  ○ Other                        │
│                                                 │
│  [✓] No incidents reported                      │
│                                                 │
│  ─────────────────────────────────────────      │
│  POST-RETURN ACTIONS:                           │
│  Weapon Status: ● Ready for Reissue            │
│                 ○ Needs Cleaning                │
│                 ○ Needs Maintenance             │
│                 ○ Needs Repair                  │
│                                                 │
│  Next Action:                                   │
│  [✓] Return to armory rack                      │
│  [ ] Send for cleaning                          │
│  [ ] Schedule maintenance                       │
│                                                 │
│  ─────────────────────────────────────────      │
│  REGISTER UPDATES:                              │
│  [✓] Daily Weapons Register updated             │
│  [✓] Ammunition Register updated                │
│  [✓] Issue record marked "Returned"            │
│  [✓] System inventory updated                   │
│                                                 │
│  ─────────────────────────────────────────      │
│  ACCEPTANCE CONFIRMATION:                       │
│  Received By: Major Vikram Singh                │
│  Designation: Armory Officer                    │
│  Date/Time: 05-Oct-2025, 9:45 PM               │
│                                                 │
│  [✅ Complete Return Process]                   │
│  [📄 Print Return Receipt]                      │
│  [❌ Cancel]                                    │
└─────────────────────────────────────────────────┘
```

---

### **SUPER ADMIN DASHBOARD:**

```
┌─────────────────────────────────────────────────┐
│  ⚙️ SUPER ADMIN DASHBOARD                       │
├─────────────────────────────────────────────────┤
│  Administrator: System Admin                    │
│  Last Login: 05-Oct-2025, 8:30 AM              │
│                                                 │
│  🔔 SYSTEM ALERTS:                              │
│  🟢 All systems operational                     │
│  🟡 Database backup pending (scheduled 11 PM)   │
│  🟢 No security incidents                       │
│                                                 │
│  ─────────────────────────────────────────      │
│  👥 USER MANAGEMENT                             │
│  ┌───────────────────────────────────────┐     │
│  │ Total Users: 156                      │     │
│  │ • Requesters: 128                     │     │
│  │ • Store Keepers: 12                   │     │
│  │ • Admins: 8                           │     │
│  │ • Armory Officers: 3                  │     │
│  │ • Super Admins: 5                     │     │
│  │                                       │     │
│  │ Recent Activity:                      │     │
│  │ • 3 new users created today           │     │
│  │ • 2 users deactivated (transferred)   │     │
│  │ • 1 role change pending approval      │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  [➕ Create New User] [👤 Manage Users]         │
│  [🔐 Role Management] [📊 User Activity Log]    │
│                                                 │
│  ─────────────────────────────────────────      │
│  📊 SYSTEM STATISTICS (Today)                   │
│  ┌───────────────────────────────────────┐     │
│  │ Requisitions:                         │     │
│  │ • Submitted: 45                       │     │
│  │ • Approved: 38                        │     │
│  │ • Rejected: 2                         │     │
│  │ • Pending: 5                          │     │
│  │                                       │     │
│  │ Issuances:                            │     │
│  │ • Items Issued: 67                    │     │
│  │ • Items Returned: 12                  │     │
│  │ • Weapons Issued: 8                   │     │
│  │ • Weapons Returned: 7                 │     │
│  │                                       │     │
│  │ Stock:                                │     │
│  │ • New Stock Received: 23 items        │     │
│  │ • Below Reorder Level: 8 items        │     │
│  │ • Total Stock Value: ₹45.2 Lakhs     │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  ─────────────────────────────────────────      │
│  🔍 AUDIT & COMPLIANCE                          │
│  [📖 View Complete Audit Trail]                 │
│  [🔫 Weapons Register (All entries)]            │
│  [📊 Generate Compliance Report]                │
│  [🚨 Security Incident Log]                     │
│  [⚠️ Anomaly Detection Report]                  │
│                                                 │
│  Recent Audit Flags:                            │
│  • None - All clear ✓                          │
│                                                 │
│  ─────────────────────────────────────────      │
│  ⚙️ SYSTEM CONFIGURATION                        │
│  [⚡ Approval Thresholds]                       │
│  [📁 Item Categories Management]                │
│  [🔔 Notification Settings]                     │
│  [🎨 System Preferences]                        │
│  [🔌 Integration Settings]                      │
│                                                 │
│  ─────────────────────────────────────────      │
│  💾 BACKUP & MAINTENANCE                        │
│  Last Backup: 04-Oct-2025, 11:00 PM ✓         │
│  Next Backup: Today, 11:00 PM (Scheduled)      │
│  Backup Status: ✅ All backups successful       │
│                                                 │
│  [💾 Manual Backup Now]                         │
│  [📥 Restore from Backup]                       │
│  [🔧 System Maintenance]                        │
│                                                 │
│  ─────────────────────────────────────────      │
│  📈 ANALYTICS & REPORTS                         │
│  [📊 Dashboard Analytics]                       │
│  [📉 Consumption Trends]                        │
│  [💰 Financial Reports]                         │
│  [👤 User Activity Analysis]                    │
│  [🎯 Performance Metrics]                       │
└─────────────────────────────────────────────────┘
```

---

## 📊 **DATABASE SCHEMA**

### **Core Tables:**

```sql
-- USERS TABLE
users:
  - user_id (PK)
  - username
  - password_hash
  - full_name
  - email
  - phone
  - badge_number
  - department_id (FK)
  - role (requester/storekeeper/admin/armory_officer/superadmin)
  - is_active
  - is_weapon_authorized (boolean)
  - created_at
  - created_by
  - last_login
  - profile_photo

-- DEPARTMENTS TABLE
departments:
  - department_id (PK)
  - department_name
  - department_code
  - head_officer_id (FK to users)
  - budget_allocated
  - budget_used
  - location
  - contact_number
  - is_active

-- ITEM_CATEGORIES TABLE
item_categories:
  - category_id (PK)
  - category_name (Weapons/Furniture/Electronics/Stationery/Equipment)
  - description
  - requires_special_approval (boolean)
  - is_returnable_default (boolean)
  - icon_url

-- ITEMS TABLE
items:
  - item_id (PK)
  - item_code (unique)
  - item_name
  - category_id (FK)
  - description
  - unit_of_measurement
  - unit_price
  - reorder_level
  - is_serialized (boolean)
  - is_returnable (boolean)
  - requires_authorization (boolean - for weapons)
  - is_controlled_item (boolean)
  - warranty_months
  - image_url
  - is_active
  - created_at
  - created_by

-- STOCK TABLE
stock:
  - stock_id (PK)
  - item_id (FK)
  - quantity_available
  - quantity_reserved (for approved pending issue)
  - quantity_issued
  - total_quantity
  - location (rack/shelf location)
  - last_updated
  - last_stock_take_date

-- SERIALIZED_ITEMS TABLE (for individual tracking)
serialized_items:
  - serial_item_id (PK)
  - item_id (FK)
  - serial_number (unique)
  - asset_tag
  - purchase_date
  - purchase_order_id
  - supplier_id (FK)
  - warranty_expiry
  - condition (new/good/fair/damaged/condemned)
  - status (available/issued/under_maintenance/disposed)
  - current_holder_id (FK to users) - null if available
  - current_location
  - notes
  - created_at

-- REQUISITIONS TABLE
requisitions:
  - requisition_id (PK)
  - requisition_number (unique, auto: REQ-2025-001)
  - requester_id (FK to users)
  - department_id (FK)
  - request_date
  - request_type (self/department/bulk)
  - priority (normal/urgent/emergency)
  - status (pending/approved/rejected/issued/completed/cancelled)
  - justification
  - total_estimated_value
  - approved_by (FK to users)
  - approved_date
  - rejection_reason
  - issued_by (FK to users)
  - issued_date
  - completed_date
  - attachment_urls (JSON array)
  - notes

-- REQUISITION_ITEMS TABLE
requisition_items:
  - req_item_id (PK)
  - requisition_id (FK)
  - item_id (FK)
  - quantity_requested
  - quantity_approved
  - quantity_issued
  - unit_price
  - total_value
  - status (pending/approved/rejected/issued)

-- ISSUANCES TABLE
issuances:
  - issuance_id (PK)
  - issuance_number (unique)
  - requisition_id (FK)
  - item_id (FK)
  - serial_item_id (FK) - if serialized
  - quantity_issued
  - issued_to (FK to users)
  - issued_by (FK to users)
  - issue_date
  - issue_time
  - expected_return_date (null if permanent)
  - is_returnable
  - delivery_method (pickup/delivery)
  - destination_location
  - challan_number
  - gate_pass_number
  - requester_signature
  - acknowledgment_method (physical/digital/otp)
  - condition_at_issue
  - accessories_issued (JSON)
  - notes
  - status (active/returned/overdue/lost)

-- RETURNS TABLE
returns:
  - return_id (PK)
  - issuance_id (FK)
  - return_date
  - return_time
  - returned_by (FK to users)
  - accepted_by (FK to users)
  - condition_at_return
  - damage_reported (boolean)
  - damage_description
  - accessories_returned (JSON)
  - is_complete_return
  - penalty_amount
  - notes
  - status (accepted/rejected/pending_inspection)

-- WEAPONS_REGISTER TABLE (Special tracking for weapons)
weapons_register:
  - register_id (PK)
  - entry_number (unique, sequential)
  - entry_date
  - entry_type (issue/return)
  - weapon_id (FK to serialized_items)
  - issued_to (FK to users)
  - issued_by (FK to users - armory officer)
  - authorization_letter_number
  - authorization_document_url
  - purpose
  - destination
  - ammunition_issued
  - ammunition_returned
  - ammunition_used
  - empty_casings_count
  - checkout_time
  - expected_return_time
  - actual_return_time
  - return_status (on_time/late/overdue)
  - overdue_days
  - supervising_officer
  - incident_reported (boolean)
  - incident_description
  - range_report_url
  - gate_pass_number
  - manual_register_entry_number
  - notes

-- STOCK_MOVEMENTS TABLE
stock_movements:
  - movement_id (PK)
  - item_id (FK)
  - movement_type (inward/outward/adjustment/transfer/disposal```sql
  - movement_type (inward/outward/adjustment/transfer/disposal)
  - quantity
  - movement_date
  - reference_type (requisition/purchase/return/adjustment)
  - reference_id
  - from_location
  - to_location
  - performed_by (FK to users)
  - approved_by (FK to users)
  - reason
  - notes
  - created_at

-- PURCHASE_ORDERS TABLE
purchase_orders:
  - po_id (PK)
  - po_number (unique)
  - po_date
  - supplier_id (FK)
  - total_amount
  - status (pending/approved/received/partially_received/cancelled)
  - expected_delivery_date
  - actual_delivery_date
  - created_by (FK to users)
  - approved_by (FK to users)
  - notes
  - attachment_urls (JSON)

-- PURCHASE_ORDER_ITEMS TABLE
po_items:
  - po_item_id (PK)
  - po_id (FK)
  - item_id (FK)
  - quantity_ordered
  - quantity_received
  - unit_price
  - total_price
  - received_date
  - received_by (FK to users)
  - grn_number (Goods Receipt Note)
  - status (pending/received/partially_received)

-- SUPPLIERS TABLE
suppliers:
  - supplier_id (PK)
  - supplier_name
  - supplier_code
  - contact_person
  - email
  - phone
  - address
  - gstin
  - pan
  - is_active
  - rating
  - notes

-- APPROVALS_WORKFLOW TABLE
approvals_workflow:
  - approval_id (PK)
  - record_type (requisition/stock_entry/disposal)
  - record_id
  - approval_level (1/2/3)
  - approver_id (FK to users)
  - approval_status (pending/approved/rejected/forwarded)
  - approval_date
  - comments
  - next_approver_id (FK to users)
  - created_at

-- AUDIT_LOG TABLE
audit_log:
  - log_id (PK)
  - user_id (FK)
  - action_type (create/update/delete/approve/reject/issue/return)
  - table_name
  - record_id
  - old_values (JSON)
  - new_values (JSON)
  - ip_address
  - device_info
  - timestamp
  - reason
  - is_override (boolean)
  - override_justification

-- NOTIFICATIONS TABLE
notifications:
  - notification_id (PK)
  - user_id (FK)
  - notification_type (requisition/approval/issue/return/alert)
  - title
  - message
  - reference_type
  - reference_id
  - priority (low/normal/high/critical)
  - is_read
  - read_at
  - created_at
  - expires_at

-- ALERTS_RULES TABLE
alerts_rules:
  - alert_id (PK)
  - alert_type (low_stock/overdue_return/overdue_approval)
  - condition_field
  - condition_operator
  - condition_value
  - notification_template
  - recipient_roles (JSON array)
  - is_active
  - created_by
  - created_at

-- DISPOSAL_RECORDS TABLE
disposal_records:
  - disposal_id (PK)
  - disposal_number (unique)
  - item_id (FK)
  - serial_item_id (FK) - if serialized
  - quantity
  - reason (damaged/obsolete/expired/condemned)
  - proposed_by (FK to users)
  - proposed_date
  - approved_by (FK to users)
  - approved_date
  - disposal_method (auction/scrap/donation/destruction)
  - disposal_date
  - disposal_value
  - disposal_agency
  - certificate_url
  - status (proposed/approved/completed)
  - notes

-- MAINTENANCE_RECORDS TABLE
maintenance_records:
  - maintenance_id (PK)
  - serial_item_id (FK)
  - maintenance_type (routine/repair/calibration)
  - scheduled_date
  - completed_date
  - performed_by
  - cost
  - description
  - parts_replaced
  - next_maintenance_due
  - status (scheduled/in_progress/completed/cancelled)
  - notes

-- GATE_PASSES TABLE
gate_passes:
  - gate_pass_id (PK)
  - gate_pass_number (unique)
  - issuance_id (FK)
  - item_details
  - taken_by (FK to users)
  - authorized_by (FK to users)
  - purpose
  - destination
  - out_date
  - out_time
  - expected_return_date
  - expected_return_time
  - actual_return_date
  - actual_return_time
  - gate_security_out
  - gate_security_in
  - vehicle_number
  - is_weapon (boolean)
  - status (active/returned/overdue)
  - notes

-- REPORTS_GENERATED TABLE
reports_generated:
  - report_id (PK)
  - report_type
  - report_name
  - generated_by (FK to users)
  - generated_date
  - parameters (JSON)
  - file_url
  - file_format (pdf/excel/csv)
  - expires_at

-- SYSTEM_SETTINGS TABLE
system_settings:
  - setting_id (PK)
  - setting_key
  - setting_value
  - setting_type (number/string/boolean/json)
  - description
  - updated_by (FK to users)
  - updated_at

-- BUDGET_TRACKING TABLE
budget_tracking:
  - budget_id (PK)
  - department_id (FK)
  - financial_year
  - allocated_budget
  - utilized_budget
  - pending_budget
  - available_budget
  - last_updated
```

---

## 🔄 **KEY SYSTEM RULES & BUSINESS LOGIC**

### **Rule 1: Approval Thresholds**
```javascript
IF requisition_value < ₹5,000 THEN
  AUTO_APPROVE (skip admin approval)
  
ELSE IF requisition_value >= ₹5,000 AND < ₹50,000 THEN
  REQUIRE admin_approval
  
ELSE IF requisition_value >= ₹50,000 THEN
  REQUIRE admin_approval AND senior_officer_approval
  
IF item_category == 'Weapons' THEN
  ALWAYS REQUIRE armory_officer_approval
  IF weapon_high_risk OR ammunition > threshold THEN
    ALSO REQUIRE senior_officer_approval
```

### **Rule 2: Stock Reservation**
```javascript
WHEN requisition_approved:
  stock.quantity_reserved += approved_quantity
  stock.quantity_available -= approved_quantity
  
WHEN item_issued:
  stock.quantity_reserved -= issued_quantity
  stock.quantity_issued += issued_quantity
  
WHEN requisition_cancelled:
  stock.quantity_reserved -= cancelled_quantity
  stock.quantity_available += cancelled_quantity
```

### **Rule 3: Overdue Alerts**
```javascript
// For Weapons
IF weapon_checkout AND current_time > expected_return_time + 1_hour THEN
  SEND_ALERT to armory_officer (HIGH priority)
  IF overdue > 24_hours THEN
    SEND_ALERT to senior_officer (CRITICAL)
    ESCALATE to security

// For General Items
IF returnable_item AND current_date > expected_return_date + 7_days THEN
  SEND_REMINDER to requester
  IF overdue > 30_days THEN
    SEND_ALERT to admin
    INITIATE penalty_process
```

### **Rule 4: Authorization Checks**
```javascript
WHEN weapon_requisition_created:
  IF user.is_weapon_authorized == false THEN
    REJECT_REQUEST automatically
  ELSE
    CHECK authorization_document uploaded
    FORWARD to armory_officer
```

### **Rule 5: Serial Number Tracking**
```javascript
IF item.is_serialized == true THEN
  WHEN issuing:
    REQUIRE serial_number_entry
    UPDATE serialized_items.status = 'issued'
    UPDATE serialized_items.current_holder_id = requester_id
  
  WHEN returning:
    VERIFY serial_number matches
    UPDATE serialized_items.status = 'available'
    UPDATE serialized_items.current_holder_id = null
```

### **Rule 6: Low Stock Alerts**
```javascript
WHEN stock_movement occurs:
  IF stock.quantity_available <= item.reorder_level THEN
    SEND_ALERT to store_keeper
    SEND_ALERT to admin
    SUGGEST auto_generate_purchase_requisition
```

### **Rule 7: Budget Checking**
```javascript
WHEN requisition_submitted:
  calculated_value = SUM(items.quantity × items.unit_price)
  department_budget = budget_tracking.available_budget
  
  IF calculated_value > department_budget THEN
    FLAG "Over Budget"
    REQUIRE additional_approval from finance_officer
```

### **Rule 8: Audit Trail**
```javascript
ON EVERY database_operation (INSERT/UPDATE/DELETE):
  CAPTURE:
    - user_id
    - timestamp
    - IP_address
    - old_values
    - new_values
    - action_type
    - reason (if override)
  WRITE to audit_log
  MAKE audit_log READ_ONLY (cannot be deleted/modified)
```

---

## 🔔 **NOTIFICATION TRIGGERS**

### **For Requesters:**
- Requisition submitted successfully
- Requisition approved/rejected
- Items ready for pickup
- Return reminder (7 days before due)
- Return overdue alert
- Budget exceeded warning

### **For Store Keepers:**
- New approved requisition to issue
- Return received
- Low stock alert
- New stock received (for entry)
- Physical verification due

### **For Admins:**
- New requisition pending approval (>₹5,000)
- High-value requisition (>₹50,000)
- Overdue approvals (>48 hours)
- Budget threshold reached (80%, 90%, 100%)
- Disposal proposals
- Unusual activity detected

### **For Armory Officers:**
- New weapon requisition
- Weapon return overdue
- Ammunition count mismatch
- Maintenance due for weapon
- Annual audit reminder

### **For Super Admins:**
- System errors
- Security incidents
- Backup failures
- Unusual login attempts
- Override actions performed
- Compliance violations

---

## 📱 **MOBILE APP FEATURES** (Optional Phase)

### **For Store Keepers:**
```
┌─────────────────────────┐
│  📱 STORE APP          │
├─────────────────────────┤
│  Quick Issue            │
│  [Scan Barcode] 🔍     │
│  [Enter Serial No.]     │
│  [Quick Issue]          │
│                         │
│  Quick Return           │
│  [Scan Return] 🔍      │
│  [Verify Condition]     │
│                         │
│  Stock Check            │
│  [Physical Count]       │
│  [Update Stock]         │
│                         │
│  Offline Mode ✓        │
│  Sync: 5 pending        │
└─────────────────────────┘
```

### **For Admins:**
```
┌─────────────────────────┐
│  📱 APPROVAL APP       │
├─────────────────────────┤
│  Pending: 12            │
│                         │
│  Swipe to Approve →    │
│  Swipe to Reject ←     │
│                         │
│  Urgent: 3              │
│  [Quick View]           │
│  [Bulk Approve]         │
│                         │
│  Notifications: 8       │
└─────────────────────────┘
```

---

## 📊 **STANDARD REPORTS**

### **1. Daily Reports:**
- Daily Stock Movement Report
- Daily Issuance Report
- Daily Returns Report
- Daily Weapons Register
- Pending Approvals Report

### **2. Weekly Reports:**
- Week's Activity Summary
- Low Stock Alert Report
- Overdue Returns Report
- Budget Utilization Report

### **3. Monthly Reports:**
- Monthly Consumption Report
- Department-wise Requisition Report
- Item-wise Issuance Report
- Supplier Performance Report
- Budget vs Actual Report
- Weapon Audit Report

### **4. Annual Reports:**
- Annual Stock Taking Report
- Asset Depreciation Report
- Disposal Report
- Procurement Report
- Compliance Report
- Complete Weapons Audit

### **5. On-Demand Reports:**
- Custom Date Range Reports
- Item History Report
- User Activity Report
- Audit Trail Report
- Exception Reports
- Forecasting Reports

---

## 🎯 **SAMPLE REPORT LAYOUT**

```
┌─────────────────────────────────────────────────┐
│  GOVERNMENT STORES - MONTHLY CONSUMPTION REPORT │
│  Department: Patrol Division                    │
│  Period: September 2025                         │
│  Generated: 05-Oct-2025 by Admin Verma         │
├─────────────────────────────────────────────────┤
│                                                 │
│  SUMMARY:                                       │
│  Total Requisitions: 45                         │
│  Total Items Issued: 123                        │
│  Total Value: ₹3,45,000                        │
│  Budget Utilized: 68%                           │
│                                                 │
│  TOP 10 ITEMS CONSUMED:                         │
│  ┌───────────────────────────────────────────┐ │
│  │ 1. Stationery (Pens, Papers)    | 450 pcs│ │
│  │ 2. Printer Toner Cartridges     | 12 pcs │ │
│  │ 3. Office Chairs                | 8 nos  │ │
│  │ 4. Desktop Monitors             | 6 nos  │ │
│  │ 5. Keyboards & Mouse Sets       | 15 sets│ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  CATEGORY-WISE BREAKDOWN:                       │
│  • Furniture: ₹85,000 (25%)                    │
│  • Electronics: ₹1,45,000 (42%)                │
│  • Stationery: ₹65,000 (19%)                   │
│  • Equipment: ₹50,000 (14%)                    │
│                                                 │
│  COMPARISON WITH LAST MONTH:                    │
│  Value: +12% ↑                                 │
│  Quantity: +8% ↑                               │
│                                                 │
│  ALERTS:                                        │
│  • Budget 68% utilized (Watch threshold)        │
│  • 3 items below reorder level                  │
│  • 2 high-value requisitions pending            │
│                                                 │
│  [Export PDF] [Export Excel] [Email Report]     │
└─────────────────────────────────────────────────┘
```

---

## 🚀 **IMPLEMENTATION ROADMAP**

### **Phase 1: Foundation (Months 1-2)**
**Deliverables:**
- ✅ Database design & setup
- ✅ User authentication system
- ✅ Role-based access control
- ✅ Basic UI framework
- ✅ User management module
- ✅ Item master setup

**Milestone:** Basic system operational with user login

---

### **Phase 2: Core Requisition System (Months 3-4)**
**Deliverables:**
- ✅ Requisition creation workflow
- ✅ Approval workflow (single-level)
- ✅ Stock management basic
- ✅ Issuance process
- ✅ Basic reporting
- ✅ Notification system

**Milestone:** Standard items requisition working end-to-end

---

### **Phase 3: Advanced Features (Months 5-6)**
**Deliverables:**
- ✅ Weapons module (separate workflow)
- ✅ Armory officer role
- ✅ Serial number tracking
- ✅ Return management
- ✅ Gate pass system
- ✅ Multi-level approval
- ✅ Budget tracking

**Milestone:** Complete system with weapons tracking

---

### **Phase 4: Automation & Intelligence (Months 7-8)**
**Deliverables:**
- ✅ Barcode/QR code integration
- ✅ Auto-reorder suggestions
- ✅ Advanced alerts & rules
- ✅ Analytics dashboard
- ✅ Audit trail viewer
- ✅ Mobile app (basic)

**Milestone:** Automated alerts and barcode scanning

---

### **Phase 5: Integration & Optimization (Months 9-10)**
**Deliverables:**
- ✅ Integration with existing systems
- ✅ Performance optimization
- ✅ Advanced reporting
- ✅ Bulk operations
- ✅ Data import/export tools
- ✅ User training materials

**Milestone:** System integrated and optimized

---

### **Phase 6: Go-Live & Support (Months 11-12)**
**Deliverables:**
- ✅ User acceptance testing
- ✅ Staff training
- ✅ Data migration
- ✅ Parallel run
- ✅ Go-live
- ✅ Post-deployment support

**Milestone:** System live in production

---

## 🛠️ **TECHNOLOGY STACK RECOMMENDATIONS**

### **Frontend:**
- **Framework:** React.js with TypeScript
- **UI Library:** Material-UI or Ant Design
- **State Management:** Redux Toolkit / Zustand
- **Form Handling:** React Hook Form + Yup validation
- **Charts:** Recharts / Chart.js
- **Barcode:** React-Barcode-Reader / QuaggaJS
- **PDF Generation:** react-pdf / jsPDF

### **Backend:**
- **Runtime:** Node.js (Express.js) OR Python (Django/FastAPI)
- **API:** RESTful API with JWT authentication
- **Real-time:** Socket.io for notifications
- **File Upload:** Multer / AWS S3
- **Email:** Nodemailer / SendGrid
- **SMS:** Twilio / MSG91

### **Database:**
- **Primary:** PostgreSQL (ACID compliance for govt data)
- **Caching:** Redis (sessions, frequent queries)
- **Full-text Search:** PostgreSQL full-text OR Elasticsearch

### **Mobile:**
- **Framework:** React Native (single codebase for iOS/Android)
- **Barcode Scanner:** react-native-camera + barcode library

### **DevOps:**
- **Version Control:** Git (GitHub/GitLab)
- **CI/CD:** GitHub Actions / Jenkins
- **Containerization:** Docker
- **Hosting:** AWS / Azure / On-premise servers
- **Monitoring:** PM2, New Relic, Sentry
- **Backup:** Automated daily backups with 7-year retention

---

## 🔐 **SECURITY MEASURES**

1. **Authentication:**
   - Strong password policy (12+ chars, complexity)
   - Two-factor authentication (OTP via SMS/Email)
   - Session timeout (15 minutes inactivity)
   - Password expiry (90 days)

2. **Authorization:**
   - Role-based access control (RBAC)
   - Granular permissions
   - IP whitelisting for admin access
   - Device fingerprinting

3. **Data Protection:**
   - Encryption at rest (AES-256)
   - Encryption in transit (TLS 1.3)
   - Sensitive data masking
   - PII data protection

4. **Audit & Compliance:**
   - Immutable audit logs
   - Complete activity tracking
   - Regular security audits
   - Compliance with government IT policies

5. **Application Security:**
   - SQL injection prevention (parameterized queries)
   - XSS protection
   - CSRF tokens
   - Rate limiting
   - Input validation & sanitization

---

## ✅ **SUCCESS CRITERIA**

The system will be considered successful when:

1. ✅ **Efficiency:** Requisition-to-issuance time reduced by 50%
2. ✅ **Accuracy:** 99%+ inventory accuracy
3. ✅ **Compliance:** 100% audit trail for all transactions
4. ✅ **Security:** Zero unauthorized access incidents
5. ✅ **User Adoption:** 90%+ users trained and actively using
6. ✅ **Performance:** Page load < 2 seconds, 99.9% uptime
7. ✅ **Weapons Tracking:** 100% weapons accounted for daily
8. ✅ **Budget Control:** Real-time budget tracking working
9. ✅ **Stock Accuracy:** Low stock alerts working, no stockouts
10. ✅ **User Satisfaction:** 80%+ satisfaction score

---

**This is a complete, production-ready plan! What would you like me to create next?**

1. **Complete Database Schema with relationships diagram?**
2. **API Endpoints documentation?**
3. **Detailed UI Wireframes for specific screens?**
4. **User Stories and Test Cases?**
5. **Something else?**

Let me know and I'll create it! 🚀