"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, Zap, Target, Clock, MessageCircle, CheckCircle, BarChart3, Heart } from "lucide-react";
import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function FeaturesPage() {
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
              Features
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              We're building something amazing! Our comprehensive features page will showcase all the powerful tools and capabilities of Bleepy Simulator.
            </p>
          </div>

          {/* Coming Soon Features Preview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <MessageCircle className="h-8 w-8" />,
                title: "AI Voice Consultations",
                description: "Realistic patient interactions with advanced AI"
              },
              {
                icon: <CheckCircle className="h-8 w-8" />,
                title: "Instant Feedback",
                description: "Get expert clinical feedback in real-time"
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Timed Sessions",
                description: "Practice with realistic time constraints"
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: "Multiple Scenarios",
                description: "Wide range of clinical case studies"
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Performance Analytics",
                description: "Track your progress and improvement"
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Real-time Conversations",
                description: "Natural, flowing dialogue with AI patients"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <NewsletterSignup 
            title="Stay Updated"
            description="Be the first to know when our features page goes live!"
            buttonText="Notify Me"
            placeholder="Enter your email"
          />
        </div>
      </div>
    </div>
  );
}
