"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  FolderOpen,
  BookOpen,
  FileVideo,
  FileImage,
  File,
  Clock,
  Eye,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Filter,
  Grid3x3,
  List as ListIcon,
  Calendar,
  Check,
  Trash2,
  AlertTriangle,
  X,
  Edit
} from "lucide-react";

interface ResourceFile {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: 'pdf' | 'video' | 'image' | 'document' | 'other';
  fileSize: string;
  uploadDate: string;
  teachingDate?: string; // Date when the teaching/session occurred
  taughtBy?: string; // Who taught the session
  downloadUrl: string;
  views: number;
  uploadedBy?: string;
  linkedEvents?: Array<{ // Events this resource is linked to
    id: string;
    title: string;
    date: string;
    start_time?: string;
    location_name?: string;
  }>;
}

// Format mapping - maps database format IDs to display info
const formatMapping: Record<string, { name: string; color: string; icon: any }> = {
  'a-e-practice-sessions': { name: 'A-E Practice Sessions', color: '#ef4444', icon: FileText },
  'bedside-teaching': { name: 'Bedside Teaching', color: '#f59e0b', icon: BookOpen },
  'clinical-skills': { name: 'Clinical Skills', color: '#10b981', icon: FileText },
  'core-teachings': { name: 'Core Teachings', color: '#3b82f6', icon: BookOpen },
  'exams-mocks': { name: 'Exams & Mocks', color: '#8b5cf6', icon: FileText },
  'grand-round': { name: 'Grand Round', color: '#f59e0b', icon: Sparkles },
  'hub-days': { name: 'Hub Days', color: '#06b6d4', icon: Calendar },
  'inductions': { name: 'Inductions', color: '#84cc16', icon: BookOpen },
  'obs-gynae-practice-sessions': { name: 'Obs & Gynae Practice', color: '#ec4899', icon: FileText },
  'osce-revision': { name: 'OSCE Revision', color: '#ef4444', icon: FileText },
  'others': { name: 'Others', color: '#6b7280', icon: FolderOpen },
  'paeds-practice-sessions': { name: 'Paeds Practice', color: '#14b8a6', icon: FileText },
  'pharmacy-teaching': { name: 'Pharmacy Teaching', color: '#a855f7', icon: BookOpen },
  'portfolio-drop-ins': { name: 'Portfolio Drop-ins', color: '#3b82f6', icon: FileText },
  'twilight-teaching': { name: 'Twilight Teaching', color: '#8b5cf6', icon: Clock },
  'virtual-reality-sessions': { name: 'Virtual Reality Sessions', color: '#06b6d4', icon: FileVideo }
};

export default function ResourcesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isAdmin } = useAdmin();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [resources, setResources] = useState<ResourceFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; resource: ResourceFile | null }>({
    show: false,
    resource: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [editModal, setEditModal] = useState<{ show: boolean; resource: ResourceFile | null }>({
    show: false,
    resource: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    customCategory: '',
    teachingDate: '',
    taughtBy: ''
  });

  // Load preferences from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('resources-view-mode') as 'grid' | 'list' | null;
    const savedItemsPerPage = localStorage.getItem('resources-items-per-page');

    if (savedViewMode) setViewMode(savedViewMode);
    if (savedItemsPerPage) setItemsPerPage(Number(savedItemsPerPage));
  }, []);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('resources-view-mode', viewMode);
  }, [viewMode]);

  // Save items per page to localStorage
  useEffect(() => {
    localStorage.setItem('resources-items-per-page', String(itemsPerPage));
  }, [itemsPerPage]);

  // Fetch resources from API
  useEffect(() => {
    async function fetchResources() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/resources');
        
        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }
        
        const data = await response.json();
        
        // Transform API data to match our interface
        const transformedResources: ResourceFile[] = data.resources.map((resource: any) => {
          console.log('Resource:', resource.title, 'Linked events:', resource.linked_events);
          return {
            id: resource.id,
            title: resource.title,
            description: resource.description || '',
            category: resource.category,
            fileType: getFileTypeFromMime(resource.file_type),
            fileSize: formatFileSizeBytes(resource.file_size),
            uploadDate: resource.upload_date,
            teachingDate: resource.teaching_date,
            taughtBy: resource.taught_by,
            downloadUrl: resource.id, // We'll use this for the download API
            views: resource.views || 0,
            uploadedBy: resource.uploaded_by_name,
            linkedEvents: resource.linked_events || []
          };
        });
        
        setResources(transformedResources);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (session) {
      fetchResources();
    }
  }, [session]);

  // Helper function to determine file type from MIME type
  const getFileTypeFromMime = (mimeType: string): ResourceFile['fileType'] => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('word') || mimeType.includes('document') || 
        mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'document';
    return 'other';
  };

  // Helper function to format file size
  const formatFileSizeBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handler for category selection
  const toggleCategorySelection = (categoryId: string) => {
    const newSelection = new Set(selectedCategories);
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    setSelectedCategories(newSelection);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearAllCategories = () => {
    setSelectedCategories(new Set());
    setCurrentPage(1);
  };

  const getCategoryCount = () => {
    return selectedCategories.size;
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Go to specific page
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle download
  const handleDownload = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/resources/download/${resourceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate download link');
      }
      
      const data = await response.json();
      
      // Open the signed URL in a new tab to download
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (resource: ResourceFile) => {
    setDeleteModal({ show: true, resource });
  };

  // Handle delete confirmation
  const confirmDelete = async () => {
    if (!deleteModal.resource) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/resources/delete/${deleteModal.resource.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete resource');
      }
      
      // Remove the resource from the local state
      setResources(prevResources => prevResources.filter(r => r.id !== deleteModal.resource?.id));
      
      // Close modal
      setDeleteModal({ show: false, resource: null });
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete resource. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteModal({ show: false, resource: null });
  };

  // Show edit modal
  const showEditModal = (resource: ResourceFile) => {
    // Extract custom category from description if it exists
    const customCategoryMatch = resource.description.match(/\[Format: (.*?)\]/);
    const customCategory = customCategoryMatch ? customCategoryMatch[1] : '';
    const cleanDescription = resource.description.replace(/\[Format:.*?\]\s*/, '');

    setEditFormData({
      title: resource.title,
      description: cleanDescription,
      category: resource.category,
      customCategory: customCategory,
      teachingDate: resource.teachingDate || '',
      taughtBy: resource.taughtBy || ''
    });
    setEditModal({ show: true, resource });
  };

  // Handle edit confirmation
  const confirmEdit = async () => {
    if (!editModal.resource) return;

    setIsEditing(true);
    try {
      const response = await fetch(`/api/resources/edit/${editModal.resource.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update resource');
      }
      
      // Update the resource in local state
      setResources(prevResources => 
        prevResources.map(r => {
          if (r.id === editModal.resource?.id) {
            return {
              ...r,
              title: editFormData.title,
              description: editFormData.category === 'others' && editFormData.customCategory
                ? `[Format: ${editFormData.customCategory}] ${editFormData.description}`
                : editFormData.description,
              category: editFormData.category,
              teachingDate: editFormData.teachingDate || undefined,
              taughtBy: editFormData.taughtBy || undefined,
            };
          }
          return r;
        })
      );
      
      // Close modal
      setEditModal({ show: false, resource: null });
    } catch (error) {
      console.error('Edit error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update resource. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditModal({ show: false, resource: null });
  };

  // Generate dynamic categories based on formats that have resources
  const categories = React.useMemo(() => {
    // Count resources per category
    const categoryCounts: Record<string, number> = {};
    resources.forEach(resource => {
      categoryCounts[resource.category] = (categoryCounts[resource.category] || 0) + 1;
    });

    // Build categories array with only formats that have resources
    const dynamicCategories = Object.keys(categoryCounts)
      .filter(categoryId => categoryCounts[categoryId] > 0)
      .map(categoryId => ({
        id: categoryId,
        name: formatMapping[categoryId]?.name || categoryId,
        color: formatMapping[categoryId]?.color || '#6b7280',
        icon: formatMapping[categoryId]?.icon || FolderOpen,
        count: categoryCounts[categoryId]
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    return dynamicCategories;
  }, [resources]);

  // Filter resources by category and search
  const filteredResources = resources.filter(resource => {
    // Category filter
    const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(resource.category);
    
    // Search filter - search in title, description, taught by, and uploaded by
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.taughtBy && resource.taughtBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (resource.uploadedBy && resource.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Pagination calculations
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? filteredResources.length : startIndex + itemsPerPage;
  const paginatedResources = filteredResources.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
      case 'document':
        return FileText;
      case 'video':
        return FileVideo;
      case 'image':
        return FileImage;
      default:
        return File;
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return 'bg-red-100 text-red-600';
      case 'video':
        return 'bg-purple-100 text-purple-600';
      case 'image':
        return 'bg-blue-100 text-blue-600';
      case 'document':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Resource Library</h1>
              <p className="text-gray-600 text-lg">
                Access study materials, recordings, and practice resources
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all border-l ${
                    viewMode === 'list'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                  }`}
                >
                  <ListIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>

              {/* Items Per Page Selector */}
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={-1}>All</option>
              </select>

              {/* Upload Button - Admin/Educator Only */}
              {isAdmin && (
                <Button
                  onClick={() => router.push('/resources/upload')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md text-sm sm:text-base"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Upload Resource</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Category Filter - Mobile Dropdown */}
        <Card className="mb-6 md:hidden relative">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-5 w-5 text-purple-600" />
              <h2 className="text-base font-semibold text-gray-900">Filter by Category</h2>
            </div>
            
            {/* Dropdown Button */}
            <button
              onClick={() => setShowMobileDropdown(!showMobileDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-purple-400 transition-all"
            >
              <span className="text-sm font-medium text-gray-700">
                {getCategoryCount() === 0 
                  ? 'Select Categories' 
                  : `${getCategoryCount()} Categor${getCategoryCount() > 1 ? 'ies' : 'y'} Selected`}
              </span>
              <ChevronRight className={`h-5 w-5 text-gray-500 transition-transform ${showMobileDropdown ? 'rotate-90' : ''}`} />
            </button>

            {/* Backdrop Overlay */}
            {showMobileDropdown && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMobileDropdown(false)}
              />
            )}

            {/* Dropdown Menu */}
            {showMobileDropdown && (
              <div className="mt-3 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto relative z-50">
                {/* Show All Option */}
                <button
                  onClick={() => {
                    clearAllCategories();
                    setShowMobileDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                      getCategoryCount() === 0 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-purple-600' 
                        : 'border-gray-300'
                    }`}>
                      {getCategoryCount() === 0 && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <FolderOpen className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900">All Resources</span>
                  </div>
                  <span className="text-xs text-gray-500">({resources.length})</span>
                </button>

                {/* Category Options */}
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count = category.count;
                  const isSelected = selectedCategories.has(category.id);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategorySelection(category.id)}
                      className="w-full flex items-center justify-between px-4 py-3 transition-colors border-b border-gray-100 last:border-b-0"
                      style={{
                        backgroundColor: isSelected ? `${category.color}10` : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = `${category.color}08`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center`}
                        style={{
                          backgroundColor: isSelected ? category.color : 'transparent',
                          borderColor: isSelected ? category.color : `${category.color}60`
                        }}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <Icon className="h-5 w-5" style={{ color: category.color }} />
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      </div>
                      <span 
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Filters Display */}
            {getCategoryCount() > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from(selectedCategories).map(catId => {
                  const category = categories.find(c => c.id === catId);
                  if (!category) return null;
                  
                  return (
                    <span
                      key={catId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name}
                      <button
                        onClick={() => toggleCategorySelection(catId)}
                        className="ml-1 hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center text-base font-bold transition-all"
                        title="Remove this filter"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                <button
                  onClick={clearAllCategories}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-full transition-all"
                >
                  ✕ Clear All
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Filter Buttons - Desktop Only */}
        <Card className="mb-8 hidden md:block">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filter by Category</h2>
              </div>
              {getCategoryCount() > 0 && (
                <Button
                  onClick={clearAllCategories}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 hover:text-red-700 font-semibold shadow-sm"
                >
                  ✕ Clear All ({getCategoryCount()})
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={clearAllCategories}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md ${
                  getCategoryCount() === 0
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
                }`}
              >
                <FolderOpen className="h-5 w-5" />
                <span>All Resources</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  getCategoryCount() === 0 ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {resources.length}
                </span>
              </button>
              
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategories.has(category.id);
                const count = category.count;

                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategorySelection(category.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md relative ${
                      isSelected
                        ? 'text-white transform scale-105'
                        : 'bg-white text-gray-700 border-2'
                    }`}
                    style={{
                      backgroundColor: isSelected ? category.color : undefined,
                      borderColor: isSelected ? category.color : `${category.color}40`,
                      '--hover-bg': `${category.color}10`,
                      '--hover-border': category.color,
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = `${category.color}10`;
                        e.currentTarget.style.borderColor = category.color;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = `${category.color}40`;
                      }
                    }}
                  >
                    {isSelected && <Check className="h-4 w-4 mr-1 absolute left-2 top-1/2 -translate-y-1/2" />}
                    <Icon 
                      className="h-5 w-5" 
                      style={{ 
                        marginLeft: isSelected ? '16px' : '0',
                        color: isSelected ? 'white' : category.color
                      }} 
                    />
                    <span>{category.name}</span>
                    <span 
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isSelected ? 'bg-white/20 text-white' : ''
                      }`}
                      style={{
                        backgroundColor: isSelected ? undefined : `${category.color}20`,
                        color: isSelected ? undefined : category.color
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Filters Display - Desktop */}
            {getCategoryCount() > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
                  {Array.from(selectedCategories).map(catId => {
                    const category = categories.find(c => c.id === catId);
                    if (!category) return null;
                    
                    return (
                      <span
                        key={catId}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium shadow-sm text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                        <button
                          onClick={() => toggleCategorySelection(catId)}
                          className="ml-1 hover:bg-black/10 rounded-full w-5 h-5 flex items-center justify-center text-lg font-bold transition-all"
                          title="Remove this filter"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resources Display */}
        {isLoading ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Resources...</h3>
                <p className="text-gray-600">Please wait while we fetch your resources</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredResources.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resources Found</h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? `No resources match your search "${searchQuery}"`
                    : 'No resources available in this category'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedResources.map((resource) => {
              const FileIcon = getFileIcon(resource.fileType);
              const categoryInfo = categories.find(c => c.id === resource.category);
              
              return (
                <Card 
                  key={resource.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 hover:border-purple-300"
                  onClick={() => handleDownload(resource.id)}
                >
                  <CardContent className="p-0">
                    {/* Header with icon and category */}
                    <div 
                      className="p-6 pb-4"
                      style={{ 
                        background: `linear-gradient(135deg, ${categoryInfo?.color}22 0%, ${categoryInfo?.color}05 100%)`
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${getFileTypeColor(resource.fileType)}`}
                        >
                          <FileIcon className="h-7 w-7" />
                        </div>
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                          style={{ backgroundColor: categoryInfo?.color }}
                        >
                          {categoryInfo?.name}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {resource.description}
                      </p>
                    </div>

                    {/* Footer with metadata */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex flex-col gap-1.5 mb-3 text-xs">
                        {/* Student View: Teaching info */}
                        {resource.teachingDate && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600">Topic taught on:</span>
                            <span className="font-medium text-blue-600">{formatDate(resource.teachingDate)}</span>
                          </div>
                        )}
                        {resource.taughtBy && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600">Topic taught by:</span>
                            <span className="font-medium text-gray-900">{resource.taughtBy}</span>
                          </div>
                        )}
                        
                        {/* Admin/Educator View: Upload info */}
                        {isAdmin && (
                          <>
                            {resource.uploadedBy && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">Uploaded by:</span>
                                <span className="font-medium text-gray-700">{resource.uploadedBy}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Upload date:</span>
                              <span className="font-medium text-gray-700">{formatDate(resource.uploadDate)}</span>
                            </div>
                          </>
                        )}
                        
                        {/* Mapped to Events */}
                        {resource.linkedEvents && resource.linkedEvents.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-1 mb-1">
                              <Calendar className="h-3 w-3 text-purple-600" />
                              <span className="text-gray-600 font-medium">Mapped to:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {resource.linkedEvents.map((event: any) => (
                                <a
                                  key={event.id}
                                  href={`/events/${event.id}`}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800 text-xs font-medium transition-colors cursor-pointer"
                                  title={`${event.title} - ${new Date(event.date).toLocaleDateString()}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  {event.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* File info */}
                        <div className="flex items-center gap-3 text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{resource.views} views</span>
                          </div>
                          <span className="font-medium">{resource.fileSize}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="flex-1 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(resource.id);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        
                        {isAdmin && (
                          <>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                showEditModal(resource);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                showDeleteConfirmation(resource);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View - Compact */
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {paginatedResources.map((resource) => {
                  const FileIcon = getFileIcon(resource.fileType);
                  const categoryInfo = categories.find(c => c.id === resource.category);
                  
                  return (
                    <div
                      key={resource.id}
                      className="hover:bg-purple-50 transition-colors group"
                    >
                      {/* Mobile View - Compact Stacked */}
                      <div className="flex md:hidden items-start gap-3 px-3 py-3">
                        <div 
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileTypeColor(resource.fileType)}`}
                        >
                          <FileIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">
                            {resource.title}
                          </h3>
                          
                          {resource.teachingDate && (
                            <div className="text-[11px] text-blue-600 font-medium mb-0.5">
                              {formatDate(resource.teachingDate)}
                            </div>
                          )}
                          
                          {/* Mapped Events - Mobile */}
                          {resource.linkedEvents && resource.linkedEvents.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-0.5">
                              {resource.linkedEvents.map((event: any) => (
                                <a
                                  key={event.id}
                                  href={`/events/${event.id}`}
                                  className="text-[10px] text-purple-600 hover:text-purple-800 font-medium underline"
                                  title={event.title}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  📅 {event.title}
                                </a>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium text-gray-600">{resource.fileSize}</span>
                            <span 
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white"
                              style={{ backgroundColor: categoryInfo?.color }}
                            >
                              {categoryInfo?.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:text-white group-hover:border-0 transition-all h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(resource.id);
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showEditModal(resource);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showDeleteConfirmation(resource);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Desktop View - Table Layout */}
                      <div className="hidden md:flex items-center gap-4 px-4 py-3">
                        {/* Left: Icon and Title */}
                        <div className="flex items-center gap-3 w-[35%]">
                          <div 
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileTypeColor(resource.fileType)}`}
                          >
                            <FileIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {resource.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-600">{resource.fileSize}</span>
                              <span 
                                className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                                style={{ backgroundColor: categoryInfo?.color }}
                              >
                                {categoryInfo?.name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Teaching Info */}
                        <div className="flex-1 flex flex-col gap-1 text-xs min-w-0">
                          {resource.teachingDate && (
                            <div className="flex items-start gap-1">
                              <span className="text-gray-600 whitespace-nowrap">Topic taught on:</span>
                              <span className="font-medium text-blue-600">{formatDate(resource.teachingDate)}</span>
                            </div>
                          )}
                          {resource.taughtBy && (
                            <div className="flex items-start gap-1">
                              <span className="text-gray-600 whitespace-nowrap">Topic taught by:</span>
                              <span className="font-medium text-gray-900">{resource.taughtBy}</span>
                            </div>
                          )}
                          
                          {/* Mapped Events - Desktop */}
                          {resource.linkedEvents && resource.linkedEvents.length > 0 && (
                            <div className="flex items-start gap-1 flex-wrap">
                              <span className="text-gray-600 whitespace-nowrap">📅 Mapped to:</span>
                              {resource.linkedEvents.map((event: any, idx: number) => (
                                <span key={event.id}>
                                  <a
                                    href={`/events/${event.id}`}
                                    className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
                                    title={event.title}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {event.title}
                                  </a>
                                  {idx < resource.linkedEvents.length - 1 && <span className="text-gray-400">, </span>}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Admin/Educator View: Upload info */}
                          {isAdmin && (
                            <>
                              {resource.uploadedBy && (
                                <div className="flex items-start gap-1">
                                  <span className="text-gray-500 whitespace-nowrap">Uploaded by:</span>
                                  <span className="font-medium text-gray-700">{resource.uploadedBy}</span>
                                </div>
                              )}
                              <div className="flex items-start gap-1">
                                <span className="text-gray-500 whitespace-nowrap">Upload date:</span>
                                <span className="font-medium text-gray-700">{formatDate(resource.uploadDate)}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:text-white group-hover:border-0 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(resource.id);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showEditModal(resource);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showDeleteConfirmation(resource);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {filteredResources.length > 0 && itemsPerPage !== -1 && totalPages > 1 && (
          <div className="mt-8">
            <div className="flex items-center justify-center w-full">
              {/* Mobile: Compact layout */}
              <div className="flex sm:hidden items-center justify-center" style={{ gap: '0px', maxWidth: '100%' }}>
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0"
                  title="First"
                >
                  <ChevronsLeft className="h-3 w-3" />
                </button>

                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0 ml-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>

                <div className="flex items-center mx-1">
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-300">
                    {currentPage} / {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0 mr-1"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>

                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="disabled:opacity-30 disabled:cursor-not-allowed w-[30px] h-[30px] flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-all flex-shrink-0"
                  title="Last"
                >
                  <ChevronsRight className="h-3 w-3" />
                </button>
              </div>

              {/* Desktop: Full layout */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-4 py-2 text-sm font-medium rounded transition-all ${
                        currentPage === pageNum
                          ? 'text-white border-2'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                      style={{
                        backgroundColor: currentPage === pageNum ? '#8b5cf6' : 'transparent',
                        borderColor: currentPage === pageNum ? '#8b5cf6' : undefined
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        {filteredResources.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredResources.length)} of {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
              {selectedCategories.size > 0 && ` in ${selectedCategories.size} selected categor${selectedCategories.size > 1 ? 'ies' : 'y'}`}
            </p>
          </div>
        )}

        {/* Info Banner */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need a specific resource?</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Can't find what you're looking for? Request new resources or suggest topics you'd like to see covered.
                </p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  Request Resource
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {deleteModal.show && deleteModal.resource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b border-red-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Delete Resource?</h3>
                      <p className="text-sm text-gray-600">This action cannot be undone</p>
                    </div>
                    <button
                      onClick={cancelDelete}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isDeleting}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">You are about to delete:</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 break-words">
                        {deleteModal.resource.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{deleteModal.resource.fileSize}</span>
                        <span>•</span>
                        <span>{deleteModal.resource.fileType.toUpperCase()}</span>
                        {deleteModal.resource.uploadedBy && (
                          <>
                            <span>•</span>
                            <span>Uploaded by {deleteModal.resource.uploadedBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">
                        <strong>Warning:</strong> This will permanently delete the file from storage and remove all associated data. Students will no longer be able to access this resource.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={cancelDelete}
                    disabled={isDeleting}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Resource Modal */}
        {editModal.show && editModal.resource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100 sticky top-0 z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Edit className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Edit Resource</h3>
                      <p className="text-sm text-gray-600">Update resource information</p>
                    </div>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isEditing}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Title *</label>
                    <Input
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      placeholder="Resource title"
                      disabled={isEditing}
                      className="text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <Textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Brief description"
                      disabled={isEditing}
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  {/* Format */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Format *</label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value, customCategory: '' })}
                      disabled={isEditing}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="others">Others</option>
                      <option value="a-e-practice-sessions">A-E Practice Sessions</option>
                      <option value="bedside-teaching">Bedside Teaching</option>
                      <option value="clinical-skills">Clinical Skills</option>
                      <option value="core-teachings">Core Teachings</option>
                      <option value="exams-mocks">Exams & Mocks</option>
                      <option value="grand-round">Grand Round</option>
                      <option value="hub-days">Hub days</option>
                      <option value="inductions">Inductions</option>
                      <option value="obs-gynae-practice-sessions">Obs & Gynae Practice Sessions</option>
                      <option value="osce-revision">OSCE Revision</option>
                      <option value="paeds-practice-sessions">Paeds Practice Sessions</option>
                      <option value="pharmacy-teaching">Pharmacy Teaching</option>
                      <option value="portfolio-drop-ins">Portfolio Drop-ins</option>
                      <option value="twilight-teaching">Twilight Teaching</option>
                      <option value="virtual-reality-sessions">Virtual Reality Sessions</option>
                    </select>
                  </div>

                  {/* Custom Format */}
                  {editFormData.category === 'others' && (
                    <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <label className="text-sm font-medium text-blue-900">Specify Format *</label>
                      <Input
                        value={editFormData.customCategory}
                        onChange={(e) => setEditFormData({ ...editFormData, customCategory: e.target.value })}
                        placeholder="e.g., Research Papers"
                        disabled={isEditing}
                        className="border-blue-300 focus:ring-blue-500 text-sm"
                      />
                      <p className="text-xs text-blue-700">
                        This will be stored under "Others" format
                      </p>
                    </div>
                  )}

                  {/* Teaching Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Teaching Date</label>
                    <Input
                      type="date"
                      value={editFormData.teachingDate}
                      onChange={(e) => setEditFormData({ ...editFormData, teachingDate: e.target.value })}
                      disabled={isEditing}
                      className="text-sm"
                    />
                  </div>

                  {/* Taught By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Taught By</label>
                    <Input
                      value={editFormData.taughtBy}
                      onChange={(e) => setEditFormData({ ...editFormData, taughtBy: e.target.value })}
                      placeholder="e.g., Dr. Smith"
                      disabled={isEditing}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200 sticky bottom-0">
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={isEditing}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmEdit}
                    disabled={isEditing}
                    className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isEditing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
}

