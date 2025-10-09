import React, { useState, useEffect } from 'react'
import { Upload, File, FileText, Image as ImageIcon, Download, Trash2, Search, Grid, List, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Document } from '@/types'
import { toast } from 'react-hot-toast'

const DocumentsPage: React.FC = () => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('documents')
        .select(`
          *,
          uploaded_by_user:users!uploaded_by(full_name),
          stock_receipt:stock_receipts(grn_number)
        `)
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Error loading documents:', error)
        // Don't show error toast if table doesn't exist yet
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          toast.error('Failed to load documents')
        }
        setDocuments([])
        return
      }

      setDocuments((data || []) as Document[])
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFileUpload(files)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (!user) return
    
    setUploading(true)
    try {
      for (const file of files) {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Save document record
        const { error: dbError } = await (supabase as any)
          .from('documents')
          .insert({
            file_name: file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user.id
          })

        if (dbError) throw dbError
      }

      toast.success(`${files.length} file(s) uploaded successfully!`)
      loadDocuments()
    } catch (error: any) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string, fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return
    
    try {
      const { error } = await (supabase as any)
        .from('documents')
        .delete()
        .eq('id', docId)

      if (error) throw error

      toast.success('Document deleted successfully')
      loadDocuments()
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-600" />
    if (fileType === 'application/pdf') return <FileText className="w-6 h-6 text-red-600" />
    return <File className="w-6 h-6 text-gray-600" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Documents</h1>
        <p className="mt-1 text-muted-foreground">
          Upload and manage receipt documents
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`card p-12 border-2 border-dashed cursor-pointer transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragOver ? (
            <p className="text-lg text-foreground">Drop files here...</p>
          ) : (
            <>
              <p className="text-lg text-foreground mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: Images (JPG, PNG), PDF • Max 5MB per file
              </p>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Files Display */}
      {filteredDocuments.length === 0 ? (
        <div className="card p-12 text-center">
          <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? 'No files match your search' : 'No documents yet'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center">
                <div className="w-full aspect-square bg-muted rounded flex items-center justify-center mb-3">
                  {getFileIcon(doc.file_type)}
                </div>
                <p className="text-sm font-medium text-center truncate w-full mb-2" title={doc.file_name}>
                  {doc.file_name}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {formatFileSize(doc.file_size)}
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.file_name)}
                    className="btn btn-danger btn-sm flex-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <table className="min-w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.file_type)}
                      <span className="text-sm font-medium">{doc.file_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {doc.file_type.split('/')[1].toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {doc.receipt_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(doc.uploaded_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="text-primary hover:text-primary/80"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.file_name)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default DocumentsPage
