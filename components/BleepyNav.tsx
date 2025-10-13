"use client";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/lib/useAdmin";
import { toast } from "sonner";
import { getLatestAnnouncements } from "@/lib/announcements";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  History, 
  Home,
  ChevronDown,
  Zap,
  Bell,
  Stethoscope,
  BookOpen,
  Users,
  Award,
  Play,
  BarChart3,
  Shield,
  GraduationCap,
  Microscope,
  Heart,
  Brain,
  Search,
  Globe,
  FileText,
  Video,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Calendar,
  AlignJustify,
  Download,
  MessageSquare
} from "lucide-react";

export const BleepyNav = () => {
  const pathname = usePathname();
  
  // Don't show nav on sensitive auth pages (but show on signin)
  if (pathname.startsWith('/auth/') && pathname !== '/auth/signin') {
    return null;
  }

  const { data: session, status } = useSession();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchFilter, setSearchFilter] = useState<'all' | 'station' | 'resource' | 'event'>('all');
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Dynamic latest announcements for navigation preview - gets the 2 most recent announcements
  const latestAnnouncements = getLatestAnnouncements(2);

  // Only render auth buttons after client-side mount to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Dynamic search functionality - fetches from database
  const [searchData, setSearchData] = useState<any[]>([])
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)

  const performSearch = async (query: string, filter?: 'all' | 'station' | 'resource' | 'event') => {
    setIsLoadingSearch(true);
    
    // Use the passed filter or the current state
    const activeFilter = filter || searchFilter;
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      
      if (data.data) {
        // Filter out admin-only items if user is not admin
        let filtered = data.data.filter((item: any) => !item.adminOnly || isAdmin);
        
        // Apply search filter
        if (activeFilter !== 'all') {
          filtered = filtered.filter((item: any) => item.type === activeFilter);
        }
        
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (query.length > 0) {
      // Debounce search by 300ms
      const timeout = setTimeout(() => {
        performSearch(query, searchFilter);
      }, 300);
      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
    }
  };

  const handleFilterChange = (filter: 'all' | 'station' | 'resource' | 'event') => {
    setSearchFilter(filter);
    if (searchQuery.length > 0) {
      performSearch(searchQuery, filter);
    }
  };

  const openSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchFilter('all');
    
    // Clear any pending search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearch();
      }
    };
    if (isSearchOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isSearchOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleDropdownHover = (dropdown: string) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setActiveDropdown(dropdown);
  };

  const handleDropdownLeave = () => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 300);
    setHoverTimeout(timeout);
  };

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Bleepy navigation menu structure
  const productsMenu = [
    {
      title: "Clinical Training",
      items: [
        { name: "OSCE Stations", description: "Interactive clinical scenarios", href: "/stations", icon: Stethoscope, color: "text-blue-600" },
        { name: "Assessment Tools", description: "Comprehensive evaluation", href: "/dashboard/overview", icon: Target, color: "text-green-600" }
      ]
    },
    {
      title: "Learning Platform",
      items: [
        { name: "Progress Tracking", description: "Monitor your development", href: "/dashboard", icon: TrendingUp, color: "text-orange-600" },
        { name: "Performance Analytics", description: "Detailed insights", href: "/dashboard/progress", icon: BarChart3, color: "text-indigo-600" },
        { name: "Certification Prep", description: "Exam readiness", href: "/dashboard", icon: Award, color: "text-yellow-600" }
      ]
    }
  ];

  const solutionsMenu = [
    {
      title: "Medical Education",
      items: [
        { name: "Medical Schools", description: "Curriculum integration", href: "/getting-started", icon: GraduationCap, color: "text-blue-600" },
        { name: "Residency Programs", description: "Specialized training", href: "/getting-started", icon: Users, color: "text-purple-600" },
        { name: "Continuing Education", description: "Professional development", href: "/events", icon: BookOpen, color: "text-green-600" }
      ]
    },
    {
      title: "Healthcare Organizations",
      items: [
        { name: "Hospitals", description: "Staff training programs", href: "/getting-started", icon: Heart, color: "text-red-600" },
        { name: "Clinics", description: "Practice improvement", href: "/getting-started", icon: Microscope, color: "text-teal-600" },
        { name: "Research Centers", description: "Clinical studies", href: "/getting-started", icon: Brain, color: "text-indigo-600" }
      ]
    }
  ];

  const resourcesMenu = [
    {
      title: "Downloads",
      items: [
        { name: "Study Materials", description: "Access resources", href: "/downloads", icon: BookOpen, color: "text-green-600" }
      ]
    },
    {
      title: "Documentation",
      items: [
        { name: "About Us", description: "Meet our founders", href: "/about", icon: Users, color: "text-green-600" },
        { name: "Getting Started", description: "Quick setup guide", href: "/getting-started", icon: Play, color: "text-blue-600" },
        { name: "Tutorials", description: "Step-by-step guides", href: "/tutorials", icon: Video, color: "text-purple-600" }
      ]
    }
  ];

  const announcements = [
    {
      title: "New AI Patient Scenarios",
      description: "Enhanced realism with advanced AI",
      date: "12/15/24",
      color: "from-blue-500 to-purple-500"
    },
    {
      title: "OSCE Exam Integration",
      description: "Direct integration with exam systems",
      date: "12/10/24", 
      color: "from-green-500 to-teal-500"
    }
  ];

  return (
    <>
      {/* Bleepy Navigation */}
      <nav className="w-full border-b" style={{ backgroundColor: '#171717', borderColor: '#B8C5D1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 group">
              <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy" className="max-w-[70px] lg:w-8 lg:h-8 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xl font-bold text-white hidden lg:block">Bleepy</span>
            </Link>
            
            {/* Desktop Navigation - Bleepy Style */}
            <div className="hidden lg:flex items-center space-x-1" ref={dropdownRef}>
              {/* Products Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('products')}
                  onMouseEnter={() => handleDropdownHover('products')}
                  onMouseLeave={handleDropdownLeave}
                  className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeDropdown === 'products' ? 'text-[#48C9B0]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <span>Products</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'products' ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`absolute top-full left-0 mt-2 w-[800px] bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-6 z-50 transition-all duration-300 transform ${
                    activeDropdown === 'products' 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                  }`}
                  onMouseEnter={() => handleDropdownHover('products')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className="px-6">
                    <div className="grid grid-cols-2 gap-8">
                      {productsMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
                          <div className="space-y-4">
                            {section.items.map((item, itemIndex) => (
                              <Link
                                key={itemIndex}
                                href={item.href}
                                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <item.icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                                <div>
                                  <div className="text-sm font-medium text-white">{item.name}</div>
                                  <div className="text-xs text-gray-400">{item.description}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Bleepy Announcements Section - Show to everyone */}
                    <div className="mt-8 pt-6 border-t border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">Latest Bleepy Updates</h3>
                        <Link href="/bleepy-announcements" className="text-sm text-white hover:text-gray-300 flex items-center">
                          View More <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {latestAnnouncements.length > 0 ? (
                          latestAnnouncements.map((announcement, index) => {
                            const gradientColors = [
                              'from-blue-500 to-purple-500',
                              'from-green-500 to-teal-500',
                              'from-orange-500 to-red-500',
                              'from-indigo-500 to-blue-500'
                            ];
                            const gradient = gradientColors[index % gradientColors.length];
                            
                            return (
                              <div key={announcement.id} className={`bg-gradient-to-r ${gradient} rounded-lg p-4 hover:scale-105 transition-transform duration-200`}>
                                <div className="text-sm font-medium text-white mb-1 line-clamp-2">
                                  {announcement.title}
                                </div>
                                <div className="text-xs text-white/80 line-clamp-2">
                                  {announcement.content}
                                </div>
                                <div className="text-xs text-white/60 mt-2">
                                  {new Date(announcement.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <>
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4">
                              <div className="text-sm font-medium text-white mb-1">Enhanced Search Experience</div>
                              <div className="text-xs text-white/80">Smart filters and better search functionality</div>
                              <div className="text-xs text-white/60 mt-2">Oct 15, 2025</div>
                            </div>
                            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4">
                              <div className="text-sm font-medium text-white mb-1">New Announcements System</div>
                              <div className="text-xs text-white/80">Better communication and targeted messaging</div>
                              <div className="text-xs text-white/60 mt-2">Oct 8, 2025</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solutions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('solutions')}
                  onMouseEnter={() => handleDropdownHover('solutions')}
                  onMouseLeave={handleDropdownLeave}
                  className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeDropdown === 'solutions' ? 'text-[#48C9B0]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <span>Solutions</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'solutions' ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`absolute top-full left-0 mt-2 w-[600px] bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-6 z-50 transition-all duration-300 transform ${
                    activeDropdown === 'solutions' 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                  }`}
                  onMouseEnter={() => handleDropdownHover('solutions')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className="px-6">
                    <div className="grid grid-cols-2 gap-8">
                      {solutionsMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
                          <div className="space-y-4">
                            {section.items.map((item, itemIndex) => (
                              <Link
                                key={itemIndex}
                                href={item.href}
                                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <item.icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                                <div>
                                  <div className="text-sm font-medium text-white">{item.name}</div>
                                  <div className="text-xs text-gray-400">{item.description}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('resources')}
                  onMouseEnter={() => handleDropdownHover('resources')}
                  onMouseLeave={handleDropdownLeave}
                  className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeDropdown === 'resources' ? 'text-[#48C9B0]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <span>Resources</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`absolute top-full left-0 mt-2 w-[500px] bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-6 z-50 transition-all duration-300 transform ${
                    activeDropdown === 'resources' 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                  }`}
                  onMouseEnter={() => handleDropdownHover('resources')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className="px-6">
                    <div className="grid grid-cols-2 gap-8">
                      {resourcesMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
                          <div className="space-y-4">
                            {section.items.map((item, itemIndex) => (
                              <Link
                                key={itemIndex}
                                href={item.href}
                                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <item.icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                                <div>
                                  <div className="text-sm font-medium text-white">{item.name}</div>
                                  <div className="text-xs text-gray-400">{item.description}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - User Menu & Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden sm:flex text-white hover:text-[#B8C5D1]"
                onClick={openSearch}
              >
                <Search className="h-5 w-5" />
              </Button>

              <div suppressHydrationWarning className="flex items-center">
                {!isMounted ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="hidden sm:block">
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ) : session ? (
                  <div className="flex items-center space-x-3">
                    {/* User Menu */}
                    <div className="hidden sm:flex items-center space-x-2">
                      <Link href="/dashboard">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`${
                            pathname === '/dashboard' 
                              ? 'text-[#48C9B0] bg-[#48C9B0]/10 border border-[#48C9B0]/20' 
                              : 'text-white hover:text-[#B8C5D1]'
                          }`}
                        >
                          Dashboard
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Link href="/admin">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                          className={`${
                            pathname === '/admin' 
                              ? 'text-[#48C9B0] bg-[#48C9B0]/10 border border-[#48C9B0]/20' 
                              : 'text-white hover:text-[#B8C5D1]'
                          }`}
                          >
                            Admin
                          </Button>
                        </Link>
                      )}
                      <Button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-[#B8C5D1]"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>

                  </div>
                ) : (
                  <>
                    <div className="hidden lg:flex items-center space-x-4">
                      <Link href="/auth/signin">
                        <Button className="text-white" style={{ backgroundColor: '#FF6B6B' }}>
                          Log In
                        </Button>
                      </Link>
                      <Link href="/auth/signin?mode=signup">
                        <Button variant="outline" className="bg-white text-[#171717] hover:bg-[#FEF9E7] border-white">
                          Sign Up Free
                        </Button>
                      </Link>
                    </div>

                    {/* Mobile Get Started Button for logged-out users */}
                    <div className="lg:hidden flex items-center">
                      <Link href="/auth/signin?mode=signup">
                        <Button className="text-white mr-3" style={{ backgroundColor: '#FF6B6B' }}>
                          <Zap className="h-4 w-4 mr-2" />
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Navigation Buttons */}
              <div className="lg:hidden flex items-center space-x-2">
                {/* Search Button - Only for logged in users */}
                {session && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-[#5D6D7E]"
                    style={{ width: '48px', height: '48px' }}
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="h-6 w-6" style={{ strokeWidth: '2.5' }} />
                  </Button>
                )}
                
                {/* Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-[#5D6D7E]"
                  style={{ width: '48px', height: '48px' }}
                  onClick={toggleMenu}
                >
                  {isMenuOpen ? <X className="h-7 w-7" style={{ strokeWidth: '2.5' }} /> : <AlignJustify className="h-7 w-7" style={{ strokeWidth: '2.5' }} />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className={`absolute top-0 right-0 h-full w-full max-w-sm border-l shadow-2xl transform transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`} style={{ backgroundColor: '#171717', borderColor: '#B8C5D1' }}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-end p-4 border-b" style={{ borderColor: '#B8C5D1' }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#B8C5D1] hover:text-white hover:bg-[#5D6D7E]"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                  {/* User Profile Section - Moved to Top */}
                  {session ? (
                    <div className="space-y-4">
                      {/* User Profile */}
                      <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                          {session.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-white">{session.user?.name}</div>
                          <div className="text-sm truncate text-blue-200">{session.user?.email}</div>
                        </div>
                      </div>
                      
                      {/* User Actions */}
                      <div className="space-y-2">
                        <Link 
                          href="/dashboard" 
                          onClick={() => setIsMenuOpen(false)} 
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                            pathname.includes('/dashboard')
                              ? 'bg-blue-500/20 border-2 border-blue-400/50 shadow-lg'
                              : 'hover:bg-gray-800/50 border border-transparent'
                          }`}
                          style={{ 
                            color: pathname.includes('/dashboard') ? '#60a5fa' : '#d1d5db',
                            backgroundColor: pathname.includes('/dashboard') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                          }}
                        >
                          <User className={`w-5 h-5 ${pathname.includes('/dashboard') ? 'text-blue-400' : 'group-hover:scale-110'} transition-transform duration-200`} />
                          <span className="font-medium">Dashboard</span>
                          {pathname.includes('/dashboard') && <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
                        </Link>
                        
                        {isAdmin && (
                          <Link 
                            href="/admin" 
                            onClick={() => setIsMenuOpen(false)} 
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                              pathname.includes('/admin')
                                ? 'bg-green-500/20 border-2 border-green-400/50 shadow-lg'
                                : 'hover:bg-gray-800/50 border border-transparent'
                            }`}
                            style={{ 
                              color: pathname.includes('/admin') ? '#4ade80' : '#d1d5db',
                              backgroundColor: pathname.includes('/admin') ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                            }}
                          >
                            <Settings className={`w-5 h-5 ${pathname.includes('/admin') ? 'text-green-400' : 'group-hover:scale-110'} transition-transform duration-200`} />
                            <span className="font-medium">Admin</span>
                            {pathname.includes('/admin') && <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                          </Link>
                        )}
                        
                        <button
                          onClick={() => {
                            signOut({ callbackUrl: "/" });
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm hover:bg-red-600/20 hover:border-red-500/30 border border-transparent transition-all duration-200 w-full group"
                          style={{ color: '#d1d5db' }}
                        >
                          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border-white/20 hover:border-white/40 hover:bg-white/10">
                          <User className="w-4 h-4 mr-2" />
                          Log In
                        </Button>
                      </Link>
                      <Link href="/auth/signin?mode=signup" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" style={{ backgroundColor: '#FF6B6B' }}>
                          <Zap className="w-4 h-4 mr-2" />
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Divider */}
                  {session && (
                    <div className="border-t border-gray-600/50 pt-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Navigation</div>
                    </div>
                  )}

                  {/* Products Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Products</div>
                    {productsMenu[0].items.map((item, index) => {
                      const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={index}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                            isActive 
                              ? 'bg-blue-500/10 border border-blue-400/30 shadow-md' 
                              : 'hover:bg-gray-800 border border-transparent'
                          }`}
                          style={{ 
                            color: isActive ? '#60a5fa' : '#d1d5db',
                            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                          }}
                        >
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : item.color} ${!isActive ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
                          <div className="flex-1">
                            <div className="font-medium" style={{ color: isActive ? '#60a5fa' : '#ffffff' }}>{item.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.description}</div>
                          </div>
                          {isActive && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Solutions Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Solutions</div>
                    {solutionsMenu[0].items.map((item, index) => {
                      const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={index}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                            isActive 
                              ? 'bg-green-500/10 border border-green-400/30 shadow-md' 
                              : 'hover:bg-gray-800 border border-transparent'
                          }`}
                          style={{ 
                            color: isActive ? '#4ade80' : '#d1d5db',
                            backgroundColor: isActive ? 'rgba(34, 197, 94, 0.05)' : 'transparent'
                          }}
                        >
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-green-400' : item.color} ${!isActive ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
                          <div className="flex-1">
                            <div className="font-medium" style={{ color: isActive ? '#4ade80' : '#ffffff' }}>{item.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.description}</div>
                          </div>
                          {isActive && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Resources Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Resources</div>
                    {resourcesMenu.map((section, sectionIndex) => (
                      <div key={sectionIndex}>
                        {section.items.map((item, index) => {
                          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                          return (
                            <Link
                              key={index}
                              href={item.href}
                              onClick={() => setIsMenuOpen(false)}
                              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                                isActive 
                                  ? 'bg-purple-500/10 border border-purple-400/30 shadow-md' 
                                  : 'hover:bg-gray-800 border border-transparent'
                              }`}
                              style={{ 
                                color: isActive ? '#a78bfa' : '#d1d5db',
                                backgroundColor: isActive ? 'rgba(147, 51, 234, 0.05)' : 'transparent'
                              }}
                            >
                              <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : item.color} ${!isActive ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
                              <div className="flex-1">
                                <div className="font-medium" style={{ color: isActive ? '#a78bfa' : '#ffffff' }}>{item.name}</div>
                                <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.description}</div>
                              </div>
                              {isActive && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={closeSearch}>
          <div className="flex items-start justify-center pt-8 sm:pt-20 px-2 sm:px-4">
            <div 
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 mx-2 sm:mx-0 animate-in slide-in-from-top-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50/30 to-blue-50/30">
                <div className="flex items-center flex-1 bg-white rounded-2xl border-2 border-gray-200 shadow-lg focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-100 focus-within:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 ml-2 mr-2">
                    <Search className="h-6 w-6 text-purple-500" />
                  </div>
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search stations, resources..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="flex-1 text-sm sm:text-base lg:text-lg border-none outline-none placeholder-gray-500 placeholder:text-xs sm:placeholder:text-sm lg:placeholder:text-base py-3 sm:py-4 bg-transparent font-medium"
                    autoFocus
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeSearch}
                  className="ml-4 text-gray-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0 h-12 w-12 rounded-2xl transition-all duration-200 border-2 border-gray-200 hover:border-red-300 hover:shadow-md"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Search Filters */}
              {searchQuery.length > 0 && (
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Filter by type:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange('all')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                        searchFilter === 'all'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleFilterChange('station')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                        searchFilter === 'station'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      <Stethoscope className="h-3 w-3" />
                      Stations
                    </button>
                    <button
                      onClick={() => handleFilterChange('resource')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                        searchFilter === 'resource'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-green-50 hover:border-green-300'
                      }`}
                    >
                      <FileText className="h-3 w-3" />
                      Resources
                    </button>
                    <button
                      onClick={() => handleFilterChange('event')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                        searchFilter === 'event'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      Events
                    </button>
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="max-h-80 sm:max-h-96 overflow-y-auto overflow-x-hidden search-results-container">
                {searchQuery.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Search Everything</h3>
                    <p className="text-gray-500">Find stations, resources, and events instantly</p>
                  </div>
                ) : isLoadingSearch ? (
                  <div className="p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-500"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Searching...</h3>
                    <p className="text-gray-500">Finding the best results for you</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-medium text-gray-600">
                        Found {searchResults.length} {searchFilter !== 'all' ? searchFilter : 'results'}
                        {searchFilter !== 'all' && <span className="text-gray-400"> ({searchFilter})</span>}
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    {searchResults.map((item, index) => {
                      const IconComponent = item.icon === 'Stethoscope' ? Stethoscope :
                                          item.icon === 'BarChart3' ? BarChart3 :
                                          item.icon === 'History' ? History :
                                          item.icon === 'Target' ? Target :
                                          item.icon === 'Heart' ? Heart :
                                          item.icon === 'Users' ? Users :
                                          item.icon === 'FileText' ? FileText :
                                          item.icon === 'Calendar' ? Calendar :
                                          Stethoscope; // default
                      
                      // Handle resource downloads with custom click handler
                      if (item.type === 'resource') {
                        return (
                          <div
                            key={index}
                            onClick={(e) => {
                              e.preventDefault();
                              // Show download message
                              toast.info('Preparing download...', {
                                description: item.title,
                                duration: 2000,
                              });
                              
                              // Trigger download
                              setTimeout(() => {
                                window.open(item.href, '_blank');
                                toast.success('Download started!', {
                                  description: `${item.title} is now downloading`,
                                  duration: 3000,
                                });
                              }, 500);
                              
                              closeSearch();
                            }}
                            className="group flex items-center p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-green-50 transition-all duration-200 border border-transparent hover:border-green-100 hover:shadow-sm cursor-pointer"
                          >
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center mr-4 group-hover:from-green-100 group-hover:to-green-100 transition-all duration-200">
                              <IconComponent className="h-6 w-6 text-gray-600 group-hover:text-green-600 transition-colors duration-200" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 group-hover:text-green-900 transition-colors duration-200">{item.title}</h3>
                              <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200 mt-1">{item.description}</p>
                              <div className="mt-2">
                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Study Resource
                                </span>
                              </div>
                            </div>
                            <Download className="h-5 w-5 text-gray-400 group-hover:text-green-500 group-hover:scale-110 transition-all duration-200 flex-shrink-0" />
                          </div>
                        );
                      }
                      
                      // Regular Link for non-resources
                      return (
                        <Link
                          key={index}
                          href={item.href}
                          onClick={closeSearch}
                          className="group flex items-center p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 border border-transparent hover:border-purple-100 hover:shadow-sm"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center mr-4 group-hover:from-purple-100 group-hover:to-blue-100 transition-all duration-200">
                            <IconComponent className="h-6 w-6 text-gray-600 group-hover:text-purple-600 transition-colors duration-200" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-900 transition-colors duration-200">{item.title}</h3>
                            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200 mt-1">{item.description}</p>
                            <div className="mt-2">
                              {item.type === 'station' && (
                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  Clinical Station
                                </span>
                              )}
                              {item.type === 'event' && (
                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Teaching Event
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No results found</h3>
                    <p className="text-gray-500 mb-4">
                      We couldn't find any {searchFilter !== 'all' ? searchFilter : 'items'} for "{searchQuery}"
                    </p>
                    <div className="text-sm text-gray-400">
                      {searchFilter === 'all' ? (
                        <>Try searching for: <span className="font-medium text-blue-600">stations</span>, <span className="font-medium text-green-600">resources</span>, or <span className="font-medium text-purple-600">events</span></>
                      ) : (
                        <>Try a different search term or switch to "All" to see all results</>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {searchQuery.length === 0 && (
                <div className="p-6 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    <p className="text-sm font-semibold text-gray-800">Quick Actions</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Link href="/stations" onClick={closeSearch} className="block">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-14 sm:h-20 text-gray-700 hover:text-blue-700 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 hover:border-blue-200 hover:shadow-lg border border-gray-200 rounded-xl sm:rounded-2xl transition-all duration-300 group p-3 sm:p-4 bg-white shadow-sm"
                      >
                        <div className="flex flex-row sm:flex-col items-center justify-center space-x-3 sm:space-x-0 sm:space-y-2 w-full h-full">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                            <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          </div>
                          <div className="text-center sm:text-center">
                            <div className="font-semibold text-sm text-gray-800 group-hover:text-blue-800">Clinical Stations</div>
                            <div className="text-xs text-gray-500 group-hover:text-blue-600 hidden sm:block">Practice scenarios</div>
                          </div>
                        </div>
                      </Button>
                    </Link>
                    <Link href="/calendar" onClick={closeSearch} className="block">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-14 sm:h-20 text-gray-700 hover:text-purple-700 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 hover:border-purple-200 hover:shadow-lg border border-gray-200 rounded-xl sm:rounded-2xl transition-all duration-300 group p-3 sm:p-4 bg-white shadow-sm"
                      >
                        <div className="flex flex-row sm:flex-col items-center justify-center space-x-3 sm:space-x-0 sm:space-y-2 w-full h-full">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                          </div>
                          <div className="text-center sm:text-center">
                            <div className="font-semibold text-sm text-gray-800 group-hover:text-purple-800">Teaching Events</div>
                            <div className="text-xs text-gray-500 group-hover:text-purple-600 hidden sm:block">Live sessions</div>
                          </div>
                        </div>
                      </Button>
                    </Link>
                    <Link href="/downloads" onClick={closeSearch} className="block">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-14 sm:h-20 text-gray-700 hover:text-green-700 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:border-green-200 hover:shadow-lg border border-gray-200 rounded-xl sm:rounded-2xl transition-all duration-300 group p-3 sm:p-4 bg-white shadow-sm"
                      >
                        <div className="flex flex-row sm:flex-col items-center justify-center space-x-3 sm:space-x-0 sm:space-y-2 w-full h-full">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:from-green-200 group-hover:to-green-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          </div>
                          <div className="text-center sm:text-center">
                            <div className="font-semibold text-sm text-gray-800 group-hover:text-green-800">Study Resources</div>
                            <div className="text-xs text-gray-500 group-hover:text-green-600 hidden sm:block">Download materials</div>
                          </div>
                        </div>
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
};
