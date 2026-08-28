"use client";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/lib/useAdmin";
import { isDashboardShellRoute } from "@/lib/isDashboardShellRoute";
import type { BleepyAnnouncement } from "@/lib/announcements";
import dynamic from "next/dynamic";
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
  MessageSquare,
  List,
  MoreVertical,
  Gamepad2,
  Mail,
  Info,
  HelpCircle,
  Trophy,
  Sparkles
} from "lucide-react";

const BleepyNavSearchModal = dynamic(
  () => import("@/components/nav/BleepyNavSearchModal").then((mod) => mod.BleepyNavSearchModal),
  { ssr: false }
);

export const BleepyNav = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navFlash, setNavFlash] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [latestAnnouncements, setLatestAnnouncements] = useState<BleepyAnnouncement[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasScrolledRef = useRef(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideNav = pathname.startsWith('/auth/') && pathname !== '/auth/signin';
  const isStaticShell = isDashboardShellRoute(pathname);
  // On FY public guides, do not compete with the article hero for LCP bandwidth.
  const demoteLogoPriority = pathname.startsWith('/guides');
  const navIsCompact = !isStaticShell && isScrolled;

  useEffect(() => {
    let cancelled = false
    const load = () => {
      void import("@/lib/announcements").then((mod) => {
        if (!cancelled) setLatestAnnouncements(mod.getLatestAnnouncements(2));
      });
    };
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(load, { timeout: 2500 });
    } else {
      timer = setTimeout(load, 1500);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const prefetch = () => {
      void import("@/components/nav/BleepyNavSearchModal");
    };
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(prefetch, { timeout: 3500 });
    } else {
      timer = setTimeout(prefetch, 2500);
    }
    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Dashboard shell pages: static full-width bar, no scroll transition
  useEffect(() => {
    if (isStaticShell) {
      document.body.classList.add("bleepy-dashboard-shell");
      setIsScrolled(false);
      setNavFlash(false);
    } else {
      document.body.classList.remove("bleepy-dashboard-shell");
    }
    return () => document.body.classList.remove("bleepy-dashboard-shell");
  }, [isStaticShell]);

  // Handle scroll effect (marketing pages only)
  useEffect(() => {
    if (isStaticShell) return;

    const handleScroll = () => {
      const scrolled = window.scrollY > 20;

      if (scrolled && !wasScrolledRef.current) {
        setNavFlash(true);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => setNavFlash(false), 700);
      }

      wasScrolledRef.current = scrolled;
      setIsScrolled(scrolled);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [isStaticShell]);

  // Lock page scroll while mobile menu is open
  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const openSearch = () => setIsSearchOpen(true);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleDropdownHover = (dropdown: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setActiveDropdown(dropdown);
  };

  const handleDropdownLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      hoverTimeoutRef.current = null;
    }, 200);
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
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Bleepy navigation menu structure - accessible to all users
  const platformMenu = [
    {
      title: "Learning & Practice",
      items: [
        { name: "Games Hub", description: "Practice & Challenge modes", href: "/games", icon: Gamepad2, color: "text-purple-600", public: true },
        { name: "OSCE Stations", description: "Interactive clinical scenarios", href: "/stations", icon: Stethoscope, color: "text-blue-600", public: true },
        { name: "Study Resources", description: "Download materials", href: "/downloads", icon: Download, color: "text-green-600", public: true }
      ]
    },
    {
      title: "Events & Calendar",
      items: [
        { name: "Teaching Calendar", description: "View all events", href: "/calendar", icon: Calendar, color: "text-indigo-600", public: true },
        { name: "Events List", description: "Browse all sessions", href: "/events-list", icon: List, color: "text-pink-600", public: true },
        { name: "Announcements", description: "Latest updates", href: "/announcements", icon: Bell, color: "text-yellow-600", public: true }
      ]
    },
    {
      title: session ? "Your Dashboard" : "Get Started",
      items: session ? [
        { name: "Dashboard", description: "Your home", href: "/dashboard", icon: Home, color: "text-blue-600", public: false },
        { name: "Progress Tracking", description: "Monitor development", href: "/dashboard/progress", icon: TrendingUp, color: "text-orange-600", public: false },
        { name: "My Certificates", description: "View achievements", href: "/mycertificates", icon: Award, color: "text-yellow-600", public: false }
      ] : [
        { name: "Getting Started", description: "Quick setup guide", href: "/getting-started", icon: Play, color: "text-blue-600", public: true },
        { name: "Tutorials", description: "Step-by-step guides", href: "/tutorials", icon: Video, color: "text-purple-600", public: true },
        { name: "About Us", description: "Learn more", href: "/about", icon: Info, color: "text-green-600", public: true }
      ]
    }
  ];

  const productsMenu = [
    {
      title: "Clinical Training",
      items: [
        { name: "AI Patient Simulator", description: "Practice with AI patients", href: "/stations", icon: Brain, color: "text-purple-600", public: true },
        { name: "OSCE Stations", description: "Interactive scenarios", href: "/stations", icon: Stethoscope, color: "text-blue-600", public: true },
        { name: "Games Hub", description: "Practice & Challenge", href: "/games", icon: Gamepad2, color: "text-indigo-600", public: true }
      ]
    },
    {
      title: session ? "Learning Tools" : "Platform Features",
      items: session ? [
        { name: "Progress Tracking", description: "Monitor your development", href: "/dashboard/progress", icon: TrendingUp, color: "text-orange-600", public: false },
        { name: "Performance Analytics", description: "Detailed insights", href: "/dashboard/overview", icon: BarChart3, color: "text-indigo-600", public: false },
        { name: "Gamification", description: "Track achievements", href: "/dashboard/gamification", icon: Trophy, color: "text-yellow-600", public: false }
      ] : [
        { name: "Event Management", description: "Complete calendar system", href: "/calendar", icon: Calendar, color: "text-blue-600", public: true },
        { name: "Learning Resources", description: "Study materials library", href: "/downloads", icon: FileText, color: "text-green-600", public: true },
        { name: "Automated Features", description: "Attendance & certificates", href: "/getting-started", icon: Zap, color: "text-yellow-600", public: true }
      ]
    }
  ];

  const solutionsMenu = [
    {
      title: "For Students",
      items: [
        { name: "Medical Students", description: "Teaching, events and simulator", href: "/getting-started", icon: GraduationCap, color: "text-blue-600", public: true },
        {
          name: "Foundation Doctors",
          description: "FY guides & training",
          href: "/guides/foundation-year",
          icon: Users,
          color: "text-purple-600",
          public: true,
        },
        { name: "Portfolio Management", description: "IMT evidence tracking", href: session ? "/imt-portfolio" : "/getting-started", icon: FileText, color: "text-green-600", public: true }
      ]
    },
    {
      title: "For Educators",
      items: [
        { name: "Teaching Events", description: "Manage sessions", href: "/calendar", icon: Calendar, color: "text-indigo-600", public: true },
        { name: "Event Management", description: "Organize teaching", href: "/events-list", icon: List, color: "text-pink-600", public: true },
        { name: "Learning Resources", description: "Share materials", href: "/downloads", icon: BookOpen, color: "text-teal-600", public: true }
      ]
    }
  ];

  const resourcesMenu = [
    {
      title: "Learn & Support",
      items: [
        { name: "Getting Started", description: "Quick setup guide", href: "/getting-started", icon: Play, color: "text-blue-600", public: true },
        { name: "Tutorials", description: "Step-by-step guides", href: "/tutorials", icon: Video, color: "text-purple-600", public: true },
        {
          name: "Foundation Year Guides",
          description: "Free FY practical guides",
          href: "/guides/foundation-year",
          icon: BookOpen,
          color: "text-teal-600",
          public: true,
        },
        { name: "Help & Support", description: "Get assistance", href: "/contact", icon: HelpCircle, color: "text-green-600", public: true }
      ]
    },
    {
      title: "About & Community",
      items: [
        { name: "About Us", description: "Meet the team", href: "/about", icon: Info, color: "text-indigo-600", public: true },
        { name: "Announcements", description: "Latest updates", href: "/announcements", icon: Bell, color: "text-yellow-600", public: true },
        { name: "Contact", description: "Get in touch", href: "/contact", icon: Mail, color: "text-pink-600", public: true }
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

  if (hideNav) {
    return null;
  }

  const useCompactChrome = isStaticShell || navIsCompact;

  return (
    <>
      {/* Bleepy Navigation */}
      <div
        className={`fixed top-0 inset-x-0 z-50 pointer-events-none ${
          isStaticShell ? '' : 'transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
        } ${navIsCompact ? 'px-4 sm:px-6 lg:px-8' : 'px-0'}`}
      >
        <nav
          className={`pointer-events-auto relative overflow-visible mx-auto ${
            isStaticShell
              ? 'mt-0 w-full max-w-none rounded-none bg-[#060818]/95 backdrop-blur-xl border-b border-white/10 shadow-md px-4 sm:px-6 lg:px-8'
              : navIsCompact
                ? `mt-1.5 max-w-7xl rounded-2xl border border-white/10 px-3 sm:px-5 lg:px-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]${navFlash ? ' bleepy-nav-scroll-flash' : ''}`
                : 'mt-0 w-full max-w-[88rem] rounded-none bg-transparent border border-transparent shadow-none backdrop-blur-none px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
          }`}
        >
          {navIsCompact && !isStaticShell ? (
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-2xl bg-[#060818]/90 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/25"
            />
          ) : null}
          <div
            className={`flex justify-between items-center flex-nowrap ${
              isStaticShell
                ? 'h-14 gap-2'
                : `transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${navIsCompact ? 'h-14 gap-2' : 'h-[4.25rem] gap-4'}`
            }`}
          >
            {/* Left cluster: logo + nav links stay grouped */}
            <div className={`flex items-center min-w-0 shrink ${useCompactChrome ? 'gap-2 lg:gap-4' : 'gap-3 lg:gap-5'}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 space-x-2 hover:opacity-80 transition-all duration-300 group min-w-0">
              <img
                src="/Bleepy-Logo-128.webp"
                alt=""
                width={52}
                height={52}
                {...(demoteLogoPriority ? {} : { fetchPriority: 'high' as const })}
                decoding="async"
                className={`bleepy-logo-glow group-hover:scale-110 transition-all duration-500 object-contain shrink-0 ${
                  useCompactChrome
                    ? 'w-9 h-9 sm:w-10 sm:h-10 lg:w-5 lg:h-5'
                    : 'w-[52px] h-[52px] lg:w-6 lg:h-6'
                }`}
              />
              <span
                className={`font-bold text-white transition-all duration-500 sr-only lg:not-sr-only lg:block ${
                  useCompactChrome ? 'text-lg' : 'text-xl'
                }`}
              >
                Bleepy
              </span>
            </Link>
            
            {/* Desktop Navigation - Bleepy Style */}
            <div
              className={`hidden lg:flex items-center shrink-0 transition-all duration-500 ${
                useCompactChrome ? 'space-x-0.5' : 'space-x-0'
              }`}
              ref={dropdownRef}
            >
              {/* Platform/Features Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownHover('platform')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  onClick={() => toggleDropdown('platform')}
                  className={`flex items-center space-x-1 font-medium transition-all duration-300 ${
                    useCompactChrome ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2 text-sm'
                  } ${
                    activeDropdown === 'platform' ? 'text-[#22d3ee]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <span>Platform</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'platform' ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`absolute top-full left-0 z-50 w-[700px] pt-2 transition-all duration-300 transform ${
                    activeDropdown === 'platform' 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="rounded-lg border border-gray-700 bg-gray-800 py-6 shadow-2xl">
                  <div className="px-6">
                    <div className="grid grid-cols-3 gap-8">
                      {platformMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
                          <div className="space-y-4">
                            {section.items
                              .filter(item => item.public || session) // Show public items or private items if logged in
                              .map((item, itemIndex) => (
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

              {/* Products Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownHover('products')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  onClick={() => toggleDropdown('products')}
                  className={`flex items-center space-x-1 font-medium transition-all duration-300 ${
                    useCompactChrome ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2 text-sm'
                  } ${
                    activeDropdown === 'products' ? 'text-[#22d3ee]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <span>Products</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'products' ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`absolute top-full left-0 z-50 w-[800px] pt-2 transition-all duration-300 transform ${
                    activeDropdown === 'products' 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="rounded-lg border border-gray-700 bg-gray-800 py-6 shadow-2xl">
                  <div className="px-6">
                    <div className="grid grid-cols-2 gap-8">
                      {productsMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
                          <div className="space-y-4">
                            {section.items
                              .filter(item => item.public || session) // Show public items or private items if logged in
                              .map((item, itemIndex) => (
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
                    
                    {/* Announcements preview - Show to everyone */}
                    <div className="mt-8 pt-6 border-t border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">Latest Updates</h3>
                        <Link href="/announcements" className="text-sm text-white hover:text-gray-300 flex items-center" onClick={() => setActiveDropdown(null)}>
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
                              <Link
                                key={announcement.id}
                                href="/announcements"
                                onClick={() => setActiveDropdown(null)}
                                className={`bg-gradient-to-r ${gradient} rounded-lg p-4 hover:scale-105 transition-transform duration-200`}
                              >
                                <div className="text-sm font-medium text-white mb-1 line-clamp-2">
                                  {announcement.title}
                                </div>
                                <div 
                                  className="announcement-content text-xs text-white/80 line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                                />
                                <div className="text-xs text-white/60 mt-2">
                                  {/* Date-only strings parse as UTC midnight; format in UTC so
                                      US PageSpeed clients don't hydrate as the previous day. */}
                                  {new Date(
                                    /^\d{4}-\d{2}-\d{2}$/.test(announcement.created_at)
                                      ? `${announcement.created_at}T12:00:00.000Z`
                                      : announcement.created_at
                                  ).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    timeZone: 'UTC',
                                  })}
                                </div>
                              </Link>
                            );
                          })
                        ) : (
                          <>
                            <Link href="/announcements" onClick={() => setActiveDropdown(null)} className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4">
                              <div className="text-sm font-medium text-white mb-1">Enhanced Search Experience</div>
                              <div className="text-xs text-white/80">Smart filters and better search functionality</div>
                              <div className="text-xs text-white/60 mt-2">Oct 15, 2025</div>
                            </Link>
                            <Link href="/announcements" onClick={() => setActiveDropdown(null)} className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4">
                              <div className="text-sm font-medium text-white mb-1">New Announcements System</div>
                              <div className="text-xs text-white/80">Better communication and targeted messaging</div>
                              <div className="text-xs text-white/60 mt-2">Oct 8, 2025</div>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Solutions Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownHover('solutions')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  onClick={() => toggleDropdown('solutions')}
                  className={`flex items-center space-x-1 font-medium transition-all duration-300 ${
                    useCompactChrome ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2 text-sm'
                  } ${
                    activeDropdown === 'solutions' ? 'text-[#22d3ee]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <span>Solutions</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'solutions' ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`absolute top-full left-0 z-50 w-[600px] pt-2 transition-all duration-300 transform ${
                    activeDropdown === 'solutions' 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="rounded-lg border border-gray-700 bg-gray-800 py-6 shadow-2xl">
                  <div className="px-6">
                    <div className="grid grid-cols-2 gap-8">
                      {solutionsMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
                          <div className="space-y-4">
                            {section.items
                              .filter(item => item.public !== false) // All solutions items are public
                              .map((item, itemIndex) => (
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

              {/* Resources Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownHover('resources')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  onClick={() => toggleDropdown('resources')}
                  className={`flex items-center space-x-1 font-medium transition-all duration-300 ${
                    useCompactChrome ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2 text-sm'
                  } ${
                    activeDropdown === 'resources' ? 'text-[#22d3ee]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <span>Resources</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`absolute top-full left-0 z-50 w-[500px] pt-2 transition-all duration-300 transform ${
                    activeDropdown === 'resources' 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="rounded-lg border border-gray-700 bg-gray-800 py-6 shadow-2xl">
                  <div className="px-6">
                    <div className="grid grid-cols-2 gap-8">
                      {resourcesMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
                          <div className="space-y-4">
                            {section.items
                              .filter(item => item.public !== false) // All resources items are public
                              .map((item, itemIndex) => (
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

              {/* Quick Access Links - Direct links to popular pages */}
              <div
                className={`hidden items-center ml-2 pl-3 border-l border-gray-700 shrink-0 ${
                  useCompactChrome ? 'xl:flex space-x-0.5' : '2xl:flex space-x-0'
                }`}
              >
                <Link
                  href="/games"
                  className={`flex items-center gap-1.5 whitespace-nowrap font-medium transition-all duration-300 ${
                    useCompactChrome ? 'px-2 py-1.5 text-sm' : 'px-2.5 py-2 text-sm'
                  } ${
                    pathname === '/games' ? 'text-[#22d3ee]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 shrink-0" />
                  <span>Games</span>
                </Link>
                <Link
                  href="/stations"
                  className={`flex items-center gap-1.5 whitespace-nowrap font-medium transition-all duration-300 ${
                    useCompactChrome ? 'px-2 py-1.5 text-sm' : 'px-2.5 py-2 text-sm'
                  } ${
                    pathname === '/stations' || pathname.startsWith('/station/') ? 'text-[#22d3ee]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 shrink-0" />
                  <span>Simulator</span>
                </Link>
                <Link
                  href="/calendar"
                  className={`flex items-center gap-1.5 whitespace-nowrap font-medium transition-all duration-300 ${
                    useCompactChrome ? 'px-2 py-1.5 text-sm' : 'px-2.5 py-2 text-sm'
                  } ${
                    pathname === '/calendar' ? 'text-[#22d3ee]' : 'text-white hover:text-[#B8C5D1]'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Calendar</span>
                </Link>
              </div>
            </div>
            </div>

            {/* Right Side - User Menu & Actions — keep ≥12px gap so mobile touch targets don't collide */}
            <div className="flex items-center shrink-0 ml-2 gap-3 sm:gap-3">
              {/* Search - Only for logged in users */}
              {session && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden sm:flex text-white hover:text-[#B8C5D1]"
                  onClick={openSearch}
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}

              <div className="flex items-center">
                {session ? (
                  <div className="flex items-center shrink-0 gap-2">
                    {/* User Menu */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      <Link href="/dashboard">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`whitespace-nowrap ${
                            pathname === '/dashboard' 
                              ? 'text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/20' 
                              : 'text-white hover:text-[#B8C5D1]'
                          }`}
                        >
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-[#B8C5D1] whitespace-nowrap shrink-0"
                      >
                        <LogOut className="h-4 w-4 mr-1.5 shrink-0" />
                        Sign Out
                      </Button>
                    </div>

                  </div>
                ) : (
                  <>
                    <div className="hidden lg:flex items-center space-x-4">
                      <Link href="/auth/signin">
                        <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                          Log In
                        </Button>
                      </Link>
                      <Link href="/auth/signin?mode=signup">
                        <Button className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20 border-0">
                          Sign Up Free
                        </Button>
                      </Link>
                    </div>

                    {/* Mobile Get Started — plain link (no nested button) for clear 48px touch target */}
                    <Link
                      href="/auth/signin?mode=signup"
                      aria-label="Get Started"
                      className="bleepy-nav-cta-compact lg:hidden inline-flex h-12 min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-md px-3.5 text-xs font-semibold text-white shrink-0"
                      style={{ backgroundColor: '#C0392B' }}
                    >
                      <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Navigation Buttons — 12px+ gap so targets don't overlap Lighthouse's 48px hit areas */}
              <div className="lg:hidden flex items-center shrink-0 gap-3">
                {/* Search Button - Only for logged in users */}
                {session && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-[#5D6D7E] shrink-0 h-12 w-12 min-h-12 min-w-12"
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="Open search"
                  >
                    <Search className="h-6 w-6" style={{ strokeWidth: '2.5' }} />
                  </Button>
                )}
                
                {/* Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-[#5D6D7E] shrink-0 h-12 w-12 min-h-12 min-w-12"
                  onClick={toggleMenu}
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? (
                    <X className="h-7 w-7" style={{ strokeWidth: '2.5' }} />
                  ) : (
                    <Menu className="h-6 w-6" style={{ strokeWidth: '2.5' }} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
          @keyframes bleepyNavSlideIn {
            0% {
              transform: translateX(100%) scale(0.96);
              opacity: 0;
            }
            100% {
              transform: translateX(0) scale(1);
              opacity: 1;
            }
          }
          
          @keyframes bleepyNavSlideOut {
            0% {
              transform: translateX(0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateX(100%) scale(0.96);
              opacity: 0;
            }
          }
          
          .bleepy-nav-menu-animated {
            transform: translateX(100%) scale(0.96);
            opacity: 0;
          }
          
          .bleepy-nav-menu-animated.bleepy-nav-menu-open {
            animation: bleepyNavSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
          }
          
          .bleepy-nav-menu-animated.bleepy-nav-menu-closed {
            animation: bleepyNavSlideOut 0.3s cubic-bezier(0.7, 0, 0.84, 0) forwards !important;
          }
        `}} />

        {/* Mobile Menu — rendered outside nav so backdrop-blur on the pill doesn't break position:fixed */}
        <div className={`lg:hidden fixed inset-0 z-[100] ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black backdrop-blur-sm transition-opacity duration-300 ease-out"
            style={{ 
              opacity: isMenuOpen ? 0.6 : 0,
              pointerEvents: isMenuOpen ? 'auto' : 'none',
              visibility: isMenuOpen ? 'visible' : 'hidden',
              willChange: 'opacity',
              transition: 'opacity 0.3s ease-out'
            }}
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className={`absolute top-0 right-0 h-full w-full max-w-sm border-l shadow-2xl bleepy-nav-menu-animated ${
            isMenuOpen ? 'bleepy-nav-menu-open' : 'bleepy-nav-menu-closed'
          }`} style={{ 
            backgroundColor: '#171717', 
            borderColor: '#B8C5D1',
            willChange: 'transform, opacity'
          }}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-end p-4 border-b" style={{ borderColor: '#B8C5D1' }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#B8C5D1] hover:text-white hover:bg-[#5D6D7E]"
                  aria-label="Close menu"
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
                    <div className="flex flex-col gap-3">
                      <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                        <Button 
                          size="sm"
                          className="w-full text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md" 
                          style={{ 
                            backgroundColor: '#C0392B',
                            border: '1px solid #C0392B',
                          }}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Log In
                        </Button>
                      </Link>
                      <Link href="/auth/signin?mode=signup" onClick={() => setIsMenuOpen(false)}>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="w-full text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                          style={{ minHeight: 'unset', minWidth: 'unset' }}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-600/50 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Navigation</div>
                  </div>

                  {/* Platform Section - Always show to all users */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Platform</div>
                    {platformMenu.flatMap((section, sectionIdx) => 
                      section.items
                        .filter(item => item.public || session)
                        .map((item, index) => {
                          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                          return (
                            <Link
                              key={`platform-${sectionIdx}-${index}`}
                              href={item.href}
                              onClick={() => setIsMenuOpen(false)}
                              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                                isActive 
                                  ? 'bg-indigo-500/10 border border-indigo-400/30 shadow-md' 
                                  : 'hover:bg-gray-800 border border-transparent'
                              }`}
                              style={{ 
                                color: isActive ? '#818cf8' : '#d1d5db',
                                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                              }}
                            >
                              <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : item.color} ${!isActive ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
                              <div className="flex-1">
                                <div className="font-medium" style={{ color: isActive ? '#818cf8' : '#ffffff' }}>{item.name}</div>
                                <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.description}</div>
                              </div>
                              {isActive && <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>}
                            </Link>
                          );
                        })
                    )}
                  </div>

                  {/* Products Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Products</div>
                    {productsMenu.flatMap((section, sectionIdx) => 
                      section.items
                        .filter(item => item.public || session)
                        .map((item, index) => {
                          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                          return (
                            <Link
                              key={`products-${sectionIdx}-${index}`}
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
                        })
                    )}
                  </div>

                  {/* Solutions Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Solutions</div>
                    {solutionsMenu.flatMap((section, sectionIdx) => 
                      section.items
                        .filter(item => item.public !== false)
                        .map((item, index) => {
                          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                          return (
                            <Link
                              key={`solutions-${sectionIdx}-${index}`}
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
                        })
                    )}
                  </div>

                  {/* Resources Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Resources</div>
                    {resourcesMenu.flatMap((section, sectionIdx) => 
                      section.items
                        .filter(item => item.public !== false)
                        .map((item, index) => {
                          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                          return (
                            <Link
                              key={`resources-${sectionIdx}-${index}`}
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
                        })
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

      {isSearchOpen && (
        <BleepyNavSearchModal isAdmin={isAdmin} onClose={() => setIsSearchOpen(false)} />
      )}

    </>
  );
};

BleepyNav.displayName = 'BleepyNav';
