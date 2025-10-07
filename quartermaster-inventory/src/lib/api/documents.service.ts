import { supabase, supabaseHelpers, STORAGE_BUCKETS } from '@/lib/supabase'
import type { Document, DocumentInsert } from '@/types'
import { toast } from 'react-hot-toast'

export interface FileUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
  documentId?: string
}

class DocumentsService {
  /**
   * Get all documents for a receipt
   */
  async getReceiptDocuments(receiptId: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploaded_by_user:users!documents_uploaded_by_fkey(id, full_name, email)
        `)
        .eq('receipt_id', receiptId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching documents:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get all documents (admin view)
   */
  async getAllDocuments(filters?: { search?: string }) {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          receipt:stock_receipts(id, grn_number, status),
          uploaded_by_user:users!documents_uploaded_by_fkey(id, full_name, email)
        `)
        .order('uploaded_at', { ascending: false })

      if (filters?.search) {
        query = query.ilike('file_name', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching all documents:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Upload a file to storage and create document record
   */
  async uploadDocument(
    receiptId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Validate file
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit')
      }

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not allowed')
      }

      // Generate unique file path
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${user.id}/${receiptId}/${timestamp}-${sanitizedFileName}`

      // Upload file to storage
      onProgress?.(0)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.RECEIPT_DOCUMENTS)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      onProgress?.(50)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.RECEIPT_DOCUMENTS)
        .getPublicUrl(filePath)

      // Create document record in database
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          receipt_id: receiptId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from(STORAGE_BUCKETS.RECEIPT_DOCUMENTS)
          .remove([filePath])
        throw dbError
      }

      onProgress?.(100)
      toast.success(`${file.name} uploaded successfully!`)
      
      return document
    } catch (error: any) {
      console.error('Error uploading document:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleDocuments(
    receiptId: string,
    files: File[],
    onProgress?: (fileProgress: FileUploadProgress[]) => void
  ): Promise<Document[]> {
    const results: Document[] = []
    const progress: FileUploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }))

    onProgress?.(progress)

    for (let i = 0; i < files.length; i++) {
      try {
        progress[i].status = 'uploading'
        onProgress?.(progress)

        const document = await this.uploadDocument(
          receiptId,
          files[i],
          (fileProgress) => {
            progress[i].progress = fileProgress
            onProgress?.(progress)
          }
        )

        progress[i].status = 'success'
        progress[i].documentId = document.id
        results.push(document)
        onProgress?.(progress)
      } catch (error: any) {
        progress[i].status = 'error'
        progress[i].error = error.message
        onProgress?.(progress)
      }
    }

    return results
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string) {
    try {
      // Get document details
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (fetchError) throw fetchError
      if (!document) throw new Error('Document not found')

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.RECEIPT_DOCUMENTS)
        .remove([document.file_path])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }

      // Delete document record from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (dbError) throw dbError

      toast.success('Document deleted successfully!')
      return true
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Download a document
   */
  async downloadDocument(documentId: string) {
    try {
      // Get document details
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (fetchError) throw fetchError
      if (!document) throw new Error('Document not found')

      // Download file from storage
      const { data, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKETS.RECEIPT_DOCUMENTS)
        .download(document.file_path)

      if (downloadError) throw downloadError

      // Create download link
      const url = URL.createObjectURL(data)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.file_name
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Download started!')
      return true
    } catch (error: any) {
      console.error('Error downloading document:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get document URL
   */
  getDocumentUrl(filePath: string): string {
    return supabaseHelpers.getFileUrl(STORAGE_BUCKETS.RECEIPT_DOCUMENTS, filePath)
  }
}

export const documentsService = new DocumentsService()
