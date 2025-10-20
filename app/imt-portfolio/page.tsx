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
  ChevronDown,
  ChevronRight,
  Info,
  X,
  Maximize2,
  Folder
} from 'lucide-react'
import { toast } from 'sonner'

interface PortfolioFile {
  id: string
  filename: string
  original_filename: string
  display_name: string | null
  file_size: number
  file_type: string
  mime_type: string
  category: string
  subcategory: string | null
  evidence_type: string | null
  custom_subsection: string | null
  custom_evidence_type: string | null
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
  { value: 'qi', label: 'QI' },
  { value: 'others', label: 'Others' }
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
  ],
  'others': [
    { value: 'general', label: 'General' },
    { value: 'miscellaneous', label: 'Miscellaneous' }
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
    { value: 'publication', label: 'Publication' },
    { value: 'book', label: 'Book' }
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
  ],
  'others': [
    { value: 'document', label: 'Document' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' }
  ]
}

const SCORING_IMAGES = {
  'postgraduate': '/images/postgraduate-scoring.webp',
  'presentations': '/images/presentations-scoring.webp',
  'publications': '/images/publications-scoring.webp',
  'teaching-experience': '/images/teaching-experience-scoring.webp',
  'training-in-teaching': '/images/training-in-teaching-scoring.webp',
  'qi': '/images/qi-scoring.webp'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<PortfolioFile | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PortfolioFile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedScoringImage, setSelectedScoringImage] = useState<string>('')
  const [isCreatingCustomSubsection, setIsCreatingCustomSubsection] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    category: '',
    subcategory: '',
    evidenceType: '',
    customSubsection: '',
    customEvidenceType: '',
    displayName: '',
    pmid: '',
    url: '',
    description: ''
  })

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      // Check if user has CTF or Admin role
      const userRole = (session?.user as any)?.role
      if (userRole !== 'ctf' && userRole !== 'admin') {
        toast.error('Access Denied', {
          description: 'IMT Portfolio is only accessible to CTF and Admin users.'
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

    // Validate subcategory (required)
    if (!uploadForm.subcategory) {
      toast.error('Please select a subcategory')
      return
    }

    // Validate evidence type (required)
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
      formData.append('subcategory', uploadForm.subcategory || '')
      formData.append('evidenceType', uploadForm.evidenceType || '')
      formData.append('customSubsection', uploadForm.customSubsection || '')
      formData.append('customEvidenceType', uploadForm.customEvidenceType || '')
      formData.append('displayName', uploadForm.displayName)
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
        setUploadForm({ file: null, category: '', subcategory: '', evidenceType: '', customSubsection: '', customEvidenceType: '', displayName: '', pmid: '', url: '', description: '' })
        setIsCreatingCustomSubsection(false)
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
          displayName: uploadForm.displayName,
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
        setUploadForm({ file: null, category: '', subcategory: '', evidenceType: '', customSubsection: '', customEvidenceType: '', displayName: '', pmid: '', url: '', description: '' })
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
    setDeleteTarget(file)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/portfolio/files/${deleteTarget.id}`, {
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
  const openEditDialog = (file: PortfolioFile) => {
    setEditingFile(file)
    setUploadForm({
      file: null,
      category: file.category,
      subcategory: file.subcategory || '',
      evidenceType: file.evidence_type || '',
      customSubsection: file.custom_subsection || '',
      customEvidenceType: file.custom_evidence_type || '',
      displayName: file.display_name || file.original_filename || '',
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

  // Open image modal
  const openImageModal = (imageSrc: string) => {
    setSelectedScoringImage(imageSrc)
    setIsImageModalOpen(true)
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

  // Group files by subsection (organizational folders)
  const groupFilesBySubsection = (files: PortfolioFile[]) => {
    const groups: { [key: string]: PortfolioFile[] } = {}
    
    files.forEach(file => {
      const subsection = file.custom_subsection || 'General'
      if (!groups[subsection]) {
        groups[subsection] = []
      }
      groups[subsection].push(file)
    })
    
    return groups
  }

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
            <h1 className="text-3xl font-bold text-gray-900">IMT Portfolio</h1>
            <p className="text-gray-600 mt-2">Manage your professional portfolio files</p>
          </div>
          
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
                      <Select value={uploadForm.subcategory} onValueChange={(value) => {
                        // Auto-select evidence type based on subcategory
                        let evidenceType = '';
                        if (uploadForm.category === 'publications') {
                          evidenceType = value === 'book-medicine' ? 'book' : 'publication';
                        }
                        setUploadForm(prev => ({ ...prev, subcategory: value, evidenceType }));
                      }}>
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

                    {/* Organizational Folder Creation */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Want to organize files in a folder?</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsCreatingCustomSubsection(!isCreatingCustomSubsection)
                          if (isCreatingCustomSubsection) {
                            setUploadForm(prev => ({ ...prev, customSubsection: '' }))
                          }
                        }}
                      >
                        {isCreatingCustomSubsection ? 'No Folder' : 'Create Folder'}
                      </Button>
                    </div>

                    {isCreatingCustomSubsection && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Folder Name (Optional)</label>
                        <Input
                          value={uploadForm.customSubsection}
                          onChange={(e) => {
                            setUploadForm(prev => ({ ...prev, customSubsection: e.target.value }))
                          }}
                          placeholder="e.g., Constipation Poster, Diabetes Research"
                        />
                        <p className="text-xs text-gray-500 mt-1">Files will be organized in this folder within the category</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Evidence Type *</label>
                      <Select value={uploadForm.evidenceType} onValueChange={(value) => setUploadForm(prev => ({ ...prev, evidenceType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select evidence type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVIDENCE_TYPES[uploadForm.category as keyof typeof EVIDENCE_TYPES]?.filter(ev => {
                            // For publications, show ONLY the relevant evidence type based on subcategory
                            if (uploadForm.category === 'publications') {
                              if (uploadForm.subcategory === 'book-medicine') {
                                return ev.value === 'book'; // Show ONLY book
                              } else if (uploadForm.subcategory) {
                                return ev.value === 'publication'; // Show ONLY publication for other subcategories
                              }
                            }
                            return true; // Show all evidence types for other categories
                          }).map(ev => (
                            <SelectItem key={ev.value} value={ev.value}>
                              {ev.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </>
                )}

                {uploadForm.category && uploadForm.evidenceType && (
                  <>
                    {/* File upload for all evidence types */}
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

                    {/* PMID and URL fields for publications only (not for books) */}
                    {uploadForm.category === 'publications' && uploadForm.subcategory !== 'book-medicine' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">PMID (Optional)</label>
                          <Input
                            type="text"
                            value={uploadForm.pmid}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, pmid: e.target.value }))}
                            placeholder="Enter PubMed ID"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">URL (Optional)</label>
                          <Input
                            type="url"
                            value={uploadForm.url}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="Enter publication URL"
                          />
                        </div>
                      </>
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

        {/* Search and IMT Scoring Link */}
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
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.open('https://www.imtrecruitment.org.uk/recruitment-process/applying/application-scoring', '_blank')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Official IMT Scoring
          </Button>
        </div>

        {/* Search Results Section */}
        {searchQuery && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-600" />
                <span>Search Results for "{searchQuery}"</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const allFilteredFiles = files.filter(file => 
                  file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (file.display_name && file.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                
                if (allFilteredFiles.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <File className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm">No files found matching your search</p>
                    </div>
                  )
                }
                
                return (
                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-lg border border-blue-200">
                        <table className="min-w-full divide-y divide-gray-200 table-fixed">
                          <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
                            <tr className="border-b-2 border-blue-300">
                              <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[20%]">File</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[15%]">Category</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[15%]">Subcategory</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[15%]">Evidence Type</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[10%]">Size</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[15%]">Description</th>
                              <th className="text-right py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[10%]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {allFilteredFiles.map((file, index) => (
                              <tr key={file.id} className={`hover:bg-blue-50/50 transition-all duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                <td className="py-4 px-4 w-[20%]">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                      {getFileIcon(file.mime_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">
                                        {file.display_name || file.original_filename || 'Publication Link'}
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
                                <td className="py-4 px-4 w-[15%]">
                                  <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 truncate block">
                                    {CATEGORIES.find(c => c.value === file.category)?.label || file.category}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4 w-[15%]">
                                  <Badge variant="outline" className="text-xs font-medium bg-purple-50 text-purple-700 border-purple-200 truncate block">
                                    {getSubcategoryLabel(file.category, file.subcategory)}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4 w-[15%]">
                                  <Badge variant="outline" className="text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200 truncate block">
                                    {getEvidenceTypeLabel(file.category, file.evidence_type)}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4 w-[10%]">
                                  <span className="text-sm text-gray-600 font-medium">
                                    {file.file_size ? formatFileSize(file.file_size) : 'N/A'}
                                  </span>
                                </td>
                                <td className="py-4 px-4 w-[15%]">
                                  <p className="text-sm text-gray-600 truncate">
                                    {file.description || <span className="text-gray-400 italic">No description</span>}
                                  </p>
                                </td>
                                <td className="py-4 px-4 w-[10%]">
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
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

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
              const filesBySubsection = groupFilesBySubsection(filteredCategoryFiles)
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
                        <div className="space-y-4">
                          {Object.entries(filesBySubsection).map(([subsection, subsectionFiles]) => (
                            <div key={subsection} className="space-y-2">
                              {subsection !== 'General' && (
                                <div className="flex items-center space-x-2 py-2">
                                  <Folder className="w-4 h-4 text-gray-500" />
                                  <h4 className="text-sm font-medium text-gray-700">{subsection}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {subsectionFiles.length} file{subsectionFiles.length !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              )}
                              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                                <div className="inline-block min-w-full align-middle">
                                  <div className="overflow-hidden rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                              <tr className="border-b-2 border-purple-200">
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[25%]">File</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[20%]">Subcategory</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[15%]">Evidence Type</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[10%]">Size</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[15%]">Description</th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[10%]">Uploaded</th>
                                <th className="text-right py-4 px-4 font-semibold text-gray-800 text-sm uppercase tracking-wider w-[5%]">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {subsectionFiles.map((file, index) => (
                                <tr key={file.id} className={`hover:bg-purple-50/50 transition-all duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                  <td className="py-4 px-4 w-[25%]">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                                        {getFileIcon(file.mime_type)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                          {file.display_name || file.original_filename || 'Publication Link'}
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
                                  <td className="py-4 px-4 w-[20%]">
                                    <Badge variant="outline" className="text-xs font-medium bg-purple-50 text-purple-700 border-purple-200 truncate block">
                                      {getSubcategoryLabel(file.category, file.subcategory)}
                                    </Badge>
                                  </td>
                                  <td className="py-4 px-4 w-[15%]">
                                    <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 truncate block">
                                      {getEvidenceTypeLabel(file.category, file.evidence_type)}
                                    </Badge>
                                  </td>
                                  <td className="py-4 px-4 w-[10%]">
                                    <span className="text-sm text-gray-600 font-medium">
                                      {file.file_size ? formatFileSize(file.file_size) : 'N/A'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 w-[15%]">
                                    <p className="text-sm text-gray-600 truncate">
                                      {file.description || <span className="text-gray-400 italic">No description</span>}
                                    </p>
                                  </td>
                                  <td className="py-4 px-4 w-[10%]">
                                    <span className="text-sm text-gray-500 font-medium">
                                      {new Date(file.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 w-[5%]">
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
                                </div>
                              </div>
                            </div>
                          ))}
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
                      
                      {/* Official Scoring Section - Under each category (exclude 'others') */}
                      {SCORING_IMAGES[category.value as keyof typeof SCORING_IMAGES] && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <Info className="w-5 h-5 text-blue-600" />
                            <h4 className="text-lg font-semibold text-blue-900">Official IMT Scoring Criteria</h4>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="relative group w-full overflow-hidden">
                              <img 
                                src={SCORING_IMAGES[category.value as keyof typeof SCORING_IMAGES]} 
                                alt={`Official IMT scoring criteria for ${category.label}`}
                                className="w-full h-auto rounded-lg shadow-sm sm:w-1/2 sm:mx-auto sm:cursor-default cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ 
                                  maxWidth: '100%', 
                                  height: 'auto',
                                  objectFit: 'contain'
                                }}
                                onClick={(e) => {
                                  // Only open modal on mobile (sm and below)
                                  if (window.innerWidth < 640) {
                                    openImageModal(SCORING_IMAGES[category.value as keyof typeof SCORING_IMAGES]);
                                  }
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {/* Mobile expand icon */}
                              <div className="absolute top-2 right-2 sm:hidden">
                                <div className="bg-black/50 rounded-full p-1">
                                  <Maximize2 className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center sm:hidden">
                              Tap image to view full size
                            </p>
                          </div>
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
                     <Select value={uploadForm.subcategory} onValueChange={(value) => {
                       // Auto-select evidence type based on subcategory for publications
                       let evidenceType = uploadForm.evidenceType; // Keep current if not publications
                       if (uploadForm.category === 'publications') {
                         evidenceType = value === 'book-medicine' ? 'book' : 'publication';
                       }
                       setUploadForm(prev => ({ ...prev, subcategory: value, evidenceType }));
                     }}>
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
                        {EVIDENCE_TYPES[uploadForm.category as keyof typeof EVIDENCE_TYPES]?.filter(ev => {
                          // For publications, show ONLY the relevant evidence type based on subcategory
                          if (uploadForm.category === 'publications') {
                            if (uploadForm.subcategory === 'book-medicine') {
                              return ev.value === 'book'; // Show ONLY book
                            } else if (uploadForm.subcategory) {
                              return ev.value === 'publication'; // Show ONLY publication for other subcategories
                            }
                          }
                          return true; // Show all evidence types for other categories
                        }).map(ev => (
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
              ) : editingFile && (
                <div>
                  <label className="block text-sm font-medium mb-2">File Name</label>
                  <Input
                    type="text"
                    value={uploadForm.displayName}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Enter file name"
                  />
                </div>
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

        {/* Image Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 sm:max-w-4xl">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setIsImageModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              <img 
                src={selectedScoringImage} 
                alt="Official IMT Scoring Criteria - Full Size"
                className="w-full h-auto max-h-[95vh] object-contain rounded-lg"
                onError={(e) => {
                  console.error('Modal image failed to load:', selectedScoringImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteFileDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDelete}
          isLoading={isDeleting}
          title={`Delete "${deleteTarget?.filename}"`}
          description={`Are you sure you want to delete "${deleteTarget?.filename}"? This action cannot be undone and the file will be permanently removed from your portfolio.`}
        />
    </div>
  )
}
/ /   A u t o - d e p l o y   t r i g g e r  
 