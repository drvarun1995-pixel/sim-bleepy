'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteFileDialog } from '@/components/ui/confirmation-dialog'
import { 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  FileText, 
  Image, 
  File,
  Plus,
  Search,
  Calendar,
  Folder,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { toast } from 'sonner'
import { useFilterPersistence } from '@/lib/filter-persistence'

interface TeachingPortfolioFile {
  id: string
  filename: string | null
  original_filename: string | null
  display_name: string | null
  file_size: number
  file_type: string | null
  mime_type: string | null
  category: string
  evidence_type: string | null
  file_path: string | null
  description: string | null
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: 'bedside-teaching', label: 'Bedside Teaching' },
  { value: 'twilight-teaching', label: 'Twilight Teaching' },
  { value: 'core-teaching', label: 'Core Teaching' },
  { value: 'osce-skills-teaching', label: 'OSCE Skills Teaching' },
  { value: 'exams', label: 'Exams' },
  { value: 'vr-sessions', label: 'VR Sessions' },
  { value: 'simulations', label: 'Simulations' },
  { value: 'portfolio-drop-in-sessions', label: 'Portfolio drop in sessions' },
  { value: 'clinical-skills-sessions', label: 'Clinical Skills sessions' },
  { value: 'paediatric-training-sessions', label: 'Paediatric training sessions' },
  { value: 'obs-gynae-training-sessions', label: 'Obs & Gynae training sessions' },
  { value: 'a-e-sessions', label: 'A-E sessions' },
  { value: 'hub-days', label: 'Hub days' },
  { value: 'others', label: 'Others' }
]

const EVIDENCE_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' }
]

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Date (Newest First)' },
  { value: 'date-asc', label: 'Date (Oldest First)' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'category-asc', label: 'Category (A-Z)' },
  { value: 'category-desc', label: 'Category (Z-A)' },
  { value: 'size-desc', label: 'Size (Largest First)' },
  { value: 'size-asc', label: 'Size (Smallest First)' }
]

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export default function TeachingPortfolioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<TeachingPortfolioFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date-desc')
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const { saveFilters, loadFilters } = useFilterPersistence('teaching-portfolio')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<TeachingPortfolioFile | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TeachingPortfolioFile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    category: '',
    evidenceType: '',
    displayName: '',
    description: ''
  })

  // Load saved filters on component mount
  useEffect(() => {
    const savedFilters = loadFilters()
    if (savedFilters.searchQuery !== undefined) setSearchQuery(savedFilters.searchQuery)
    if (savedFilters.categoryFilter !== undefined) {
      // Handle legacy empty string values
      setCategoryFilter(savedFilters.categoryFilter === '' ? 'all' : savedFilters.categoryFilter)
    }
    if (savedFilters.sortBy !== undefined) setSortBy(savedFilters.sortBy)
    setFiltersLoaded(true)
  }, [loadFilters])

  // Save filters whenever they change (but not on initial load)
  useEffect(() => {
    if (!filtersLoaded) return
    saveFilters({
      searchQuery: searchQuery,
      categoryFilter: categoryFilter,
      sortBy: sortBy,
    })
  }, [searchQuery, categoryFilter, sortBy, saveFilters, filtersLoaded])

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      // Check if user has CTF or Admin role
      const userRole = (session?.user as any)?.role
      if (userRole !== 'ctf' && userRole !== 'admin') {
        toast.error('Access Denied', {
          description: 'Teaching Portfolio is only accessible to CTF and Admin users.'
        })
        router.push('/dashboard')
      }
    }
  }, [status, session, router])

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (status !== 'authenticated') return

    try {
      setLoading(true)
      const response = await fetch('/api/teaching-portfolio/files')
      const data = await response.json()
      
      if (data.files) {
        setFiles(data.files)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadForm.category) {
      toast.error('Please select a category')
      return
    }

    if (!uploadForm.evidenceType) {
      toast.error('Please select an evidence type')
      return
    }

    if (!uploadForm.file) {
      toast.error('Please select a file')
      return
    }

    if (uploadForm.file.size > 25 * 1024 * 1024) {
      toast.error('File size must be less than 25MB')
      return
    }

    if (!ALLOWED_TYPES.includes(uploadForm.file.type)) {
      toast.error('File type not supported')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('category', uploadForm.category)
      formData.append('evidenceType', uploadForm.evidenceType)
      formData.append('displayName', uploadForm.displayName)
      formData.append('description', uploadForm.description)

      const response = await fetch('/api/teaching-portfolio/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('File uploaded successfully')
        setUploadForm({ file: null, category: '', evidenceType: '', displayName: '', description: '' })
        setIsUploadDialogOpen(false)
        fetchFiles()
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Handle file download
  const handleDownload = async (file: TeachingPortfolioFile) => {
    const toastId = toast.loading(`Downloading ${file.display_name || file.original_filename}...`)
    
    try {
      const response = await fetch(`/api/teaching-portfolio/files/${file.id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.original_filename || 'download'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success(`${file.display_name || file.original_filename} downloaded successfully`, { id: toastId })
      } else {
        toast.error('Failed to download file. Please try again.', { id: toastId })
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('An error occurred while downloading the file', { id: toastId })
    }
  }

  // Handle export all (ZIP + Word document)
  const handleExportAll = async () => {
    if (files.length === 0) {
      toast.error('No files to export')
      return
    }

    const toastId = toast.loading('Preparing your portfolio download...', {
      description: 'This may take a moment for large portfolios'
    })

    try {
      setIsExporting(true)
      const response = await fetch('/api/teaching-portfolio/download-all')
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'user'
        const cleanUserName = userName.replace(/[<>:"/\\|?*]/g, '_')
        a.download = `Teaching_Portfolio_${cleanUserName}_${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success(`Portfolio downloaded successfully! ${files.length} files packaged into ZIP`, { id: toastId })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to export portfolio', { id: toastId })
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('An error occurred while exporting the portfolio', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  // Handle file edit
  const handleEdit = async () => {
    if (!editingFile) return

    try {
      const response = await fetch(`/api/teaching-portfolio/files/${editingFile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: uploadForm.category,
          evidenceType: uploadForm.evidenceType,
          displayName: uploadForm.displayName,
          description: uploadForm.description
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('File updated successfully')
        setEditingFile(null)
        setIsEditDialogOpen(false)
        setUploadForm({ file: null, category: '', evidenceType: '', displayName: '', description: '' })
        fetchFiles()
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch (error) {
      console.error('Edit error:', error)
      toast.error('Update failed')
    }
  }

  // Handle file delete
  const handleDelete = async (file: TeachingPortfolioFile) => {
    setDeleteTarget(file)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/teaching-portfolio/files/${deleteTarget.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('File deleted successfully')
        fetchFiles()
      } else {
        toast.error(data.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Delete failed')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  // Open edit dialog
  const openEditDialog = (file: TeachingPortfolioFile) => {
    setEditingFile(file)
    setUploadForm({
      file: null,
      category: file.category,
      evidenceType: file.evidence_type || '',
      displayName: file.display_name || file.original_filename || '',
      description: file.description || ''
    })
    setIsEditDialogOpen(true)
  }

  // Get file icon
  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="w-5 h-5" />
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Filter and sort files
  const filteredFiles = files
    .filter(file => {
      // Search filter
      const matchesSearch = (file.original_filename?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                           (file.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                           (file.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name-asc':
          return (a.display_name || a.original_filename || '').localeCompare(b.display_name || b.original_filename || '')
        case 'name-desc':
          return (b.display_name || b.original_filename || '').localeCompare(a.display_name || a.original_filename || '')
        case 'category-asc':
          return (CATEGORIES.find(c => c.value === a.category)?.label || a.category).localeCompare(
            CATEGORIES.find(c => c.value === b.category)?.label || b.category
          )
        case 'category-desc':
          return (CATEGORIES.find(c => c.value === b.category)?.label || b.category).localeCompare(
            CATEGORIES.find(c => c.value === a.category)?.label || a.category
          )
        case 'size-desc':
          return (b.file_size || 0) - (a.file_size || 0)
        case 'size-asc':
          return (a.file_size || 0) - (b.file_size || 0)
        default:
          return 0
      }
    })

  if (status === 'loading') {
    return <LoadingScreen message="Loading portfolio..." />
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teaching Portfolio</h1>
          <p className="text-gray-600 mt-2">Manage your teaching portfolio files</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportAll} 
            disabled={isExporting || files.length === 0}
            className="bg-green-600 hover:bg-green-700"
            type="button"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Preparing ZIP...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Portfolio
              </>
            )}
          </Button>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700" type="button">
                <Plus className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...CATEGORIES].sort((a, b) => a.label.localeCompare(b.label)).map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {uploadForm.category && (
                <div>
                  <label className="block text-sm font-medium mb-2">Evidence Type *</label>
                  <Select value={uploadForm.evidenceType} onValueChange={(value) => setUploadForm(prev => ({ ...prev, evidenceType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select evidence type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVIDENCE_TYPES.map(ev => (
                        <SelectItem key={ev.value} value={ev.value}>
                          {ev.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {uploadForm.category && uploadForm.evidenceType && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">File *</label>
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setUploadForm(prev => ({ 
                          ...prev, 
                          file,
                          displayName: file ? file.name.replace(/\.[^/.]+$/, '') : ''
                        }))
                      }}
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    />
                  </div>

                  {uploadForm.file && (
                    <div>
                      <label className="block text-sm font-medium mb-2">File Name *</label>
                      <Input
                        type="text"
                        value={uploadForm.displayName}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Enter file name"
                      />
                    </div>
                  )}
                </>
              )}

              {uploadForm.category && (
                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this file..."
                    rows={3}
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {[...CATEGORIES].sort((a, b) => a.label.localeCompare(b.label)).map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Files List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-500"></div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <File className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium">
              {searchQuery || categoryFilter !== 'all' ? 'No files match your filters' : 'No files uploaded yet'}
            </p>
            <p className="text-sm mt-2">
              {searchQuery || categoryFilter !== 'all' ? 'Try adjusting your search terms or category filter' : 'Upload your first file to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFiles.map((file) => {
            const categoryLabel = CATEGORIES.find(c => c.value === file.category)?.label || file.category
            const evidenceTypeLabel = EVIDENCE_TYPES.find(e => e.value === file.evidence_type)?.label || file.evidence_type || 'N/A'

            return (
              <Card 
                key={file.id}
                className="shadow-lg border-0 backdrop-blur-sm transition-all duration-200 hover:shadow-xl bg-white/80"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(file.mime_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate text-lg">
                            {file.display_name || file.original_filename || 'Untitled'}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Folder className="h-4 w-4 mr-1.5 text-purple-500" />
                          <span className="font-medium">{categoryLabel}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {evidenceTypeLabel}
                        </Badge>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                          {formatDate(file.created_at)}
                        </div>
                        {file.file_size && (
                          <span className="text-xs text-gray-500">
                            {formatFileSize(file.file_size)}
                          </span>
                        )}
                      </div>
                      {file.description && (
                        <p className="text-gray-700 text-sm line-clamp-2 mt-2">
                          {file.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(file)
                      }}
                      className="h-9 hover:bg-green-100 hover:text-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditDialog(file)
                      }}
                      className="h-9 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(file)
                      }}
                      className="h-9 hover:bg-red-100 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {[...CATEGORIES].sort((a, b) => a.label.localeCompare(b.label)).map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Evidence Type *</label>
              <Select value={uploadForm.evidenceType} onValueChange={(value) => setUploadForm(prev => ({ ...prev, evidenceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select evidence type" />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map(ev => (
                    <SelectItem key={ev.value} value={ev.value}>
                      {ev.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">File Name *</label>
              <Input
                type="text"
                value={uploadForm.displayName}
                onChange={(e) => setUploadForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter file name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this file..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteFileDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title={`Delete "${deleteTarget?.display_name || deleteTarget?.original_filename || 'file'}"`}
        description={`Are you sure you want to delete "${deleteTarget?.display_name || deleteTarget?.original_filename || 'this file'}"? This action cannot be undone and the file will be permanently removed from your portfolio.`}
      />
    </div>
  )
}

