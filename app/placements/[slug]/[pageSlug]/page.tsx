'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Loader2
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

  useEffect(() => {
    if (status === 'authenticated' && slug && pageSlug) {
      fetchPageData();
    }
  }, [status, slug, pageSlug]);

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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingScreen message="Loading page..." />
      </div>
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
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/placements/${slug}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {specialtyName || 'Specialty'}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
        </div>

        {/* Page Content */}
        <Card>
          <CardContent className="pt-6">
            {page.content ? (
              <div 
                className="prose max-w-none"
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

