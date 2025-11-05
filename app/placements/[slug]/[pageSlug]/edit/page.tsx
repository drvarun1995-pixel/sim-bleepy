'use client';

import { useState, useEffect } from 'react';
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';

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

      const data = await response.json();
      
      // Clear uploaded images list since page was saved successfully
      setUploadedImagePaths([]);
      setInitialContent(pageContent); // Update initial content to current
      
      toast.success('Page updated successfully');
      // Use the slug returned from API (which might have been updated if title changed)
      router.push(`/placements/${slug}/${data.page.slug}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  // Cleanup newly uploaded images if page is not saved (on cancel or unmount)
  useEffect(() => {
    return () => {
      // On unmount, if there are newly uploaded images, delete them
      // (they weren't saved since we're unmounting without saving)
      if (uploadedImagePaths.length > 0) {
        fetch('/api/placements/images/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePaths: uploadedImagePaths })
        }).catch(error => {
          console.error('Error cleaning up images:', error);
        });
      }
    };
  }, [uploadedImagePaths]);

  // Extract image paths from content that are not in initial content (newly uploaded)
  const extractNewImagePaths = (content: string, initialContent: string): string[] => {
    const newPaths: string[] = [];
    if (!content) return newPaths;

    // Extract all image URLs from content
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    const contentUrls = new Set<string>();
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      contentUrls.add(match[1]);
    }

    // Extract image URLs from initial content
    const initialUrls = new Set<string>();
    if (initialContent) {
      while ((match = imgRegex.exec(initialContent)) !== null) {
        initialUrls.add(match[1]);
      }
    }

    // Find new URLs (in content but not in initial)
    contentUrls.forEach(url => {
      if (!initialUrls.has(url)) {
        // Extract path from view API URL
        const pathMatch = url.match(/\/api\/placements\/images\/view\?path=([^&"']+)/);
        if (pathMatch) {
          newPaths.push(decodeURIComponent(pathMatch[1]));
        }
      }
    });

    return newPaths;
  };

  // Handle cancel button - cleanup new images
  const handleCancel = () => {
    // Extract newly uploaded image paths from current content
    const newPaths = extractNewImagePaths(pageContent, initialContent);
    const pathsToDelete = [...uploadedImagePaths, ...newPaths];
    
    if (pathsToDelete.length > 0) {
      fetch('/api/placements/images/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePaths: pathsToDelete })
      }).catch(error => {
        console.error('Error cleaning up images:', error);
      });
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
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/placements/${slug}/${pageSlug}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {page.title}
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
                <RichTextEditor
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

