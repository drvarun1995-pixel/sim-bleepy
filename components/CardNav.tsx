"use client";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
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
  Bell,
  HelpCircle,
  ChevronDown
} from "lucide-react";

export const CardNav = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as Element).closest('.mobile-menu-container')) {
        setIsMenuOpen(false);
      }
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, showUserMenu]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navItems = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "#features", label: "Features", icon: Zap, active: pathname.includes("features") },
    { href: "/help", label: "Help", icon: HelpCircle, active: pathname.includes("help") },
  ];

  const userMenuItems = session ? [
    { href: "/dashboard", label: "Dashboard", icon: User, active: pathname.includes("dashboard") },
    { href: "/history", label: "History", icon: History, active: pathname.includes("history") },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Settings, active: pathname.includes("admin") }] : []),
  ] : [];

  return (
    <>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 group">
              <div className="relative">
                <img src="/bleepy-logo.svg" alt="Bleepy Simulator" className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent serif-title">
                  Bleepy Simulator
                </span>
                <span className="text-xs text-gray-500 hidden sm:block humanist-text">AI Clinical Training</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    size="sm"
                    className={`transition-all duration-200 ${
                      item.active 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Right side - User menu or auth buttons */}
            <div className="flex items-center space-x-2">
              {status === "loading" ? (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              ) : session ? (
                <div className="flex items-center space-x-2">
                  {/* Notifications - Desktop only */}
                  <Button variant="ghost" size="sm" className="hidden lg:flex relative">
                    <Bell className="h-4 w-4" />
                    <Badge variant="destructive" className="absolute -top-1 -right-1 w-4 h-4 text-xs p-0 flex items-center justify-center">
                      3
                    </Badge>
                  </Button>

                  {/* User Profile - Desktop */}
                  <div className="relative user-menu-container">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="hidden sm:flex items-center space-x-2"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {session.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="hidden lg:block text-left">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-24">
                          {session.user?.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-24">
                          {session.user?.email}
                        </div>
                      </div>
                      <ChevronDown className="h-3 w-3 text-gray-500" />
                    </Button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute top-full right-0 mt-2 w-56 z-50">
                        <Card className="shadow-xl border border-gray-200">
                          <CardContent className="p-2">
                            <div className="space-y-1">
                              {userMenuItems.map((item) => (
                                <Link key={item.href} href={item.href} onClick={() => setShowUserMenu(false)}>
                                  <Button
                                    variant="ghost"
                                    className={`w-full justify-start ${item.active ? 'bg-purple-50 text-purple-700' : ''}`}
                                  >
                                    <item.icon className="w-4 h-4 mr-3" />
                                    {item.label}
                                  </Button>
                                </Link>
                              ))}
                              <div className="border-t border-gray-200 my-1"></div>
                              <Button
                                variant="ghost"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <LogOut className="h-4 w-4 mr-3" />
                                Sign Out
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={toggleMenu}
                  >
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
                      <Zap className="h-4 w-4 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={toggleMenu}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mobile-menu-container">
            <div className="px-4 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 shadow-lg">
              {/* Navigation Links */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      item.active 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                        : 'text-gray-600'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              ))}

              {/* User Menu Items */}
              {session && (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {session.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{session.user?.name}</div>
                        <div className="text-sm text-gray-500">{session.user?.email}</div>
                      </div>
                    </div>
                    
                    {/* Mobile Notifications */}
                    <Button variant="ghost" className="w-full justify-start mb-2 relative">
                      <Bell className="w-4 h-4 mr-3" />
                      Notifications
                      <Badge variant="destructive" className="ml-auto">
                        3
                      </Badge>
                    </Button>
                    
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button
                          variant="ghost"
                          className={`w-full justify-start mb-1 ${item.active ? 'bg-purple-50 text-purple-700' : ''}`}
                        >
                          <item.icon className="w-4 h-4 mr-3" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    
                    <div className="border-t border-gray-200 mt-3 pt-2">
                      <Button
                        variant="ghost"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </Button>
                    </div>
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
