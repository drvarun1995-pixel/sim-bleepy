'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Stethoscope, 
  Plus, 
  Edit,
  Trash2,
  Loader2,
  Save,
  Eye,
  FileText,
  Folder,
  Search,
  Grid3x3,
  List,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DeleteSpecialtyDialog } from '@/components/ui/confirmation-dialog';
import Link from 'next/link';
import { useOnboardingTour } from '@/components/onboarding/OnboardingContext';
import { createCompletePlacementsGuideTour } from '@/lib/onboarding/steps/placements-guide/CompletePlacementsGuideTour';

interface Specialty {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  page_count?: number;
  document_count?: number;
  last_updated?: string;
}

export default function PlacementsGuidePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { startTourWithSteps } = useOnboardingTour();
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Dialogs
  const [showAddSpecialtyDialog, setShowAddSpecialtyDialog] = useState(false);
  const [showEditSpecialtyDialog, setShowEditSpecialtyDialog] = useState(false);
  const [showDeleteSpecialtyDialog, setShowDeleteSpecialtyDialog] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [deletingSpecialty, setDeletingSpecialty] = useState<Specialty | null>(null);
  
  // Form states
  const [specialtyName, setSpecialtyName] = useState('');
  const [specialtyDescription, setSpecialtyDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserRole();
      fetchSpecialties();
    }
  }, [status]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        const role = data.user?.role || '';
        setUserRole(role);
        
        // Check if user has access
        if (!['admin', 'meded_team', 'ctf'].includes(role)) {
          router.push('/dashboard');
          toast.error('Access denied. Only CTF, MedEd Team, and Admin can access this page.');
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/placements/specialties?includeInactive=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch specialties');
      }

      const data = await response.json();
      const specialtiesList = data.specialties || [];
      
      // Fetch statistics for each specialty
      const specialtiesWithStats = await Promise.all(
        specialtiesList.map(async (specialty: Specialty) => {
          try {
            // Fetch page count
            const pagesResponse = await fetch(`/api/placements/pages?specialtySlug=${specialty.slug}`);
            const pagesData = pagesResponse.ok ? await pagesResponse.json() : { pages: [] };
            const pageCount = pagesData.pages?.length || 0;
            
            // Fetch document count
            const docsResponse = await fetch(`/api/placements/documents?specialtySlug=${specialty.slug}`);
            const docsData = docsResponse.ok ? await docsResponse.json() : { documents: [] };
            const documentCount = docsData.documents?.length || 0;
            
            return {
              ...specialty,
              page_count: pageCount,
              document_count: documentCount
            };
          } catch (error) {
            console.error(`Error fetching stats for ${specialty.slug}:`, error);
            return {
              ...specialty,
              page_count: 0,
              document_count: 0
            };
          }
        })
      );
      
      setSpecialties(specialtiesWithStats);
    } catch (error) {
      console.error('Error fetching specialties:', error);
      toast.error('Failed to load specialties');
    } finally {
      setLoading(false);
    }
  };

  const canManage = () => {
    return userRole === 'admin' || userRole === 'meded_team' || userRole === 'ctf';
  };

  const handleAddSpecialty = async () => {
    if (!specialtyName) {
      toast.error('Please fill in the specialty name');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/placements/specialties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: specialtyName,
          description: specialtyDescription || null,
          display_order: 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create specialty');
      }

      toast.success('Specialty created successfully');
      setShowAddSpecialtyDialog(false);
      resetForm();
      fetchSpecialties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create specialty');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSpecialty = async () => {
    if (!editingSpecialty || !specialtyName) {
      toast.error('Please fill in the specialty name');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/placements/specialties/${editingSpecialty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: specialtyName,
          description: specialtyDescription || null,
          display_order: editingSpecialty.display_order
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update specialty');
      }

      toast.success('Specialty updated successfully');
      setShowEditSpecialtyDialog(false);
      resetForm();
      fetchSpecialties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update specialty');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSpecialty = (specialty: Specialty) => {
    setDeletingSpecialty(specialty);
    setShowDeleteSpecialtyDialog(true);
  };

  const confirmDeleteSpecialty = async () => {
    if (!deletingSpecialty) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/placements/specialties/${deletingSpecialty.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete specialty');
      }

      toast.success('Specialty deleted successfully');
      setShowDeleteSpecialtyDialog(false);
      setDeletingSpecialty(null);
      fetchSpecialties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete specialty');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setSpecialtyName('');
    setSpecialtyDescription('');
    setEditingSpecialty(null);
  };

  const openEditDialog = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setSpecialtyName(specialty.name);
    setSpecialtyDescription(specialty.description || '');
    setShowEditSpecialtyDialog(true);
  };

  // Filtered and sorted specialties
  const filteredSpecialties = useMemo(() => {
    let filtered = specialties;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.slug.toLowerCase().includes(query) ||
          (s.description && s.description.toLowerCase().includes(query))
      );
    }

    // Sort by name ascending
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [specialties, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = specialties.length;
    const totalPages = specialties.reduce((sum, s) => sum + (s.page_count || 0), 0);
    const totalDocuments = specialties.reduce((sum, s) => sum + (s.document_count || 0), 0);
    return { total, totalPages, totalDocuments };
  }, [specialties]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingScreen message="Loading placements guide..." fullScreen={false} />
      </div>
    );
  }

  if (!canManage()) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Placements Guide</h1>
                <p className="text-gray-600 mt-2 text-base sm:text-lg">
                  Manage specialties, pages, and documents for placements
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => setShowAddSpecialtyDialog(true)} className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all" data-tour="placements-add-specialty">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Specialty
                </Button>
                <Button
                  onClick={() => {
                    const userRole = session?.user?.role || 'meded_team'
                    const placementsGuideSteps = createCompletePlacementsGuideTour({ 
                      role: userRole as any
                    })
                    if (startTourWithSteps) {
                      startTourWithSteps(placementsGuideSteps)
                    }
                  }}
                  variant="secondary"
                  className="hidden lg:flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
                >
                  <Sparkles className="h-4 w-4" />
                  Start Placements Guide Tour
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6" data-tour="placements-statistics">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Total Specialties</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Pages</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.totalPages}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Total Documents</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.totalDocuments}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                  <Folder className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:border-purple-400 focus:ring-purple-200"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2" data-tour="placements-view-toggle">
            <div className="flex border rounded-lg overflow-hidden w-full sm:w-auto">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none border-0 flex-1 sm:flex-initial"
                title="Grid view"
              >
                <Grid3x3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Grid</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none border-0 flex-1 sm:flex-initial"
                title="List view"
              >
                <List className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">List</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {specialties.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredSpecialties.length}</span> of <span className="font-semibold text-gray-900">{specialties.length}</span> specialties
          </div>
        )}
      </div>

      {/* Specialties List */}
      {specialties.length === 0 ? (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardContent className="pt-6 text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No specialties yet
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first specialty
            </p>
            <Button onClick={() => setShowAddSpecialtyDialog(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Add First Specialty
            </Button>
          </CardContent>
        </Card>
      ) : filteredSpecialties.length === 0 ? (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardContent className="pt-6 text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No specialties found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
            }} className="border-gray-300 hover:bg-gray-50 transition-colors">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="placements-specialties">
          {filteredSpecialties.map((specialty) => (
            <Card key={specialty.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-purple-300 bg-gradient-to-br from-white to-gray-50/30 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-2 group-hover:text-purple-600 transition-colors">
                      {specialty.name}
                    </CardTitle>
                    {specialty.description && (
                      <CardDescription className="line-clamp-2">
                        {specialty.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center ml-3 shadow-md group-hover:shadow-lg transition-shadow">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                {/* Statistics */}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">{specialty.page_count || 0}</span>
                    <span className="text-xs text-gray-500">pages</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Folder className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">{specialty.document_count || 0}</span>
                    <span className="text-xs text-gray-500">docs</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex gap-2 mt-auto pt-4 border-t">
                  <Link href={`/placements/${specialty.slug}`} className="flex-1">
                    <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(specialty)}
                    className="border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSpecialty(specialty)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto" data-tour="placements-specialties">
          <div className="min-w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" style={{ minWidth: '1000px' }}>
            {/* Table Header */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 px-2 sm:px-6 py-3 sm:py-4 border-b-2 border-gray-300 dark:border-gray-600">
              <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-center" style={{ minWidth: '1000px' }}>
                <div className="col-span-3 border-r border-gray-300 dark:border-gray-600 pr-2">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Specialty</h3>
                </div>
                <div className="col-span-2 border-r border-gray-300 dark:border-gray-600 pr-2">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Pages</h3>
                </div>
                <div className="col-span-2 border-r border-gray-300 dark:border-gray-600 pr-2">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide whitespace-nowrap">Documents</h3>
                </div>
                <div className="col-span-5">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Actions</h3>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-300 dark:divide-gray-700">
              {filteredSpecialties.map((specialty, index) => (
                <div 
                  key={specialty.id} 
                  className={`px-2 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 border-b border-gray-200 dark:border-gray-700 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-800/30'
                  }`}
                >
                  <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-center" style={{ minWidth: '1000px' }}>
                    {/* Specialty Column */}
                    <div className="col-span-3 border-r border-gray-300 dark:border-gray-600 pr-2">
                      <div className="flex items-center justify-start space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {specialty.name}
                          </p>
                          {specialty.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {specialty.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pages Column */}
                    <div className="col-span-2 border-r border-gray-300 dark:border-gray-600 pr-2">
                      <div className="flex items-center justify-center gap-1 text-gray-900 dark:text-gray-100">
                        <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium">{specialty.page_count || 0}</span>
                      </div>
                    </div>

                    {/* Documents Column */}
                    <div className="col-span-2 border-r border-gray-300 dark:border-gray-600 pr-2">
                      <div className="flex items-center justify-center gap-1 text-gray-900 dark:text-gray-100">
                        <Folder className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium">{specialty.document_count || 0}</span>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="col-span-5 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <Link href={`/placements/${specialty.slug}`}>
                          <Button variant="outline" size="sm" className="text-xs px-3 h-7 whitespace-nowrap">
                            <Eye className="h-3 w-3 mr-1.5" />
                            <span>View</span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(specialty)}
                          className="text-xs px-3 h-7 whitespace-nowrap"
                        >
                          <Edit className="h-3 w-3 mr-1.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSpecialty(specialty)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs px-3 h-7 whitespace-nowrap"
                        >
                          <Trash2 className="h-3 w-3 mr-1.5" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Specialty Dialog */}
      <Dialog open={showAddSpecialtyDialog} onOpenChange={setShowAddSpecialtyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Specialty</DialogTitle>
            <DialogDescription>
              Create a new specialty for placements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="specialtyName">Name *</Label>
              <Input
                id="specialtyName"
                value={specialtyName}
                onChange={(e) => setSpecialtyName(e.target.value)}
                placeholder="e.g., Cardiology"
              />
              <p className="text-xs text-gray-500 mt-1">A unique slug will be automatically generated from the name</p>
            </div>
            <div>
              <Label htmlFor="specialtyDescription">Description</Label>
              <Textarea
                id="specialtyDescription"
                value={specialtyDescription}
                onChange={(e) => setSpecialtyDescription(e.target.value)}
                placeholder="Brief description of this specialty"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddSpecialtyDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddSpecialty} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Specialty
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Specialty Dialog */}
      <Dialog open={showEditSpecialtyDialog} onOpenChange={setShowEditSpecialtyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Specialty</DialogTitle>
            <DialogDescription>
              Update specialty information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editSpecialtyName">Name *</Label>
              <Input
                id="editSpecialtyName"
                value={specialtyName}
                onChange={(e) => setSpecialtyName(e.target.value)}
                placeholder="e.g., Cardiology"
              />
              <p className="text-xs text-gray-500 mt-1">Changing the name will auto-generate a new unique slug</p>
            </div>
            <div>
              <Label htmlFor="editSpecialtyDescription">Description</Label>
              <Textarea
                id="editSpecialtyDescription"
                value={specialtyDescription}
                onChange={(e) => setSpecialtyDescription(e.target.value)}
                placeholder="Brief description of this specialty"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditSpecialtyDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSpecialty} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Specialty
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Specialty Dialog */}
      <DeleteSpecialtyDialog
        open={showDeleteSpecialtyDialog}
        onOpenChange={setShowDeleteSpecialtyDialog}
        onConfirm={confirmDeleteSpecialty}
        isLoading={isDeleting}
        title={deletingSpecialty ? `Delete "${deletingSpecialty.name}"` : 'Delete Specialty'}
        description={deletingSpecialty 
          ? `Are you sure you want to delete "${deletingSpecialty.name}"? This action cannot be undone and will remove all associated pages and documents.`
          : 'Are you sure you want to delete this specialty? This action cannot be undone and will remove all associated pages and documents.'}
      />
    </div>
  );
}

