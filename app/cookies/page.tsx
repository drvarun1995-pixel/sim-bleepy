"use client";

import { Cookie, Settings, Eye, Shield, Clock, Globe, Mail, CheckCircle, XCircle } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Cookie className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Cookie Policy
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-blue-100 text-green-800 mb-6">
              <Cookie className="h-4 w-4 mr-2" />
              Last Updated: September 2025
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Learn about how we use cookies and similar technologies to enhance your experience on Bleepy Simulator.
            </p>
          </div>

          {/* Cookie Types Overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Essential Cookies",
                description: "Required for basic website functionality and security",
                color: "from-green-100 to-emerald-100",
                textColor: "text-green-600"
              },
              {
                icon: <Settings className="h-8 w-8" />,
                title: "Preference Cookies",
                description: "Remember your settings and preferences",
                color: "from-blue-100 to-cyan-100",
                textColor: "text-blue-600"
              },
              {
                icon: <Eye className="h-8 w-8" />,
                title: "Analytics Cookies",
                description: "Help us understand how you use our platform",
                color: "from-purple-100 to-pink-100",
                textColor: "text-purple-600"
              }
            ].map((type, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50">
                <div className={`w-12 h-12 bg-gradient-to-r ${type.color} rounded-xl flex items-center justify-center ${type.textColor} mb-4 mx-auto`}>
                  {type.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{type.title}</h3>
                <p className="text-gray-600 text-sm text-center">{type.description}</p>
              </div>
            ))}
          </div>

          {/* Cookie Policy Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Cookie className="h-6 w-6 mr-2 text-purple-600" />
                1. What Are Cookies?
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) 
                  when you visit our website. They help us provide you with a better experience by remembering 
                  your preferences and understanding how you use our platform.
                </p>
                <p>
                  We also use similar technologies such as web beacons, pixel tags, and local storage to 
                  collect and store information about your interactions with our service.
                </p>
              </div>
            </section>

            {/* How We Use Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Settings className="h-6 w-6 mr-2 text-purple-600" />
                2. How We Use Cookies
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>We use cookies and similar technologies for the following purposes:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-green-800">Essential Functions</h3>
                    </div>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• User authentication and login</li>
                      <li>• Session management</li>
                      <li>• Security and fraud prevention</li>
                      <li>• Load balancing and performance</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Settings className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-800">User Experience</h3>
                    </div>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Remember user preferences</li>
                      <li>• Language and region settings</li>
                      <li>• Theme and display options</li>
                      <li>• Form data retention</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Eye className="h-5 w-5 text-purple-600 mr-2" />
                      <h3 className="font-semibold text-purple-800">Analytics</h3>
                    </div>
                    <ul className="text-purple-700 text-sm space-y-1">
                      <li>• Usage statistics and patterns</li>
                      <li>• Performance monitoring</li>
                      <li>• Error tracking and debugging</li>
                      <li>• Feature usage analysis</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <h3 className="font-semibold text-yellow-800">Session Management</h3>
                    </div>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Training session tracking</li>
                      <li>• Progress saving</li>
                      <li>• Timeout management</li>
                      <li>• State persistence</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-purple-600" />
                3. Contact Information
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3">Cookie Questions?</h3>
                  <div className="space-y-2 text-purple-700">
                    <p><strong>Email:</strong> support@bleepy.co.uk</p>
                    <p><strong>Subject Line:</strong> Cookie Policy Inquiry</p>
                    <p><strong>Response Time:</strong> Within 5 business days</p>
                  </div>
                </div>
                
                <p>
                  If you have questions about our use of cookies or would like to manage your cookie 
                  preferences, please contact us using the information above.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              This Cookie Policy is effective as of September 2025 and was last updated on September 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
