'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Stethoscope, 
  ArrowRight, 
  Plus, 
  FileText,
  Folder,
  Loader2,
  Edit,
  Trash2,
  Search,
  BookOpen,
  FileIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';
import { useAdmin } from '@/lib/useAdmin';

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
}

export default function PlacementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSpecialties();
      fetchUserRole();
    }
  }, [status]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.user?.role || '');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/placements/specialties');
      
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

  // Filter and sort specialties
  const filteredSpecialties = useMemo(() => {
    let filtered = specialties.filter(specialty => specialty.is_active);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(specialty =>
        specialty.name.toLowerCase().includes(query) ||
        specialty.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort by name ascending
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [specialties, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSpecialties = filteredSpecialties.length;
    const totalPages = filteredSpecialties.reduce((sum, s) => sum + (s.page_count || 0), 0);
    const totalDocuments = filteredSpecialties.reduce((sum, s) => sum + (s.document_count || 0), 0);
    
    return {
      totalSpecialties,
      totalPages,
      totalDocuments
    };
  }, [filteredSpecialties]);

  const canManage = () => {
    return userRole === 'admin' || userRole === 'meded_team' || userRole === 'ctf';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingScreen message="Loading placements..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Placements</h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">
                Browse specialty information, resources, and documents
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Total Specialties</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.totalSpecialties}</p>
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
                  <BookOpen className="h-6 w-6 text-white" />
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
                  <FileIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-purple-400 focus:ring-purple-200"
          />
        </div>

        {/* Results Count */}
        {searchQuery && (
          <p className="text-sm text-gray-600">
            Found {filteredSpecialties.length} {filteredSpecialties.length === 1 ? 'specialty' : 'specialties'} matching "{searchQuery}"
          </p>
        )}

        {/* Specialties Grid */}
        {filteredSpecialties.length === 0 ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardContent className="pt-6 text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No specialties found' : 'No specialties available'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? `Try adjusting your search terms for "${searchQuery}"`
                  : 'Specialties will appear here once they are added'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpecialties.map((specialty) => (
              <Card 
                key={specialty.id} 
                className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-purple-300 bg-gradient-to-br from-white to-gray-50/30"
              >
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
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{specialty.page_count || 0}</span>
                      <span className="text-xs text-gray-500">pages</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">{specialty.document_count || 0}</span>
                      <span className="text-xs text-gray-500">docs</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href={`/placements/${specialty.slug}`}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

