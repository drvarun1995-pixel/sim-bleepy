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
  FileIcon,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';
import { useAdmin } from '@/lib/useAdmin';
import { useOnboardingTour } from '@/components/onboarding/OnboardingContext';
import { createCompletePlacementsTour } from '@/lib/onboarding/steps/placements/CompletePlacementsTour';

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
  const { startTourWithSteps } = useOnboardingTour();
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'grid' | 'az'>('grid');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

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
    
    // Apply letter filter for A-Z view
    if (activeTab === 'az' && selectedLetter) {
      filtered = filtered.filter(specialty => 
        specialty.name.charAt(0).toUpperCase() === selectedLetter
      );
    }
    
    // Sort by name ascending
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [specialties, searchQuery, activeTab, selectedLetter]);

  // Get all available letters from specialties
  const availableLetters = useMemo(() => {
    const activeSpecialties = specialties.filter(s => s.is_active);
    const letters = new Set(
      activeSpecialties.map(s => s.name.charAt(0).toUpperCase())
    );
    return Array.from(letters).sort();
  }, [specialties]);

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
            <div className="flex-shrink-0">
              <Button
                onClick={() => {
                  const userRole = session?.user?.role || 'meded_team'
                  const placementsSteps = createCompletePlacementsTour({ 
                    role: userRole as any
                  })
                  if (startTourWithSteps) {
                    startTourWithSteps(placementsSteps)
                  }
                }}
                variant="secondary"
                className="hidden lg:flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
              >
                <Sparkles className="h-4 w-4" />
                Start Placements Tour
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6" data-tour="placements-stats">
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

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1 flex space-x-1" data-tour="placements-views">
            <button
              onClick={() => {
                setActiveTab('grid');
                setSelectedLetter(null);
              }}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => {
                setActiveTab('az');
                setSelectedLetter(null);
              }}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'az'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              A-Z Specialties
            </button>
          </div>
        </div>

        {/* Search Bar - Only show for grid view */}
        {activeTab === 'grid' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:border-purple-400 focus:ring-purple-200"
              data-tour="placements-search"
            />
          </div>
        )}

        {/* Results Count */}
        {searchQuery && activeTab === 'grid' && (
          <p className="text-sm text-gray-600">
            Found {filteredSpecialties.length} {filteredSpecialties.length === 1 ? 'specialty' : 'specialties'} matching "{searchQuery}"
          </p>
        )}

        {/* A-Z Navigation - Only show for A-Z view */}
        {activeTab === 'az' && (
          <div className="space-y-4">
            {/* Alphabetical Navigation */}
            <div className="flex flex-wrap justify-center gap-2">
              {/* Show All Button */}
              <button
                onClick={() => setSelectedLetter(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  selectedLetter === null
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Show All
              </button>
              
              {/* Letter Buttons */}
              {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
                const hasSpecialtiesWithLetter = availableLetters.includes(letter);
                
                return (
                  <button
                    key={letter}
                    onClick={() => {
                      if (hasSpecialtiesWithLetter) {
                        setSelectedLetter(letter);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedLetter === letter
                        ? 'bg-blue-600 text-white shadow-md'
                        : hasSpecialtiesWithLetter
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!hasSpecialtiesWithLetter}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* Filter Status */}
            {selectedLetter && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-lg">
                  <span className="text-blue-800 font-medium">
                    Showing specialties starting with "{selectedLetter}"
                  </span>
                  <button
                    onClick={() => setSelectedLetter(null)}
                    className="text-blue-600 hover:text-blue-800 text-sm underline cursor-pointer"
                  >
                    Show All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Specialties Display */}
        {filteredSpecialties.length === 0 ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardContent className="pt-6 text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || selectedLetter ? 'No specialties found' : 'No specialties available'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? `Try adjusting your search terms for "${searchQuery}"`
                  : selectedLetter
                    ? `No specialties start with "${selectedLetter}"`
                    : 'Specialties will appear here once they are added'}
              </p>
              {(searchQuery || selectedLetter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLetter(null);
                  }}
                  className="mt-4"
                >
                  Clear Filter
                </Button>
              )}
            </CardContent>
          </Card>
        ) : activeTab === 'az' ? (
          /* A-Z View */
          <div className={selectedLetter ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-6"} data-tour="placements-list">
            {filteredSpecialties.map((specialty, index) => {
              const firstLetter = specialty.name.charAt(0).toUpperCase();
              const isFirstOfLetter = !selectedLetter && (index === 0 || 
                filteredSpecialties[index - 1].name.charAt(0).toUpperCase() !== firstLetter);

              return (
                <div key={specialty.id}>
                  {/* Letter Header - Only show when showing all specialties */}
                  {isFirstOfLetter && (
                    <div id={`letter-${firstLetter}`} className="mb-4 mt-6 first:mt-0">
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg sm:text-2xl">{firstLetter}</span>
                        </div>
                        <div className="text-center">
                          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {firstLetter}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {filteredSpecialties.filter(s => s.name.charAt(0).toUpperCase() === firstLetter).length} {filteredSpecialties.filter(s => s.name.charAt(0).toUpperCase() === firstLetter).length === 1 ? 'specialty' : 'specialties'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Specialty Card */}
                  <Card 
                    className={`group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-purple-300 bg-gradient-to-br from-white to-gray-50/30 ${selectedLetter ? 'w-full' : 'w-full max-w-4xl mx-auto'}`}
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
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="placements-list">
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

        {/* Back to Top Button - Only show for A-Z view */}
        {activeTab === 'az' && filteredSpecialties.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              Back to Top
            </button>
          </div>
        )}
    </div>
  );
}

