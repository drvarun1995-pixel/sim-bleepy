'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  FileText, 
  Image, 
  File,
  Plus,
  Filter,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

interface PortfolioFile {
  id: string
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  mime_type: string
  category: string
  subcategory: string | null
  evidence_type: string | null
  pmid: string | null
  url: string | null
  description: string | null
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'presentations', label: 'Presentations' },
  { value: 'publications', label: 'Publications' },
  { value: 'teaching-experience', label: 'Teaching experience' },
  { value: 'training-in-teaching', label: 'Training in teaching' },
  { value: 'qi', label: 'QI' }
]

const SUBCATEGORIES = {
  'postgraduate': [
    { value: 'phd', label: 'PhD' },
    { value: 'md', label: 'MD' },
    { value: 'other-masters', label: 'Other Masters level degree (e.g. MSc, MA, M.Res)' },
    { value: 'other-diploma', label: 'Other PG diploma or certificate' }
  ],
  'presentations': [
    { value: 'oral', label: 'Oral Presentation' },
    { value: 'poster', label: 'Poster Presentation' }
  ],
  'publications': [
    { value: 'original-research', label: 'Original research' },
    { value: 'pubmed-editorial', label: 'PubMed: Editorial' },
    { value: 'pubmed-reviews', label: 'PubMed: Reviews' },
    { value: 'pubmed-abstracts', label: 'PubMed: Abstracts' },
    { value: 'pubmed-case-reports', label: 'PubMed: Case Reports' },
    { value: 'pubmed-letters', label: 'PubMed: Letters' },
    { value: 'book-medicine', label: 'Book in Medicine' },
    { value: 'non-pubmed', label: 'Non-PubMed' }
  ],
  'teaching-experience': [
    { value: 'organised-taught', label: 'Organised + Taught' },
    { value: 'taught', label: 'Taught' },
    { value: 'occasional-teaching', label: 'Occasional Teaching' }
  ],
  'training-in-teaching': [
    { value: 'pg-cert', label: 'PG Cert' },
    { value: 'pg-diploma', label: 'PG Diploma' },
    { value: 'others', label: 'Others (such as Teach the Teacher course)' }
  ],
  'qi': [
    { value: 'audit', label: 'Audit' },
    { value: 'qip', label: 'QIP' }
  ]
}

const EVIDENCE_TYPES = {
  'postgraduate': [
    { value: 'certificate', label: 'Certificate' }
  ],
  'presentations': [
    { value: 'abstract-accepted-email', label: 'Abstract accepted email' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'slides', label: 'Slides' }
  ],
  'publications': [
    { value: 'pmid-url', label: 'PMID and URL' }
  ],
  'teaching-experience': [
    { value: 'letter', label: 'Letter' },
    { value: 'timetable', label: 'Timetable/Programme Outline/Content' },
    { value: 'formal-feedback', label: 'Formal Feedback' }
  ],
  'training-in-teaching': [
    { value: 'certificate', label: 'Certificate' },
    { value: 'course-outline', label: 'Course Outline' }
  ],
  'qi': [
    { value: 'certificate', label: 'Certificate' },
    { value: 'qipat-form', label: 'QIPAT form' },
    { value: 'other', label: 'Other' }
  ]
}

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

export default function PortfolioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<PortfolioFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<PortfolioFile | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    category: '',
    subcategory: '',
    evidenceType: '',
    pmid: '',
    url: '',
    description: ''
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (status !== 'authenticated') return

    try {
      setLoading(true)
      const response = await fetch('/api/portfolio/files')
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

    if (!uploadForm.subcategory) {
      toast.error('Please select a subcategory')
      return
    }

    if (!uploadForm.evidenceType) {
      toast.error('Please select an evidence type')
      return
    }

    // For publications, validate PMID or URL
    if (uploadForm.category === 'publications' && uploadForm.evidenceType === 'pmid-url') {
      if (!uploadForm.pmid && !uploadForm.url) {
        toast.error('Please provide either PMID or URL for publications')
        return
      }
    } else {
      // For non-publications, file is required
      if (!uploadForm.file) {
        toast.error('Please select a file')
        return
      }
    }

    if (uploadForm.file && uploadForm.file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    if (uploadForm.file && !ALLOWED_TYPES.includes(uploadForm.file.type)) {
      toast.error('File type not supported')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      if (uploadForm.file) {
        formData.append('file', uploadForm.file)
      }
      formData.append('category', uploadForm.category)
      formData.append('subcategory', uploadForm.subcategory)
      formData.append('evidenceType', uploadForm.evidenceType)
      formData.append('pmid', uploadForm.pmid)
      formData.append('url', uploadForm.url)
      formData.append('description', uploadForm.description)

      const response = await fetch('/api/portfolio/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('File uploaded successfully')
        setUploadForm({ file: null, category: '', subcategory: '', evidenceType: '', pmid: '', url: '', description: '' })
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
  const handleDownload = async (file: PortfolioFile) => {
    try {
      const response = await fetch(`/api/portfolio/files/${file.id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.original_filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error('Download failed')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed')
    }
  }

  // Handle file edit
  const handleEdit = async () => {
    if (!editingFile) return

    try {
      const response = await fetch(`/api/portfolio/files/${editingFile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: uploadForm.category,
          subcategory: uploadForm.subcategory,
          evidenceType: uploadForm.evidenceType,
          pmid: uploadForm.pmid,
          url: uploadForm.url,
          description: uploadForm.description
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('File updated successfully')
        setEditingFile(null)
        setIsEditDialogOpen(false)
        setUploadForm({ file: null, category: '', subcategory: '', evidenceType: '', pmid: '', url: '', description: '' })
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
  const handleDelete = async (file: PortfolioFile) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/portfolio/files/${file.id}`, {
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
    }
  }

  // Open edit dialog
  const openEditDialog = (file: PortfolioFile) => {
    setEditingFile(file)
    setUploadForm({
      file: null,
      category: file.category,
      subcategory: file.subcategory || '',
      evidenceType: file.evidence_type || '',
      pmid: file.pmid || '',
      url: file.url || '',
      description: file.description || ''
    })
    setIsEditDialogOpen(true)
  }

  // Get file icon
  const getFileIcon = (mimeType: string) => {
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

  // Get subcategory label
  const getSubcategoryLabel = (category: string, subcategory: string | null) => {
    if (!subcategory) return 'No subcategory'
    const subcategories = SUBCATEGORIES[category as keyof typeof SUBCATEGORIES]
    const subcategoryObj = subcategories?.find(sub => sub.value === subcategory)
    return subcategoryObj?.label || subcategory
  }

  // Get evidence type label
  const getEvidenceTypeLabel = (category: string, evidenceType: string | null) => {
    if (!evidenceType) return 'No evidence type'
    const evidenceTypes = EVIDENCE_TYPES[category as keyof typeof EVIDENCE_TYPES]
    const evidenceTypeObj = evidenceTypes?.find(ev => ev.value === evidenceType)
    return evidenceTypeObj?.label || evidenceType
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Group files by category
  const filesByCategory = files.reduce((acc, file) => {
    if (!acc[file.category]) {
      acc[file.category] = []
    }
    acc[file.category].push(file)
    return acc
  }, {} as Record<string, PortfolioFile[]>)

  // Filter files by search query
  const getFilteredFilesForCategory = (categoryFiles: PortfolioFile[]) => {
    return categoryFiles.filter(file => {
      const matchesSearch = file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSearch
    })
  }

  if (status === 'loading') {
    return <LoadingScreen message="Loading portfolio..." />
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex">
      <DashboardSidebar role={(session?.user as any)?.role || 'user'} />
      
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IMT Portfolio</h1>
            <p className="text-gray-600 mt-2">Manage your professional portfolio files</p>
          </div>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
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
                  <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value, subcategory: '', evidenceType: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {uploadForm.category && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subcategory *</label>
                      <Select value={uploadForm.subcategory} onValueChange={(value) => setUploadForm(prev => ({ ...prev, subcategory: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBCATEGORIES[uploadForm.category as keyof typeof SUBCATEGORIES]?.map(subcat => (
                            <SelectItem key={subcat.value} value={subcat.value}>
                              {subcat.label}
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
                          {EVIDENCE_TYPES[uploadForm.category as keyof typeof EVIDENCE_TYPES]?.map(ev => (
                            <SelectItem key={ev.value} value={ev.value}>
                              {ev.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {uploadForm.category === 'publications' && uploadForm.evidenceType === 'pmid-url' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">PMID</label>
                      <Input
                        type="text"
                        value={uploadForm.pmid}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, pmid: e.target.value }))}
                        placeholder="Enter PubMed ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">URL</label>
                      <Input
                        type="url"
                        value={uploadForm.url}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="Enter publication URL"
                      />
                    </div>
                  </>
                ) : uploadForm.category && uploadForm.evidenceType && (
                  <div>
                    <label className="block text-sm font-medium mb-2">File *</label>
                    <Input
                      type="file"
                      onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    />
                  </div>
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

        {/* Filters */}
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
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Files by Category */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {CATEGORIES.map((category) => {
              const categoryFiles = filesByCategory[category.value] || []
              const filteredCategoryFiles = getFilteredFilesForCategory(categoryFiles)
              const isExpanded = expandedCategories.has(category.value)
              const hasFiles = filteredCategoryFiles.length > 0
              
              return (
                <Card key={category.value} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCategory(category.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {category.label}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {categoryFiles.length} file{categoryFiles.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      {hasFiles ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full">
                            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                              <tr className="border-b-2 border-purple-200">
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider">File</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider">Subcategory</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider">Evidence Type</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider">Size</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider">Description</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider">Uploaded</th>
                                <th className="text-right py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {filteredCategoryFiles.map((file, index) => (
                                <tr key={file.id} className={`hover:bg-purple-50/50 transition-all duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                                        {getFileIcon(file.mime_type)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                          {file.original_filename || 'Publication Link'}
                                        </p>
                                        {file.pmid && (
                                          <p className="text-xs text-purple-600 mt-1">PMID: {file.pmid}</p>
                                        )}
                                        {file.url && (
                                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block truncate">
                                            {file.url}
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <Badge variant="outline" className="text-xs font-medium bg-purple-50 text-purple-700 border-purple-200">
                                      {getSubcategoryLabel(file.category, file.subcategory)}
                                    </Badge>
                                  </td>
                                  <td className="py-4 px-4">
                                    <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                                      {getEvidenceTypeLabel(file.category, file.evidence_type)}
                                    </Badge>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="text-sm text-gray-600 font-medium">
                                      {file.file_size ? formatFileSize(file.file_size) : 'N/A'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <p className="text-sm text-gray-600 max-w-xs truncate">
                                      {file.description || <span className="text-gray-400 italic">No description</span>}
                                    </p>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="text-sm text-gray-500 font-medium">
                                      {new Date(file.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center justify-end space-x-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDownload(file)}
                                        className="h-9 w-9 p-0 hover:bg-green-100 hover:text-green-700 rounded-lg transition-colors"
                                        title="Download"
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openEditDialog(file)}
                                        className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors"
                                        title="Edit"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(file)}
                                        className="h-9 w-9 p-0 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                          <File className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-sm">
                            {searchQuery 
                              ? 'No files found matching your search'
                              : 'No files uploaded yet'
                            }
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
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
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value, subcategory: '', evidenceType: '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {uploadForm.category && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subcategory</label>
                    <Select value={uploadForm.subcategory} onValueChange={(value) => setUploadForm(prev => ({ ...prev, subcategory: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBCATEGORIES[uploadForm.category as keyof typeof SUBCATEGORIES]?.map(subcat => (
                          <SelectItem key={subcat.value} value={subcat.value}>
                            {subcat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Evidence Type</label>
                    <Select value={uploadForm.evidenceType} onValueChange={(value) => setUploadForm(prev => ({ ...prev, evidenceType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select evidence type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVIDENCE_TYPES[uploadForm.category as keyof typeof EVIDENCE_TYPES]?.map(ev => (
                          <SelectItem key={ev.value} value={ev.value}>
                            {ev.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {uploadForm.category === 'publications' && uploadForm.evidenceType === 'pmid-url' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">PMID</label>
                    <Input
                      type="text"
                      value={uploadForm.pmid}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, pmid: e.target.value }))}
                      placeholder="Enter PubMed ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">URL</label>
                    <Input
                      type="url"
                      value={uploadForm.url}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="Enter publication URL"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
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
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
