'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save,
  Loader2
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
      
      // Mark as saved to prevent cleanup
      setIsSaved(true);
      // Clear uploaded images list since page was saved successfully
      setUploadedImagePaths([]);
      // Update initial content to current to prevent cleanup of saved images
      setInitialContent(pageContent);
      
      toast.success('Page updated successfully');
      router.push(`/placements/${slug}/${data.page.slug}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  // Cleanup function to extract and delete newly uploaded images
  const cleanupNewImages = useCallback(() => {
    // Don't cleanup if page was saved successfully
    if (isSaved || !pageContent) return;
    
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
  }, [pageContent, initialContent, isSaved]);

  // Cleanup on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupNewImages();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also cleanup on unmount
      cleanupNewImages();
    };
  }, [cleanupNewImages]);

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
    <div className="max-w-[70%] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/placements/${slug}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {specialty?.name || 'Specialty'}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Page</h1>
          <p className="text-gray-600 mt-2">Update page information</p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Page Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="pageTitle">Title *</Label>
              <Input
                id="pageTitle"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Page title"
                className="mt-1"
              />
              {generatedSlug && generatedSlug !== pageSlug && (
                <p className="text-xs text-gray-500 mt-1">
                  URL will change to: <span className="font-mono">{generatedSlug}</span>
                  <span className="text-blue-600"> (will be made unique if needed)</span>
                </p>
              )}
              {generatedSlug === pageSlug && (
                <p className="text-xs text-gray-500 mt-1">
                  Current URL: <span className="font-mono">{pageSlug}</span>
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="pageContent">Content</Label>
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
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
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

