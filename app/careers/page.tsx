"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, Briefcase, Users, MapPin, Clock } from "lucide-react";

import NewsletterSignup from "@/components/NewsletterSignup";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Under Construction Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Construction className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Careers
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Join our mission to revolutionize medical education. We're building a team of passionate professionals who want to make a difference in healthcare.
            </p>
          </div>

          {/* Why Work With Us */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Work With Us?</h2>
              <div className="space-y-4">
                {[
                  "Make a real impact on medical education",
                  "Work with cutting-edge AI technology",
                  "Collaborate with world-class medical professionals",
                  "Flexible remote-first culture",
                  "Competitive compensation and benefits",
                  "Opportunities for professional growth"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Culture</h2>
              <p className="text-gray-600 mb-4">
                We're a diverse team of innovators, educators, and healthcare professionals united by our passion for improving medical training through technology.
              </p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">50+</div>
                  <div className="text-sm text-gray-600">Team Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">15+</div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-gray-600">Remote-First</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">4.8★</div>
                  <div className="text-sm text-gray-600">Team Satisfaction</div>
                </div>
              </div>
            </div>
          </div>

          {/* Open Positions Preview */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Open Positions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Senior AI/ML Engineer",
                  department: "Engineering",
                  location: "Remote",
                  type: "Full-time",
                  description: "Lead the development of our AI patient simulation technology and machine learning models."
                },
                {
                  title: "Medical Education Specialist",
                  department: "Education",
                  location: "Remote",
                  type: "Full-time",
                  description: "Work with medical professionals to design and validate clinical training scenarios."
                },
                {
                  title: "Product Manager",
                  department: "Product",
                  location: "Remote",
                  type: "Full-time",
                  description: "Drive product strategy and roadmap for our AI-powered medical training platform."
                },
                {
                  title: "UX/UI Designer",
                  department: "Design",
                  location: "Remote",
                  type: "Full-time",
                  description: "Create intuitive and engaging user experiences for medical professionals and students."
                }
              ].map((position, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {position.department}
                    </div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Coming Soon
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{position.title}</h3>
                  <p className="text-gray-600 mb-4">{position.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{position.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{position.type}</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200" disabled>
                    Apply Now
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Don't See Your Role?
            </h2>
            <p className="text-gray-600 mb-6">
              We're always looking for talented individuals who share our passion for improving medical education. Send us your resume!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Send Resume
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
