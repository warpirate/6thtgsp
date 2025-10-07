import { useQuery } from '@tanstack/react-query'
import { auditService, type AuditLogFilters } from '@/lib/api'

export const AUDIT_QUERY_KEYS = {
  all: ['audit'] as const,
  lists: () => [...AUDIT_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: AuditLogFilters, page?: number) => 
    [...AUDIT_QUERY_KEYS.lists(), filters, page] as const,
  recent: (limit?: number) => [...AUDIT_QUERY_KEYS.all, 'recent', limit] as const,
  receipt: (receiptId: string) => [...AUDIT_QUERY_KEYS.all, 'receipt', receiptId] as const,
  userSummary: (userId: string, days?: number) => 
    [...AUDIT_QUERY_KEYS.all, 'summary', userId, days] as const,
}

/**
 * Hook to fetch audit logs
 */
export function useAuditLogs(filters?: AuditLogFilters, page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.list(filters, page),
    queryFn: () => auditService.getAuditLogs(filters, page, limit),
    staleTime: 10000,
  })
}

/**
 * Hook to fetch recent activities
 */
export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.recent(limit),
    queryFn: () => auditService.getRecentActivities(limit),
    staleTime: 5000,
  })
}

/**
 * Hook to fetch audit logs for a specific receipt
 */
export function useReceiptAuditLogs(receiptId: string | undefined) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.receipt(receiptId || ''),
    queryFn: () => auditService.getReceiptAuditLogs(receiptId!),
    enabled: !!receiptId,
  })
}

/**
 * Hook to fetch user activity summary
 */
export function useUserActivitySummary(userId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.userSummary(userId || '', days),
    queryFn: () => auditService.getUserActivitySummary(userId!, days),
    enabled: !!userId,
  })
}
