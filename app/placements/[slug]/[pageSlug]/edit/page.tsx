'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save,
  Loader2,
  FileText,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';
import { TiptapSimpleEditor } from '@/components/ui/tiptap-simple-editor';

interface Specialty {
  id: string;
  name: string;
  slug: string;
}

interface SpecialtyPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
}

export default function EditSpecialtyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const pageSlug = params.pageSlug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [page, setPage] = useState<SpecialtyPage | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
  const [initialContent, setInitialContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && slug && pageSlug) {
      fetchData();
      fetchUserRole();
    }
  }, [status, slug, pageSlug]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.user?.role || '');
        
        // Check if user can manage
        if (!['admin', 'meded_team', 'ctf'].includes(data.user?.role || '')) {
          toast.error('You do not have permission to edit pages');
          router.push(`/placements/${slug}/${pageSlug}`);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchData = async () => {
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
      if (!pagesResponse.ok) throw new Error('Failed to fetch pages');
      const pagesData = await pagesResponse.json();
      const foundPage = pagesData.pages.find((p: SpecialtyPage) => p.slug === pageSlug);
      
      if (!foundPage) {
        toast.error('Page not found');
        router.push(`/placements/${slug}`);
        return;
      }
      
      setPage(foundPage);
      setPageTitle(foundPage.title);
      setGeneratedSlug(foundPage.slug);
      const content = foundPage.content || '';
      setPageContent(content);
      setInitialContent(content); // Store initial content to detect changes
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load page data');
    } finally {
      setLoading(false);
    }
  };

  // Generate slug from title when title changes
  useEffect(() => {
    if (pageTitle) {
      const slug = pageTitle.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'page';
      setGeneratedSlug(slug);
    }
  }, [pageTitle]);

  const handleSave = async () => {
    if (!page || !pageTitle) {
      toast.error('Please fill in the title');
      return;
    }

    try {
      setSaving(true);

      // Extract image paths from current content and initial content to find deleted images
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;
      
      // Get all images from current content
      const contentUrls = new Set<string>();
      imgRegex.lastIndex = 0;
      while ((match = imgRegex.exec(pageContent)) !== null) {
        contentUrls.add(match[1]);
      }
      
      // Get all images from initial content
      const initialUrls = new Set<string>();
      if (initialContent) {
        imgRegex.lastIndex = 0;
        while ((match = imgRegex.exec(initialContent)) !== null) {
          initialUrls.add(match[1]);
        }
      }

      // Find images that were in initial content but not in current content (deleted)
      const deletedImagePaths: string[] = [];
      initialUrls.forEach(url => {
        if (!contentUrls.has(url)) {
          const pathMatch = url.match(/\/api\/placements\/images\/view\?path=([^&"']+)/);
          if (pathMatch) {
            deletedImagePaths.push(decodeURIComponent(pathMatch[1]));
          }
        }
      });

      // Save the page
      const response = await fetch(`/api/placements/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageTitle,
          content: pageContent
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update page');
      }

      // Delete images that were removed from content (only if page was saved successfully)
      if (deletedImagePaths.length > 0) {
        fetch('/api/placements/images/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePaths: deletedImagePaths })
        }).catch(error => {
          console.error('Error cleaning up deleted images:', error);
        });
      }

      const data = await response.json();
      
      // Mark as saved to prevent cleanup (use ref for immediate effect)
      isSavedRef.current = true;
      setIsSaved(true);
      // Clear uploaded images list since page was saved successfully
      setUploadedImagePaths([]);
      // Update initial content to current to prevent cleanup of saved images
      initialContentRef.current = pageContent;
      setInitialContent(pageContent);
      
      toast.success('Page updated successfully');
      // Small delay to ensure state updates before navigation
      setTimeout(() => {
        router.push(`/placements/${slug}/${data.page.slug}`);
      }, 100);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  // Use refs to track state (avoids stale closures)
  const isSavedRef = useRef(false);
  const pageContentRef = useRef(pageContent);
  const initialContentRef = useRef(initialContent);
  
  // Keep refs in sync
  useEffect(() => {
    isSavedRef.current = isSaved;
  }, [isSaved]);
  
  useEffect(() => {
    pageContentRef.current = pageContent;
  }, [pageContent]);
  
  useEffect(() => {
    initialContentRef.current = initialContent;
  }, [initialContent]);

  // Cleanup function to extract and delete newly uploaded images
  const cleanupNewImages = useCallback(() => {
    // Don't cleanup if page was saved successfully
    if (isSavedRef.current || !pageContentRef.current) return;
    
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    let match;
    
    // Get all images from current content
    const contentUrls = new Set<string>();
    imgRegex.lastIndex = 0;
    while ((match = imgRegex.exec(pageContentRef.current)) !== null) {
      contentUrls.add(match[1]);
    }
    
    // Get all images from initial content
    const initialUrls = new Set<string>();
    if (initialContentRef.current) {
      imgRegex.lastIndex = 0;
      while ((match = imgRegex.exec(initialContentRef.current)) !== null) {
        initialUrls.add(match[1]);
      }
    }
    
    // Find new images (in content but not in initial)
    const newImagePaths: string[] = [];
    contentUrls.forEach(url => {
      if (!initialUrls.has(url)) {
        const pathMatch = url.match(/\/api\/placements\/images\/view\?path=([^&"']+)/);
        if (pathMatch) {
          newImagePaths.push(decodeURIComponent(pathMatch[1]));
        }
      }
    });
    
    if (newImagePaths.length > 0) {
      // Use sendBeacon for more reliable cleanup on page unload
      const data = JSON.stringify({ imagePaths: newImagePaths });
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/placements/images/cleanup', blob);
      } else {
        // Fallback: use fetch with keepalive
        fetch('/api/placements/images/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true
        }).catch(() => {
          // Silently fail - cleanup is best effort
        });
      }
    }
  }, []); // No dependencies - uses refs

  // Cleanup on page unload/refresh - only set up once
  useEffect(() => {
    // Don't set up cleanup if already saved
    if (isSaved) return;
    
    const handleBeforeUnload = () => {
      if (!isSavedRef.current) {
        cleanupNewImages();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also cleanup on unmount (but only if not saved)
      if (!isSavedRef.current) {
        cleanupNewImages();
      }
    };
  }, [isSaved, cleanupNewImages]);

  // Handle cancel button - cleanup uploaded images
  const handleCancel = () => {
    // Extract newly uploaded images (not in initial content) and delete them
    if (pageContent && initialContent) {
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;
      
      // Get all images from current content
      const contentUrls = new Set<string>();
      imgRegex.lastIndex = 0;
      while ((match = imgRegex.exec(pageContent)) !== null) {
        contentUrls.add(match[1]);
      }
      
      // Get all images from initial content
      const initialUrls = new Set<string>();
      imgRegex.lastIndex = 0;
      while ((match = imgRegex.exec(initialContent)) !== null) {
        initialUrls.add(match[1]);
      }
      
      // Find new images (in content but not in initial)
      const newImagePaths: string[] = [];
      contentUrls.forEach(url => {
        if (!initialUrls.has(url)) {
          const pathMatch = url.match(/\/api\/placements\/images\/view\?path=([^&"']+)/);
          if (pathMatch) {
            newImagePaths.push(decodeURIComponent(pathMatch[1]));
          }
        }
      });
      
      if (newImagePaths.length > 0) {
        fetch('/api/placements/images/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePaths: newImagePaths })
        }).catch(error => {
          console.error('Error cleaning up images:', error);
        });
      }
    }
    router.push(`/placements/${slug}/${pageSlug}`);
  };

  const handleImageUploaded = (imagePath: string) => {
    setUploadedImagePaths(prev => [...prev, imagePath]);
  };

  if (status === 'loading' || loading) {
    return (
      <LoadingScreen message="Loading..." />
    );
  }

  if (!specialty || !page) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Page not found</p>
            <Link href={`/placements/${slug}`}>
              <Button className="mt-4">Back to {specialty?.name || 'Specialty'}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link href={`/placements/${slug}`}>
            <Button variant="ghost" className="mb-4 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to {specialty?.name || 'Specialty'}</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <Edit3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Edit Page</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2 break-words">
                Update page information for <span className="font-semibold text-gray-800">{page?.title || 'this page'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="!p-1 sm:!p-0 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader className="px-2 sm:px-6 py-4 sm:py-6 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <FileText className="h-5 w-5 text-purple-600" />
              Page Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6 pt-4 sm:pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pageTitle" className="text-sm font-semibold text-gray-700">Title *</Label>
              <Input
                id="pageTitle"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Enter page title..."
                className="border-gray-200 focus:border-purple-400 focus:ring-purple-200 transition-colors"
              />
              {generatedSlug && generatedSlug !== pageSlug && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="font-medium">URL will change to:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{generatedSlug}</span>
                  <span className="text-blue-600">(will be made unique if needed)</span>
                </p>
              )}
              {generatedSlug === pageSlug && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="font-medium">Current URL:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{pageSlug}</span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageContent" className="text-sm font-semibold text-gray-700">Content</Label>
              <div className="mt-1">
                <TiptapSimpleEditor
                  value={pageContent}
                  onChange={setPageContent}
                  placeholder="Enter page content..."
                  specialtySlug={slug}
                  pageSlug={generatedSlug || pageSlug}
                  onImageUploaded={handleImageUploaded}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Page
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

