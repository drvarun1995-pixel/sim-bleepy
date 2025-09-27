"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, DollarSign, Check, Star } from "lucide-react";
import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function PricingPage() {
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
              Pricing Plans
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              We're crafting flexible pricing options that work for every medical professional. Stay tuned for our launch!
            </p>
          </div>

          {/* Coming Soon Pricing Preview */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Free Plan */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50">
              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-green-600 mb-6 mx-auto">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Plan</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">$0<span className="text-lg text-gray-500">/month</span></div>
              <p className="text-gray-600 mb-6">Perfect for getting started with AI clinical training</p>
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  1 consultation per day
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Basic scenarios
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Standard feedback
                </li>
              </ul>
              <Button className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200" disabled>
                Coming Soon
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-purple-200 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Most Popular
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-6 mx-auto">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro Plan</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">$29<span className="text-lg text-gray-500">/month</span></div>
              <p className="text-gray-600 mb-6">For serious medical professionals</p>
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Unlimited consultations
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  All scenarios
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Advanced analytics
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Priority support
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" disabled>
                Coming Soon
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 mx-auto">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">Custom</div>
              <p className="text-gray-600 mb-6">For institutions and large teams</p>
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Everything in Pro
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Custom scenarios
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Team management
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  API access
                </li>
              </ul>
              <Button className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200" disabled>
                Contact Sales
              </Button>
            </div>
          </div>

          {/* Call to Action */}
          <NewsletterSignup 
            title="Get Early Access"
            description="Be the first to experience our pricing plans when they launch!"
            buttonText="Get Notified"
            placeholder="Enter your email"
          />
        </div>
      </div>
    </div>
  );
}
