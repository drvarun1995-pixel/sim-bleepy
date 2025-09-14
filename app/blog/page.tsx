"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, BookOpen, Calendar, User, Tag } from "lucide-react";
import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/bleepy-logo.svg" alt="Bleepy Simulator" className="w-8 h-8" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Bleepy Simulator</span>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Under Construction Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Construction className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Blog
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Stay updated with the latest insights on AI-powered medical training, clinical best practices, and industry trends.
            </p>
          </div>

          {/* Blog Categories */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <BookOpen className="h-6 w-6" />,
                title: "AI in Medicine",
                description: "Latest developments in medical AI"
              },
              {
                icon: <User className="h-6 w-6" />,
                title: "Clinical Training",
                description: "Best practices for medical education"
              },
              {
                icon: <Tag className="h-6 w-6" />,
                title: "Industry News",
                description: "Updates from the medical training world"
              }
            ].map((category, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100/50 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-3 mx-auto">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>

          {/* Coming Soon Articles Preview */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              {
                title: "The Future of AI-Powered Clinical Training",
                excerpt: "How artificial intelligence is revolutionizing medical education and what it means for the next generation of healthcare professionals.",
                author: "Dr. Sarah Chen",
                date: "Coming Soon",
                category: "AI in Medicine",
                readTime: "5 min read"
              },
              {
                title: "Mastering Clinical Communication with AI Patients",
                excerpt: "Learn how to improve your patient communication skills through realistic AI interactions and get instant feedback on your approach.",
                author: "Dr. Michael Rodriguez",
                date: "Coming Soon",
                category: "Clinical Training",
                readTime: "7 min read"
              },
              {
                title: "OSCE Preparation: A Complete Guide",
                excerpt: "Everything you need to know about preparing for Objective Structured Clinical Examinations using modern training tools.",
                author: "Dr. Emily Watson",
                date: "Coming Soon",
                category: "Clinical Training",
                readTime: "10 min read"
              },
              {
                title: "The Science Behind Realistic AI Patient Interactions",
                excerpt: "Discover the technology and psychology that makes AI patients feel so realistic and how it enhances learning outcomes.",
                author: "Dr. James Park",
                date: "Coming Soon",
                category: "AI in Medicine",
                readTime: "6 min read"
              }
            ].map((article, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {article.category}
                  </div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Coming Soon
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{article.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{article.date}</span>
                    </div>
                  </div>
                  <span>{article.readTime}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter Signup */}
          <NewsletterSignup 
            title="Stay Updated"
            description="Get the latest blog posts delivered to your inbox!"
            buttonText="Subscribe"
            placeholder="Enter your email"
          />
        </div>
      </div>
    </div>
  );
}
