"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, FileText, Scale, Shield, Users } from "lucide-react";
import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function TermsPage() {
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
        <div className="max-w-4xl mx-auto text-center">
          {/* Under Construction Header */}
          <div className="mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Construction className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Terms of Service
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Our terms of service outline the rules and guidelines for using Bleepy Simulator and our commitment to providing a safe, educational platform.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Users className="h-8 w-8" />,
                title: "User Responsibilities",
                description: "Guidelines for appropriate use of our platform"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Service Availability",
                description: "Our commitment to service reliability and uptime"
              },
              {
                icon: <Scale className="h-8 w-8" />,
                title: "Legal Framework",
                description: "Legal terms and conditions for using our services"
              }
            ].map((section, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 mx-auto">
                  {section.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </div>
            ))}
          </div>

          {/* Terms Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 mb-12 text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What We're Building</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Acceptance of Terms</h3>
                <p className="text-gray-600 text-sm">By using our service, you agree to be bound by these terms and conditions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Use of Service</h3>
                <p className="text-gray-600 text-sm">Guidelines for appropriate use of Bleepy Simulator for educational and training purposes.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Intellectual Property</h3>
                <p className="text-gray-600 text-sm">Information about our intellectual property rights and your rights to use our content.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                <p className="text-gray-600 text-sm">Our liability limitations and disclaimers regarding the use of our training platform.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Termination</h3>
                <p className="text-gray-600 text-sm">Terms regarding account termination and service discontinuation.</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Legal Questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Have questions about our terms of service? Contact our legal team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Contact Legal Team
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
