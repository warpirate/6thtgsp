# API Integration Implementation Plan

**Status**: 🔴 **Critical Priority**  
**Estimated Effort**: 2-3 days  
**Complexity**: Medium

---

## 📊 Current State

All implemented pages use **mock data**. The application UI is complete but not connected to the Supabase backend.

**Mock Data Locations**:
- `src/pages/dashboard/DashboardPage.tsx` - Lines 20-52 (stats, activities, tasks)
- `src/pages/receipts/ReceiptsPage.tsx` - Lines 8-49 (mock receipts)
- `src/pages/receipts/ReceiptDetailPage.tsx` - Lines 18-37 (single receipt)
- `src/pages/approvals/ApprovalsPage.tsx` - Lines 8-46 (pending receipts, history)

---

## 🎯 Integration Strategy

### Phase 1: Setup (2 hours)

#### 1.1 Install React Query
```bash
npm install @tanstack/react-query
```

#### 1.2 Setup Query Client
**File**: `src/lib/queryClient.ts` (NEW)
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

#### 1.3 Add Provider to App
**File**: `src/App.tsx`
```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

// Wrap app with QueryClientProvider
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <Routes>...</Routes>
  </AuthProvider>
</QueryClientProvider>
```

---

### Phase 2: Create API Layer (4 hours)

#### 2.1 Receipt API Functions
**File**: `src/lib/api/receipts.ts` (NEW)

```typescript
import { supabase } from '@/lib/supabase'
import type { ReceiptStatus } from '@/types'

export interface Receipt {
  id: string
  receipt_id: string
  item_name: string
  quantity: number
  unit: string
  description?: string
  unit_price?: number
  supplier?: string
  purchase_date?: string
  status: ReceiptStatus
  created_at: string
  submitted_at?: string
  verified_at?: string
  approved_at?: string
  received_by: string
  verified_by?: string
  approved_by?: string
  created_by_user?: {
    id: string
    full_name: string
  }
  verified_by_user?: {
    id: string
    full_name: string
  }
  approved_by_user?: {
    id: string
    full_name: string
  }
  rejection_reason?: string
}

export interface ReceiptsFilters {
  status?: ReceiptStatus[]
  search?: string
  dateFrom?: string
  dateTo?: string
  createdBy?: string
}

export const receiptsApi = {
  // Fetch all receipts with filters
  async getAll(filters?: ReceiptsFilters) {
    let query = supabase
      .from('stock_receipts')
      .select(`
        *,
        created_by_user:users!received_by(id, full_name),
        verified_by_user:users!verified_by(id, full_name),
        approved_by_user:users!approved_by(id, full_name)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`item_name.ilike.%${filters.search}%,receipt_id.ilike.%${filters.search}%`)
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (filters?.createdBy) {
      query = query.eq('received_by', filters.createdBy)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Receipt[]
  },

  // Fetch single receipt by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('stock_receipts')
      .select(`
        *,
        created_by_user:users!received_by(id, full_name),
        verified_by_user:users!verified_by(id, full_name),
        approved_by_user:users!approved_by(id, full_name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Receipt
  },

  // Create new receipt
  async create(receipt: Omit<Receipt, 'id' | 'created_at' | 'receipt_id'>) {
    const { data, error } = await supabase
      .from('stock_receipts')
      .insert({
        ...receipt,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error
    return data as Receipt
  },

  // Update receipt
  async update(id: string, updates: Partial<Receipt>) {
    const { data, error } = await supabase
      .from('stock_receipts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Receipt
  },

  // Delete receipt
  async delete(id: string) {
    const { error } = await supabase
      .from('stock_receipts')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Submit receipt for verification
  async submit(id: string) {
    const { data, error } = await supabase
      .from('stock_receipts')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Receipt
  },

  // Verify receipt
  async verify(id: string, userId: string, comments?: string) {
    const { data, error } = await supabase
      .from('stock_receipts')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: userId,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log workflow action
    if (comments) {
      await supabase.from('approval_workflow').insert({
        receipt_id: id,
        approver_id: userId,
        action: 'verified',
        comments,
      })
    }

    return data as Receipt
  },

  // Approve receipt
  async approve(id: string, userId: string, comments?: string) {
    const { data, error } = await supabase
      .from('stock_receipts')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: userId,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log workflow action
    if (comments) {
      await supabase.from('approval_workflow').insert({
        receipt_id: id,
        approver_id: userId,
        action: 'approved',
        comments,
      })
    }

    return data as Receipt
  },

  // Reject receipt
  async reject(id: string, userId: string, reason: string) {
    const { data, error } = await supabase
      .from('stock_receipts')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log workflow action
    await supabase.from('approval_workflow').insert({
      receipt_id: id,
      approver_id: userId,
      action: 'rejected',
      comments: reason,
    })

    return data as Receipt
  },
}
```

---

### Phase 3: Create Custom Hooks (3 hours)

#### 3.1 Receipts Hooks
**File**: `src/hooks/useReceipts.ts` (NEW)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { receiptsApi, type ReceiptsFilters } from '@/lib/api/receipts'
import { useAuth } from '@/lib/auth/AuthProvider'

export const useReceipts = (filters?: ReceiptsFilters) => {
  return useQuery({
    queryKey: ['receipts', filters],
    queryFn: () => receiptsApi.getAll(filters),
  })
}

export const useReceipt = (id: string) => {
  return useQuery({
    queryKey: ['receipts', id],
    queryFn: () => receiptsApi.getById(id),
    enabled: !!id,
  })
}

export const useCreateReceipt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: receiptsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
  })
}

export const useUpdateReceipt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      receiptsApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['receipts', variables.id] })
    },
  })
}

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: receiptsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
  })
}

export const useSubmitReceipt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: receiptsApi.submit,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['receipts', id] })
    },
  })
}

export const useVerifyReceipt = () => {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      receiptsApi.verify(id, userProfile!.id, comments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['receipts', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

export const useApproveReceipt = () => {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      receiptsApi.approve(id, userProfile!.id, comments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['receipts', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

export const useRejectReceipt = () => {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      receiptsApi.reject(id, userProfile!.id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['receipts', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}
```

---

### Phase 4: Update Components (6 hours)

#### 4.1 Update Receipts Page
**File**: `src/pages/receipts/ReceiptsPage.tsx`

**Changes**:
```typescript
// REMOVE mock data (lines 8-49)
// ADD:
import { useReceipts } from '@/hooks/useReceipts'

const ReceiptsPage: React.FC = () => {
  // ... existing state
  
  // REPLACE mock data with:
  const { data: receipts, isLoading, error } = useReceipts({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    search: searchTerm || undefined,
  })
  
  // ADD loading state:
  if (isLoading) return <LoadingSpinner />
  
  // ADD error state:
  if (error) return <ErrorMessage error={error} />
  
  // UPDATE filteredReceipts to use real data
  const filteredReceipts = receipts || []
  
  // ... rest of component
}
```

#### 4.2 Update Create Receipt Page
**File**: `src/pages/receipts/CreateReceiptPage.tsx`

**Changes**:
```typescript
import { useCreateReceipt, useSubmitReceipt } from '@/hooks/useReceipts'
import { toast } from 'react-hot-toast' // NEW: install react-hot-toast

const CreateReceiptPage: React.FC = () => {
  const createMutation = useCreateReceipt()
  const submitMutation = useSubmitReceipt()
  
  const onSaveDraft = async (data: ReceiptFormData) => {
    try {
      const receipt = await createMutation.mutateAsync({
        ...data,
        received_by: userProfile!.id,
      })
      toast.success('Receipt saved as draft!')
      navigate('/receipts')
    } catch (error) {
      toast.error('Failed to save draft')
    }
  }
  
  const onSubmit = async (data: ReceiptFormData) => {
    try {
      const receipt = await createMutation.mutateAsync({
        ...data,
        received_by: userProfile!.id,
      })
      await submitMutation.mutateAsync(receipt.id)
      toast.success('Receipt submitted for verification!')
      navigate('/receipts')
    } catch (error) {
      toast.error('Failed to submit receipt')
    }
  }
  
  // ... rest
}
```

#### 4.3 Update Receipt Detail Page
**File**: `src/pages/receipts/ReceiptDetailPage.tsx`

**Changes**:
```typescript
import { useReceipt, useVerifyReceipt, useApproveReceipt, useRejectReceipt } from '@/hooks/useReceipts'
import { toast } from 'react-hot-toast'

const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams()
  const { data: receipt, isLoading } = useReceipt(id!)
  const verifyMutation = useVerifyReceipt()
  const approveMutation = useApproveReceipt()
  const rejectMutation = useRejectReceipt()
  
  if (isLoading) return <LoadingSpinner />
  if (!receipt) return <NotFoundPage />
  
  const confirmAction = async () => {
    try {
      if (actionType === 'verify') {
        await verifyMutation.mutateAsync({ id: receipt.id, comments })
        toast.success('Receipt verified successfully!')
      } else if (actionType === 'approve') {
        await approveMutation.mutateAsync({ id: receipt.id, comments })
        toast.success('Receipt approved successfully!')
      } else if (actionType === 'reject') {
        await rejectMutation.mutateAsync({ id: receipt.id, reason: comments })
        toast.success('Receipt rejected')
      }
      setShowActionModal(false)
      setComments('')
    } catch (error) {
      toast.error('Action failed')
    }
  }
  
  // ... rest
}
```

#### 4.4 Update Approvals Page
**File**: `src/pages/approvals/ApprovalsPage.tsx`

**Changes**:
```typescript
import { useReceipts } from '@/hooks/useReceipts'

const ApprovalsPage: React.FC = () => {
  // REPLACE mock data with:
  const { data: allReceipts } = useReceipts()
  
  const pendingReceipts = allReceipts?.filter(r => 
    r.status === 'submitted' || r.status === 'verified'
  ) || []
  
  // For history, fetch approval_workflow
  const { data: history } = useQuery({
    queryKey: ['approval-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('approval_workflow')
        .select('*, receipt:stock_receipts(*), approver:users(*)')
        .order('created_at', { ascending: false })
        .limit(50)
      return data
    },
  })
  
  // ... rest
}
```

---

### Phase 5: Add Toast Notifications (1 hour)

#### 5.1 Install react-hot-toast
```bash
npm install react-hot-toast
```

#### 5.2 Add Toaster to App
**File**: `src/App.tsx`
```typescript
import { Toaster } from 'react-hot-toast'

// Add before closing div:
<Toaster position="top-right" />
```

---

## 📋 Testing Checklist

After integration, test:

- [ ] Receipts list loads from database
- [ ] Search filters work
- [ ] Status filters work
- [ ] Create receipt saves to database
- [ ] Submit changes status to 'submitted'
- [ ] Verify action works (for Users)
- [ ] Approve action works (for Admins)
- [ ] Reject with reason works
- [ ] Toast notifications appear
- [ ] Loading states show correctly
- [ ] Error messages display
- [ ] Navigation works after actions
- [ ] RLS policies enforce permissions

---

## 🎯 Success Criteria

✅ All mock data replaced with real queries  
✅ CRUD operations working  
✅ Workflow actions (verify/approve/reject) working  
✅ Toast notifications implemented  
✅ Loading and error states handled  
✅ Cache invalidation working correctly  
✅ RLS policies enforced  

---

**Estimated Total Time**: 16 hours (2 full days)  
**Priority**: 🔴 **CRITICAL** - Blocks production deployment  
**Dependencies**: Supabase project configured, tables created  

---

**Last Updated**: 2025-10-04
