"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, Shield, Lock, Eye, CheckCircle } from "lucide-react";

import NewsletterSignup from "@/components/NewsletterSignup";

export default function SecurityPage() {
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
              Security
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Learn about our commitment to security, privacy, and compliance in protecting your data and ensuring safe AI-powered medical training.
            </p>
          </div>

          {/* Security Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Data Encryption",
                description: "End-to-end encryption for all data transmission and storage"
              },
              {
                icon: <Lock className="h-8 w-8" />,
                title: "Access Control",
                description: "Multi-factor authentication and role-based access controls"
              },
              {
                icon: <Eye className="h-8 w-8" />,
                title: "Privacy Protection",
                description: "HIPAA-compliant data handling and privacy safeguards"
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

          {/* Compliance & Certifications */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Compliance & Certifications</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Healthcare Compliance:</h3>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>HIPAA Compliant</span>
                  </li>
                  <li className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>FERPA Compliant</span>
                  </li>
                  <li className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>GDPR Compliant</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Security Standards:</h3>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>SOC 2 Type II</span>
                  </li>
                  <li className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>ISO 27001</span>
                  </li>
                  <li className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Regular Security Audits</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Contact */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Security Questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Have security concerns or questions? Our security team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Contact Security
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
