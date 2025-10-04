"use client";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/lib/useAdmin";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  History, 
  Home,
  ChevronDown,
  Bell,
  HelpCircle,
  Stethoscope,
  BookOpen,
  Users,
  Award,
  Zap,
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
  Headphones,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Calendar
} from "lucide-react";

export const DeepgramNav = () => {
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
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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

  const performSearch = async (query: string) => {
    setIsLoadingSearch(true);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      
      if (data.data) {
        // Filter out admin-only items if user is not admin
        const filtered = data.data.filter((item: any) => !item.adminOnly || isAdmin);
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
        performSearch(query);
      }, 300);
      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
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

  // Deepgram-inspired menu structure
  const productsMenu = [
    {
      title: "Clinical Training",
      items: [
        { name: "OSCE Stations", description: "Interactive clinical scenarios", href: "/scenarios", icon: Stethoscope, color: "text-blue-600" },
        { name: "Assessment Tools", description: "Comprehensive evaluation", href: "/features", icon: Target, color: "text-green-600" }
      ]
    },
    {
      title: "Learning Platform",
      items: [
        { name: "Progress Tracking", description: "Monitor your development", href: "/dashboard", icon: TrendingUp, color: "text-orange-600" },
        { name: "Performance Analytics", description: "Detailed insights", href: "/history", icon: BarChart3, color: "text-indigo-600" },
        { name: "Certification Prep", description: "Exam readiness", href: "/tutorials", icon: Award, color: "text-yellow-600" }
      ]
    }
  ];

  const solutionsMenu = [
    {
      title: "Medical Education",
      items: [
        { name: "Medical Schools", description: "Curriculum integration", href: "/partners", icon: GraduationCap, color: "text-blue-600" },
        { name: "Residency Programs", description: "Specialized training", href: "/careers", icon: Users, color: "text-purple-600" },
        { name: "Continuing Education", description: "Professional development", href: "/webinars", icon: BookOpen, color: "text-green-600" }
      ]
    },
    {
      title: "Healthcare Organizations",
      items: [
        { name: "Hospitals", description: "Staff training programs", href: "/integrations", icon: Heart, color: "text-red-600" },
        { name: "Clinics", description: "Practice improvement", href: "/case-studies", icon: Microscope, color: "text-teal-600" },
        { name: "Research Centers", description: "Clinical studies", href: "/research", icon: Brain, color: "text-indigo-600" }
      ]
    }
  ];

  const resourcesMenu = [
    {
      title: "Documentation",
      items: [
        { name: "Getting Started", description: "Quick setup guide", href: "/help", icon: Play, color: "text-blue-600" },
        { name: "API Reference", description: "Technical documentation", href: "/api", icon: FileText, color: "text-gray-600" },
        { name: "Tutorials", description: "Step-by-step guides", href: "/tutorials", icon: Video, color: "text-purple-600" }
      ]
    },
    {
      title: "Support",
      items: [
        { name: "Help Center", description: "Find answers", href: "/help", icon: HelpCircle, color: "text-green-600" },
        { name: "Community", description: "Connect with peers", href: "/blog", icon: Users, color: "text-blue-600" },
        { name: "Contact Support", description: "Get assistance", href: "/contact", icon: Headphones, color: "text-orange-600" }
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
      {/* Deepgram-inspired Navigation */}
      <nav className="w-full border-b" style={{ backgroundColor: '#171717', borderColor: '#B8C5D1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 group">
              <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy Simulator" className="max-w-[70px] lg:w-8 lg:h-8 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xl font-bold text-white hidden lg:block">Bleepy Simulator</span>
            </Link>
            
            {/* Desktop Navigation - Deepgram Style */}
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
                    
                    {/* Announcements Section */}
                    <div className="mt-8 pt-6 border-t border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">Announcements</h3>
                        <Link href="/blog" className="text-sm text-white hover:text-gray-300 flex items-center">
                          View More <ChevronDown className="w-4 h-4 ml-1 rotate-[-90deg]" />
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4">
                          <div className="text-sm font-medium text-white mb-1">New AI Patient Scenarios</div>
                          <div className="text-xs text-white/80">Enhanced realism with advanced AI</div>
                          <div className="text-xs text-white/60 mt-2">Published on 12/15/24</div>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4">
                          <div className="text-sm font-medium text-white mb-1">OSCE Exam Integration</div>
                          <div className="text-xs text-white/80">Direct integration with exam systems</div>
                          <div className="text-xs text-white/60 mt-2">Published on 12/10/24</div>
                        </div>
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

              {/* Events Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('events')}
                  onMouseEnter={() => handleDropdownHover('events')}
                  onMouseLeave={handleDropdownLeave}
                  className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeDropdown === 'events' ? 'text-[#48C9B0]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <span>Events</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'events' ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-4 z-50 transition-all duration-300 transform ${
                    activeDropdown === 'events' 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                  }`}
                  onMouseEnter={() => handleDropdownHover('events')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className="px-4 space-y-2">
                    <Link 
                      href="/events"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-gray-700 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform duration-200" />
                      <div>
                        <div className="font-medium text-white">All Events</div>
                        <div className="text-xs text-gray-400">Manage all events</div>
                      </div>
                    </Link>
                    
                    {isAdmin && (
                      <Link 
                        href="/event-data"
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-gray-700 group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform duration-200" />
                        <div>
                          <div className="font-medium text-white">Event Data</div>
                          <div className="text-xs text-gray-400">Manage categories & data</div>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Simple Links */}
              <Link href="/pricing" className="px-4 py-2 text-sm font-medium text-white hover:text-[#B8C5D1] transition-all duration-300">
                Pricing
              </Link>
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

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-[#5D6D7E]"
                style={{ width: '50px', height: '50px' }}
                onClick={toggleMenu}
              >
                {isMenuOpen ? <X className="h-8 w-8" style={{ strokeWidth: '2.5' }} /> : <Menu className="h-8 w-8" style={{ strokeWidth: '2.5' }} />}
              </Button>
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
                      <Link href="/auth/signin?mode=signup" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" style={{ backgroundColor: '#FF6B6B' }}>
                          <User className="w-4 h-4 mr-2" />
                          Log In / Sign Up
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
                    {resourcesMenu[0].items.map((item, index) => {
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

                  {/* Quick Links Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Quick Links</div>
                    
                    {/* Events Section */}
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#B8C5D1' }}>Events</div>
                      
                      {/* All Events Link */}
                      <Link
                        href="/events"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group mb-2 ${
                          pathname === '/events'
                            ? 'bg-green-500/10 border border-green-400/30 shadow-md' 
                            : 'hover:bg-gray-800 border border-transparent'
                        }`}
                        style={{ 
                          color: pathname === '/events' ? '#4ade80' : '#d1d5db',
                          backgroundColor: pathname === '/events' ? 'rgba(34, 197, 94, 0.05)' : 'transparent'
                        }}
                      >
                        <Calendar className={`w-5 h-5 ${pathname === '/events' ? 'text-green-400' : 'text-white group-hover:scale-110'} transition-transform duration-200`} />
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: pathname === '/events' ? '#4ade80' : '#ffffff' }}>All Events</div>
                          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Manage all events</div>
                        </div>
                        {pathname === '/events' && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                      </Link>

                      {/* Event Data Link - Admin Only */}
                      {isAdmin && (
                        <Link
                          href="/event-data"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                            pathname === '/event-data'
                              ? 'bg-purple-500/10 border border-purple-400/30 shadow-md' 
                              : 'hover:bg-gray-800 border border-transparent'
                          }`}
                          style={{ 
                            color: pathname === '/event-data' ? '#a78bfa' : '#d1d5db',
                            backgroundColor: pathname === '/event-data' ? 'rgba(147, 51, 234, 0.05)' : 'transparent'
                          }}
                        >
                          <Settings className={`w-5 h-5 ${pathname === '/event-data' ? 'text-purple-400' : 'text-white group-hover:scale-110'} transition-transform duration-200`} />
                          <div className="flex-1">
                            <div className="font-medium" style={{ color: pathname === '/event-data' ? '#a78bfa' : '#ffffff' }}>Event Data</div>
                            <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Manage categories & data</div>
                          </div>
                          {pathname === '/event-data' && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4" style={{ borderTop: '1px solid #374151' }}>
                <Link 
                  href="/pricing" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm hover:bg-gray-800 transition-all duration-200"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="font-medium">View Pricing</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={closeSearch}>
          <div className="flex items-start justify-center pt-20 px-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200">
              {/* Search Input */}
              <div className="flex items-center p-4 border-b border-gray-200">
                <Search className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search for stations, features, or help..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 text-lg border-none outline-none placeholder-gray-400"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeSearch}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {searchQuery.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Start typing to search...</p>
                  </div>
                ) : isLoadingSearch ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-2"></div>
                    <p>Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2">
                    <div className="text-xs text-gray-400 mb-2">Found {searchResults.length} results</div>
                    {searchResults.map((item, index) => {
                      const IconComponent = item.icon === 'Stethoscope' ? Stethoscope :
                                          item.icon === 'BarChart3' ? BarChart3 :
                                          item.icon === 'History' ? History :
                                          item.icon === 'HelpCircle' ? HelpCircle :
                                          item.icon === 'Target' ? Target :
                                          item.icon === 'Heart' ? Heart :
                                          item.icon === 'Users' ? Users :
                                          Stethoscope; // default
                      
                      return (
                        <Link
                          key={index}
                          href={item.href}
                          onClick={closeSearch}
                          className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <IconComponent className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-500">{item.description}</p>
                            {item.type === 'station' && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Clinical Station
                              </span>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No results found for "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try searching for station names or "help"</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {searchQuery.length === 0 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3">Quick Actions:</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('stations');
                        handleSearch('stations');
                      }}
                      className="justify-start text-left"
                    >
                      <Stethoscope className="h-4 w-4 mr-2" />
                      View All Clinical Stations
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('dashboard');
                        handleSearch('dashboard');
                      }}
                      className="justify-start text-left"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('history');
                        handleSearch('history');
                      }}
                      className="justify-start text-left"
                    >
                      <History className="h-4 w-4 mr-2" />
                      View History
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('help');
                        handleSearch('help');
                      }}
                      className="justify-start text-left"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Get Help
                    </Button>
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
