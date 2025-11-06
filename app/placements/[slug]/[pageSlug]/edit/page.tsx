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
  Edit3,
  Image as ImageIcon,
  X,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';
import { TiptapSimpleEditor } from '@/components/ui/tiptap-simple-editor';
import { DebugMultiSelect } from '@/components/ui/debug-multi-select';
import { getCategories } from '@/lib/events-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag, Eye, EyeOff } from 'lucide-react';

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
  featured_image?: string | null;
  status?: 'published' | 'draft';
  categories?: Array<{ id: string; name: string; slug: string; color: string }>;
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
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImagePath, setFeaturedImagePath] = useState<string | null>(null);
  const [initialFeaturedImagePath, setInitialFeaturedImagePath] = useState<string | null>(null);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
  const [showFeaturedImage, setShowFeaturedImage] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; parent: string | null; color: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pageStatus, setPageStatus] = useState<'published' | 'draft'>('draft');

  useEffect(() => {
    if (status === 'authenticated' && slug && pageSlug) {
      fetchData();
      fetchUserRole();
      fetchCategories();
    }
  }, [status, slug, pageSlug]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      // The API returns an object with categories property
      const categoriesArray = categoriesData.categories || [];
      setCategories(categoriesArray);
      
      if (categoriesArray.length === 0) {
        console.warn('No categories found in database');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

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

      // Fetch pages (include inactive/draft pages for editing)
      const pagesResponse = await fetch(`/api/placements/pages?specialtyId=${foundSpecialty.id}&includeInactive=true`);
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
      
      // Set status
      setPageStatus(foundPage.status || 'draft');
      
      // Set categories
      if (foundPage.categories && foundPage.categories.length > 0) {
        setSelectedCategories(foundPage.categories.map((cat: any) => cat.id));
      }
      
      // Set featured image if it exists
      if (foundPage.featured_image) {
        setFeaturedImagePath(foundPage.featured_image);
        setInitialFeaturedImagePath(foundPage.featured_image);
        setShowFeaturedImage(true);
        // Generate view URL for the featured image
        const viewUrl = `/api/placements/images/view?path=${encodeURIComponent(foundPage.featured_image)}`;
        setFeaturedImage(viewUrl);
      }
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
          content: pageContent,
          featured_image: showFeaturedImage ? featuredImagePath : null,
          status: pageStatus,
          category_ids: selectedCategories
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

      // Delete old featured image if it was removed or replaced
      if (initialFeaturedImagePath && initialFeaturedImagePath !== featuredImagePath) {
        fetch('/api/placements/images/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePaths: [initialFeaturedImagePath] })
        }).catch(error => {
          console.error('Error cleaning up old featured image:', error);
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
      // Update initial featured image path
      if (featuredImagePath) {
        setInitialFeaturedImagePath(featuredImagePath);
      }
      
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
    if (isSavedRef.current) return;
    
    const imagePaths: string[] = [];
    
    // Extract new images from content
    if (pageContentRef.current) {
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
      contentUrls.forEach(url => {
        if (!initialUrls.has(url)) {
          const pathMatch = url.match(/\/api\/placements\/images\/view\?path=([^&"']+)/);
          if (pathMatch) {
            imagePaths.push(decodeURIComponent(pathMatch[1]));
          }
        }
      });
    }
    
    // Add new featured image if it was uploaded but not saved
    if (featuredImagePath && featuredImagePath !== initialFeaturedImagePath) {
      imagePaths.push(featuredImagePath);
    }
    
    if (imagePaths.length > 0) {
      // Use sendBeacon for more reliable cleanup on page unload
      const data = JSON.stringify({ imagePaths });
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
  }, [featuredImagePath, initialFeaturedImagePath]); // Include featured image paths in dependencies

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
    const imagePaths: string[] = [];
    
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
      contentUrls.forEach(url => {
        if (!initialUrls.has(url)) {
          const pathMatch = url.match(/\/api\/placements\/images\/view\?path=([^&"']+)/);
          if (pathMatch) {
            imagePaths.push(decodeURIComponent(pathMatch[1]));
          }
        }
      });
    }
    
    // Add new featured image if it was uploaded but not saved
    if (featuredImagePath && featuredImagePath !== initialFeaturedImagePath) {
      imagePaths.push(featuredImagePath);
    }
    
    if (imagePaths.length > 0) {
      fetch('/api/placements/images/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePaths })
      }).catch(error => {
        console.error('Error cleaning up images:', error);
      });
    }
    router.push(`/placements/${slug}/${pageSlug}`);
  };

  const handleImageUploaded = (imagePath: string) => {
    setUploadedImagePaths(prev => [...prev, imagePath]);
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Invalid file type. Only images are allowed.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    try {
      setUploadingFeaturedImage(true);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('specialtySlug', slug);
      formData.append('pageSlug', generatedSlug || pageSlug);
      formData.append('isFeatured', 'true'); // Flag to indicate this is a featured image

      // Upload image
      const response = await fetch('/api/placements/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Store the view URL and path
      setFeaturedImage(data.url);
      setFeaturedImagePath(data.path);
      
      toast.success('Featured image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading featured image:', error);
      toast.error(error.message || 'Failed to upload featured image');
    } finally {
      setUploadingFeaturedImage(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemoveFeaturedImage = async () => {
    // Just clear the state - the old image will be deleted when the page is saved
    setFeaturedImage(null);
    setFeaturedImagePath(null);
    setShowFeaturedImage(false);
    toast.success('Featured image removed');
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showFeaturedImage"
                  checked={showFeaturedImage}
                  onCheckedChange={(checked) => {
                    setShowFeaturedImage(checked as boolean);
                    if (!checked) {
                      // Remove featured image if checkbox is unchecked
                      if (featuredImagePath) {
                        handleRemoveFeaturedImage();
                      }
                    }
                  }}
                />
                <Label htmlFor="showFeaturedImage" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Add Featured Image
                </Label>
              </div>
              {showFeaturedImage && (
                <div className="space-y-3 mt-3">
                  {featuredImage ? (
                    <div className="relative group">
                      <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                        <img
                          src={featuredImage}
                          alt="Featured"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveFeaturedImage}
                          className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                          aria-label="Remove featured image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-purple-400 transition-colors">
                      <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3" />
                      <Label
                        htmlFor="featuredImage"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md shadow-md hover:shadow-lg transition-all"
                      >
                        {uploadingFeaturedImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload Featured Image
                          </>
                        )}
                      </Label>
                      <input
                        id="featuredImage"
                        type="file"
                        accept="image/*"
                        onChange={handleFeaturedImageUpload}
                        disabled={uploadingFeaturedImage}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF or WebP (max 10MB)</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categories" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </Label>
              <DebugMultiSelect
                options={categories.map(cat => ({
                  value: cat.id,
                  label: cat.name
                }))}
                selected={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Select categories..."
                className="w-full"
              />
              <p className="text-xs text-gray-500">Select one or more categories for this page</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageStatus" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                {pageStatus === 'published' ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                Status
              </Label>
              <Select value={pageStatus} onValueChange={(value: 'published' | 'draft') => setPageStatus(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-green-600" />
                      <span>Published</span>
                      <span className="text-xs text-gray-500">(Visible on placement page)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-gray-400" />
                      <span>Draft</span>
                      <span className="text-xs text-gray-500">(Hidden from placement page)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {pageStatus === 'published' 
                  ? 'This page will be visible on the placement page' 
                  : 'This page will be hidden from the placement page'}
              </p>
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

