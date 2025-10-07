import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsService, type FileUploadProgress } from '@/lib/api'

export const DOCUMENT_QUERY_KEYS = {
  all: ['documents'] as const,
  lists: () => [...DOCUMENT_QUERY_KEYS.all, 'list'] as const,
  receiptDocuments: (receiptId: string) => 
    [...DOCUMENT_QUERY_KEYS.lists(), 'receipt', receiptId] as const,
  allDocuments: (filters?: { search?: string }) => 
    [...DOCUMENT_QUERY_KEYS.lists(), 'all', filters] as const,
}

/**
 * Hook to fetch documents for a receipt
 */
export function useReceiptDocuments(receiptId: string | undefined) {
  return useQuery({
    queryKey: DOCUMENT_QUERY_KEYS.receiptDocuments(receiptId || ''),
    queryFn: () => documentsService.getReceiptDocuments(receiptId!),
    enabled: !!receiptId,
  })
}

/**
 * Hook to fetch all documents (admin view)
 */
export function useAllDocuments(filters?: { search?: string }) {
  return useQuery({
    queryKey: DOCUMENT_QUERY_KEYS.allDocuments(filters),
    queryFn: () => documentsService.getAllDocuments(filters),
    staleTime: 30000,
  })
}

/**
 * Hook to upload a document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      receiptId, 
      file, 
      onProgress 
    }: { 
      receiptId: string
      file: File
      onProgress?: (progress: number) => void 
    }) => documentsService.uploadDocument(receiptId, file, onProgress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: DOCUMENT_QUERY_KEYS.receiptDocuments(variables.receiptId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: DOCUMENT_QUERY_KEYS.allDocuments() 
      })
    },
  })
}

/**
 * Hook to upload multiple documents
 */
export function useUploadMultipleDocuments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      receiptId, 
      files, 
      onProgress 
    }: { 
      receiptId: string
      files: File[]
      onProgress?: (fileProgress: FileUploadProgress[]) => void 
    }) => documentsService.uploadMultipleDocuments(receiptId, files, onProgress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: DOCUMENT_QUERY_KEYS.receiptDocuments(variables.receiptId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: DOCUMENT_QUERY_KEYS.allDocuments() 
      })
    },
  })
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => documentsService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENT_QUERY_KEYS.lists() })
    },
  })
}

/**
 * Hook to download a document
 */
export function useDownloadDocument() {
  return useMutation({
    mutationFn: (documentId: string) => documentsService.downloadDocument(documentId),
  })
}
