import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/lib/api'
import type { UserUpdate, UserRole } from '@/types'

export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: { search?: string; role?: UserRole; department?: string }) => 
    [...USER_QUERY_KEYS.lists(), filters] as const,
  details: () => [...USER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
  stats: (id: string) => [...USER_QUERY_KEYS.all, 'stats', id] as const,
}

/**
 * Hook to fetch all users
 */
export function useUsers(filters?: { search?: string; role?: UserRole; department?: string }) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.list(filters),
    queryFn: () => usersService.getAllUsers(filters),
    staleTime: 30000,
  })
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.detail(userId || ''),
    queryFn: () => usersService.getUserById(userId!),
    enabled: !!userId,
  })
}

/**
 * Hook to fetch user statistics
 */
export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.stats(userId || ''),
    queryFn: () => usersService.getUserStats(userId!),
    enabled: !!userId,
  })
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UserUpdate }) =>
      usersService.updateUser(userId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() })
    },
  })
}

/**
 * Hook to update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      usersService.updateUserRole(userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() })
    },
  })
}

/**
 * Hook to deactivate a user
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersService.deactivateUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(userId) })
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() })
    },
  })
}

/**
 * Hook to activate a user
 */
export function useActivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersService.activateUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(userId) })
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() })
    },
  })
}
