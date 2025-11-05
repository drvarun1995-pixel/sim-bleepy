'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Loader2,
  Edit,
  FileText,
  ChevronRight,
  Stethoscope
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
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardContent className="pt-6 text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Page not found</h3>
            <p className="text-gray-600 mb-4">The requested page could not be found.</p>
            <Link href={`/placements/${slug}`}>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {specialtyName || 'Specialty'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-4 flex-wrap">
          <Link href="/placements" className="hover:text-purple-600 transition-colors text-gray-600 inline-flex items-center leading-none">
            Placements
          </Link>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-gray-400 inline-flex items-center" />
          <Link href={`/placements/${slug}`} className="hover:text-purple-600 transition-colors text-gray-600 inline-flex items-center leading-none">
            {specialtyName || 'Specialty'}
          </Link>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-gray-400 inline-flex items-center" />
          <span className="text-gray-900 font-medium inline-flex items-center leading-none">{page.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 break-words leading-tight">
                {page.title}
              </h1>
              {specialtyName && (
                <div className="mt-3 flex items-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                    <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base font-medium text-purple-900">{specialtyName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            <Link href={`/placements/${slug}`}>
              <Button variant="outline" className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 transition-colors hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to {specialtyName || 'Specialty'}</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            {['admin', 'meded_team', 'ctf'].includes(userRole) && (
              <Link href={`/placements/${slug}/${pageSlug}/edit`}>
                <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Page
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Page Content */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <style jsx global>{`
              .placements-content {
                font-size: 1rem;
                line-height: 1.75;
                color: #374151;
              }
              
              .placements-content h1,
              .placements-content h2,
              .placements-content h3,
              .placements-content h4,
              .placements-content h5,
              .placements-content h6 {
                font-weight: 700;
                margin-top: 1.5em;
                margin-bottom: 0.75em;
                color: #111827;
                line-height: 1.3;
              }
              
              .placements-content h1 {
                font-size: 2.25em;
              }
              
              .placements-content h2 {
                font-size: 1.875em;
              }
              
              .placements-content h3 {
                font-size: 1.5em;
              }
              
              .placements-content h4 {
                font-size: 1.25em;
              }
              
              .placements-content p {
                margin-top: 1em;
                margin-bottom: 1em;
              }
              
              .placements-content ul,
              .placements-content ol {
                margin-top: 1em;
                margin-bottom: 1em;
                padding-left: 1.625em;
              }
              
              .placements-content li {
                margin-top: 0.5em;
                margin-bottom: 0.5em;
              }
              
              .placements-content a {
                color: #6366f1;
                text-decoration: underline;
                text-decoration-color: #c7d2fe;
                transition: all 0.2s;
              }
              
              .placements-content a:hover {
                color: #4f46e5;
                text-decoration-color: #6366f1;
              }
              
              .placements-content strong {
                font-weight: 600;
                color: #111827;
              }
              
              .placements-content em {
                font-style: italic;
              }
              
              .placements-content code {
                background-color: #f3f4f6;
                padding: 0.125em 0.375em;
                border-radius: 0.25rem;
                font-size: 0.875em;
                font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
              }
              
              .placements-content pre {
                background-color: #1f2937;
                color: #f9fafb;
                padding: 1em;
                border-radius: 0.5rem;
                overflow-x: auto;
                margin-top: 1em;
                margin-bottom: 1em;
              }
              
              .placements-content pre code {
                background-color: transparent;
                padding: 0;
                color: inherit;
              }
              
              .placements-content blockquote {
                border-left: 4px solid #e5e7eb;
                padding-left: 1em;
                margin-left: 0;
                margin-top: 1em;
                margin-bottom: 1em;
                color: #6b7280;
                font-style: italic;
              }
              
              .placements-content hr {
                border: none;
                border-top: 1px solid #e5e7eb;
                margin-top: 2em;
                margin-bottom: 2em;
              }
              
              .placements-content table {
                border-collapse: collapse !important;
                margin: 1.5em 0 !important;
                width: 100% !important;
                border: 2px solid #171717 !important;
                background-color: #ffffff !important;
                display: block;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
              }
              
              .placements-content table td,
              .placements-content table th {
                border: 1px solid #171717 !important;
                padding: 0.75em !important;
                min-width: 50px !important;
                min-height: 30px !important;
                vertical-align: top !important;
                background-color: #ffffff !important;
                text-align: left;
              }
              
              .placements-content table th {
                background-color: #f9fafb !important;
                font-weight: 600 !important;
                color: #111827;
              }
              
              .placements-content img {
                max-width: 100% !important;
                height: auto !important;
                margin: 1.5em 0 !important;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              }
              
              /* Image alignment styles */
              .placements-content img[data-align="center"],
              .placements-content img[style*="display: block"][style*="margin: 0.5em auto"] {
                display: block !important;
                margin: 1.5em auto !important;
                text-align: center !important;
              }
              
              .placements-content img[data-align="left"],
              .placements-content img[style*="float: left"] {
                float: left !important;
                margin: 0.5em 1em 0.5em 0 !important;
                clear: left !important;
                max-width: 50% !important;
              }
              
              .placements-content img[data-align="right"],
              .placements-content img[style*="float: right"] {
                float: right !important;
                margin: 0.5em 0 0.5em 1em !important;
                clear: right !important;
                max-width: 50% !important;
              }
              
              /* Support for inline styles from editor */
              .placements-content img[style*="text-align: center"] {
                display: block !important;
                margin: 1.5em auto !important;
              }
              
              /* Mobile responsive adjustments */
              @media (max-width: 640px) {
                .placements-content {
                  font-size: 0.9375rem;
                  line-height: 1.65;
                }
                
                .placements-content h1 {
                  font-size: 1.75em;
                }
                
                .placements-content h2 {
                  font-size: 1.5em;
                }
                
                .placements-content h3 {
                  font-size: 1.25em;
                }
                
                .placements-content img[data-align="left"],
                .placements-content img[style*="float: left"],
                .placements-content img[data-align="right"],
                .placements-content img[style*="float: right"] {
                  float: none !important;
                  display: block !important;
                  margin: 1em auto !important;
                  max-width: 100% !important;
                }
                
                .placements-content table {
                  font-size: 0.875rem;
                }
                
                .placements-content table td,
                .placements-content table th {
                  padding: 0.5em !important;
                }
              }
            `}</style>
            {page.content ? (
              <div 
                className="placements-content"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No content available for this page.</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

