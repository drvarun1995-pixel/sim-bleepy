"use client";

import { Button } from "@/components/ui/button";
import { Construction, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function ContactPage() {
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
              Contact Us
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Get in touch with our team. We'd love to hear from you and answer any questions you might have.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Mail className="h-8 w-8" />,
                title: "Email Us",
                description: "Send us an email and we'll get back to you within 24 hours",
                contact: "hello@bleepysimulator.com"
              },
              {
                icon: <Phone className="h-8 w-8" />,
                title: "Call Us",
                description: "Speak directly with our support team",
                contact: "+1 (555) 123-4567"
              },
              {
                icon: <MessageCircle className="h-8 w-8" />,
                title: "Live Chat",
                description: "Chat with us in real-time for immediate assistance",
                contact: "Available 9 AM - 6 PM EST"
              }
            ].map((method, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 mx-auto">
                  {method.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                <div className="text-purple-600 font-medium text-sm">{method.contact}</div>
              </div>
            ))}
          </div>

          {/* Contact Form Preview */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled
                />
              </div>
              <input
                type="text"
                placeholder="Subject"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled
              />
              <textarea
                placeholder="Your Message"
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled
              ></textarea>
              <Button className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200" disabled>
                Send Message
              </Button>
            </div>
          </div>

          {/* Office Info */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Office</h2>
            <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
              <MapPin className="h-5 w-5" />
              <span>123 Innovation Drive, Tech City, TC 12345</span>
            </div>
            <p className="text-gray-600">
              We're a remote-first company with team members across the globe, but our headquarters are located in the heart of the tech district.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
