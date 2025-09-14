"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, Play, BookOpen, Video, Award } from "lucide-react";
import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function TutorialsPage() {
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
              Tutorials
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Master Bleepy Simulator with our comprehensive video tutorials and step-by-step guides.
            </p>
          </div>

          {/* Tutorial Categories */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <Play className="h-8 w-8" />,
                title: "Getting Started",
                description: "Learn the basics of Bleepy Simulator",
                duration: "15 min",
                lessons: ["Platform Overview", "First Consultation", "Understanding Feedback"],
                color: "from-green-100 to-emerald-100",
                iconColor: "text-green-600"
              },
              {
                icon: <Video className="h-8 w-8" />,
                title: "Advanced Features",
                description: "Master advanced consultation techniques",
                duration: "45 min",
                lessons: ["Complex Scenarios", "Performance Analytics", "Custom Settings"],
                color: "from-blue-100 to-indigo-100",
                iconColor: "text-blue-600"
              },
              {
                icon: <Award className="h-8 w-8" />,
                title: "Best Practices",
                description: "Clinical excellence and professional development",
                duration: "30 min",
                lessons: ["Communication Skills", "Clinical Reasoning", "Time Management"],
                color: "from-purple-100 to-violet-100",
                iconColor: "text-purple-600"
              },
              {
                icon: <BookOpen className="h-8 w-8" />,
                title: "Scenario Deep Dives",
                description: "Detailed analysis of specific clinical cases",
                duration: "60 min",
                lessons: ["Chest Pain Assessment", "Emergency Protocols", "Differential Diagnosis"],
                color: "from-orange-100 to-red-100",
                iconColor: "text-orange-600"
              },
              {
                icon: <Play className="h-8 w-8" />,
                title: "Integration Guide",
                description: "Connect with your existing systems",
                duration: "20 min",
                lessons: ["LMS Integration", "API Setup", "Data Export"],
                color: "from-teal-100 to-cyan-100",
                iconColor: "text-teal-600"
              },
              {
                icon: <Award className="h-8 w-8" />,
                title: "Certification Prep",
                description: "Prepare for medical examinations",
                duration: "90 min",
                lessons: ["OSCE Preparation", "Clinical Skills", "Assessment Strategies"],
                color: "from-pink-100 to-rose-100",
                iconColor: "text-pink-600"
              }
            ].map((tutorial, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-300">
                <div className={`w-16 h-16 bg-gradient-to-r ${tutorial.color} rounded-2xl flex items-center justify-center ${tutorial.iconColor} mb-6`}>
                  {tutorial.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{tutorial.title}</h3>
                <p className="text-gray-600 mb-4">{tutorial.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">Duration: {tutorial.duration}</span>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Coming Soon
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 text-sm">Lessons:</h4>
                  <ul className="space-y-1">
                    {tutorial.lessons.map((lesson, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                        {lesson}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full mt-6 bg-gray-100 text-gray-600 hover:bg-gray-200" disabled>
                  Start Tutorial
                </Button>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Be the First to Learn
            </h2>
            <p className="text-gray-600 mb-6">
              Get notified when our tutorial library launches!
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
