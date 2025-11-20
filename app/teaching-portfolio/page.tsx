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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Target,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  Users,
  Shield,
  Activity
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
  activity_date: string | null
  created_at: string
  updated_at: string
}

// Curriculum-aligned categories for ARCP
const CURRICULUM_DOMAINS = [
  {
    id: 'professional-values',
    name: 'Professional Values & Behaviours',
    description: 'Professionalism, communication, team working',
    color: 'purple',
    minEvidence: 3,
    subcategories: [
      { value: 'professionalism', label: 'Professionalism' },
      { value: 'communication', label: 'Communication' },
      { value: 'team-working', label: 'Team Working' }
    ]
  },
  {
    id: 'professional-skills',
    name: 'Professional Skills',
    description: 'Clinical skills, teaching skills, leadership',
    color: 'blue',
    minEvidence: 4,
    subcategories: [
      { value: 'clinical-skills', label: 'Clinical Skills' },
      { value: 'teaching-skills', label: 'Teaching Skills' },
      { value: 'leadership', label: 'Leadership' }
    ]
  },
  {
    id: 'professional-knowledge',
    name: 'Professional Knowledge',
    description: 'Medical knowledge, evidence-based practice, research',
    color: 'green',
    minEvidence: 3,
    subcategories: [
      { value: 'medical-knowledge', label: 'Medical Knowledge' },
      { value: 'evidence-based-practice', label: 'Evidence-Based Practice' },
      { value: 'research', label: 'Research' }
    ]
  },
  {
    id: 'health-promotion',
    name: 'Health Promotion & Illness Prevention',
    description: 'Public health, prevention strategies',
    color: 'orange',
    minEvidence: 2,
    subcategories: [
      { value: 'public-health', label: 'Public Health' },
      { value: 'prevention', label: 'Prevention Strategies' }
    ]
  },
  {
    id: 'patient-safety',
    name: 'Patient Safety & Quality Improvement',
    description: 'QI projects, audit, patient safety',
    color: 'red',
    minEvidence: 2,
    subcategories: [
      { value: 'qi-projects', label: 'QI Projects' },
      { value: 'audit', label: 'Audit' },
      { value: 'patient-safety', label: 'Patient Safety' }
    ]
  }
]

// Legacy categories (mapped to curriculum domains)
const CATEGORIES = [
  { value: 'bedside-teaching', label: 'Bedside Teaching', domain: 'professional-skills' },
  { value: 'twilight-teaching', label: 'Twilight Teaching', domain: 'professional-skills' },
  { value: 'core-teaching', label: 'Core Teaching', domain: 'professional-skills' },
  { value: 'osce-skills-teaching', label: 'OSCE Skills Teaching', domain: 'professional-skills' },
  { value: 'exams', label: 'Exams', domain: 'professional-knowledge' },
  // Professional Knowledge categories
  { value: 'medical-knowledge-sessions', label: 'Medical Knowledge Sessions', domain: 'professional-knowledge' },
  { value: 'evidence-based-practice-workshops', label: 'Evidence-Based Practice Workshops', domain: 'professional-knowledge' },
  { value: 'journal-club-participation', label: 'Journal Club Participation', domain: 'professional-knowledge' },
  { value: 'case-presentations', label: 'Case Presentations', domain: 'professional-knowledge' },
  { value: 'research-activities', label: 'Research Activities', domain: 'professional-knowledge' },
  { value: 'clinical-reasoning-sessions', label: 'Clinical Reasoning Sessions', domain: 'professional-knowledge' },
  { value: 'vr-sessions', label: 'VR Sessions', domain: 'professional-skills' },
  { value: 'simulations', label: 'Simulations', domain: 'professional-skills' },
  { value: 'portfolio-drop-in-sessions', label: 'Portfolio drop in sessions', domain: 'professional-values' },
  { value: 'communication-skills-training', label: 'Communication Skills Training', domain: 'professional-values' },
  { value: 'professionalism-workshops', label: 'Professionalism Workshops', domain: 'professional-values' },
  { value: 'team-working-sessions', label: 'Team Working Sessions', domain: 'professional-values' },
  { value: 'mdt-participation', label: 'MDT Participation', domain: 'professional-values' },
  { value: 'mentoring-activities', label: 'Mentoring Activities', domain: 'professional-values' },
  { value: 'ethics-training', label: 'Ethics Training', domain: 'professional-values' },
  { value: 'clinical-skills-sessions', label: 'Clinical Skills sessions', domain: 'professional-skills' },
  { value: 'paediatric-training-sessions', label: 'Paediatric training sessions', domain: 'professional-skills' },
  { value: 'obs-gynae-training-sessions', label: 'Obs & Gynae training sessions', domain: 'professional-skills' },
  { value: 'a-e-sessions', label: 'A-E sessions', domain: 'professional-skills' },
  { value: 'hub-days', label: 'Hub days', domain: 'professional-skills' },
  // Health Promotion categories
  { value: 'public-health-teaching', label: 'Public Health Teaching', domain: 'health-promotion' },
  { value: 'prevention-strategies', label: 'Prevention Strategies', domain: 'health-promotion' },
  { value: 'health-education-sessions', label: 'Health Education Sessions', domain: 'health-promotion' },
  { value: 'screening-program-teaching', label: 'Screening Program Teaching', domain: 'health-promotion' },
  { value: 'lifestyle-medicine-teaching', label: 'Lifestyle Medicine Teaching', domain: 'health-promotion' },
  { value: 'community-health-initiatives', label: 'Community Health Initiatives', domain: 'health-promotion' },
  { value: 'vaccination-program-teaching', label: 'Vaccination Program Teaching', domain: 'health-promotion' },
  // Patient Safety categories
  { value: 'qi-projects', label: 'QI Projects', domain: 'patient-safety' },
  { value: 'audit-projects', label: 'Audit Projects', domain: 'patient-safety' },
  { value: 'patient-safety-training', label: 'Patient Safety Training', domain: 'patient-safety' },
  { value: 'incident-reporting-training', label: 'Incident Reporting Training', domain: 'patient-safety' },
  { value: 'root-cause-analysis', label: 'Root Cause Analysis', domain: 'patient-safety' },
  { value: 'clinical-governance-participation', label: 'Clinical Governance Participation', domain: 'patient-safety' },
  { value: 'risk-management-training', label: 'Risk Management Training', domain: 'patient-safety' },
  { value: 'morbidity-mortality-meetings', label: 'Morbidity & Mortality Meetings', domain: 'patient-safety' },
  // Generic fallback
  { value: 'others', label: 'Others', domain: 'professional-knowledge' }
]

const EVIDENCE_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'document', label: 'Document' },
  { value: 'feedback', label: 'Formal Feedback' },
  { value: 'reflection', label: 'Reflection' },
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
  const [activeTab, setActiveTab] = useState('overview')
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
    curriculumDomain: '',
    category: '',
    evidenceType: '',
    displayName: '',
    description: '',
    activityDate: ''
  })

  // Load saved filters on component mount
  useEffect(() => {
    const savedFilters = loadFilters()
    if (savedFilters.searchQuery !== undefined) setSearchQuery(savedFilters.searchQuery)
    if (savedFilters.categoryFilter !== undefined) {
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

  // Get categories for selected domain
  const getCategoriesForDomain = (domainId: string) => {
    return CATEGORIES.filter(cat => cat.domain === domainId)
  }

  // Calculate ARCP metrics
  const calculateDomainProgress = () => {
    const domainStats = CURRICULUM_DOMAINS.map(domain => {
      // First, try to get files by curriculum_domain if it exists
      // Otherwise, fall back to category mapping
      const domainFiles = files.filter(file => {
        // Check if file has curriculum_domain field (new approach)
        if ((file as any).curriculum_domain) {
          return (file as any).curriculum_domain === domain.id
        }
        // Fall back to category mapping (legacy approach)
        const relatedCategories = CATEGORIES
          .filter(cat => cat.domain === domain.id)
          .map(cat => cat.value)
        return relatedCategories.includes(file.category)
      })
      
      const count = domainFiles.length
      const percentage = domain.minEvidence > 0 
        ? Math.min(100, (count / domain.minEvidence) * 100) 
        : 0
      const isComplete = count >= domain.minEvidence
      
      // Get category labels for this domain
      const categoryLabels = CATEGORIES
        .filter(cat => cat.domain === domain.id)
        .map(cat => cat.label)
      
      return {
        ...domain,
        count,
        percentage,
        isComplete,
        files: domainFiles,
        categoryLabels
      }
    })
    
    return domainStats
  }

  const domainProgress = calculateDomainProgress()
  const totalFiles = files.length
  const completeDomains = domainProgress.filter(d => d.isComplete).length
  const totalDomains = CURRICULUM_DOMAINS.length
  const arcpReadiness = totalDomains > 0 ? Math.round((completeDomains / totalDomains) * 100) : 0
  const missingEvidence = domainProgress.filter(d => !d.isComplete)

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadForm.curriculumDomain) {
      toast.error('Please select a curriculum domain')
      return
    }

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
      formData.append('curriculumDomain', uploadForm.curriculumDomain)
      formData.append('category', uploadForm.category)
      formData.append('evidenceType', uploadForm.evidenceType)
      formData.append('displayName', uploadForm.displayName)
      formData.append('description', uploadForm.description)
      formData.append('activityDate', uploadForm.activityDate || '')

      const response = await fetch('/api/teaching-portfolio/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('File uploaded successfully')
        setUploadForm({ file: null, curriculumDomain: '', category: '', evidenceType: '', displayName: '', description: '', activityDate: '' })
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

  // Handle export all
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
          curriculumDomain: uploadForm.curriculumDomain,
          category: uploadForm.category,
          evidenceType: uploadForm.evidenceType,
          displayName: uploadForm.displayName,
          description: uploadForm.description,
          activityDate: uploadForm.activityDate || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('File updated successfully')
        setEditingFile(null)
        setIsEditDialogOpen(false)
        setUploadForm({ file: null, curriculumDomain: '', category: '', evidenceType: '', displayName: '', description: '', activityDate: '' })
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
    // Determine domain from category or use stored domain
    const fileDomain = (file as any).curriculum_domain || CATEGORIES.find(c => c.value === file.category)?.domain || ''
    setUploadForm({
      file: null,
      curriculumDomain: fileDomain,
      category: file.category,
      evidenceType: file.evidence_type || '',
      displayName: file.display_name || file.original_filename || '',
      description: file.description || '',
      activityDate: file.activity_date ? new Date(file.activity_date).toISOString().split('T')[0] : ''
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
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Get color classes
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; progress: string }> = {
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        progress: 'bg-purple-600'
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        progress: 'bg-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        progress: 'bg-green-600'
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        progress: 'bg-orange-600'
      },
      red: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        progress: 'bg-red-600'
      }
    }
    return colors[color] || colors.purple
  }

  // Filter and sort files
  const filteredFiles = files
    .filter(file => {
      const matchesSearch = (file.original_filename?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                           (file.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                           (file.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      
      const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          const dateA = a.activity_date ? new Date(a.activity_date).getTime() : new Date(a.created_at).getTime()
          const dateB = b.activity_date ? new Date(b.activity_date).getTime() : new Date(b.created_at).getTime()
          return dateB - dateA
        case 'date-asc':
          const dateA_asc = a.activity_date ? new Date(a.activity_date).getTime() : new Date(a.created_at).getTime()
          const dateB_asc = b.activity_date ? new Date(b.activity_date).getTime() : new Date(b.created_at).getTime()
          return dateA_asc - dateB_asc
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teaching Portfolio</h1>
          <p className="text-gray-600 mt-2">ARCP-compliant teaching portfolio management</p>
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
                  <label className="block text-sm font-medium mb-2">Curriculum Domain *</label>
                  <Select value={uploadForm.curriculumDomain} onValueChange={(value) => setUploadForm(prev => ({ ...prev, curriculumDomain: value, category: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select curriculum domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRICULUM_DOMAINS.map(domain => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {uploadForm.curriculumDomain && (
                    <p className="text-xs text-gray-500 mt-1">
                      {CURRICULUM_DOMAINS.find(d => d.id === uploadForm.curriculumDomain)?.description}
                    </p>
                  )}
                </div>

                {uploadForm.curriculumDomain && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoriesForDomain(uploadForm.curriculumDomain)
                          .sort((a, b) => a.label.localeCompare(b.label))
                          .map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {getCategoriesForDomain(uploadForm.curriculumDomain).length === 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        No specific categories available for this domain. You can use "Others" category or contact admin to add domain-specific categories.
                      </p>
                    )}
                  </div>
                )}

                {uploadForm.curriculumDomain && uploadForm.category && (
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

                {uploadForm.curriculumDomain && uploadForm.category && uploadForm.evidenceType && (
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

                {uploadForm.curriculumDomain && uploadForm.category && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Activity Date (Optional)</label>
                      <Input
                        type="date"
                        value={uploadForm.activityDate}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, activityDate: e.target.value }))}
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
                  </>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Files ({totalFiles})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - ARCP Dashboard */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* ARCP Readiness Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">ARCP Readiness</p>
                    <p className="text-3xl font-bold text-purple-900">{arcpReadiness}%</p>
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    arcpReadiness >= 80 ? 'bg-green-500' : arcpReadiness >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {arcpReadiness >= 80 ? (
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Complete Domains</p>
                    <p className="text-3xl font-bold text-blue-900">{completeDomains}/{totalDomains}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Total Evidence</p>
                    <p className="text-3xl font-bold text-green-900">{totalFiles}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">Missing Evidence</p>
                    <p className="text-3xl font-bold text-orange-900">{missingEvidence.length}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Domain Progress Cards */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Curriculum Domain Progress</h2>
            {domainProgress.map((domain) => {
              const colors = getColorClasses(domain.color)
              return (
                <Card key={domain.id} className={`${colors.border} border-2`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
                          {domain.isComplete ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{domain.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`font-medium ${colors.text}`}>
                            {domain.count} / {domain.minEvidence} evidence items
                          </span>
                          <span className="text-gray-500">
                            {Math.round(domain.percentage)}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${colors.progress}`}
                        style={{ width: `${Math.min(100, domain.percentage)}%` }}
                      />
                    </div>
                    {domain.categoryLabels && domain.categoryLabels.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Categories that count toward this domain:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {domain.categoryLabels.map((label, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(!domain.categoryLabels || domain.categoryLabels.length === 0) && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> No specific categories available for this domain. You can upload files using "Others" category or contact admin to add domain-specific categories.
                        </p>
                      </div>
                    )}
                    {!domain.isComplete && (
                      <p className="text-xs text-gray-500 mt-2">
                        Need {domain.minEvidence - domain.count} more evidence item{domain.minEvidence - domain.count !== 1 ? 's' : ''} to complete this domain
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Missing Evidence Alert */}
          {missingEvidence.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  Action Required: Missing Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-700 mb-4">
                  The following curriculum domains need additional evidence to meet ARCP requirements:
                </p>
                <ul className="space-y-2">
                  {missingEvidence.map((domain) => (
                    <li key={domain.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{domain.name}</span>
                        <p className="text-sm text-gray-600">
                          Currently have {domain.count} of {domain.minEvidence} required evidence items
                        </p>
                      </div>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        Need {domain.minEvidence - domain.count} more
                      </Badge>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => setActiveTab('files')}
                  className="mt-4 bg-yellow-600 hover:bg-yellow-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Evidence
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Files Tab - Existing File Management */}
        <TabsContent value="files" className="space-y-6 mt-6">
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
                            {file.activity_date && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                                {formatDate(file.activity_date)}
                              </div>
                            )}
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
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Curriculum Domain *</label>
              <Select value={uploadForm.curriculumDomain} onValueChange={(value) => setUploadForm(prev => ({ ...prev, curriculumDomain: value, category: '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select curriculum domain" />
                </SelectTrigger>
                <SelectContent>
                  {CURRICULUM_DOMAINS.map(domain => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {uploadForm.curriculumDomain && (
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoriesForDomain(uploadForm.curriculumDomain)
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    {/* Always show "Others" as fallback */}
                    {getCategoriesForDomain(uploadForm.curriculumDomain).length === 0 && (
                      <SelectItem value="others">Others</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

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
              <label className="block text-sm font-medium mb-2">Activity Date (Optional)</label>
              <Input
                type="date"
                value={uploadForm.activityDate}
                onChange={(e) => setUploadForm(prev => ({ ...prev, activityDate: e.target.value }))}
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
