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
  HelpCircle
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
    { href: "/help", label: "Help", icon: HelpCircle },
  ];

  const userMenuItems = session ? [
    { href: "/dashboard", label: "Dashboard", icon: User },
    { href: "/history", label: "History", icon: History },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Settings }] : []),
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
                <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy Simulator" className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Bleepy Simulator
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
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-4">
              {/* Navigation Links */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 ${
                    pathname === item.href ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* User Menu Items */}
              {session && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center space-x-3 px-3 py-2 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {session.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{session.user?.name}</div>
                        <div className="text-sm text-gray-500">{session.user?.email}</div>
                      </div>
                    </div>
                    
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-16"></div>
    </>
  );
};
