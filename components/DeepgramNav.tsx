"use client";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  CheckCircle
} from "lucide-react";

export const DeepgramNav = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Don't show nav on sensitive auth pages (but show on signin)
  if (pathname.startsWith('/auth/') && pathname !== '/auth/signin') {
    return null;
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const response = await fetch('/api/admin/check');
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    };
    checkAdminStatus();
  }, [status, session]);

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
        { name: "AI Patient Interactions", description: "Realistic patient conversations", href: "/demo", icon: Brain, color: "text-purple-600" },
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
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: '#2C3E50', borderColor: '#B8C5D1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 group">
              <img src="/bleepy-logo.svg" alt="Bleepy Simulator" className="max-w-[70px] lg:w-8 lg:h-8 group-hover:scale-110 transition-transform duration-300" />
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

              {/* Simple Links */}
              <Link href="/pricing" className="px-4 py-2 text-sm font-medium text-white hover:text-[#B8C5D1] transition-all duration-300">
                Pricing
              </Link>
            </div>

            {/* Right Side - User Menu & Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <Button variant="ghost" size="icon" className="hidden sm:flex text-white hover:text-[#B8C5D1]">
                <Search className="h-5 w-5" />
              </Button>

              {status === "loading" ? (
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
                  </div>

                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-4">
                  <Link href="/auth/signin">
                    <Button variant="ghost" className="text-white hover:text-[#B8C5D1]">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button className="text-white" style={{ backgroundColor: '#FF6B6B' }}>
                      Get A Demo
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button variant="outline" className="bg-white text-[#2C3E50] hover:bg-[#FEF9E7] border-white">
                      Sign Up Free
                    </Button>
                  </Link>
                </div>
              )}

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
          }`} style={{ backgroundColor: '#2C3E50', borderColor: '#B8C5D1' }}>
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

      {/* Spacer for fixed navigation */}
      <div className="h-16"></div>

    </>
  );
};
