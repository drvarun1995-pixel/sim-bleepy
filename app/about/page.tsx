"use client";

import { Button } from "@/components/ui/button";
import { Construction, Users, Target, Award, Heart } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function AboutPage() {
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
              About Us
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Learn about our mission to revolutionize medical education through AI-powered clinical training.
            </p>
          </div>

          {/* Mission & Vision Preview */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 mx-auto">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To democratize access to high-quality clinical training by providing AI-powered patient simulations that help medical professionals develop essential skills in a safe, controlled environment.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 mx-auto">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                A world where every medical professional has access to unlimited, realistic clinical training that prepares them to provide exceptional patient care with confidence and competence.
              </p>
            </div>
          </div>

          {/* Team Preview */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Meet Our Team</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "Dr. Sarah Chen",
                  role: "Chief Medical Officer",
                  expertise: "Emergency Medicine, Medical Education",
                  image: "👩‍⚕️"
                },
                {
                  name: "Dr. Michael Rodriguez",
                  role: "Chief Technology Officer",
                  expertise: "AI/ML, Healthcare Technology",
                  image: "👨‍💻"
                },
                {
                  name: "Dr. Emily Watson",
                  role: "Head of Education",
                  expertise: "Clinical Training, Curriculum Development",
                  image: "👩‍🏫"
                }
              ].map((member, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50">
                  <div className="text-4xl mb-4">{member.image}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{member.name}</h3>
                  <div className="text-purple-600 font-semibold mb-2">{member.role}</div>
                  <p className="text-gray-600 text-sm">{member.expertise}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Values Preview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Patient-Centered",
                description: "Every decision we make is guided by what's best for patient care and safety."
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Collaborative",
                description: "We work closely with medical professionals to create solutions that truly meet their needs."
              },
              {
                icon: <Award className="h-8 w-8" />,
                title: "Excellence",
                description: "We're committed to delivering the highest quality training experiences possible."
              }
            ].map((value, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 mx-auto">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Join Our Mission
            </h2>
            <p className="text-gray-600 mb-6">
              Interested in learning more about our team and mission? Get in touch with us!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
