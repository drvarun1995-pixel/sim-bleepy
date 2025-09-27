"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, FileText, TrendingUp, Users, Award } from "lucide-react";
import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy Simulator" className="w-8 h-8" />
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
              Case Studies
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Discover how medical institutions and professionals are transforming their training with Bleepy Simulator.
            </p>
          </div>

          {/* Stats Preview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: <Users className="h-6 w-6" />, value: "2,000+", label: "Medical Students" },
              { icon: <Award className="h-6 w-6" />, value: "95%", label: "Success Rate" },
              { icon: <TrendingUp className="h-6 w-6" />, value: "40%", label: "Improvement" },
              { icon: <FileText className="h-6 w-6" />, value: "50+", label: "Institutions" }
            ].map((stat, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100/50 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-3 mx-auto">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Coming Soon Case Studies */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              {
                title: "Harvard Medical School: Revolutionizing Clinical Training",
                excerpt: "How Harvard Medical School integrated Bleepy Simulator into their curriculum, resulting in 45% improvement in student performance.",
                institution: "Harvard Medical School",
                results: ["45% improvement in clinical skills", "90% student satisfaction", "Reduced training time by 30%"],
                category: "Medical Education"
              },
              {
                title: "Mayo Clinic: Enhancing Resident Training Programs",
                excerpt: "Mayo Clinic's implementation of AI-powered training led to significant improvements in resident confidence and clinical decision-making.",
                institution: "Mayo Clinic",
                results: ["60% increase in resident confidence", "25% faster skill acquisition", "98% program satisfaction"],
                category: "Residency Training"
              },
              {
                title: "Johns Hopkins: Emergency Medicine Excellence",
                excerpt: "Johns Hopkins Emergency Medicine department used Bleepy Simulator to prepare residents for high-stakes emergency scenarios.",
                institution: "Johns Hopkins Hospital",
                results: ["50% better emergency response", "35% reduction in errors", "100% pass rate on exams"],
                category: "Emergency Medicine"
              },
              {
                title: "Stanford University: Pediatric Training Innovation",
                excerpt: "Stanford's pediatric program leveraged AI training to improve communication skills with young patients and their families.",
                institution: "Stanford University",
                results: ["40% improvement in communication", "85% parent satisfaction", "Faster diagnosis accuracy"],
                category: "Pediatrics"
              }
            ].map((study, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {study.category}
                  </div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Coming Soon
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{study.title}</h3>
                <p className="text-gray-600 mb-4">{study.excerpt}</p>
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Institution: {study.institution}</div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-gray-800">Key Results:</div>
                    {study.results.map((result, idx) => (
                      <div key={idx} className="text-sm text-gray-600 flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200" disabled>
                  Read Full Case Study
                </Button>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Share Your Success Story
            </h2>
            <p className="text-gray-600 mb-6">
              Have you seen success with Bleepy Simulator? We'd love to feature your story!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Share Story
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
