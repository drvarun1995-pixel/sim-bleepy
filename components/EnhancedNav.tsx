"use client";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  History, 
  Home,
  Zap,
  ChevronDown,
  Bell,
  HelpCircle,
  Stethoscope,
  BookOpen,
  Users,
  Calendar
} from "lucide-react";

export const EnhancedNav = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Don't show nav on auth pages
  if (pathname.startsWith('/auth/')) {
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

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "#features", label: "Features", icon: Zap },
    { href: "/about", label: "About Us", icon: HelpCircle },
  ];

  const userMenuItems = session ? [
    { href: "/dashboard", label: "Dashboard", icon: User },
    { href: "/dashboard/progress", label: "Progress", icon: History },
    ...(isAdmin ? [{ href: "/admin-dashboard", label: "Admin", icon: Settings }] : []),
  ] : [];

  return (
    <>
      {/* Enhanced Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg' 
          : 'bg-white/90 backdrop-blur-sm border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 group">
              <div className="relative">
                <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy" className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Bleepy
                </span>
                <span className="text-xs text-gray-500 hidden sm:block">AI Clinical Training</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-gray-100 ${
                    pathname === item.href ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {status === "loading" ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="hidden sm:block">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : session ? (
                <div className="flex items-center space-x-3">
                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center">
                      3
                    </Badge>
                  </Button>

                  {/* User Menu */}
                  <div className="hidden sm:flex items-center space-x-2">
                    {userMenuItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>

                  {/* User Profile */}
                  <div className="flex items-center space-x-3">
                    <div className="hidden sm:block text-right">
                      <div className="text-sm font-medium text-gray-900">{session.user?.name}</div>
                      <div className="text-xs text-gray-500">{session.user?.email}</div>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {session.user?.name?.charAt(0) || 'U'}
                    </div>
                  </div>

                  <Button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/auth/signin">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <Zap className="h-4 w-4 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={toggleMenu}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 transition-all duration-300">
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
                          
                          <Link 
                            href="/dashboard/progress" 
                            onClick={() => setIsMenuOpen(false)} 
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                              pathname.includes('/progress')
                                ? 'bg-green-500/20 border-2 border-green-400/50 shadow-lg'
                                : 'hover:bg-gray-800/50 border border-transparent'
                            }`}
                            style={{ 
                              color: pathname.includes('/progress') ? '#4ade80' : '#d1d5db',
                              backgroundColor: pathname.includes('/progress') ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                            }}
                          >
                            <History className={`w-5 h-5 ${pathname.includes('/progress') ? 'text-green-400' : 'group-hover:scale-110'} transition-transform duration-200`} />
                            <span className="font-medium">Progress</span>
                            {pathname.includes('/progress') && <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                          </Link>
                          
                          {isAdmin && (
                            <Link 
                              href="/admin-dashboard" 
                              onClick={() => setIsMenuOpen(false)} 
                              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                                pathname.includes('/admin-dashboard')
                                  ? 'bg-green-500/20 border-2 border-green-400/50 shadow-lg'
                                  : 'hover:bg-gray-800/50 border border-transparent'
                              }`}
                              style={{ 
                                color: pathname.includes('/admin-dashboard') ? '#4ade80' : '#d1d5db',
                                backgroundColor: pathname.includes('/admin-dashboard') ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                              }}
                            >
                              <Settings className={`w-5 h-5 ${pathname.includes('/admin-dashboard') ? 'text-green-400' : 'group-hover:scale-110'} transition-transform duration-200`} />
                              <span className="font-medium">Admin</span>
                              {pathname.includes('/admin-dashboard') && <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
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
                      <div className="flex flex-col gap-6">
                        <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                          <Button 
                            className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-red-500/25" 
                            style={{ 
                              backgroundColor: '#FF6B6B',
                              border: '2px solid #FF6B6B'
                            }}
                          >
                            <User className="w-5 h-5 mr-3" />
                            Log In
                          </Button>
                        </Link>
                        <Link href="/auth/signin?mode=signup" onClick={() => setIsMenuOpen(false)}>
                          <Button 
                            variant="outline"
                            className="w-full text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                          >
                            <Zap className="w-5 h-5 mr-3" />
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

                    {/* Main Navigation Links */}
                    <div className="space-y-3">
                      <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Main</div>
                      {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                      <Link
                        key={item.href}
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
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-400'} ${!isActive ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
                            <div className="flex-1">
                              <div className="font-medium" style={{ color: isActive ? '#a78bfa' : '#ffffff' }}>{item.label}</div>
                            </div>
                            {isActive && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Additional Navigation Items */}
                    <div className="space-y-3">
                      <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#B8C5D1' }}>Quick Access</div>
                      
                      <Link
                        href="/stations"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                          pathname.includes('/stations')
                            ? 'bg-blue-500/10 border border-blue-400/30 shadow-md' 
                            : 'hover:bg-gray-800 border border-transparent'
                        }`}
                        style={{ 
                          color: pathname.includes('/stations') ? '#60a5fa' : '#d1d5db',
                          backgroundColor: pathname.includes('/stations') ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        <Stethoscope className={`w-5 h-5 ${pathname.includes('/stations') ? 'text-blue-400' : 'text-blue-500'} ${!pathname.includes('/stations') ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: pathname.includes('/stations') ? '#60a5fa' : '#ffffff' }}>OSCE Stations</div>
                          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Interactive clinical scenarios</div>
                        </div>
                        {pathname.includes('/stations') && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
                      </Link>

                      <Link
                        href="/calendar"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                          pathname.includes('/calendar')
                            ? 'bg-green-500/10 border border-green-400/30 shadow-md' 
                            : 'hover:bg-gray-800 border border-transparent'
                        }`}
                        style={{ 
                          color: pathname.includes('/calendar') ? '#4ade80' : '#d1d5db',
                          backgroundColor: pathname.includes('/calendar') ? 'rgba(34, 197, 94, 0.05)' : 'transparent'
                        }}
                      >
                        <Calendar className={`w-5 h-5 ${pathname.includes('/calendar') ? 'text-green-400' : 'text-green-500'} ${!pathname.includes('/calendar') ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: pathname.includes('/calendar') ? '#4ade80' : '#ffffff' }}>Teaching Events</div>
                          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Live sessions & workshops</div>
                        </div>
                        {pathname.includes('/calendar') && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                      </Link>

                      <Link
                        href="/downloads"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                          pathname.includes('/downloads')
                            ? 'bg-orange-500/10 border border-orange-400/30 shadow-md' 
                            : 'hover:bg-gray-800 border border-transparent'
                        }`}
                        style={{ 
                          color: pathname.includes('/downloads') ? '#fb923c' : '#d1d5db',
                          backgroundColor: pathname.includes('/downloads') ? 'rgba(251, 146, 60, 0.05)' : 'transparent'
                        }}
                      >
                        <BookOpen className={`w-5 h-5 ${pathname.includes('/downloads') ? 'text-orange-400' : 'text-orange-500'} ${!pathname.includes('/downloads') ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: pathname.includes('/downloads') ? '#fb923c' : '#ffffff' }}>Study Resources</div>
                          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Download materials</div>
                        </div>
                        {pathname.includes('/downloads') && <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>}
                      </Link>

                      <Link
                        href="/about"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                          pathname.includes('/about')
                            ? 'bg-purple-500/10 border border-purple-400/30 shadow-md' 
                            : 'hover:bg-gray-800 border border-transparent'
                        }`}
                        style={{ 
                          color: pathname.includes('/about') ? '#a78bfa' : '#d1d5db',
                          backgroundColor: pathname.includes('/about') ? 'rgba(147, 51, 234, 0.05)' : 'transparent'
                        }}
                      >
                        <Users className={`w-5 h-5 ${pathname.includes('/about') ? 'text-purple-400' : 'text-purple-500'} ${!pathname.includes('/about') ? 'group-hover:scale-110' : ''} transition-transform duration-200`} />
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: pathname.includes('/about') ? '#a78bfa' : '#ffffff' }}>About Us</div>
                          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Meet our founders</div>
                        </div>
                        {pathname.includes('/about') && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>}
                      </Link>
                    </div>

                  </div>
                </div>

                  </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-16"></div>
    </>
  );
};
