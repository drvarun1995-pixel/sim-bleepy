"use client";

import { Button } from "./ui/button";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Nav = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Don't show nav on auth pages
  if (pathname.startsWith('/auth/')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-300">
            <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy" className="w-8 h-8" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Bleepy</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={() => signOut()}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="#features" className="text-gray-600 hover:text-gray-900 hidden sm:block">
                  Features
                </Link>
                <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <Link href="/auth/signin">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              {status === "authenticated" && (
                <Link href="/dashboard/progress">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                    Progress
                  </Button>
                </Link>
              )}
              <a 
                href="https://bleepy.co.uk" 
                target="_blank" 
                rel="noopener noreferrer nofollow"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Resources
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
