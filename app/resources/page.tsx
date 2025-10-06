"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Check
} from "lucide-react";

interface ResourceFile {
  id: string;
  title: string;
  description: string;
  category: 'core-teaching' | 'grand-rounds' | 'osce' | 'twilight';
  fileType: 'pdf' | 'video' | 'image' | 'document' | 'other';
  fileSize: string;
  uploadDate: string;
  teachingDate?: string; // Date when the teaching/session occurred
  taughtBy?: string; // Who taught the session
  downloadUrl: string;
  views: number;
  uploadedBy?: string;
}

// Mock data - Replace with API call later
const mockResources: ResourceFile[] = [
  {
    id: '1',
    title: 'Cardiology Basics - ECG Interpretation',
    description: 'Comprehensive guide to reading and interpreting ECGs',
    category: 'core-teaching',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    uploadDate: '2025-09-15',
    teachingDate: '2025-09-10',
    taughtBy: 'Dr. Sarah Mitchell',
    downloadUrl: '#',
    views: 234,
    uploadedBy: 'Dr. Smith'
  },
  {
    id: '2',
    title: 'Grand Round: Complex Respiratory Case',
    description: 'Case presentation and discussion from weekly grand rounds',
    category: 'grand-rounds',
    fileType: 'video',
    fileSize: '145 MB',
    uploadDate: '2025-09-20',
    teachingDate: '2025-09-18',
    taughtBy: 'Prof. Johnson',
    downloadUrl: '#',
    views: 156,
    uploadedBy: 'Admin Team'
  },
  {
    id: '3',
    title: 'OSCE Practice Scenarios - Neurology',
    description: 'Practice scenarios with marking criteria',
    category: 'osce',
    fileType: 'pdf',
    fileSize: '1.8 MB',
    uploadDate: '2025-09-25',
    teachingDate: '2025-09-22',
    taughtBy: 'Dr. Williams',
    downloadUrl: '#',
    views: 567,
    uploadedBy: 'Dr. Williams'
  },
  {
    id: '4',
    title: 'Twilight Teaching: Acute Medicine Updates',
    description: 'Latest protocols and treatment guidelines',
    category: 'twilight',
    fileType: 'document',
    fileSize: '3.2 MB',
    uploadDate: '2025-10-01',
    teachingDate: '2025-09-28',
    taughtBy: 'Dr. Brown',
    downloadUrl: '#',
    views: 189,
    uploadedBy: 'Dr. Brown'
  },
];

const categories = [
  { id: 'all', name: 'All Resources', color: '#6366f1', icon: FolderOpen },
  { id: 'core-teaching', name: 'Core Teaching', color: '#10b981', icon: BookOpen },
  { id: 'grand-rounds', name: 'Grand Rounds', color: '#f59e0b', icon: Sparkles },
  { id: 'osce', name: 'OSCE Practice', color: '#ef4444', icon: FileText },
  { id: 'twilight', name: 'Twilight Teaching', color: '#8b5cf6', icon: Clock },
];

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

  // Filter resources by category and search
  const filteredResources = mockResources.filter(resource => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
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
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resource
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by title, description, teacher, or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-base"
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
                  <span className="text-xs text-gray-500">({mockResources.length})</span>
                </button>

                {/* Category Options */}
                {categories.filter(c => c.id !== 'all').map((category) => {
                  const Icon = category.icon;
                  const count = mockResources.filter(r => r.category === category.id).length;
                  const isSelected = selectedCategories.has(category.id);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategorySelection(category.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isSelected 
                            ? 'border-purple-600' 
                            : 'border-gray-300'
                        }`}
                        style={{
                          backgroundColor: isSelected ? category.color : 'transparent'
                        }}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <Icon className="h-5 w-5" style={{ color: category.color }} />
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">({count})</span>
                    </button>
                  );
                })}

                {/* Apply Button */}
                {getCategoryCount() > 0 && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <Button
                      onClick={() => setShowMobileDropdown(false)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      Apply Filters
                    </Button>
                  </div>
                )}
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
                  {mockResources.length}
                </span>
              </button>
              
              {categories.filter(c => c.id !== 'all').map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategories.has(category.id);
                const count = mockResources.filter(r => r.category === category.id).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategorySelection(category.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md relative ${
                      isSelected
                        ? 'text-white transform scale-105'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
                    }`}
                    style={{
                      backgroundColor: isSelected ? category.color : undefined,
                      borderColor: isSelected ? category.color : undefined,
                      borderWidth: isSelected ? '2px' : undefined
                    }}
                  >
                    {isSelected && <Check className="h-4 w-4 mr-1 absolute left-2 top-1/2 -translate-y-1/2" />}
                    <Icon className="h-5 w-5" style={{ marginLeft: isSelected ? '16px' : '0' }} />
                    <span>{category.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isSelected ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
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
        {filteredResources.length === 0 ? (
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
                  onClick={() => {
                    // Handle download/view
                    window.open(resource.downloadUrl, '_blank');
                  }}
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
                        
                        {/* File info */}
                        <div className="flex items-center gap-3 text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{resource.views} views</span>
                          </div>
                          <span className="font-medium">{resource.fileSize}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        className="w-full group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle download
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
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

                        <Button
                          variant="outline"
                          size="sm"
                          className="group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:text-white group-hover:border-0 transition-all flex-shrink-0 h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle download
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
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
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
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

                        {/* Right: Download Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:text-white group-hover:border-0 transition-all flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle download
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
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
      </div>
    </div>
  );
}

