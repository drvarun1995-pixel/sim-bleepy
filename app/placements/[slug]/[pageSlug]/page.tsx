'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Loader2,
  Edit,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Ensure currentImageIndex is always within bounds
  useEffect(() => {
    if (lightboxImages.length > 0 && currentImageIndex >= lightboxImages.length) {
      setCurrentImageIndex(0);
    }
  }, [lightboxImages.length, currentImageIndex]);

  // Process HTML content to replace image URLs with view API URLs and add IDs to H2 headings
  const processImageUrls = (html: string): string => {
    if (!html) return html;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Process images
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (!src) return;

      if (!src.includes('/api/placements/images/view')) {
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
      }
      
      // Add class and data attribute for lightbox
      img.classList.add('lightbox-image');
      img.style.cursor = 'pointer';
    });

    // Process H2 headings - add IDs and scroll-margin-top
    const headings = tempDiv.querySelectorAll('h2');
    headings.forEach((heading, index) => {
      const text = heading.textContent || '';
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      heading.id = id;
      heading.style.scrollMarginTop = '120px';
    });

    return tempDiv.innerHTML;
  };

  // Generate table of contents from headings
  const generateTableOfContents = (html: string): TableOfContentsItem[] => {
    if (!html) return [];
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Only fetch H2 headings
    const headings = tempDiv.querySelectorAll('h2');
    const toc: TableOfContentsItem[] = [];
    
    headings.forEach((heading, index) => {
      const text = heading.textContent || '';
      const level = 2; // All are H2
      
      // Use existing ID if present, otherwise create one
      let id = heading.id;
      if (!id) {
        id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        heading.id = id;
      }
      
      // Ensure scroll-margin-top is set
      if (!heading.style.scrollMarginTop) {
        heading.style.scrollMarginTop = '120px';
      }
      
      toc.push({ id, text, level });
    });
    
    return toc;
  };

  // Calculate reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const scrollableDistance = documentHeight - windowHeight;
      const scrolled = scrollTop / scrollableDistance;
      
      setReadingProgress(Math.min(100, Math.max(0, scrolled * 100)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page]);

  useEffect(() => {
    if (status === 'authenticated' && slug && pageSlug) {
      fetchPageData();
      fetchUserRole();
    }
  }, [status, slug, pageSlug]);

  // Setup lightbox for images using event delegation
  useEffect(() => {
    if (!contentRef.current || !page) return;

    let cleanup: (() => void) | null = null;

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      const container = contentRef.current;
      if (!container) return;

      // Use event delegation on the content container
      const handleImageClick = (e: MouseEvent) => {
        let target = e.target as HTMLElement;
        
        // Check if clicked element is an image or inside an image
        let img = target.closest('img') as HTMLImageElement;
        
        // If target is not an img, check if it's the img itself
        if (!img && target.tagName === 'IMG') {
          img = target as HTMLImageElement;
        }
        
        if (!img || !container.contains(img)) return;

        const src = img.getAttribute('src');
        if (!src || src.includes('data:')) return;

        // Prevent other handlers from interfering - but only after we've identified it's an image
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Collect all images in content for navigation
        const allImages = container.querySelectorAll('img');
        if (!allImages || allImages.length === 0) return;

        const imageSources: string[] = [];
        allImages.forEach((image) => {
          const imageSrc = image.getAttribute('src');
          if (imageSrc && !imageSrc.includes('data:')) { // Exclude data URIs
            imageSources.push(imageSrc);
          }
        });

        const index = imageSources.indexOf(src);
        if (index !== -1) {
          setLightboxImages(imageSources);
          setCurrentImageIndex(index);
          setImageLoadError(false);
          setLightboxOpen(true);
        }
      };

      // Use capture phase to catch events before other handlers
      container.addEventListener('click', handleImageClick, { capture: true, passive: false });

      // Also add pointer cursor and direct click handler to all images as fallback
      const images = container.querySelectorAll('img');
      const directClickHandler = (e: MouseEvent) => {
        const img = e.currentTarget as HTMLImageElement;
        const src = img.getAttribute('src');
        if (!src || src.includes('data:')) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Collect all images for navigation
        const allImages = container.querySelectorAll('img');
        const imageSources: string[] = [];
        allImages.forEach((image) => {
          const imageSrc = image.getAttribute('src');
          if (imageSrc && !imageSrc.includes('data:')) {
            imageSources.push(imageSrc);
          }
        });

        const index = imageSources.indexOf(src);
        if (index !== -1) {
          setLightboxImages(imageSources);
          setCurrentImageIndex(index);
          setImageLoadError(false);
          setLightboxOpen(true);
        }
      };

      images.forEach((img) => {
        (img as HTMLElement).style.cursor = 'pointer';
        if (!img.classList.contains('lightbox-image')) {
          img.classList.add('lightbox-image');
        }
        // Add direct handler as fallback
        img.addEventListener('click', directClickHandler, { capture: true });
      });

      // Store cleanup function
      cleanup = () => {
        container.removeEventListener('click', handleImageClick, { capture: true } as EventListenerOptions);
        images.forEach((img) => {
          img.removeEventListener('click', directClickHandler, { capture: true } as EventListenerOptions);
        });
      };
    }, 200);

    return () => {
      clearTimeout(timer);
      if (cleanup) {
        cleanup();
      }
    };
  }, [page]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      } else if (e.key === 'ArrowRight' && currentImageIndex < lightboxImages.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentImageIndex, lightboxImages.length]);

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
      // Remove any existing highlight
      const previousHighlight = document.querySelector('.toc-highlight');
      if (previousHighlight) {
        previousHighlight.classList.remove('toc-highlight');
      }

      // Calculate scroll position with offset
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      // Smooth scroll to heading
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Add highlight animation after a short delay
      setTimeout(() => {
        element.classList.add('toc-highlight');
        
        // Remove highlight after animation completes
        setTimeout(() => {
          element.classList.remove('toc-highlight');
        }, 2000);
      }, 500);
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
          <div className="relative w-full" style={{ height: '70vh', minHeight: '500px' }}>
            {/* Featured Image */}
            <img 
              src={featuredImageUrl} 
              alt={page.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Title and Date Overlay - Positioned at bottom */}
            <div className="absolute inset-0 z-20 flex items-end justify-center pb-8 sm:pb-12 md:pb-16 lg:pb-20">
              <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 text-center rounded-t-lg" style={{
                background: 'linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.65))',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}>
                {/* Date */}
                {page.updated_at && (
                  <div className="flex items-center justify-center gap-2 text-sm text-white mb-4">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(page.updated_at)}</span>
                  </div>
                )}

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-0">
                  {page.title}
                </h1>
              </div>
            </div>
          </div>
        ) : null}

        <div className="w-full max-w-7xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-6 flex-wrap px-4 sm:px-0">
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
            <div className="mb-8 px-4 sm:px-0">
              <div className="flex flex-wrap items-center justify-center gap-3">
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
            <div className="mb-8 px-4 sm:px-0">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  {/* Title */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    {page.title}
                  </h1>

                  {/* Date Only */}
                  {page.updated_at && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
                      <Clock className="h-4 w-4" />
                      <span>Updated {formatDate(page.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show if no featured image */}
          {!featuredImageUrl && (
            <div className="mb-8 px-4 sm:px-0">
              <div className="flex flex-wrap items-center justify-center gap-3">
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

          {/* Main Content */}
          <div className="relative">
            <div className="w-full">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-none sm:rounded-lg">
                <CardContent className="p-4 sm:p-8 lg:p-10">
                  {/* Inline Table of Contents - Collapsible Accordion */}
                  {tableOfContents.length > 0 && (
                    <div className="mb-8 rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50 overflow-hidden shadow-sm">
                      <button
                        onClick={() => setShowTOC(!showTOC)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-purple-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-purple-100 text-purple-700">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <h2 className="text-base font-semibold text-gray-900">
                            Table of Contents
                          </h2>
                          <span className="text-xs text-gray-500 font-normal">
                            ({tableOfContents.length} {tableOfContents.length === 1 ? 'item' : 'items'})
                          </span>
                        </div>
                        <ChevronDown 
                          className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                            showTOC ? 'transform rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      <div 
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          showTOC ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                        style={{
                          transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out'
                        }}
                      >
                        <nav className="px-5 pb-4 pt-2 space-y-1.5">
                          {tableOfContents.map((item, index) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                scrollToHeading(item.id);
                                // Optionally close TOC after clicking on mobile
                                if (window.innerWidth < 1024) {
                                  setTimeout(() => setShowTOC(false), 300);
                                }
                              }}
                              className="group block w-full text-left px-4 py-2.5 rounded-md text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-white hover:shadow-md hover:scale-[1.01] hover:text-purple-700 border-l-2 border-purple-300 hover:border-purple-500"
                              style={{
                                animation: showTOC ? `fadeInUp 0.3s ease-out ${index * 0.05}s both` : 'none'
                              }}
                            >
                              <span className="flex items-center gap-2.5">
                                <span className="text-purple-400 text-xs font-mono font-semibold min-w-[24px]">
                                  {String(index + 1).padStart(2, '0')}.
                                </span>
                                <span className="flex-1">{item.text}</span>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
                              </span>
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                  )}
                  
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
          scroll-margin-top: 120px;
          transition: all 0.3s ease;
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
        
        /* TOC Highlight Animation */
        .placements-content h2.toc-highlight {
          animation: highlightPulse 2s ease-in-out;
          background: linear-gradient(90deg, 
            rgba(147, 51, 234, 0.1) 0%, 
            rgba(147, 51, 234, 0.2) 50%, 
            rgba(147, 51, 234, 0.1) 100%);
          border-radius: 0.5rem;
          padding: 0.5em 0.75em;
          margin-left: -0.75em;
          margin-right: -0.75em;
          box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
        }
        
        @keyframes highlightPulse {
          0% {
            background: linear-gradient(90deg, 
              rgba(147, 51, 234, 0.3) 0%, 
              rgba(147, 51, 234, 0.4) 50%, 
              rgba(147, 51, 234, 0.3) 100%);
            box-shadow: 0 0 30px rgba(147, 51, 234, 0.5);
            transform: scale(1.02);
          }
          50% {
            background: linear-gradient(90deg, 
              rgba(147, 51, 234, 0.2) 0%, 
              rgba(147, 51, 234, 0.3) 50%, 
              rgba(147, 51, 234, 0.2) 100%);
            box-shadow: 0 0 25px rgba(147, 51, 234, 0.4);
            transform: scale(1.01);
          }
          100% {
            background: linear-gradient(90deg, 
              rgba(147, 51, 234, 0.1) 0%, 
              rgba(147, 51, 234, 0.2) 50%, 
              rgba(147, 51, 234, 0.1) 100%);
            box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
            transform: scale(1);
          }
        }
        
        /* Fade In Up Animation for TOC Items */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }
        
        /* Lightbox image hover effect */
        .lightbox-image {
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        
        .lightbox-image:hover {
          transform: scale(1.02);
          opacity: 0.9;
        }
      `}</style>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent 
          className="!max-w-[98vw] !max-h-[98vh] !w-[98vw] !h-[98vh] p-0 bg-black/95 border-0 m-0 !translate-x-[-50%] !translate-y-[-50%]"
          showCloseButton={true}
          style={{ 
            width: '98vw', 
            height: '98vh', 
            maxWidth: '98vw', 
            maxHeight: '98vh',
            top: '50%',
            left: '50%'
          }}
        >
          {/* Visually hidden title for accessibility */}
          <DialogTitle className="sr-only">
            Image Lightbox - {lightboxImages.length > 0 ? `Image ${currentImageIndex + 1} of ${lightboxImages.length}` : 'Viewing image'}
          </DialogTitle>
          
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {lightboxImages.length > 0 && currentImageIndex >= 0 && currentImageIndex < lightboxImages.length && lightboxImages[currentImageIndex] ? (
              <>
                {/* Previous Button */}
                {currentImageIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 z-30 bg-black/50 hover:bg-black/70 text-white border border-white/20 rounded-full w-12 h-12 sm:w-14 sm:h-14"
                    onClick={() => {
                      if (currentImageIndex > 0) {
                        setCurrentImageIndex(currentImageIndex - 1);
                        setImageLoadError(false);
                      }
                    }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                  </Button>
                )}

                {/* Image */}
                {!imageLoadError && lightboxImages[currentImageIndex] ? (
                <img
                    src={lightboxImages[currentImageIndex] || ''}
                  alt={`Image ${currentImageIndex + 1} of ${lightboxImages.length}`}
                  className="w-auto h-auto object-contain"
                  style={{ 
                    maxWidth: 'min(calc(98vw - 6rem), 90vw)', 
                    maxHeight: 'calc(98vh - 6rem)',
                    width: 'auto',
                    height: 'auto'
                  }}
                    onError={() => {
                      console.error('Lightbox image failed to load:', lightboxImages[currentImageIndex]);
                      setImageLoadError(true);
                    }}
                    onLoad={() => {
                      setImageLoadError(false);
                    }}
                  />
                ) : (
                  <div className="text-white text-center p-4 bg-black/50 rounded-lg">
                    <p className="mb-2">Failed to load image</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-white/50 hover:bg-white/10"
                      onClick={() => {
                        setImageLoadError(false);
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {/* Next Button */}
                {currentImageIndex < lightboxImages.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 z-30 bg-black/50 hover:bg-black/70 text-white border border-white/20 rounded-full w-12 h-12 sm:w-14 sm:h-14"
                    onClick={() => {
                      if (currentImageIndex < lightboxImages.length - 1) {
                        setCurrentImageIndex(currentImageIndex + 1);
                        setImageLoadError(false);
                      }
                    }}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                  </Button>
                )}

                {/* Image Counter */}
                {lightboxImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                    {Math.min(currentImageIndex + 1, lightboxImages.length)} / {lightboxImages.length}
                  </div>
                )}
              </>
            ) : (
              <div className="text-white text-center p-4">
                <p>No image available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
