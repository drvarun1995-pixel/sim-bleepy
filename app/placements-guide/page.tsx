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
  List
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';

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
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Dialogs
  const [showAddSpecialtyDialog, setShowAddSpecialtyDialog] = useState(false);
  const [showEditSpecialtyDialog, setShowEditSpecialtyDialog] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  
  // Form states
  const [specialtyName, setSpecialtyName] = useState('');
  const [specialtyDescription, setSpecialtyDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleDeleteSpecialty = async (specialtyId: string, specialtyName: string) => {
    if (!confirm(`Are you sure you want to delete "${specialtyName}"? This will also delete all associated pages and documents.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/placements/specialties/${specialtyId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete specialty');
      }

      toast.success('Specialty deleted successfully');
      fetchSpecialties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete specialty');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Placements Guide</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage specialties, pages, and documents for placements
            </p>
          </div>
          <Button onClick={() => setShowAddSpecialtyDialog(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Specialty
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Specialties</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalPages}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalDocuments}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Folder className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
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
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredSpecialties.length}</span> of <span className="font-semibold text-gray-900 dark:text-gray-100">{specialties.length}</span> specialties
          </div>
        )}
      </div>

      {/* Specialties List */}
      {specialties.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No specialties yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by adding your first specialty
            </p>
            <Button onClick={() => setShowAddSpecialtyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Specialty
            </Button>
          </CardContent>
        </Card>
      ) : filteredSpecialties.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No specialties found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecialties.map((specialty) => (
            <Card key={specialty.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                        {specialty.name}
                      </CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {specialty.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {specialty.description}
                  </p>
                )}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Pages
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {specialty.page_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Folder className="h-3.5 w-3.5" />
                      Documents
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {specialty.document_count || 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto pt-4 border-t">
                  <Link href={`/placements/${specialty.slug}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(specialty)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSpecialty(specialty.id, specialty.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" style={{ minWidth: '1000px' }}>
            {/* Table Header */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 px-2 sm:px-6 py-3 sm:py-4 border-b-2 border-gray-300 dark:border-gray-600">
              <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-center" style={{ minWidth: '1000px' }}>
                <div className="col-span-3 border-r border-gray-300 dark:border-gray-600 pr-2">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Specialty</h3>
                </div>
                <div className="col-span-1 border-r border-gray-300 dark:border-gray-600 pr-2">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Pages</h3>
                </div>
                <div className="col-span-2 border-r border-gray-300 dark:border-gray-600 pr-2">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide whitespace-nowrap">Documents</h3>
                </div>
                <div className="col-span-6">
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
                    <div className="col-span-1 border-r border-gray-300 dark:border-gray-600 pr-2">
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
                    <div className="col-span-6 flex items-center justify-center">
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
                          onClick={() => handleDeleteSpecialty(specialty.id, specialty.name)}
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
    </div>
  );
}

