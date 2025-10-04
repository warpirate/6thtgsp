# Real-Time Features Implementation Plan

**Status**: 🟡 **Medium Priority**  
**Estimated Effort**: 1-2 days  
**Complexity**: Medium  
**Dependencies**: API Integration must be complete first

---

## 📊 Current State

The application currently has **no real-time features**. All data updates require manual page refresh or navigation.

---

## 🎯 Required Real-Time Features

### 1. Live Receipt Status Updates ⚡
**Use Case**: Users see receipt status changes instantly without refresh

**Affected Pages**:
- Receipts List Page
- Receipt Detail Page
- Dashboard Page (recent activity)
- Approvals Page

**Example Scenario**:
- User A is viewing a receipt that's "Submitted"
- User B (verifier) approves it
- User A's screen instantly updates to show "Approved" status

---

### 2. Live Approval Notifications 🔔
**Use Case**: Approvers get notified immediately when receipts need their action

**Affected Pages**:
- Dashboard Page
- Approvals Page
- Navbar (notification badge)

**Example Scenario**:
- User creates and submits a receipt
- Verifiers instantly see notification badge update
- Approvals page counter updates live

---

### 3. Live Dashboard Metrics 📊
**Use Case**: Dashboard statistics update in real-time

**Affected Pages**:
- Dashboard Page

**Example Scenario**:
- Admin is viewing dashboard
- New receipt gets approved
- "Approved Today" counter increments automatically

---

### 4. Collaborative Editing Prevention 🚫
**Use Case**: Prevent data conflicts when multiple users edit the same receipt

**Affected Pages**:
- Receipt Detail Page
- Create/Edit Receipt Pages

**Example Scenario**:
- User A starts editing a draft receipt
- User B tries to open the same receipt
- User B sees "Currently being edited by User A" message

---

### 5. User Presence Indicators 👥
**Use Case**: Show who's currently viewing important pages

**Affected Pages**:
- Approvals Page (optional)
- Receipt Detail Page (optional)

---

## 🔧 Implementation Plan

### Phase 1: Setup Supabase Realtime (2 hours)

#### 1.1 Enable Realtime in Supabase
```sql
-- Enable realtime for stock_receipts table
alter publication supabase_realtime add table stock_receipts;

-- Enable realtime for approval_workflow
alter publication supabase_realtime add table approval_workflow;

-- Enable realtime for notifications (if table exists)
alter publication supabase_realtime add table notifications;
```

#### 1.2 Create Realtime Hook
**File**: `src/hooks/useRealtimeSubscription.ts` (NEW)

```typescript
import { useEffect } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

export const useRealtimeSubscription = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_receipts',
        },
        (payload) => {
          console.log('Receipt changed:', payload)
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['receipts'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
          queryClient.invalidateQueries({ queryKey: ['approvals'] })
          
          // If we know the specific receipt ID, invalidate that too
          if (payload.new && (payload.new as any).id) {
            queryClient.invalidateQueries({ 
              queryKey: ['receipts', (payload.new as any).id] 
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_workflow',
        },
        (payload) => {
          console.log('Approval workflow changed:', payload)
          queryClient.invalidateQueries({ queryKey: ['approvals'] })
          queryClient.invalidateQueries({ queryKey: ['approval-history'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
```

---

### Phase 2: Integrate Realtime in Pages (4 hours)

#### 2.1 Update App.tsx to Enable Global Subscription
**File**: `src/App.tsx`

```typescript
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

function App() {
  // Enable realtime subscriptions globally
  useRealtimeSubscription()
  
  return (
    // ... rest of app
  )
}
```

#### 2.2 Receipt-Specific Realtime Hook
**File**: `src/hooks/useRealtimeReceipt.ts` (NEW)

```typescript
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

export const useRealtimeReceipt = (receiptId: string) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!receiptId) return

    const channel = supabase
      .channel(`receipt-${receiptId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_receipts',
          filter: `id=eq.${receiptId}`,
        },
        (payload) => {
          console.log('Receipt updated:', payload)
          
          // Immediately update cache with new data
          queryClient.setQueryData(['receipts', receiptId], payload.new)
          
          // Also invalidate to refetch with relationships
          queryClient.invalidateQueries({ queryKey: ['receipts', receiptId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [receiptId, queryClient])
}
```

**Usage in Receipt Detail Page**:
```typescript
// Add to ReceiptDetailPage.tsx
import { useRealtimeReceipt } from '@/hooks/useRealtimeReceipt'

const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams()
  const { data: receipt } = useReceipt(id!)
  
  // Enable real-time updates for this receipt
  useRealtimeReceipt(id!)
  
  // ... rest of component
}
```

---

### Phase 3: Optimistic Updates (3 hours)

#### 3.1 Update Mutations with Optimistic Updates
**File**: `src/hooks/useReceipts.ts`

```typescript
export const useVerifyReceipt = () => {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      receiptsApi.verify(id, userProfile!.id, comments),
    
    // Optimistic update
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['receipts', id] })
      
      // Snapshot previous value
      const previousReceipt = queryClient.getQueryData(['receipts', id])
      
      // Optimistically update to new value
      queryClient.setQueryData(['receipts', id], (old: any) => ({
        ...old,
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: userProfile!.id,
      }))
      
      // Return context with previous value
      return { previousReceipt }
    },
    
    // If mutation fails, rollback
    onError: (err, variables, context) => {
      if (context?.previousReceipt) {
        queryClient.setQueryData(['receipts', variables.id], context.previousReceipt)
      }
    },
    
    // Always refetch after success or error
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receipts', variables.id] })
    },
  })
}
```

---

### Phase 4: Notification System (4 hours)

#### 4.1 Create Notifications Table (if not exists)
```sql
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  receipt_id uuid references public.stock_receipts(id) on delete cascade,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS policies
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);
```

#### 4.2 Notification Hooks
**File**: `src/hooks/useNotifications.ts` (NEW)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useEffect } from 'react'

export const useNotifications = () => {
  const { userProfile } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', userProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile!.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data
    },
    enabled: !!userProfile?.id,
  })

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!userProfile?.id) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          console.log('New notification:', payload)
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          
          // Show toast notification
          toast.info(payload.new.title)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile?.id, queryClient])

  return query
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useUnreadCount = () => {
  const { userProfile } = useAuth()

  return useQuery({
    queryKey: ['notifications', 'unread-count', userProfile?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile!.id)
        .eq('read', false)
      
      if (error) throw error
      return count || 0
    },
    enabled: !!userProfile?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}
```

#### 4.3 Notification Badge in Navbar
**File**: `src/components/layout/Header.tsx` (or wherever navbar is)

```typescript
import { useUnreadCount } from '@/hooks/useNotifications'
import { Bell } from 'lucide-react'

const NotificationBell = () => {
  const { data: unreadCount } = useUnreadCount()

  return (
    <button className="relative">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
```

---

### Phase 5: Collaborative Editing Prevention (Optional - 2 hours)

#### 5.1 Create Presence System
**File**: `src/hooks/usePresence.ts` (NEW)

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'

export const usePresence = (channel: string) => {
  const { userProfile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    if (!userProfile) return

    const presenceChannel = supabase.channel(channel)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const users = Object.values(state).flat()
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userProfile.id,
            full_name: userProfile.full_name,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [channel, userProfile])

  return onlineUsers
}
```

**Usage in Receipt Detail Page**:
```typescript
const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams()
  const onlineUsers = usePresence(`receipt-${id}`)
  
  const otherUsers = onlineUsers.filter(u => u.user_id !== userProfile?.id)
  
  return (
    <div>
      {otherUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-800">
            Currently viewing: {otherUsers.map(u => u.full_name).join(', ')}
          </p>
        </div>
      )}
      {/* ... rest of page */}
    </div>
  )
}
```

---

## 📋 Testing Checklist

- [ ] Open same receipt in two browser tabs, edit in one, see update in other
- [ ] Submit receipt, verify notification appears for approvers
- [ ] Approve receipt, verify dashboard stats update instantly
- [ ] Check notification badge updates without refresh
- [ ] Verify optimistic updates show immediately
- [ ] Verify rollback works if mutation fails
- [ ] Test with multiple users simultaneously
- [ ] Check performance with many active subscriptions

---

## ⚡ Performance Considerations

### Subscription Management
- ✅ Use single global subscription for common tables
- ✅ Create specific subscriptions only when needed (e.g., detail pages)
- ✅ Clean up subscriptions on unmount
- ✅ Debounce rapid updates to prevent excessive re-renders

### Query Invalidation Strategy
- ✅ Invalidate specific queries, not all queries
- ✅ Use optimistic updates for instant feedback
- ✅ Set appropriate `staleTime` to reduce refetches

### Notification System
- ✅ Limit notification queries (e.g., last 50)
- ✅ Mark as read in batches
- ✅ Use pagination for notification history

---

## 🎯 Success Criteria

✅ Status changes reflect instantly across all viewing users  
✅ Notification badges update in real-time  
✅ Dashboard metrics update without manual refresh  
✅ Optimistic updates provide instant feedback  
✅ No performance degradation with subscriptions  
✅ Subscriptions clean up properly  
✅ Works with multiple simultaneous users  

---

**Estimated Total Time**: 12-16 hours (1.5-2 days)  
**Priority**: 🟡 **Medium** - Enhances UX significantly  
**Dependencies**: API Integration, Toast notifications  

---

**Last Updated**: 2025-10-04
