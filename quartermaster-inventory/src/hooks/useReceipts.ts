import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { receiptsService, type ReceiptFilters, type PaginationParams } from '@/lib/api'
import type { StockReceiptInsert, StockReceiptUpdate } from '@/types'

export const RECEIPT_QUERY_KEYS = {
  all: ['receipts'] as const,
  lists: () => [...RECEIPT_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: ReceiptFilters, pagination?: PaginationParams) => 
    [...RECEIPT_QUERY_KEYS.lists(), filters, pagination] as const,
  details: () => [...RECEIPT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECEIPT_QUERY_KEYS.details(), id] as const,
  pendingApprovals: () => [...RECEIPT_QUERY_KEYS.all, 'pending'] as const,
  dashboardStats: () => [...RECEIPT_QUERY_KEYS.all, 'stats'] as const,
}

/**
 * Hook to fetch receipts with filters and pagination
 */
export function useReceipts(filters?: ReceiptFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: RECEIPT_QUERY_KEYS.list(filters, pagination),
    queryFn: () => receiptsService.getReceipts(filters, pagination),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch a single receipt by ID
 */
export function useReceipt(id: string | undefined) {
  return useQuery({
    queryKey: RECEIPT_QUERY_KEYS.detail(id || ''),
    queryFn: () => receiptsService.getReceiptById(id!),
    enabled: !!id,
  })
}

/**
 * Hook to fetch pending approvals
 */
export function usePendingApprovals() {
  return useQuery({
    queryKey: RECEIPT_QUERY_KEYS.pendingApprovals(),
    queryFn: () => receiptsService.getPendingApprovals(),
    staleTime: 10000, // 10 seconds
  })
}

/**
 * Hook to fetch dashboard stats
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: RECEIPT_QUERY_KEYS.dashboardStats(),
    queryFn: () => receiptsService.getDashboardStats(),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to create a receipt
 */
export function useCreateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (receipt: StockReceiptInsert) => receiptsService.createReceipt(receipt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.dashboardStats() })
    },
  })
}

/**
 * Hook to update a receipt
 */
export function useUpdateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: StockReceiptUpdate }) =>
      receiptsService.updateReceipt(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.lists() })
    },
  })
}

/**
 * Hook to delete a receipt
 */
export function useDeleteReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => receiptsService.deleteReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.dashboardStats() })
    },
  })
}

/**
 * Hook to submit a receipt
 */
export function useSubmitReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      receiptsService.submitReceipt(id, comments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.pendingApprovals() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.dashboardStats() })
    },
  })
}

/**
 * Hook to verify a receipt
 */
export function useVerifyReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      receiptsService.verifyReceipt(id, comments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.pendingApprovals() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.dashboardStats() })
    },
  })
}

/**
 * Hook to approve a receipt
 */
export function useApproveReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      receiptsService.approveReceipt(id, comments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.pendingApprovals() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.dashboardStats() })
    },
  })
}

/**
 * Hook to reject a receipt
 */
export function useRejectReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) =>
      receiptsService.rejectReceipt(id, comments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.pendingApprovals() })
      queryClient.invalidateQueries({ queryKey: RECEIPT_QUERY_KEYS.dashboardStats() })
    },
  })
}
