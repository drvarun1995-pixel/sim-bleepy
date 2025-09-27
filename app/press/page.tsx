"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, Newspaper, Download, Calendar, User } from "lucide-react";

import NewsletterSignup from "@/components/NewsletterSignup";

export default function PressPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Under Construction Header */}
          <div className="mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Construction className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Press Kit
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Media resources, company information, and press materials for journalists and media professionals.
            </p>
          </div>

          {/* Press Resources */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Download className="h-8 w-8" />,
                title: "Company Logo",
                description: "High-resolution logos and brand assets",
                status: "Coming Soon"
              },
              {
                icon: <Newspaper className="h-8 w-8" />,
                title: "Press Releases",
                description: "Latest company announcements and news",
                status: "Coming Soon"
              },
              {
                icon: <User className="h-8 w-8" />,
                title: "Executive Bios",
                description: "Leadership team information and photos",
                status: "Coming Soon"
              }
            ].map((resource, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 mx-auto">
                  {resource.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {resource.status}
                </div>
              </div>
            ))}
          </div>

          {/* Media Contact */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Media Contact</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Press Inquiries</h3>
                <p className="text-gray-600">press@bleepysimulator.com</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">General Media</h3>
                <p className="text-gray-600">media@bleepysimulator.com</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Phone</h3>
                <p className="text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-600 mb-6">
              Get notified when our press kit and media resources are available!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Get Notified
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
