# All Pages Quick Reference Guide

## 📚 Complete Page Implementation Guide

This document provides implementation blueprints for all remaining pages. Each section contains enough detail to build the page following the established patterns from Dashboard and Login pages.

---

## ✅ Completed Pages (Full Documentation)

1. **[Dashboard Page](./dashboard-page.md)** - 400+ lines ✅
2. **[Login Page](./login-page.md)** - 450+ lines ✅  
3. **[Receipts Page](./receipts-page.md)** - 450+ lines ✅
4. **[Page Index](./index.md)** - Complete reference ✅

---

## 📝 Pages To Implement (Detailed Blueprints Below)

### Authentication Pages
5. Forgot Password Page
6. Reset Password Page

### Core Application Pages
7. Create Receipt Page
8. Receipt Detail Page

### Workflow Pages
9. Approvals Page
10. Inventory Page

### Management Pages
11. Documents Page
12. Audit Logs Page
13. User Management Page

### User Pages
14. Profile Page
15. Settings Page

### Error Pages
16. 404 Not Found Page
17. 401 Unauthorized Page
18. 500 Server Error Page

---

# 5. Forgot Password Page

## Quick Specs
- **Route**: `/auth/forgot-password`
- **Access**: Public
- **Purpose**: Initiate password reset flow
- **Status**: 🟢 Implemented

## Component Structure
```typescript
const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      setSubmitted(true)
    } catch (error) {
      // Show error
    } finally {
      setLoading(false)
    }
  }
  
  if (submitted) {
    return <SuccessMessage email={email} />
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Send Reset Link</button>
    </form>
  )
}
```

## Key Features
- Email validation (Zod schema)
- Rate limiting protection (Supabase handles)
- Success confirmation message
- Return to login link
- Resend option after 60 seconds

## Security
- No user enumeration (same message for existing/non-existing emails)
- Token-based reset (Supabase handles)
- Expiring links (1 hour default)

## Testing
```typescript
test('sends reset email', async () => {
  render(<ForgotPasswordPage />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } })
  fireEvent.click(screen.getByText('Send Reset Link'))
  
  await waitFor(() => {
    expect(screen.getByText(/check your email/i)).toBeInTheDocument()
  })
})
```

---

# 6. Reset Password Page

## Quick Specs
- **Route**: `/auth/reset-password`
- **Access**: Public (requires token)
- **Purpose**: Complete password reset
- **Status**: 🟢 Implemented

## Component Structure
```typescript
const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      // Show error
      return
    }
    
    try {
      await supabase.auth.updateUser({ password })
      // Show success message
      navigate('/auth/login')
    } catch (error) {
      // Show error
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="password" value={password} />
      <input type="password" value={confirmPassword} />
      <button type="submit">Reset Password</button>
    </form>
  )
}
```

## Key Features
- Password strength indicator
- Confirmation field matching
- Show/hide password toggle
- Token validation (automatic via Supabase)
- Expired token handling

## Validation
```typescript
const passwordSchema = z.string()
  .min(8, 'Min 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
```

---

# 7. Create Receipt Page

## Quick Specs
- **Route**: `/receipts/create`
- **Access**: Users with `create_receipt` permission
- **Purpose**: Submit new stock receipts
- **Status**: 🚧 Under Construction

## Component Structure
```typescript
const CreateReceiptPage: React.FC = () => {
  const { register, handleSubmit, watch } = useForm<ReceiptForm>({
    resolver: zodResolver(receiptSchema)
  })
  const [step, setStep] = useState(1) // Multi-step form
  const [documents, setDocuments] = useState<File[]>([])
  
  const onSubmit = async (data) => {
    // 1. Create receipt record
    const { data: receipt } = await supabase
      .from('stock_receipts')
      .insert({
        ...data,
        status: 'draft',
        received_by: currentUserId
      })
      .select()
      .single()
    
    // 2. Upload documents
    for (const file of documents) {
      const { data: upload } = await supabase.storage
        .from('receipt-documents')
        .upload(`${receipt.id}/${file.name}`, file)
      
      await supabase.from('documents').insert({
        receipt_id: receipt.id,
        file_path: upload.path,
        file_name: file.name
      })
    }
    
    // 3. Navigate to receipt detail
    navigate(`/receipts/${receipt.id}`)
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <Stepper currentStep={step} />
      
      {step === 1 && <BasicInfoStep />}
      {step === 2 && <ItemDetailsStep />}
      {step === 3 && <DocumentsStep />}
      {step === 4 && <ReviewStep />}
      
      <NavigationButtons
        onNext={() => setStep(step + 1)}
        onPrev={() => setStep(step - 1)}
        onSave={handleSubmit(onSubmit)}
      />
    </div>
  )
}
```

## Multi-Step Breakdown

### Step 1: Basic Information
- Item name (required)
- Quantity (required)
- Unit (required, dropdown)
- Description (optional, textarea)

### Step 2: Details
- Unit price (optional)
- Supplier name (optional)
- Purchase date (optional, date picker)
- Category (dropdown)

### Step 3: Documents
- File upload (drag & drop)
- Multiple files support
- Preview thumbnails
- Remove uploaded files

### Step 4: Review & Submit
- Summary of all entered data
- Edit links to go back to steps
- Save as Draft button
- Submit for Verification button

## Key Features
- Auto-save drafts every 30 seconds
- Form validation per step
- File upload with progress bars
- Preview before submit
- Duplicate detection warning

## Draft Management
```typescript
// Auto-save logic
useEffect(() => {
  const interval = setInterval(() => {
    if (isDirty) {
      saveDraft(watch())
    }
  }, 30000)
  
  return () => clearInterval(interval)
}, [isDirty, watch])
```

---

# 8. Receipt Detail Page

## Quick Specs
- **Route**: `/receipts/:id`
- **Access**: All authenticated users (RLS filtered)
- **Purpose**: View/edit individual receipt
- **Status**: 🚧 Under Construction

## Component Structure
```typescript
const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams()
  const { userProfile, roleName, hasPermission } = useAuth()
  
  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => fetchReceiptDetails(id)
  })
  
  const canEdit = useMemo(() => {
    if (!receipt) return false
    return receipt.status === 'draft' && receipt.received_by === userProfile?.id
  }, [receipt, userProfile])
  
  if (isLoading) return <LoadingSpinner />
  if (!receipt) return <NotFoundPage />
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <ReceiptHeader receipt={receipt} />
      
      {/* Status Timeline */}
      <StatusTimeline receipt={receipt} />
      
      {/* Details Card */}
      <DetailsCard receipt={receipt} canEdit={canEdit} />
      
      {/* Documents Section */}
      <DocumentsSection receipt={receipt} />
      
      {/* Approval History */}
      <ApprovalHistory receipt={receipt} />
      
      {/* Actions */}
      <ActionButtons receipt={receipt} />
    </div>
  )
}
```

## Sub-Components

### Status Timeline
```typescript
const StatusTimeline: React.FC<{ receipt }> = ({ receipt }) => {
  const timeline = [
    { status: 'draft', date: receipt.created_at, user: receipt.created_by_user },
    { status: 'submitted', date: receipt.submitted_at, user: receipt.submitted_by_user },
    { status: 'verified', date: receipt.verified_at, user: receipt.verified_by_user },
    { status: 'approved', date: receipt.approved_at, user: receipt.approved_by_user },
  ].filter(item => item.date) // Only show completed stages
  
  return (
    <div className="relative">
      {timeline.map((item, index) => (
        <TimelineItem key={index} {...item} isLast={index === timeline.length - 1} />
      ))}
    </div>
  )
}
```

### Action Buttons (Role-Based)
```typescript
const ActionButtons: React.FC<{ receipt }> = ({ receipt }) => {
  const { roleName, hasPermission } = useAuth()
  
  return (
    <div className="flex gap-3">
      {receipt.status === 'draft' && (
        <>
          <button onClick={handleEdit} className="btn btn-secondary">
            Edit
          </button>
          <button onClick={handleSubmit} className="btn btn-primary">
            Submit for Verification
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            Delete
          </button>
        </>
      )}
      
      {receipt.status === 'submitted' && hasPermission('verify_receipt') && (
        <>
          <button onClick={handleVerify} className="btn btn-success">
            Verify
          </button>
          <button onClick={handleReject} className="btn btn-danger">
            Reject
          </button>
        </>
      )}
      
      {receipt.status === 'verified' && hasPermission('approve_receipt') && (
        <>
          <button onClick={handleApprove} className="btn btn-success">
            Approve
          </button>
          <button onClick={handleReject} className="btn btn-danger">
            Reject
          </button>
        </>
      )}
      
      <button onClick={handleExportPDF} className="btn btn-secondary">
        <Download className="w-4 h-4" />
        Export PDF
      </button>
    </div>
  )
}
```

## Real-Time Updates
```typescript
useEffect(() => {
  const subscription = supabase
    .channel(`receipt-${id}`)
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'stock_receipts', filter: `id=eq.${id}` },
      (payload) => {
        queryClient.invalidateQueries(['receipt', id])
      }
    )
    .subscribe()
  
  return () => subscription.unsubscribe()
}, [id])
```

---

# 9. Approvals Page

## Quick Specs
- **Route**: `/approvals`
- **Access**: Users with approval permissions
- **Purpose**: Review and approve pending receipts
- **Status**: 🚧 Under Construction

## Component Structure
```typescript
const ApprovalsPage: React.FC = () => {
  const { roleName, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  
  const { data: pendingReceipts } = useQuery({
    queryKey: ['approvals', 'pending', roleName],
    queryFn: () => fetchPendingApprovals(roleName)
  })
  
  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" />
      
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="pending">
          Pending ({pendingReceipts?.length || 0})
        </Tab>
        <Tab value="history">
          History
        </Tab>
      </Tabs>
      
      {activeTab === 'pending' && (
        <PendingApprovalsList receipts={pendingReceipts} />
      )}
      
      {activeTab === 'history' && (
        <ApprovalHistoryList />
      )}
    </div>
  )
}
```

## Pending Approvals List
```typescript
const PendingApprovalsList: React.FC<{ receipts }> = ({ receipts }) => {
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  
  const handleApprove = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setAction('approve')
    setShowModal(true)
  }
  
  const handleReject = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setAction('reject')
    setShowModal(true)
  }
  
  return (
    <>
      <div className="space-y-4">
        {receipts.map((receipt) => (
          <ApprovalCard
            key={receipt.id}
            receipt={receipt}
            onApprove={() => handleApprove(receipt)}
            onReject={() => handleReject(receipt)}
          />
        ))}
      </div>
      
      <ApprovalModal
        open={showModal}
        receipt={selectedReceipt}
        action={action}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmAction}
      />
    </>
  )
}
```

## Approval Card
```typescript
const ApprovalCard: React.FC<Props> = ({ receipt, onApprove, onReject }) => {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Link to={`/receipts/${receipt.id}`} className="text-lg font-semibold">
              {receipt.receipt_id}
            </Link>
            <StatusBadge status={receipt.status} />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Item:</span>
              <p className="font-medium">{receipt.item_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <p className="font-medium">{receipt.quantity} {receipt.unit}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Submitted By:</span>
              <p className="font-medium">{receipt.created_by_user.full_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>
              <p className="font-medium">{format(new Date(receipt.submitted_at), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 ml-4">
          <button onClick={onApprove} className="btn btn-success btn-sm">
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button onClick={onReject} className="btn btn-danger btn-sm">
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
```

## Bulk Approval (Future Enhancement)
```typescript
const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])

const handleBulkApprove = async () => {
  await Promise.all(
    selectedReceipts.map(id => 
      supabase
        .from('stock_receipts')
        .update({ status: 'approved', approved_by: currentUserId, approved_at: new Date() })
        .eq('id', id)
    )
  )
  
  queryClient.invalidateQueries(['approvals'])
  setSelectedReceipts([])
}
```

---

# 10. Inventory Page

## Quick Specs
- **Route**: `/inventory`
- **Access**: Users with `view_reports` permission
- **Purpose**: Track and analyze inventory
- **Status**: 🚧 Under Construction

## Component Structure
```typescript
const InventoryPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })
  const [groupBy, setGroupBy] = useState<'item' | 'category' | 'supplier'>('item')
  
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', dateRange, groupBy],
    queryFn: () => fetchInventoryData(dateRange, groupBy)
  })
  
  return (
    <div className="space-y-6">
      <PageHeader title="Inventory & Reports" />
      
      {/* Filters */}
      <FilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />
      
      {/* Summary Cards */}
      <SummaryCards data={inventoryData} />
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryTrendsChart data={inventoryData} />
        <CategoryBreakdownChart data={inventoryData} />
      </div>
      
      {/* Detailed Table */}
      <InventoryTable data={inventoryData} />
      
      {/* Export Options */}
      <ExportButtons onExport={handleExport} />
    </div>
  )
}
```

## Charts (using Recharts)
```typescript
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const InventoryTrendsChart: React.FC<{ data }> = ({ data }) => {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">Inventory Trends</h3>
      <LineChart width={500} height={300} data={data.trends}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="received" stroke="#3b82f6" />
        <Line type="monotone" dataKey="approved" stroke="#22c55e" />
      </LineChart>
    </div>
  )
}
```

## Export Functionality
```typescript
const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
  if (format === 'csv') {
    const csv = convertToCSV(inventoryData)
    downloadFile(csv, 'inventory-report.csv', 'text/csv')
  } else if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(inventoryData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory')
    XLSX.writeFile(workbook, 'inventory-report.xlsx')
  } else if (format === 'pdf') {
    const pdf = await generateInventoryPDF(inventoryData)
    downloadFile(pdf, 'inventory-report.pdf', 'application/pdf')
  }
}
```

---

# 11-17. Remaining Pages (Quick Blueprints)

## 11. Documents Page
- **Route**: `/documents`
- **Components**: File uploader, file browser, preview modal
- **Key Features**: Upload, download, categorize, search by name/type
- **Storage**: Supabase Storage bucket

## 12. Audit Logs Page
- **Route**: `/audit`
- **Access**: Admin/Super Admin
- **Components**: Filterable log table, export functionality
- **Key Features**: User activity tracking, change history, export logs

## 13. User Management Page
- **Route**: `/users`
- **Access**: Super Admin only
- **Components**: User table, create/edit modal, role selector
- **Key Features**: CRUD operations, role assignment, deactivate users

## 14. Profile Page
- **Route**: `/profile`
- **Components**: Profile form, avatar uploader, password change form
- **Key Features**: Edit personal info, change password, view activity

## 15. Settings Page
- **Route**: `/settings`
- **Components**: Theme toggle, notification preferences, display options
- **Key Features**: Customize experience, manage notifications

## 16. 404 Not Found Page
- **Route**: `*` (catch-all)
- **Components**: Error illustration, message, navigation links
- **Key Features**: Friendly error, search bar, breadcrumbs

## 17. 401 Unauthorized Page
- **Route**: `/unauthorized`
- **Components**: Access denied message, role info, contact admin link
- **Key Features**: Clear explanation, next steps

## 18. 500 Server Error Page
- **Route**: `/server-error`
- **Components**: Error message, error ID, retry button
- **Key Features**: Error logging, retry action, support contact

---

## 🎯 Implementation Priority

### Phase 1 (Critical) ⭐⭐⭐
1. Create Receipt Page - Core feature
2. Receipt Detail Page - Core feature
3. Approvals Page - Core workflow

### Phase 2 (Important) ⭐⭐
4. Inventory Page - Reporting
5. Documents Page - Document management
6. User Management Page - Administration

### Phase 3 (Standard) ⭐
7. Profile Page - User settings
8. Settings Page - Preferences
9. Audit Logs Page - Compliance
10. Error Pages - User experience

---

## 📋 Common Patterns Across All Pages

### 1. Page Layout Structure
```typescript
<div className="space-y-6">
  <PageHeader title="..." description="..." actions={<.../>} />
  <FilterSection />
  <ContentArea />
  <PaginationControls />
</div>
```

### 2. Permission Checks
```typescript
const { hasPermission, canAccess } = useAuth()

if (!hasPermission('required_permission')) {
  return <Navigate to="/unauthorized" />
}
```

### 3. Data Fetching
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', filters],
  queryFn: fetchResource,
  staleTime: 30000,
})
```

### 4. Form Handling
```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
})
```

### 5. Error Handling
```typescript
if (error) return <ErrorBoundary error={error} />
if (isLoading) return <LoadingSpinner />
if (!data) return <EmptyState />
```

---

## 🔗 Quick Links

- [Comprehensive Page Examples](./dashboard-page.md)
- [Authentication Flow](../flows/authentication-flow.md)
- [Receipt Workflow](../flows/receipt-workflow.md)
- [Database Schema](../database-schema.md)
- [Design System](../design-system.md)

---

**Last Updated**: 2025-10-04  
**Version**: 1.0.0  
**Status**: ✅ Blueprint Complete  
**Maintainer**: Quarter Master Development Team

## 📝 Usage Instructions

1. **Choose a page to implement** from the priority list
2. **Copy the relevant blueprint** from this document
3. **Expand using the template** from Dashboard/Login docs
4. **Add Mermaid diagrams** for complex flows
5. **Include code examples** for key features
6. **Document security considerations**
7. **Add testing strategies**

Each blueprint above provides enough context to create a full 400+ line comprehensive document following the established template.
