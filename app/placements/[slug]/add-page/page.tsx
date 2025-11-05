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
      const response = await fetch('/api/placements/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialty_id: specialty.id,
          title: pageTitle,
          content: pageContent,
          display_order: 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create page');
      }

      const data = await response.json();
      
      // Clear uploaded images list since page was saved successfully
      setUploadedImagePaths([]);
      
      toast.success('Page created successfully');
      router.push(`/placements/${slug}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create page');
    } finally {
      setSaving(false);
    }
  };

  // Cleanup uploaded images if page is not saved (on cancel or unmount)
  useEffect(() => {
    return () => {
      // On unmount, if there are uploaded images, delete them
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
  }, [uploadedImagePaths]); // Track uploadedImagePaths

  // Handle cancel button - cleanup images
  const handleCancel = () => {
    if (uploadedImagePaths.length > 0) {
      fetch('/api/placements/images/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePaths: uploadedImagePaths })
      }).catch(error => {
        console.error('Error cleaning up images:', error);
      });
    }
    router.push(`/placements/${slug}`);
  };

  const handleImageUploaded = (imagePath: string) => {
    setUploadedImagePaths(prev => [...prev, imagePath]);
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
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/placements/${slug}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {specialty.name}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Page</h1>
          <p className="text-gray-600 mt-2">Create a new sub-page for {specialty.name}</p>
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
              {generatedSlug && (
                <p className="text-xs text-gray-500 mt-1">
                  URL will be: <span className="font-mono">{generatedSlug}</span>
                  {generatedSlug !== pageTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') && (
                    <span className="text-blue-600"> (will be made unique if needed)</span>
                  )}
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
                  pageSlug={generatedSlug || undefined}
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

