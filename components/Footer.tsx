"use client";

import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";
import { useSession } from "next-auth/react";
import {
  Gamepad2,
  Stethoscope,
  Download,
  Calendar,
  List,
  Bell,
  Home,
  TrendingUp,
  Award,
  Play,
  Video,
  Info,
  Brain,
  BarChart3,
  Shield,
  FileText,
  HelpCircle,
  Mail
} from "lucide-react";

export default function Footer() {
  const { data: session } = useSession();
  
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity duration-300 group">
              <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy" className="w-12 h-12 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Bleepy
              </span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              The complete platform for medical education. Everything you need to excel in medical training—all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <a 
                href="https://www.facebook.com/bleepyuk" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on Facebook"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/bleepyuk" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 transition-colors duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://x.com/bleepyuk" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on X (Twitter)"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-black transition-colors duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://www.linkedin.com/company/bleepyuk" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on LinkedIn"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href="https://www.youtube.com/@bleepyuk" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on YouTube"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a 
                href="https://uk.pinterest.com/bleepyuk" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Follow us on Pinterest"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="-143 145 512 512">
                  <path d="M-143,145v512h512V145H-143z M113,528.3c-12.6,0-24.8-1.9-36.3-5.3c4.9-7.7,10.2-17.6,12.9-27.4c1.6-5.7,9-35.2,9-35.2c4.4,8.5,17.4,15.9,31.3,15.9c41.2,0,69.1-37.5,69.1-87.7c0-38-32.2-73.3-81-73.3c-60.8,0-91.5,43.6-91.5,80c0,22,8.3,41.6,26.2,48.9c2.9,1.2,5.5,0,6.4-3.2c0.6-2.2,2-7.9,2.6-10.3c0.9-3.2,0.5-4.3-1.8-7.1c-5.1-6.1-8.4-13.9-8.4-25.1c0-32.3,24.2-61.3,63-61.3c34.4,0,53.3,21,53.3,49c0,36.9-16.3,68-40.6,68c-13.4,0-23.4-11.1-20.2-24.6c3.8-16.2,11.3-33.7,11.3-45.4c0-10.5-5.6-19.2-17.3-19.2c-13.7,0-24.7,14.2-24.7,33.1c0,12.1,4.1,20.2,4.1,20.2s-14,59.4-16.5,69.7c-2.3,9.7-2.6,20.5-2.2,29.4C16.5,497.8-15,452.7-15,400.3c0-70.7,57.3-128,128-128s128,57.3,128,128S183.7,528.3,113,528.3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Learning & Practice */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Learning & Practice
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/games" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <Gamepad2 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Games Hub</span>
                </Link>
              </li>
              <li>
                <Link href="/stations" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <Stethoscope className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>OSCE Stations</span>
                </Link>
              </li>
              <li>
                <Link href="/downloads" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <Download className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                  <span>Study Resources</span>
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <Video className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>Tutorials</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Events & Calendar */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Events & Calendar
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/calendar" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <Calendar className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Teaching Calendar</span>
                </Link>
              </li>
              <li>
                <Link href="/events-list" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <List className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Events List</span>
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <Bell className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                  <span>Announcements</span>
                </Link>
              </li>
              {session && (
                <li>
                  <Link href="/bookings" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <Award className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                    <span>My Bookings</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Dashboard & Account */}
          {session ? (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-400" />
                Dashboard & Account
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <Home className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/progress" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <TrendingUp className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                    <span>Progress Tracking</span>
                  </Link>
                </li>
                <li>
                  <Link href="/mycertificates" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <Award className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                    <span>My Certificates</span>
                  </Link>
                </li>
                <li>
                  <Link href={"/imt-portfolio"} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <FileText className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                    <span>Portfolio</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/overview" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <BarChart3 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Analytics</span>
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-green-400" />
                Resources & Support
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/getting-started" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <Play className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Getting Started</span>
                  </Link>
                </li>
                <li>
                  <Link href="/tutorials" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <Video className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>Tutorials</span>
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <Info className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>Changelog</span>
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                    <HelpCircle className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                    <span>Help & Support</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Resources & Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              Resources & Info
            </h3>
            <ul className="space-y-3">
              {session ? (
                <>
                  <li>
                    <Link href="/changelog" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                      <Info className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span>Changelog</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                      <Mail className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>Contact Us</span>
                    </Link>
                  </li>
                </>
              ) : null}
              <li>
                <Link href="/about" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <Info className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <Shield className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <FileText className="w-4 h-4 text-gray-400 group-hover:scale-110 transition-transform" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300 text-sm group">
                  <FileText className="w-4 h-4 text-gray-400 group-hover:scale-110 transition-transform" />
                  <span>Cookie Policy</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-8 border border-gray-700">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Stay Updated with Medical AI
              </h3>
              <p className="text-gray-300 mb-6 text-lg">
                Get the latest insights on AI-powered medical training, new scenarios, and clinical best practices.
              </p>
              <NewsletterSignup 
                title=""
                description=""
                buttonText="Subscribe"
                placeholder="Enter your email"
                className="bg-transparent border-none p-0"
              />
              <p className="text-gray-400 text-sm mt-4">
                Join 2,000+ medical professionals. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-6">
            {/* Copyright and Links Row */}
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <p className="text-gray-400 text-base order-2 lg:order-1">
                © 2025 Bleepy. All rights reserved.
              </p>
              
              {/* Navigation Links - Centered and properly spaced */}
              <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 order-1 lg:order-2">
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-medium">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-medium">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-medium">
                  Cookie Policy
                </Link>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-medium">
                  About Us
                </Link>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-medium">
                  Contact Us
                </Link>
              </div>
            </div>
            
            {/* Status and Made with Love Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">All systems operational</span>
              </div>
              <div className="text-gray-400 text-sm font-medium">
                Made with <span className="text-pink-400">❤️</span> for medical professionals
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
