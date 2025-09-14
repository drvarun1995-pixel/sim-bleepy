"use client";

import { Button } from "@/components/ui/button";
import { Heart, Stethoscope, Clock, Target, BarChart3, MessageCircle, Star, CheckCircle, ArrowRight, Shield, Infinity, Users, Play, Zap, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
    setIsVisible(true);
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">+</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null; // Will redirect to dashboard
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/bleepy-logo.svg" alt="Bleepy Simulator" className="w-8 h-8" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Bleepy Simulator</span>
            </div>
            <div className="hidden sm:flex items-center space-x-6">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900">Sign In</Link>
              <Link href="/auth/signin">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
            <div className="sm:hidden">
              <Link href="/auth/signin">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                  Start
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className={`order-2 lg:order-1 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 mb-6 shadow-sm">
                <Zap className="h-4 w-4 mr-2 text-purple-600" />
                AI-Powered Medical Practice
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Master Clinical Skills with{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Patient Consultations
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
                Practice realistic clinical consultations with AI patients, get instant expert feedback, 
                and master your clinical skills in timed sessions. Join medical professionals who are 
                advancing their practice with cutting-edge AI technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <Play className="mr-2 h-5 w-5" />
                    Start Free Practice
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex items-center justify-center sm:justify-start space-x-3 text-gray-600">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-base font-medium">Trusted by 200+ medical professionals</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">95%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">2K+</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">4.9★</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
            </div>
            <div className={`relative order-1 lg:order-2 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 lg:p-8 shadow-2xl border border-white/20">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-base">Live Session</span>
                        <p className="text-xs text-gray-500">Chest Pain Assessment</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Voice session active</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600 mb-2 font-medium">Patient: 45-year-old male</p>
                      <p className="text-gray-900 text-base leading-relaxed">"Doctor, I've been having chest pain for the past 2 hours. It started when I was walking up the stairs..."</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-l-4 border-purple-500">
                      <p className="text-sm text-gray-600 mb-2 font-medium">Your response:</p>
                      <p className="text-gray-900 text-base leading-relaxed">"I understand you're concerned. Can you describe the pain in more detail? Is it sharp, dull, or crushing?"</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl px-4 py-3">
                      <span className="text-sm text-gray-600 font-medium">Score: </span>
                      <span className="font-bold text-green-600 text-lg">8.5/10</span>
                      <div className="text-xs text-gray-500 mt-1">Excellent clinical reasoning</div>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Session: 3:24</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 mb-6 shadow-sm">
              <Award className="h-4 w-4 mr-2" />
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Complete Clinical Skills Training with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Technology
              </span>
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed">
              Master every clinical scenario with realistic patient consultations, instant feedback, 
              and comprehensive skills assessment - exactly like real clinical practice.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <MessageCircle className="h-8 w-8" />,
                title: "Realistic Voice Consultations",
                description: "Practice with AI patients that respond naturally to your questions and provide realistic clinical scenarios."
              },
              {
                icon: <CheckCircle className="h-8 w-8" />,
                title: "Expert Clinical Feedback",
                description: "Get instant feedback on clinical reasoning, communication skills, and professional behavior standards."
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Timed Practice Sessions",
                description: "Practice with realistic time constraints to prepare for real clinical situations and examinations."
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: "Comprehensive Scenario Coverage",
                description: "Access a wide range of clinical scenarios from basic consultations to complex emergency presentations."
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Performance Analytics",
                description: "Track your progress with detailed analytics and identify areas for improvement."
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Real-Time Conversations",
                description: "Engage in natural, flowing conversations with AI patients that adapt to your communication style."
              }
            ].map((feature, index) => (
              <div key={index} className={`group bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 border border-gray-100/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: `${index * 100}ms`}}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center text-purple-600 mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 group-hover:text-purple-600 transition-colors duration-300">{feature.title}</h3>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-white via-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className={`order-2 lg:order-1 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 mb-6 shadow-sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Success Stories
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Trusted by{" "}
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  200+ Medical Professionals
                </span>
              </h2>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
                Join the ranks of successful medical professionals from around the world. 
                Our proven AI-powered platform has helped thousands advance their clinical skills, 
                improve consultation techniques, and excel in their practice.
              </p>
              <div className="grid grid-cols-3 gap-6 sm:gap-8">
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 mb-2">95%</div>
                  <div className="text-sm sm:text-base text-gray-600 font-medium">Success Rate</div>
                </div>
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600 mb-2">2K+</div>
                  <div className="text-sm sm:text-base text-gray-600 font-medium">Students</div>
                </div>
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600 mb-2">4.9★</div>
                  <div className="text-sm sm:text-base text-gray-600 font-medium">Rating</div>
                </div>
              </div>
            </div>
            <div className={`relative order-1 lg:order-2 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 lg:p-8 shadow-2xl border border-white/20">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Dr. Sarah Chen</h3>
                      <p className="text-gray-600 text-sm">Emergency Medicine Resident</p>
                      <div className="flex mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 text-lg leading-relaxed italic">
                    "Bleepy Simulator transformed my clinical practice. The AI patients are incredibly realistic, 
                    and the feedback helped me identify areas I never knew needed improvement. 
                    My confidence in patient consultations has increased dramatically."
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
              Advance Your Clinical Practice{" "}
              <span className="text-yellow-300">Today</span>
            </h2>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 leading-relaxed max-w-4xl mx-auto">
              Join 200+ medical professionals who used Bleepy Simulator's AI-powered clinical skills 
              training to excel in their practice. Start your free practice today and boost your confidence.
            </p>
            <Link href="/auth/signin" className="block w-full sm:w-auto mb-8">
              <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                <Play className="mr-3 h-6 w-6" />
                Begin Free Clinical Training
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 lg:space-x-12 text-blue-100 text-base sm:text-lg">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Infinity className="h-5 w-5" />
                <span className="font-medium">Free forever plan</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Users className="h-5 w-5" />
                <span className="font-medium">200+ professionals trust us</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <img src="/bleepy-logo.svg" alt="Bleepy Simulator" className="w-12 h-12" />
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Bleepy Simulator
                </span>
              </div>
              <p className="text-gray-300 text-base leading-relaxed mb-6">
                AI-powered clinical skills training platform for medical professionals. 
                Practice realistic consultations and master your clinical expertise.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors duration-300 cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300 cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors duration-300 cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors duration-300 cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Product</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/features" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/scenarios" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Clinical Scenarios
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Live Demo
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    API Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/integrations" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Resources</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/help" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/tutorials" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/case-studies" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link href="/research" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Research Papers
                  </Link>
                </li>
                <li>
                  <Link href="/webinars" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Webinars
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Company</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/partners" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Partners
                  </Link>
                </li>
                <li>
                  <Link href="/press" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Press Kit
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-gray-300 hover:text-white transition-colors duration-300 text-base">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-8 border border-gray-700">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Stay Updated with Medical AI
                </h3>
                <p className="text-gray-300 mb-6 text-lg">
                  Get the latest insights on AI-powered medical training, new scenarios, and clinical best practices.
                </p>
                <NewsletterSignup 
                  title=""
                  description=""
                  buttonText="Subscribe"
                  placeholder="Enter your email"
                  className="bg-transparent border-none p-0"
                />
                <p className="text-gray-400 text-sm mt-4">
                  Join 2,000+ medical professionals. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-4 md:mb-0">
                <p className="text-gray-400 text-base">
                  © 2025 Bleepy Simulator. All rights reserved.
                </p>
                <div className="flex space-x-6 text-sm">
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors duration-300">
                    Cookie Policy
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
                <div className="text-gray-400 text-sm">
                  Made with ❤️ for medical professionals
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
