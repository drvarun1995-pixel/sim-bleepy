'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2,
  Edit,
  FileText,
  ChevronRight,
  Stethoscope,
  Share2,
  Clock,
  Calendar,
  BookOpen,
  Menu,
  X,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';

interface SpecialtyPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
  featured_image?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  categories?: Array<{ id: string; name: string; slug: string; color?: string }>;
}

interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
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
  const [relatedPages, setRelatedPages] = useState<SpecialtyPage[]>([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [showTOC, setShowTOC] = useState(false);
  const [copied, setCopied] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);

  // Process HTML content to replace image URLs with view API URLs
  const processImageUrls = (html: string): string => {
    if (!html) return html;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (!src) return;

      if (src.includes('/api/placements/images/view')) {
        return;
      }

      let storagePath = '';
      
      if (src.includes('/storage/v1/object/')) {
        const pathMatch = src.match(/\/storage\/v1\/object\/(?:public|sign)\/placements\/(.+?)(?:\?|$)/);
        if (pathMatch) {
          storagePath = decodeURIComponent(pathMatch[1]);
        }
      } else if (src.includes('/placements/') || src.includes('placements/')) {
        const pathMatch = src.match(/(?:placements\/|placements%2F)(.+?)(?:\?|$)/);
        if (pathMatch) {
          storagePath = decodeURIComponent(pathMatch[1].replace(/%2F/g, '/'));
        }
      } else if (src.startsWith('rheumatology/') || src.includes('/images/')) {
        storagePath = src;
      }

      if (storagePath) {
        img.setAttribute('src', `/api/placements/images/view?path=${encodeURIComponent(storagePath)}`);
      }
    });

    return tempDiv.innerHTML;
  };

  // Generate table of contents from headings
  const generateTableOfContents = (html: string): TableOfContentsItem[] => {
    if (!html) return [];
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc: TableOfContentsItem[] = [];
    
    headings.forEach((heading, index) => {
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      
      heading.id = id;
      toc.push({ id, text, level });
    });
    
    return toc;
  };

  // Calculate reading progress and parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      
      const scrollableDistance = documentHeight - windowHeight;
      const scrolled = scrollTop / scrollableDistance;
      
      setReadingProgress(Math.min(100, Math.max(0, scrolled * 100)));

      // Parallax effect for hero image
      if (heroImageRef.current && featuredImageUrl) {
        const heroRect = heroImageRef.current.getBoundingClientRect();
        const heroTop = heroRect.top;
        const heroHeight = heroRect.height;
        
        // Only apply parallax when image is visible in viewport
        if (heroTop < window.innerHeight && heroTop + heroHeight > 0) {
          // Parallax speed factor (0.3 = moves at 30% of scroll speed)
          const parallaxSpeed = 0.3;
          // Calculate offset based on how much we've scrolled past the hero
          const scrollPastHero = Math.max(0, window.innerHeight - heroTop);
          const offset = scrollPastHero * parallaxSpeed;
          setParallaxOffset(-offset);
        } else if (heroTop + heroHeight <= 0) {
          // Image is completely scrolled past, keep it at max offset
          setParallaxOffset(-heroHeight * 0.3);
        } else {
          // Image hasn't been reached yet
          setParallaxOffset(0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, featuredImageUrl]);

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
      
      const specialtyResponse = await fetch('/api/placements/specialties');
      if (specialtyResponse.ok) {
        const specialtyData = await specialtyResponse.json();
        const foundSpecialty = specialtyData.specialties.find((s: any) => s.slug === slug);
        if (foundSpecialty) {
          setSpecialtyName(foundSpecialty.name);
        }
      }

      const specialtyResponse2 = await fetch('/api/placements/specialties');
      if (!specialtyResponse2.ok) throw new Error('Failed to fetch specialties');
      const specialtyData2 = await specialtyResponse2.json();
      const foundSpecialty2 = specialtyData2.specialties.find((s: any) => s.slug === slug);
      
      if (!foundSpecialty2) {
        toast.error('Specialty not found');
        router.push('/placements');
        return;
      }

      // Fetch pages - only published for public view
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
        // Generate table of contents
        const toc = generateTableOfContents(foundPage.content);
        setTableOfContents(toc);
      }

      // Load featured image
      if (foundPage.featured_image) {
        setFeaturedImageUrl(`/api/placements/images/view?path=${encodeURIComponent(foundPage.featured_image)}`);
      }
      
      setPage(foundPage);

      // Fetch related pages (other pages from same specialty, excluding current)
      const otherPages = pagesData.pages
        .filter((p: SpecialtyPage) => p.id !== foundPage.id && p.status === 'published')
        .slice(0, 3);
      setRelatedPages(otherPages);
    } catch (error) {
      console.error('Error fetching page data:', error);
      toast.error('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: page?.title || '',
          text: `Check out this page: ${page?.title}`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setShowTOC(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <LoadingScreen message="Loading page..." />
    );
  }

  if (!page) {
    return (
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="w-full">
        {/* Hero Section with Featured Image - Full Width */}
        {featuredImageUrl ? (
          <div className="mb-8 w-full">
            <div 
              ref={heroImageRef}
              className="relative w-full h-[60vh] min-h-[400px] max-h-[700px] overflow-hidden"
            >
              <div 
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: `translateY(${parallaxOffset}px)`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <img 
                  src={featuredImageUrl} 
                  alt={page.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 z-10 pointer-events-none" />
              
              {/* Title and Metadata Overlay */}
              <div className="absolute bottom-0 left-0 right-0 z-20">
                {/* Background overlay for better separation */}
                <div className="bg-gradient-to-t from-black/50 via-black/30 to-black/10 backdrop-blur-sm">
                  <div className="p-6 sm:p-8 md:p-10 lg:p-12">
                    <div className="max-w-4xl mx-auto">
                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        {specialtyName && (
                          <Badge variant="outline" className="px-3 py-1.5 bg-white/95 backdrop-blur-sm border-white/30 text-purple-900 shadow-lg">
                            <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                            {specialtyName}
                          </Badge>
                        )}
                        
                        {page.categories && page.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {page.categories.map((category) => (
                              <Badge 
                                key={category.id}
                                variant="outline"
                                className="px-2.5 py-1 text-xs bg-white/95 backdrop-blur-sm border-white/30 shadow-lg"
                                style={{
                                  color: category.color || '#374151'
                                }}
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {page.updated_at && (
                          <div className="flex items-center gap-1.5 text-sm text-white/95 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-lg">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(page.updated_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-0 leading-tight drop-shadow-2xl">
                        {page.title}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-6 flex-wrap">
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

          {/* Action Buttons - Show below hero if featured image exists */}
          {featuredImageUrl && (
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/placements/${slug}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Back to {specialtyName || 'Specialty'}</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </>
                  )}
                </Button>

                {tableOfContents.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTOC(!showTOC)}
                    className="border-gray-300 hover:bg-gray-50 lg:hidden"
                  >
                    {showTOC ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Close
                      </>
                    ) : (
                      <>
                        <Menu className="h-4 w-4 mr-2" />
                        Contents
                      </>
                    )}
                  </Button>
                )}

                {['admin', 'meded_team', 'ctf'].includes(userRole) && (
                  <Link href={`/placements/${slug}/${pageSlug}/edit`}>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Page
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Header Section - No Featured Image */}
          {!featuredImageUrl && (
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  {/* Title */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    {page.title}
                  </h1>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {specialtyName && (
                      <Badge variant="outline" className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-900">
                        <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                        {specialtyName}
                      </Badge>
                    )}
                    
                    {page.categories && page.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {page.categories.map((category) => (
                          <Badge 
                            key={category.id}
                            variant="outline"
                            className="px-2.5 py-1 text-xs"
                            style={{
                              borderColor: category.color || '#e5e7eb',
                              backgroundColor: category.color ? `${category.color}15` : '#f9fafb',
                              color: category.color || '#374151'
                            }}
                          >
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {page.updated_at && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Updated {formatDate(page.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show if no featured image */}
          {!featuredImageUrl && (
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/placements/${slug}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                  >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to {specialtyName || 'Specialty'}</span>
                  <span className="sm:hidden">Back</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </>
                )}
              </Button>

              {tableOfContents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTOC(!showTOC)}
                  className="border-gray-300 hover:bg-gray-50 lg:hidden"
                >
                  {showTOC ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </>
                  ) : (
                    <>
                      <Menu className="h-4 w-4 mr-2" />
                      Contents
                    </>
                  )}
                  </Button>
                )}

                {['admin', 'meded_team', 'ctf'].includes(userRole) && (
                  <Link href={`/placements/${slug}/${pageSlug}/edit`}>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Page
                  </Button>
                </Link>
              )}
            </div>
          </div>
          )}

          {/* Desktop Table of Contents */}
          {tableOfContents.length > 0 && (
            <div className="hidden lg:block lg:absolute lg:right-0 lg:top-24 lg:w-64">
            <Card className="sticky top-24 border-gray-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Table of Contents
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <nav className="space-y-1">
                  {tableOfContents.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToHeading(item.id)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-purple-50 hover:text-purple-700 ${
                        item.level === 1 ? 'font-medium text-gray-900' :
                        item.level === 2 ? 'text-gray-700 pl-4' :
                        'text-gray-600 pl-6 text-xs'
                      }`}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </CardContent>
              </Card>
            </div>
          )}

          {/* Mobile Table of Contents */}
          {showTOC && tableOfContents.length > 0 && (
            <Card className="mb-6 lg:hidden border-gray-200 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Table of Contents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <nav className="space-y-1 max-h-64 overflow-y-auto">
                {tableOfContents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-purple-50 hover:text-purple-700 ${
                      item.level === 1 ? 'font-medium text-gray-900' :
                      item.level === 2 ? 'text-gray-700 pl-4' :
                      'text-gray-600 pl-6 text-xs'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <div className="relative">
            <div className={`w-full ${tableOfContents.length > 0 ? 'lg:pr-72' : ''}`}>
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8 lg:p-10">
                <div 
                  ref={contentRef}
                  className="placements-content prose prose-lg prose-purple max-w-none"
                  dangerouslySetInnerHTML={{ __html: page.content || '' }}
                />
              </CardContent>
              </Card>

              {/* Related Pages */}
              {relatedPages.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Related Pages
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedPages.map((relatedPage) => (
                    <Link 
                      key={relatedPage.id}
                      href={`/placements/${slug}/${relatedPage.slug}`}
                      className="group"
                    >
                      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-gray-200">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-2 line-clamp-2">
                            {relatedPage.title}
                          </h3>
                          {relatedPage.content && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {relatedPage.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                            </p>
                          )}
                          <div className="mt-3 flex items-center text-sm text-purple-600 group-hover:text-purple-700">
                            Read more
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Styles */}
      <style jsx global>{`
        .placements-content {
          font-size: 1.125rem;
          line-height: 1.8;
          color: #374151;
        }
        
        .placements-content h1,
        .placements-content h2,
        .placements-content h3,
        .placements-content h4,
        .placements-content h5,
        .placements-content h6 {
          font-weight: 700;
          margin-top: 2em;
          margin-bottom: 1em;
          color: #111827;
          line-height: 1.3;
          scroll-margin-top: 100px;
        }
        
        .placements-content h1 {
          font-size: 2.5em;
          border-bottom: 3px solid #e5e7eb;
          padding-bottom: 0.5em;
        }
        
        .placements-content h2 {
          font-size: 2em;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.4em;
        }
        
        .placements-content h3 {
          font-size: 1.5em;
        }
        
        .placements-content h4 {
          font-size: 1.25em;
        }
        
        .placements-content p {
          margin-top: 1.25em;
          margin-bottom: 1.25em;
        }
        
        .placements-content ul,
        .placements-content ol {
          margin-top: 1.25em;
          margin-bottom: 1.25em;
          padding-left: 2em;
        }
        
        .placements-content li {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
        }
        
        .placements-content a {
          color: #6366f1;
          text-decoration: underline;
          text-decoration-color: #c7d2fe;
          transition: all 0.2s;
          font-weight: 500;
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
          padding: 0.2em 0.4em;
          border-radius: 0.375rem;
          font-size: 0.9em;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
          color: #dc2626;
        }
        
        .placements-content pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1.5em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-top: 1.5em;
          margin-bottom: 1.5em;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .placements-content pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        
        .placements-content blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1.5em;
          margin-left: 0;
          margin-top: 1.5em;
          margin-bottom: 1.5em;
          color: #6b7280;
          font-style: italic;
          background-color: #f9fafb;
          padding: 1em 1.5em;
          border-radius: 0.5rem;
        }
        
        .placements-content hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin-top: 3em;
          margin-bottom: 3em;
        }
        
        .placements-content table {
          border-collapse: collapse !important;
          margin: 2em 0 !important;
          width: 100% !important;
          border: 2px solid #e5e7eb !important;
          background-color: #ffffff !important;
          display: block;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        
        .placements-content table td,
        .placements-content table th {
          border: 1px solid #e5e7eb !important;
          padding: 0.875em !important;
          min-width: 50px !important;
          min-height: 40px !important;
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
          margin: 2em 0 !important;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .placements-content img[data-align="center"],
        .placements-content img[style*="display: block"][style*="margin: 0.5em auto"] {
          display: block !important;
          margin: 2em auto !important;
          text-align: center !important;
        }
        
        .placements-content img[data-align="left"],
        .placements-content img[style*="float: left"] {
          float: left !important;
          margin: 0.5em 1.5em 0.5em 0 !important;
          clear: left !important;
          max-width: 50% !important;
        }
        
        .placements-content img[data-align="right"],
        .placements-content img[style*="float: right"] {
          float: right !important;
          margin: 0.5em 0 0.5em 1.5em !important;
          clear: right !important;
          max-width: 50% !important;
        }
        
        .placements-content img[style*="text-align: center"] {
          display: block !important;
          margin: 2em auto !important;
        }
        
        @media (max-width: 1024px) {
          .placements-content {
            font-size: 1rem;
            line-height: 1.75;
          }
        }
        
        @media (max-width: 640px) {
          .placements-content {
            font-size: 0.9375rem;
            line-height: 1.7;
          }
          
          .placements-content h1 {
            font-size: 2em;
          }
          
          .placements-content h2 {
            font-size: 1.75em;
          }
          
          .placements-content h3 {
            font-size: 1.5em;
          }
          
          .placements-content img[data-align="left"],
          .placements-content img[style*="float: left"],
          .placements-content img[data-align="right"],
          .placements-content img[style*="float: right"] {
            float: none !important;
            display: block !important;
            margin: 1.5em auto !important;
            max-width: 100% !important;
          }
          
          .placements-content table {
            font-size: 0.875rem;
          }
          
          .placements-content table td,
          .placements-content table th {
            padding: 0.625em !important;
          }
        }
        
        @media print {
          .placements-content {
            font-size: 12pt;
            line-height: 1.6;
          }
          
          .placements-content img {
            max-width: 100% !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
