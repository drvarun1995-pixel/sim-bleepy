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
  Eye
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
  
  // Dialogs
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showDeletePageDialog, setShowDeletePageDialog] = useState(false);
  const [showDeleteDocumentDialog, setShowDeleteDocumentDialog] = useState(false);
  const [deletingPage, setDeletingPage] = useState<SpecialtyPage | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<SpecialtyDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && slug) {
      fetchSpecialtyData();
      fetchUserRole();
    }
  }, [status, slug]);

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

  const fetchSpecialtyData = async () => {
    try {
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

      // Fetch pages
      const pagesResponse = await fetch(`/api/placements/pages?specialtySlug=${slug}`);
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
      fetchSpecialtyData();
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
      fetchSpecialtyData();
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <Link href="/placements-guide">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Placements Guide
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 break-words">{specialty.name}</h1>
            {specialty.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2 break-words">{specialty.description}</p>
            )}
          </div>
          {canManage() && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Link href={`/placements/${slug}/add-page`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Page
                </Button>
              </Link>
              <Button 
                onClick={() => setShowAddDocumentDialog(true)} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.pages}</p>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.documents}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Folder className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pages Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pages</h2>
          {pages.length > 0 && (
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search pages..."
                value={pagesSearchQuery}
                onChange={(e) => setPagesSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>

        {pages.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No pages yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {canManage() ? 'Get started by adding your first page' : 'No pages available for this specialty'}
              </p>
              {canManage() && (
                <Link href={`/placements/${slug}/add-page`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Page
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : filteredPages.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No pages found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search criteria
              </p>
              <Button variant="outline" onClick={() => setPagesSearchQuery('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPages.map((page) => (
              <Card key={page.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 break-words">{page.title}</CardTitle>
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
                      className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 break-words"
                      dangerouslySetInnerHTML={{ __html: page.content.substring(0, 200) }}
                    />
                  )}
                  <Link href={`/placements/${slug}/${page.slug}`} className="mt-auto">
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Page
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Documents</h2>
          {documents.length > 0 && (
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={documentsSearchQuery}
                onChange={(e) => setDocumentsSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No documents yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {canManage() ? 'Get started by uploading your first document' : 'No documents available for this specialty'}
              </p>
              {canManage() && (
                <Button onClick={() => setShowAddDocumentDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No documents found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search criteria
              </p>
              <Button variant="outline" onClick={() => setDocumentsSearchQuery('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base break-words">{document.title}</h3>
                          {document.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">{document.description}</p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="break-all">{document.file_name}</span>
                            <span className="flex-shrink-0">{formatFileSize(document.file_size)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
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
                  </div>
                </CardContent>
              </Card>
            ))}
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
              className="w-full sm:w-auto"
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
