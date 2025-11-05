'use client';

import { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
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
  
  // Dialogs
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  
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
      const pagesResponse = await fetch(`/api/placements/pages?specialtyId=${foundSpecialty.id}`);
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        setPages(pagesData.pages || []);
      }

      // Fetch documents
      const documentsResponse = await fetch(`/api/placements/documents?specialtyId=${foundSpecialty.id}`);
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


  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const response = await fetch(`/api/placements/pages/${pageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      toast.success('Page deleted successfully');
      fetchSpecialtyData();
    } catch (error) {
      toast.error('Failed to delete page');
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

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/placements/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast.success('Document deleted successfully');
      fetchSpecialtyData();
    } catch (error) {
      toast.error('Failed to delete document');
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
      <LoadingScreen message="Loading specialty information..." />
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
    <div className="w-full max-w-[70%] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/placements">
            <Button variant="ghost" className="mb-4 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Placements
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{specialty.name}</h1>
              {specialty.description && (
                <p className="text-gray-600 mt-2 text-sm sm:text-base break-words">{specialty.description}</p>
              )}
            </div>
            {canManage() && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Link href={`/placements/${slug}/add-page`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Page</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </Link>
                <Button 
                  onClick={() => setShowAddDocumentDialog(true)} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Upload Document</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Pages Section */}
        {pages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Pages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pages.map((page) => (
                <Card key={page.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg break-words">{page.title}</CardTitle>
                      </div>
                      {canManage() && (
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
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
                            onClick={() => handleDeletePage(page.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {page.content && (
                      <div 
                        className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3 break-words"
                        dangerouslySetInnerHTML={{ __html: page.content.substring(0, 200) }}
                      />
                    )}
                    <Link href={`/placements/${slug}/${page.slug}`}>
                      <Button variant="outline" className="w-full text-sm">
                        View Page
                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Documents</h2>
          {documents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Folder className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-sm sm:text-base">No documents available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{document.title}</h3>
                            {document.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{document.description}</p>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs text-gray-500">
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
                          className="inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          <Download className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Download</span>
                          <span className="sm:hidden">DL</span>
                        </a>
                        {canManage() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(document.id)}
                            className="h-8 w-8 p-0"
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
    </div>
  );
}

