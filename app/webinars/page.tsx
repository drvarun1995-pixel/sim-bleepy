"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, Video, Calendar, Clock, Users } from "lucide-react";
import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function WebinarsPage() {
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
              Webinars
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Join our expert-led webinars to learn about the latest developments in AI-powered medical training and clinical education.
            </p>
          </div>

          {/* Upcoming Webinars Preview */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              {
                title: "The Future of AI in Medical Education",
                speaker: "Dr. Sarah Chen, Chief Medical Officer",
                date: "Coming Soon",
                time: "2:00 PM EST",
                duration: "45 minutes",
                description: "Explore how artificial intelligence is transforming medical education and what it means for the future of clinical training.",
                topics: ["AI in Medical Training", "Future Trends", "Implementation Strategies"],
                attendees: "500+ registered"
              },
              {
                title: "Mastering Clinical Communication with AI",
                speaker: "Dr. Michael Rodriguez, Clinical Director",
                date: "Coming Soon",
                time: "3:30 PM EST",
                duration: "60 minutes",
                description: "Learn how to improve your patient communication skills through AI-powered training and get practical tips for real-world application.",
                topics: ["Communication Skills", "AI Training Methods", "Real-world Application"],
                attendees: "300+ registered"
              },
              {
                title: "OSCE Preparation: A Complete Guide",
                speaker: "Dr. Emily Watson, Education Specialist",
                date: "Coming Soon",
                time: "1:00 PM EST",
                duration: "90 minutes",
                description: "Comprehensive guide to preparing for Objective Structured Clinical Examinations using modern AI training tools.",
                topics: ["OSCE Preparation", "Study Strategies", "Practice Techniques"],
                attendees: "750+ registered"
              },
              {
                title: "Integrating AI Training into Medical Curricula",
                speaker: "Dr. James Park, Academic Director",
                date: "Coming Soon",
                time: "4:00 PM EST",
                duration: "75 minutes",
                description: "For educators: Learn how to effectively integrate AI-powered training into existing medical school curricula.",
                topics: ["Curriculum Integration", "Faculty Training", "Student Engagement"],
                attendees: "200+ registered"
              }
            ].map((webinar, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Video className="h-3 w-3 mr-1" />
                    Live Webinar
                  </div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Coming Soon
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{webinar.title}</h3>
                <div className="text-sm text-gray-600 mb-3">
                  <div className="font-semibold">Speaker: {webinar.speaker}</div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{webinar.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{webinar.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{webinar.attendees}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{webinar.description}</p>
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Topics Covered:</div>
                  <div className="flex flex-wrap gap-2">
                    {webinar.topics.map((topic, idx) => (
                      <div key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        {topic}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Duration: {webinar.duration}</div>
                  <Button className="bg-gray-100 text-gray-600 hover:bg-gray-200" disabled>
                    Register
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Webinar Series */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Webinar Series: "AI in Medical Education"
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Join our comprehensive 4-part webinar series covering all aspects of AI-powered medical training.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Part 1: Introduction to AI Training", status: "Coming Soon" },
                { title: "Part 2: Implementation Strategies", status: "Coming Soon" },
                { title: "Part 3: Measuring Success", status: "Coming Soon" },
                { title: "Part 4: Future Trends", status: "Coming Soon" }
              ].map((part, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-sm font-semibold text-gray-900 mb-2">{part.title}</div>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {part.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Stay Updated on Webinars
            </h2>
            <p className="text-gray-600 mb-6">
              Get notified about upcoming webinars and exclusive educational content!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
