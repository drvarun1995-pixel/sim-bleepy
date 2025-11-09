'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
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
  ArrowLeft, 
  Plus, 
  FileText,
  Folder,
  Loader2,
  Edit,
  Trash2,
  Download,
  Upload,
  X,
  Search,
  Eye,
  EyeOff,
  Grid3x3,
  List,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DeletePageDialog, DeleteFileDialog } from '@/components/ui/confirmation-dialog';
import Link from 'next/link';

interface Specialty {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface SpecialtyPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
  display_order: number;
  status?: 'published' | 'draft';
}

interface SpecialtyDocument {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  display_order: number;
}

export default function SpecialtyDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [pages, setPages] = useState<SpecialtyPage[]>([]);
  const [documents, setDocuments] = useState<SpecialtyDocument[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  
  // Search states
  const [pagesSearchQuery, setPagesSearchQuery] = useState('');
  const [documentsSearchQuery, setDocumentsSearchQuery] = useState('');
  
  // View mode
  const [pagesViewMode, setPagesViewMode] = useState<'grid' | 'list'>('grid');
  const [documentsViewMode, setDocumentsViewMode] = useState<'grid' | 'list'>('list');
  
  // Show more states
  const [showMorePages, setShowMorePages] = useState(false);
  const [showMoreDocuments, setShowMoreDocuments] = useState(false);
  
  // Dialogs
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showDeletePageDialog, setShowDeletePageDialog] = useState(false);
  const [showDeleteDocumentDialog, setShowDeleteDocumentDialog] = useState(false);
  const [deletingPage, setDeletingPage] = useState<SpecialtyPage | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<SpecialtyDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewingPage, setPreviewingPage] = useState<SpecialtyPage | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && slug) {
      fetchUserRole();
    }
  }, [status, slug]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        const role = data.user?.role || '';
        setUserRole(role);
        // Fetch specialty data after role is set
        fetchSpecialtyData(role);
      } else {
        // Even if role fetch fails, fetch specialty data
        fetchSpecialtyData('');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Even if role fetch fails, fetch specialty data
      fetchSpecialtyData('');
    }
  };

  const fetchSpecialtyData = async (role: string = '') => {
    try {
      // Use provided role or fallback to current userRole state
      const currentRole = role || userRole;
      setLoading(true);
      
      // Fetch specialty
      const specialtyResponse = await fetch('/api/placements/specialties');
      if (!specialtyResponse.ok) throw new Error('Failed to fetch specialties');
      const specialtyData = await specialtyResponse.json();
      const foundSpecialty = specialtyData.specialties.find((s: Specialty) => s.slug === slug);
      
      if (!foundSpecialty) {
        toast.error('Specialty not found');
        router.push('/placements');
        return;
      }
      
      setSpecialty(foundSpecialty);

      // Fetch pages (include inactive/draft pages for admins)
      const canManagePages = currentRole === 'admin' || currentRole === 'meded_team' || currentRole === 'ctf';
      const pagesUrl = canManagePages 
        ? `/api/placements/pages?specialtySlug=${slug}&includeInactive=true`
        : `/api/placements/pages?specialtySlug=${slug}`;
      const pagesResponse = await fetch(pagesUrl);
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        setPages(pagesData.pages || []);
      }

      // Fetch documents
      const documentsResponse = await fetch(`/api/placements/documents?specialtySlug=${slug}`);
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData.documents || []);
      }
    } catch (error) {
      console.error('Error fetching specialty data:', error);
      toast.error('Failed to load specialty information');
    } finally {
      setLoading(false);
    }
  };

  const canManage = () => {
    return userRole === 'admin' || userRole === 'meded_team' || userRole === 'ctf';
  };

  // Filtered pages and documents
  const filteredPages = useMemo(() => {
    if (!pagesSearchQuery) return pages;
    const query = pagesSearchQuery.toLowerCase();
    return pages.filter(page => 
      page.title.toLowerCase().includes(query) ||
      (page.content && page.content.toLowerCase().includes(query))
    );
  }, [pages, pagesSearchQuery]);

  const filteredDocuments = useMemo(() => {
    if (!documentsSearchQuery) return documents;
    const query = documentsSearchQuery.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(query) ||
      doc.file_name.toLowerCase().includes(query) ||
      (doc.description && doc.description.toLowerCase().includes(query))
    );
  }, [documents, documentsSearchQuery]);

  // Reset show more when search changes
  useEffect(() => {
    setShowMorePages(false);
  }, [pagesSearchQuery]);

  useEffect(() => {
    setShowMoreDocuments(false);
  }, [documentsSearchQuery]);

  // Displayed pages and documents (limited initially)
  const displayedPages = useMemo(() => {
    if (showMorePages) return filteredPages;
    return filteredPages.slice(0, 5);
  }, [filteredPages, showMorePages]);

  const displayedDocuments = useMemo(() => {
    if (showMoreDocuments) return filteredDocuments;
    return filteredDocuments.slice(0, 5);
  }, [filteredDocuments, showMoreDocuments]);

  // Statistics
  const stats = useMemo(() => {
    return {
      pages: pages.length,
      documents: documents.length
    };
  }, [pages.length, documents.length]);

  const handleDeletePage = (page: SpecialtyPage) => {
    setDeletingPage(page);
    setShowDeletePageDialog(true);
  };

  const handlePreviewPage = (page: SpecialtyPage) => {
    setPreviewingPage(page);
    setShowPreviewModal(true);
  };

  const confirmDeletePage = async () => {
    if (!deletingPage) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/placements/pages/${deletingPage.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      toast.success('Page deleted successfully');
      setShowDeletePageDialog(false);
      setDeletingPage(null);
      
      // Remove the deleted page from state immediately
      setPages(prevPages => prevPages.filter(p => p.id !== deletingPage.id));
      
      // Then refresh the full list to ensure consistency
      await fetchSpecialtyData(userRole);
    } catch (error) {
      toast.error('Failed to delete page');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteDocument = (document: SpecialtyDocument) => {
    setDeletingDocument(document);
    setShowDeleteDocumentDialog(true);
  };

  const confirmDeleteDocument = async () => {
    if (!deletingDocument) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/placements/documents/${deletingDocument.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast.success('Document deleted successfully');
      setShowDeleteDocumentDialog(false);
      setDeletingDocument(null);
      
      // Remove the deleted document from state immediately
      setDocuments(prevDocuments => prevDocuments.filter(d => d.id !== deletingDocument.id));
      
      // Then refresh the full list to ensure consistency
      await fetchSpecialtyData(userRole);
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);

  const handleDownloadDocument = async (doc: SpecialtyDocument) => {
    if (downloadingDocumentId === doc.id) return;
    
    setDownloadingDocumentId(doc.id);
    
    try {
      toast.info('Preparing download...', {
        description: doc.title || 'Your file is being prepared',
        duration: 2000,
      });
      
      const response = await fetch(`/api/placements/documents/${doc.id}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = doc.file_name;
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
        }
      }
      
      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
      
      toast.success('Download started', {
        description: filename,
        duration: 2000,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed', {
        description: 'Unable to download the file. Please try again.',
        duration: 4000,
      });
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const handleUploadDocument = async () => {
    if (!specialty || !documentTitle || !selectedFile) {
      toast.error('Please fill in all required fields and select a file');
      return;
    }

    try {
      setUploadingDocument(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', documentTitle);
      formData.append('description', documentDescription);
      formData.append('specialtyId', specialty.id);
      formData.append('displayOrder', documents.length.toString());

      const response = await fetch('/api/placements/documents', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      toast.success('Document uploaded successfully');
      setShowAddDocumentDialog(false);
      setDocumentTitle('');
      setDocumentDescription('');
      setSelectedFile(null);
      fetchSpecialtyData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingScreen message="Loading specialty information..." fullScreen={false} />
      </div>
    );
  }

  if (!specialty) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Specialty not found</p>
            <Link href="/placements">
              <Button className="mt-4">Back to Placements</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/placements">
          <Button variant="ghost" className="mb-4 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Placements
          </Button>
        </Link>
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 break-words">{specialty.name}</h1>
                {specialty.description && (
                  <p className="text-gray-600 mt-2 text-base sm:text-lg break-words">{specialty.description}</p>
                )}
              </div>
              {canManage() && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Link href={`/placements/${slug}/add-page`} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Page
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => setShowAddDocumentDialog(true)} 
                    variant="outline"
                    className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Total Pages</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.pages}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
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
                  <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.documents}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                  <Folder className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pages Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Pages</h2>
            {pages.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search pages..."
                    value={pagesSearchQuery}
                    onChange={(e) => setPagesSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-purple-400 focus:ring-purple-200"
                  />
                </div>
                <div className="flex border rounded-lg overflow-hidden w-full sm:w-auto">
                  <Button
                    variant={pagesViewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPagesViewMode('grid')}
                    className="rounded-none border-0 flex-1 sm:flex-initial"
                    title="Grid view"
                  >
                    <Grid3x3 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Grid</span>
                  </Button>
                  <Button
                    variant={pagesViewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPagesViewMode('list')}
                    className="rounded-none border-0 flex-1 sm:flex-initial"
                    title="List view"
                  >
                    <List className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
          {pages.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {displayedPages.length} of {filteredPages.length} {filteredPages.length === 1 ? 'page' : 'pages'}
            </p>
          )}
        </div>

        {pages.length === 0 ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardContent className="pt-6 text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No pages yet
              </h3>
              <p className="text-gray-600 mb-4">
                {canManage() ? 'Get started by adding your first page' : 'No pages available for this specialty'}
              </p>
              {canManage() && (
                <Link href={`/placements/${slug}/add-page`}>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Page
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : filteredPages.length === 0 ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardContent className="pt-6 text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No pages found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria
              </p>
              <Button variant="outline" onClick={() => setPagesSearchQuery('')} className="border-gray-300 hover:bg-gray-50 transition-colors">
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : pagesViewMode === 'grid' ? (
          <div className="space-y-4">
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${showMorePages && filteredPages.length > 5 ? 'max-h-[800px] overflow-y-auto' : ''}`}>
              {displayedPages.map((page) => (
                <Card key={page.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-purple-300 bg-gradient-to-br from-white to-gray-50/30 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-gray-900 break-words group-hover:text-purple-600 transition-colors mb-2">{page.title}</CardTitle>
                        {canManage() && (
                          <div className="flex items-center gap-2">
                            {page.status === 'draft' && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Draft
                              </Badge>
                            )}
                            {page.status === 'published' && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                <Eye className="h-3 w-3 mr-1" />
                                Published
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      {canManage() && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Link href={`/placements/${slug}/${page.slug}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePage(page)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {page.content && (
                      <div 
                        className="text-sm text-gray-600 mb-4 line-clamp-3 break-words"
                        dangerouslySetInnerHTML={{ __html: page.content.substring(0, 200) }}
                      />
                    )}
                    <div className="mt-auto">
                      {page.status === 'draft' ? (
                        <Button 
                          onClick={() => handlePreviewPage(page)}
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white hover:text-white shadow-md hover:shadow-lg transition-all"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      ) : (
                        <Link href={`/placements/${slug}/${page.slug}`} className="block w-full">
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                            <Eye className="h-4 w-4 mr-2" />
                            View Page
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredPages.length > 5 && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMorePages(!showMorePages)}
                  className="w-full sm:w-auto"
                >
                  {showMorePages ? (
                    <>
                      Show Less
                      <ChevronDown className="h-4 w-4 ml-2 rotate-180" />
                    </>
                  ) : (
                    <>
                      Show More ({filteredPages.length - 5} more)
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`overflow-x-auto ${showMorePages && filteredPages.length > 5 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
              <div className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200" style={{ minWidth: '800px' }}>
                {/* Table Header */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-2 sm:px-6 py-3 sm:py-4 border-b-2 border-gray-300">
                  <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-center" style={{ minWidth: '800px' }}>
                    <div className="col-span-5 border-r border-gray-300 pr-2">
                      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Page</h3>
                    </div>
                    <div className="col-span-7">
                      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Actions</h3>
                    </div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-300">
                  {displayedPages.map((page, index) => (
                    <div 
                      key={page.id} 
                      className={`px-2 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-center" style={{ minWidth: '800px' }}>
                        {/* Page Column */}
                        <div className="col-span-5 border-r border-gray-300 pr-2">
                          <div className="flex items-center justify-start space-x-2 sm:space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {page.title}
                                </p>
                                {canManage() && page.status === 'draft' && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 flex-shrink-0">
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Draft
                                  </Badge>
                                )}
                                {canManage() && page.status === 'published' && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 flex-shrink-0">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Published
                                  </Badge>
                                )}
                              </div>
                              {page.content && (
                                <div 
                                  className="text-xs text-gray-500 truncate mt-0.5 line-clamp-1"
                                  dangerouslySetInnerHTML={{ __html: page.content.substring(0, 100) }}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-7 flex items-center justify-center">
                          <div className="flex items-center gap-2 flex-wrap justify-center">
                            {page.status === 'draft' ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs px-3 h-7 whitespace-nowrap border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-900"
                                onClick={() => handlePreviewPage(page)}
                              >
                                <Eye className="h-3 w-3 mr-1.5" />
                                <span>Preview</span>
                              </Button>
                            ) : (
                              <Link href={`/placements/${slug}/${page.slug}`}>
                                <Button variant="outline" size="sm" className="text-xs px-3 h-7 whitespace-nowrap">
                                  <Eye className="h-3 w-3 mr-1.5" />
                                  <span>View</span>
                                </Button>
                              </Link>
                            )}
                            {canManage() && (
                              <>
                                <Link href={`/placements/${slug}/${page.slug}/edit`}>
                                  <Button variant="outline" size="sm" className="text-xs px-3 h-7 whitespace-nowrap">
                                    <Edit className="h-3 w-3 mr-1.5" />
                                    <span>Edit</span>
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePage(page)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-3 h-7 whitespace-nowrap"
                                >
                                  <Trash2 className="h-3 w-3 mr-1.5" />
                                  <span>Delete</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {filteredPages.length > 5 && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMorePages(!showMorePages)}
                  className="w-full sm:w-auto"
                >
                  {showMorePages ? (
                    <>
                      Show Less
                      <ChevronDown className="h-4 w-4 ml-2 rotate-180" />
                    </>
                  ) : (
                    <>
                      Show More ({filteredPages.length - 5} more)
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
            {documents.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={documentsSearchQuery}
                    onChange={(e) => setDocumentsSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-green-400 focus:ring-green-200"
                  />
                </div>
                <div className="flex border rounded-lg overflow-hidden w-full sm:w-auto">
                  <Button
                    variant={documentsViewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDocumentsViewMode('grid')}
                    className="rounded-none border-0 flex-1 sm:flex-initial"
                    title="Grid view"
                  >
                    <Grid3x3 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Grid</span>
                  </Button>
                  <Button
                    variant={documentsViewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDocumentsViewMode('list')}
                    className="rounded-none border-0 flex-1 sm:flex-initial"
                    title="List view"
                  >
                    <List className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
          {documents.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {displayedDocuments.length} of {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
            </p>
          )}
        </div>

        {documents.length === 0 ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardContent className="pt-6 text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No documents yet
              </h3>
              <p className="text-gray-600 mb-4">
                {canManage() ? 'Get started by uploading your first document' : 'No documents available for this specialty'}
              </p>
              {canManage() && (
                <Button onClick={() => setShowAddDocumentDialog(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : filteredDocuments.length === 0 ? (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardContent className="pt-6 text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No documents found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria
              </p>
              <Button variant="outline" onClick={() => setDocumentsSearchQuery('')} className="border-gray-300 hover:bg-gray-50 transition-colors">
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : documentsViewMode === 'grid' ? (
          <div className="space-y-4">
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${showMoreDocuments && filteredDocuments.length > 5 ? 'max-h-[800px] overflow-y-auto' : ''}`}>
              {displayedDocuments.map((document) => (
                <Card key={document.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-green-300 bg-gradient-to-br from-white to-gray-50/30 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-gray-900 break-words group-hover:text-green-600 transition-colors">{document.title}</CardTitle>
                        {document.description && (
                          <CardDescription className="mt-1 line-clamp-2 break-words">{document.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 space-y-1">
                      <p className="break-all">{document.file_name}</p>
                      <p className="flex-shrink-0">{formatFileSize(document.file_size)}</p>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        onClick={() => handleDownloadDocument(document)}
                        disabled={downloadingDocumentId === document.id}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        {downloadingDocumentId === document.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                      {canManage() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(document)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredDocuments.length > 5 && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMoreDocuments(!showMoreDocuments)}
                  className="w-full sm:w-auto"
                >
                  {showMoreDocuments ? (
                    <>
                      Show Less
                      <ChevronDown className="h-4 w-4 ml-2 rotate-180" />
                    </>
                  ) : (
                    <>
                      Show More ({filteredDocuments.length - 5} more)
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`overflow-x-auto ${showMoreDocuments && filteredDocuments.length > 5 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
              <div className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200" style={{ minWidth: '900px' }}>
                {/* Table Header */}
                <div className="bg-gradient-to-r from-gray-50 to-green-50 px-2 sm:px-6 py-3 sm:py-4 border-b-2 border-gray-300">
                  <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-center" style={{ minWidth: '900px' }}>
                    <div className="col-span-6 border-r border-gray-300 pr-2">
                      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Document</h3>
                    </div>
                    <div className="col-span-2 border-r border-gray-300 pr-2">
                      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Size</h3>
                    </div>
                    <div className="col-span-4">
                      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Actions</h3>
                    </div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-300">
                  {displayedDocuments.map((document, index) => (
                    <div 
                      key={document.id} 
                      className={`px-2 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-center" style={{ minWidth: '900px' }}>
                        {/* Document Column */}
                        <div className="col-span-6 border-r border-gray-300 pr-2">
                          <div className="flex items-center justify-start space-x-2 sm:space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {document.title}
                              </p>
                              {document.description && (
                                <p className="text-xs text-gray-500 truncate mt-0.5 line-clamp-1">
                                  {document.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {document.file_name}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Size Column */}
                        <div className="col-span-2 border-r border-gray-300 pr-2">
                          <div className="flex items-center justify-center text-gray-900">
                            <span className="text-sm font-medium">{formatFileSize(document.file_size)}</span>
                          </div>
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-4 flex items-center justify-center">
                          <div className="flex items-center gap-2 flex-wrap justify-center">
                            <Button
                              onClick={() => handleDownloadDocument(document)}
                              disabled={downloadingDocumentId === document.id}
                              size="sm"
                              className="text-xs px-3 h-7 whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
                            >
                              {downloadingDocumentId === document.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                  <span>Downloading...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1.5" />
                                  <span>Download</span>
                                </>
                              )}
                            </Button>
                            {canManage() && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDocument(document)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-3 h-7 whitespace-nowrap"
                              >
                                <Trash2 className="h-3 w-3 mr-1.5" />
                                <span>Delete</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {filteredDocuments.length > 5 && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMoreDocuments(!showMoreDocuments)}
                  className="w-full sm:w-auto"
                >
                  {showMoreDocuments ? (
                    <>
                      Show Less
                      <ChevronDown className="h-4 w-4 ml-2 rotate-180" />
                    </>
                  ) : (
                    <>
                      Show More ({filteredDocuments.length - 5} more)
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Document Dialog */}
      <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
        <DialogContent className="w-[95vw] max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Upload Document</DialogTitle>
            <DialogDescription className="text-sm">
              Upload a document for {specialty.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="docTitle" className="text-sm">Title *</Label>
              <Input
                id="docTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Document title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="docDescription" className="text-sm">Description</Label>
              <Textarea
                id="docDescription"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="docFile" className="text-sm">File *</Label>
              <Input
                id="docFile"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-1 break-words">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowAddDocumentDialog(false)}
              className="w-full sm:w-auto hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadDocument} 
              disabled={uploadingDocument}
              className="w-full sm:w-auto"
            >
              {uploadingDocument ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Page Dialog */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0" showCloseButton={false}>
          <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 rounded-md bg-white/90 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md z-10"
              onClick={() => setShowPreviewModal(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
            <div className="pr-12">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl font-bold text-gray-900 break-words">
                      {previewingPage?.title || 'Page Preview'}
                    </DialogTitle>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 flex-shrink-0">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Draft
                </Badge>
              </div>
              <DialogDescription className="text-sm text-amber-700 mt-2 pr-0">
                Draft Preview - This page is not visible to public users
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {previewingPage?.content ? (
              <div 
                className="prose prose-sm sm:prose-base max-w-none"
                dangerouslySetInnerHTML={{ __html: previewingPage.content }}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No content available for this page.</p>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between w-full gap-4">
              <p className="text-xs text-gray-500 max-w-md">
                This is a preview of a draft page. Publish the page to make it visible to all users.
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Close
                </Button>
                {previewingPage && (
                  <Link href={`/placements/${slug}/${previewingPage.slug}/edit`}>
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Page
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Page Dialog */}
      <DeletePageDialog
        open={showDeletePageDialog}
        onOpenChange={setShowDeletePageDialog}
        onConfirm={confirmDeletePage}
        isLoading={isDeleting}
        title={deletingPage ? `Delete "${deletingPage.title}"` : 'Delete Page'}
        description={deletingPage 
          ? `Are you sure you want to delete "${deletingPage.title}"? This action cannot be undone and will permanently remove the page and all associated content.`
          : 'Are you sure you want to delete this page? This action cannot be undone and will permanently remove the page and all associated content.'}
      />

      {/* Delete Document Dialog */}
      <DeleteFileDialog
        open={showDeleteDocumentDialog}
        onOpenChange={setShowDeleteDocumentDialog}
        onConfirm={confirmDeleteDocument}
        isLoading={isDeleting}
        title={deletingDocument ? `Delete "${deletingDocument.title}"` : 'Delete Document'}
        description={deletingDocument 
          ? `Are you sure you want to delete "${deletingDocument.title}"? This action cannot be undone and the file will be permanently removed.`
          : 'Are you sure you want to delete this document? This action cannot be undone and the file will be permanently removed.'}
      />
    </div>
  );
}
