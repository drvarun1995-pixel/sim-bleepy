'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Loader2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';

interface SpecialtyPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
}

export default function SpecialtyPageDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const pageSlug = params.pageSlug as string;

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<SpecialtyPage | null>(null);
  const [specialtyName, setSpecialtyName] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  // Process HTML content to replace image URLs with view API URLs
  const processImageUrls = (html: string): string => {
    if (!html) return html;

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all img tags
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (!src) return;

      // If it's already a view API URL, leave it as is
      if (src.includes('/api/placements/images/view')) {
        return;
      }

      // If it's a storage path (starts with specialty slug or contains placements folder)
      // Extract the path and convert to view API URL
      let storagePath = '';
      
      // Check if it's a Supabase storage URL
      if (src.includes('/storage/v1/object/')) {
        // Extract path from Supabase URL
        const pathMatch = src.match(/\/storage\/v1\/object\/(?:public|sign)\/placements\/(.+?)(?:\?|$)/);
        if (pathMatch) {
          storagePath = decodeURIComponent(pathMatch[1]);
        }
      } else if (src.includes('/placements/') || src.includes('placements/')) {
        // Direct storage path
        const pathMatch = src.match(/(?:placements\/|placements%2F)(.+?)(?:\?|$)/);
        if (pathMatch) {
          storagePath = decodeURIComponent(pathMatch[1].replace(/%2F/g, '/'));
        }
      } else if (src.startsWith('rheumatology/') || src.includes('/images/')) {
        // Direct path format: {specialty}/{page}/images/{file}
        storagePath = src;
      }

      // If we found a storage path, replace with view API URL
      if (storagePath) {
        img.setAttribute('src', `/api/placements/images/view?path=${encodeURIComponent(storagePath)}`);
      }
    });

    return tempDiv.innerHTML;
  };

  useEffect(() => {
    if (status === 'authenticated' && slug && pageSlug) {
      fetchPageData();
      fetchUserRole();
    }
  }, [status, slug, pageSlug]);

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

  const fetchPageData = async () => {
    try {
      setLoading(true);
      
      // Fetch specialty to get name
      const specialtyResponse = await fetch('/api/placements/specialties');
      if (specialtyResponse.ok) {
        const specialtyData = await specialtyResponse.json();
        const foundSpecialty = specialtyData.specialties.find((s: any) => s.slug === slug);
        if (foundSpecialty) {
          setSpecialtyName(foundSpecialty.name);
        }
      }

      // Fetch pages for this specialty
      const specialtyResponse2 = await fetch('/api/placements/specialties');
      if (!specialtyResponse2.ok) throw new Error('Failed to fetch specialties');
      const specialtyData2 = await specialtyResponse2.json();
      const foundSpecialty2 = specialtyData2.specialties.find((s: any) => s.slug === slug);
      
      if (!foundSpecialty2) {
        toast.error('Specialty not found');
        router.push('/placements');
        return;
      }

      // Fetch pages
      const pagesResponse = await fetch(`/api/placements/pages?specialtyId=${foundSpecialty2.id}`);
      if (!pagesResponse.ok) throw new Error('Failed to fetch pages');
      const pagesData = await pagesResponse.json();
      const foundPage = pagesData.pages.find((p: SpecialtyPage) => p.slug === pageSlug);
      
      if (!foundPage) {
        toast.error('Page not found');
        router.push(`/placements/${slug}`);
        return;
      }
      
      // Process image URLs in content
      if (foundPage.content) {
        foundPage.content = processImageUrls(foundPage.content);
      }
      
      setPage(foundPage);
    } catch (error) {
      console.error('Error fetching page data:', error);
      toast.error('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <LoadingScreen message="Loading page..." />
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Page not found</p>
            <Link href={`/placements/${slug}`}>
              <Button className="mt-4">Back to {specialtyName || 'Specialty'}</Button>
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
          <div className="flex items-center justify-between mb-4">
            <Link href={`/placements/${slug}`}>
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {specialtyName || 'Specialty'}
              </Button>
            </Link>
            {['admin', 'meded_team', 'ctf'].includes(userRole) && (
              <Link href={`/placements/${slug}/${pageSlug}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Page
                </Button>
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
        </div>

        {/* Page Content */}
        <Card>
          <CardContent className="pt-6">
            <style jsx global>{`
              .placements-content table {
                border-collapse: collapse !important;
                margin: 16px 0 !important;
                width: 100% !important;
                border: 2px solid #171717 !important;
                background-color: #ffffff !important;
              }
              
              .placements-content table td,
              .placements-content table th {
                border: 1px solid #171717 !important;
                padding: 8px !important;
                min-width: 50px !important;
                min-height: 30px !important;
                vertical-align: top !important;
                background-color: #ffffff !important;
              }
              
              .placements-content table th {
                background-color: #f9fafb !important;
                font-weight: 600 !important;
              }
              
              .placements-content img {
                max-width: 100% !important;
                height: auto !important;
                margin: 10px 0 !important;
              }
              
              /* Image alignment styles */
              .placements-content img[data-align="center"],
              .placements-content img[style*="display: block"][style*="margin: 0.5em auto"] {
                display: block !important;
                margin: 0.5em auto !important;
                text-align: center !important;
              }
              
              .placements-content img[data-align="left"],
              .placements-content img[style*="float: left"] {
                float: left !important;
                margin: 0.5em 1em 0.5em 0 !important;
                clear: left !important;
              }
              
              .placements-content img[data-align="right"],
              .placements-content img[style*="float: right"] {
                float: right !important;
                margin: 0.5em 0 0.5em 1em !important;
                clear: right !important;
              }
              
              /* Support for inline styles from editor */
              .placements-content img[style*="text-align: center"] {
                display: block !important;
                margin: 0.5em auto !important;
              }
            `}</style>
            {page.content ? (
              <div 
                className="prose max-w-none placements-content"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            ) : (
              <p className="text-gray-600">No content available for this page.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

