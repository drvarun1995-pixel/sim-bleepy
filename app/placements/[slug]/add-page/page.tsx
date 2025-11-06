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

export default function AddSpecialtyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImagePath, setFeaturedImagePath] = useState<string | null>(null);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
  const [showFeaturedImage, setShowFeaturedImage] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; parent: string | null; color: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pageStatus, setPageStatus] = useState<'published' | 'draft'>('draft');

  useEffect(() => {
    if (status === 'authenticated' && slug) {
      fetchSpecialtyData();
      fetchUserRole();
      fetchCategories();
    }
  }, [status, slug]);

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
          toast.error('You do not have permission to add pages');
          router.push(`/placements/${slug}`);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchSpecialtyData = async () => {
    try {
      setLoading(true);
      
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
    } catch (error) {
      console.error('Error fetching specialty data:', error);
      toast.error('Failed to load specialty information');
    } finally {
      setLoading(false);
    }
  };

  // Generate slug from title
  useEffect(() => {
    if (pageTitle) {
      const slug = pageTitle.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'page';
      setGeneratedSlug(slug);
    } else {
      setGeneratedSlug('');
    }
  }, [pageTitle]);

  const handleSave = async () => {
    if (!specialty || !pageTitle) {
      toast.error('Please fill in the title');
      return;
    }

    try {
      setSaving(true);

      // Use the featured image path as-is (it should already be correct)
      // The path structure is: {specialtySlug}/{pageSlug}/images/featured.webp
      // If the slug changed due to uniqueness, the API will handle the final slug
      // and we'll update the path accordingly after getting the response
      let finalFeaturedImagePath = featuredImagePath;

      const response = await fetch('/api/placements/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialty_id: specialty.id,
          title: pageTitle,
          content: pageContent,
          display_order: 0,
          featured_image: finalFeaturedImagePath,
          status: pageStatus,
          category_ids: selectedCategories
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create page');
      }

      const data = await response.json();
      const finalSlug = data.page?.slug || generatedSlug;
      
      // If the slug changed due to uniqueness, we may need to update the featured image path
      // The path structure is: {specialtySlug}/{pageSlug}/images/featured.webp
      if (featuredImagePath && finalSlug && !featuredImagePath.includes(`/${finalSlug}/`)) {
        // Slug changed due to uniqueness, construct the new path
        const newPath = `${slug}/${finalSlug}/images/featured.webp`;
        // Update the featured image in the database with the correct path
        // Note: The file itself is already uploaded, we're just updating the path reference
        await fetch(`/api/placements/pages/${data.page.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured_image: newPath })
        }).catch(err => console.error('Failed to update featured image path:', err));
      }
      
      // Mark as saved to prevent cleanup (use ref for immediate effect)
      isSavedRef.current = true;
      setIsSaved(true);
      // Clear uploaded images list since page was saved successfully
      setUploadedImagePaths([]);
      // Clear page content to prevent cleanup
      pageContentRef.current = '';
      // Clear featured image state (it's now saved in the database)
      setFeaturedImage(null);
      setFeaturedImagePath(null);
      
      toast.success('Page created successfully');
      // Small delay to ensure state updates before navigation
      setTimeout(() => {
        router.push(`/placements/${slug}`);
      }, 100);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create page');
    } finally {
      setSaving(false);
    }
  };

  // Use ref to track if saved (avoids stale closures)
  const isSavedRef = useRef(false);
  const pageContentRef = useRef(pageContent);
  
  // Keep refs in sync
  useEffect(() => {
    isSavedRef.current = isSaved;
  }, [isSaved]);
  
  useEffect(() => {
    pageContentRef.current = pageContent;
  }, [pageContent]);

  // Cleanup function to extract and delete images
  const cleanupImages = useCallback(() => {
    // Don't cleanup if page was saved successfully
    if (isSavedRef.current) return;
    
    const imagePaths: string[] = [];
    
    // Extract images from content
    if (pageContentRef.current) {
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;
      
      while ((match = imgRegex.exec(pageContentRef.current)) !== null) {
        const url = match[1];
        const pathMatch = url.match(/\/api\/placements\/images\/view\?path=([^&"']+)/);
        if (pathMatch) {
          imagePaths.push(decodeURIComponent(pathMatch[1]));
        }
      }
    }
    
    // Add featured image if exists
    if (featuredImagePath) {
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
  }, [featuredImagePath]); // Include featuredImagePath in dependencies

  // Cleanup on page unload/refresh - only set up once
  useEffect(() => {
    // Don't set up cleanup if already saved
    if (isSaved) return;
    
    const handleBeforeUnload = () => {
      if (!isSavedRef.current) {
        cleanupImages();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also cleanup on unmount (but only if not saved)
      if (!isSavedRef.current) {
        cleanupImages();
      }
    };
  }, [isSaved, cleanupImages]);

  // Handle cancel button - cleanup uploaded images
  const handleCancel = () => {
    const imagePaths: string[] = [];
    
    // Extract all image paths from content and delete them
    if (pageContent) {
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;
      
      while ((match = imgRegex.exec(pageContent)) !== null) {
        const url = match[1];
        const pathMatch = url.match(/\/api\/placements\/images\/view\?path=([^&"']+)/);
        if (pathMatch) {
          imagePaths.push(decodeURIComponent(pathMatch[1]));
        }
      }
    }
    
    // Add featured image if exists
    if (featuredImagePath) {
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
    router.push(`/placements/${slug}`);
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

      // Require a page title/slug before uploading
      if (!generatedSlug) {
        toast.error('Please enter a page title first');
        return;
      }
      
      const pageSlugForUpload = generatedSlug;
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('specialtySlug', slug);
      formData.append('pageSlug', pageSlugForUpload);
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
    if (!featuredImagePath) {
      setFeaturedImage(null);
      setFeaturedImagePath(null);
      return;
    }

    try {
      // Delete from storage
      const response = await fetch('/api/placements/images/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePaths: [featuredImagePath] }),
      });

      if (!response.ok) {
        console.error('Failed to delete featured image from storage');
      }

      setFeaturedImage(null);
      setFeaturedImagePath(null);
      toast.success('Featured image removed');
    } catch (error) {
      console.error('Error removing featured image:', error);
      // Still remove from UI even if deletion fails
      setFeaturedImage(null);
      setFeaturedImagePath(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <LoadingScreen message="Loading..." />
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
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link href={`/placements/${slug}`}>
            <Button variant="ghost" className="mb-4 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to {specialty.name}</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Add New Page</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2 break-words">Create a new sub-page for <span className="font-semibold text-gray-800">{specialty.name}</span></p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="!p-1 sm:!p-0 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader className="px-2 sm:px-6 py-4 sm:py-6 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Edit3 className="h-5 w-5 text-purple-600" />
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
              {generatedSlug && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="font-medium">URL:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{generatedSlug}</span>
                  {generatedSlug !== pageTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') && (
                    <span className="text-blue-600">(will be made unique if needed)</span>
                  )}
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
                        className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-all ${
                          !pageTitle || uploadingFeaturedImage
                            ? 'bg-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        }`}
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
                        disabled={uploadingFeaturedImage || !pageTitle}
                        className="hidden"
                      />
                      {!pageTitle && (
                        <p className="text-xs text-amber-600 mt-2">Please enter a page title first</p>
                      )}
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
                  pageSlug={generatedSlug || undefined}
                  onImageUploaded={handleImageUploaded}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
                    Create Page
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

