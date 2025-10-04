# Documents Page Implementation

**Status**: 🔴 **High Priority**  
**Current File**: `src/pages/documents/DocumentsPage.tsx` (19 lines placeholder)  
**Estimated Effort**: 2 days  
**Complexity**: Medium  

---

## 📊 Page Purpose

Centralized document management for receipt attachments and other files with upload, preview, and download capabilities.

---

## 🎯 Required Features

### 1. File Upload System
- **Drag & Drop Zone** - Visual drop area for files
- **Click to Browse** - Traditional file picker
- **Multiple File Upload** - Upload many files at once
- **Progress Indicators** - Show upload progress for each file
- **File Type Restrictions** - Images (jpg, png, pdf), max 5MB per file
- **Auto-link to Receipts** - Option to attach to specific receipt

### 2. File Browser
- **Grid View** - Thumbnail grid with file icons
- **List View** - Detailed table view
- **Search** - Filter by filename, type, date
- **Filter by Category** - Receipt documents, general files, etc.
- **Sort Options** - By name, date, size, type

### 3. File Preview
- **Image Preview** - Full-size image viewer with zoom
- **PDF Viewer** - Embedded PDF display
- **Download Option** - Direct download button

### 4. File Management
- **Rename** - Edit filename
- **Move** - Assign to different receipt
- **Delete** - With confirmation dialog
- **Bulk Operations** - Select multiple, delete/download batch

---

## 🔧 Implementation Plan

### Phase 1: Setup Supabase Storage (30 minutes)

#### 1.1 Create Storage Bucket (via Supabase Dashboard or SQL)
```sql
-- Create bucket for receipt documents
insert into storage.buckets (id, name, public)
values ('receipt-documents', 'receipt-documents', true);

-- Set up RLS policies for the bucket
create policy "Users can view receipt documents"
  on storage.objects for select
  using ( bucket_id = 'receipt-documents' );

create policy "Users can upload receipt documents"
  on storage.objects for insert
  with check ( bucket_id = 'receipt-documents' and auth.role() = 'authenticated' );

create policy "Users can delete own documents"
  on storage.objects for delete
  using ( bucket_id = 'receipt-documents' and auth.uid() = owner );
```

#### 1.2 Create Documents Table
```sql
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  file_type text not null,
  receipt_id uuid references public.stock_receipts(id) on delete cascade,
  uploaded_by uuid references public.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS policies
alter table public.documents enable row level security;

create policy "Users can view documents"
  on public.documents for select
  using (true);

create policy "Users can upload documents"
  on public.documents for insert
  with check (auth.uid() = uploaded_by);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = uploaded_by);
```

### Phase 2: Install Dependencies (10 minutes)

```bash
npm install react-dropzone
npm install react-pdf
npm install @react-pdf-viewer/core @react-pdf-viewer/default-layout
```

### Phase 3: Create API Layer (1 hour)

**File**: `src/lib/api/documents.ts` (NEW)

```typescript
import { supabase } from '@/lib/supabase'

export interface Document {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  receipt_id?: string
  uploaded_by: string
  created_at: string
  uploaded_by_user?: {
    full_name: string
  }
  receipt?: {
    receipt_id: string
  }
}

export const documentsApi = {
  // Upload file to storage and create record
  async upload(file: File, receiptId?: string, userId?: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${file.name}`
    const filePath = receiptId ? `${receiptId}/${fileName}` : `general/${fileName}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipt-documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Create document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        receipt_id: receiptId,
        uploaded_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data as Document
  },

  // Get all documents
  async getAll(filters?: { receiptId?: string; search?: string }) {
    let query = supabase
      .from('documents')
      .select(`
        *,
        uploaded_by_user:users!uploaded_by(full_name),
        receipt:stock_receipts(receipt_id)
      `)
      .order('created_at', { ascending: false })

    if (filters?.receiptId) {
      query = query.eq('receipt_id', filters.receiptId)
    }

    if (filters?.search) {
      query = query.ilike('file_name', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Document[]
  },

  // Get download URL
  async getDownloadUrl(filePath: string) {
    const { data } = supabase.storage
      .from('receipt-documents')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  // Delete document
  async delete(id: string, filePath: string) {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('receipt-documents')
      .remove([filePath])

    if (storageError) throw storageError

    // Delete record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Update document (rename, reassign)
  async update(id: string, updates: Partial<Document>) {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Document
  },
}
```

### Phase 4: Create Custom Hooks (30 minutes)

**File**: `src/hooks/useDocuments.ts` (NEW)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api/documents'
import { useAuth } from '@/lib/auth/AuthProvider'
import { toast } from 'react-hot-toast'

export const useDocuments = (filters?: { receiptId?: string; search?: string }) => {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentsApi.getAll(filters),
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

  return useMutation({
    mutationFn: ({ file, receiptId }: { file: File; receiptId?: string }) =>
      documentsApi.upload(file, receiptId, userProfile?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('File uploaded successfully')
    },
    onError: () => {
      toast.error('Failed to upload file')
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, filePath }: { id: string; filePath: string }) =>
      documentsApi.delete(id, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('File deleted')
    },
    onError: () => {
      toast.error('Failed to delete file')
    },
  })
}
```

### Phase 5: Build Components (6-8 hours)

**File**: `src/pages/documents/DocumentsPage.tsx`

```typescript
import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon,
  Download,
  Trash2,
  Search,
  Grid,
  List,
  X
} from 'lucide-react'
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/hooks/useDocuments'
import { documentsApi } from '@/lib/api/documents'

const DocumentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedReceipt, setSelectedReceipt] = useState<string>()
  const [previewFile, setPreviewFile] = useState<any>(null)

  const { data: documents, isLoading } = useDocuments({ 
    search: searchTerm,
    receiptId: selectedReceipt 
  })
  const uploadMutation = useUploadDocument()
  const deleteMutation = useDeleteDocument()

  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadMutation.mutateAsync({ file, receiptId: selectedReceipt })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
  })

  const handleDelete = async (doc: any) => {
    if (confirm(`Delete ${doc.file_name}?`)) {
      await deleteMutation.mutateAsync({ id: doc.id, filePath: doc.file_path })
    }
  }

  const handleDownload = async (doc: any) => {
    const url = await documentsApi.getDownloadUrl(doc.file_path)
    window.open(url, '_blank')
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-6 h-6" />
    if (fileType === 'application/pdf') return <FileText className="w-6 h-6" />
    return <File className="w-6 h-6" />
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
        {...getRootProps()}
        className={`card p-12 border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
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
      {isLoading ? (
        <div className="text-center py-12">Loading documents...</div>
      ) : documents?.length === 0 ? (
        <div className="card p-12 text-center">
          <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents yet</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents?.map((doc) => (
            <div key={doc.id} className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center">
                <div className="w-full aspect-square bg-muted rounded flex items-center justify-center mb-3">
                  {doc.file_type.startsWith('image/') ? (
                    <img
                      src={documentsApi.getDownloadUrl(doc.file_path)}
                      alt={doc.file_name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    getFileIcon(doc.file_type)
                  )}
                </div>
                <p className="text-sm font-medium text-center truncate w-full mb-2">
                  {doc.file_name}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="btn btn-danger btn-sm"
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
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents?.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm">{doc.file_name}</td>
                  <td className="px-6 py-4 text-sm">{doc.file_type}</td>
                  <td className="px-6 py-4 text-sm">
                    {(doc.file_size / 1024).toFixed(0)} KB
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="text-red-600 hover:text-red-700"
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
```

---

## 📋 Testing Checklist

- [ ] Drag & drop upload works
- [ ] Click to upload works
- [ ] Multiple file upload works
- [ ] File size limit enforced (5MB)
- [ ] File type restrictions work
- [ ] Grid view displays correctly
- [ ] List view displays correctly
- [ ] Search filters files
- [ ] Download works
- [ ] Delete works with confirmation
- [ ] Image thumbnails show correctly
- [ ] PDF icon shows for PDFs
- [ ] Mobile responsive

---

## 🎯 Success Criteria

✅ Files upload successfully to Supabase Storage  
✅ Documents table updated with metadata  
✅ Grid and list views both work  
✅ Search filters files correctly  
✅ Download and delete operations work  
✅ RLS policies enforce security  
✅ Responsive design  

---

**Estimated Time**: 12-16 hours (1.5-2 days)  
**Priority**: 🔴 **High** - Needed for receipt attachments  
**Dependencies**: Supabase Storage, react-dropzone  

---

**Last Updated**: 2025-10-04
