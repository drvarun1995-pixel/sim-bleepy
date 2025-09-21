"use client";

import { Button } from "@/components/ui/button";
import { Heart, Stethoscope, Clock, Target, BarChart3, MessageCircle, Star, CheckCircle, ArrowRight, Shield, Infinity, Users, Play, Zap, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NewsletterSignup from "@/components/NewsletterSignup";
import EnhancedHero from "@/components/EnhancedHero";
// import { ScrollFloat, ParallaxScroll, FloatingElement } from "@/components/ScrollFloat";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
  return (
    <div className="bg-white">
      {/* Enhanced Hero Section */}
      <section className="pt-8 pb-12">
        <EnhancedHero />
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute top-10 left-10 opacity-10 animate-float-slow">
          <div className="w-20 h-20 bg-blue-400 rounded-full blur-xl"></div>
        </div>
        <div className="absolute top-20 right-20 opacity-10 animate-float">
          <div className="w-32 h-32 bg-purple-400 rounded-full blur-xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center mb-16 sm:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 mb-6 shadow-sm">
              <Award className="h-4 w-4 mr-2" />
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight serif-title">
              Complete Clinical Skills Training with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Technology
              </span>
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed humanist-text">
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
              <div 
                key={index} 
                className={`group bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 border border-gray-100/50 animate-float-slow ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} 
                style={{transitionDelay: `${index * 100}ms`}}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center text-purple-600 mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 group-hover:text-purple-600 transition-colors duration-300 serif-title">{feature.title}</h3>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed humanist-text">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-white via-purple-50 to-blue-50 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute top-20 left-20 opacity-5 animate-float-slow">
          <div className="w-40 h-40 bg-green-400 rounded-full blur-2xl"></div>
        </div>
        <div className="absolute bottom-20 right-20 opacity-5 animate-float">
          <div className="w-60 h-60 bg-blue-400 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className={`order-2 lg:order-1 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 mb-6 shadow-sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Success Stories
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight serif-title">
                Trusted by{" "}
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  200+ Medical Professionals
                </span>
              </h2>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed humanist-text">
                Join the ranks of successful medical professionals from around the world. 
                Our proven AI-powered platform has helped thousands advance their clinical skills, 
                improve consultation techniques, and excel in their practice.
              </p>
              <div className="grid grid-cols-3 gap-6 sm:gap-8">
                {[
                  { value: "95%", label: "Success Rate", color: "text-blue-600" },
                  { value: "2K+", label: "Students", color: "text-green-600" },
                  { value: "4.9★", label: "Rating", color: "text-purple-600" }
                ].map((stat, index) => (
                  <div key={index} className={`text-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg animate-float-slow transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: `${index * 200}ms`}}>
                    <div className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`relative order-1 lg:order-2 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 lg:p-8 shadow-2xl border border-white/20 animate-float">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-float-slow">
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
                  <blockquote className="text-gray-700 text-lg leading-relaxed italic humanist-text">
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
        {/* Floating background elements */}
        <div className="absolute top-10 left-10 opacity-20 animate-float-slow">
          <div className="w-32 h-32 bg-yellow-300 rounded-full blur-2xl"></div>
        </div>
        <div className="absolute bottom-10 right-10 opacity-20 animate-float">
          <div className="w-40 h-40 bg-pink-300 rounded-full blur-2xl"></div>
        </div>
        
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight serif-title">
              Advance Your Clinical Practice{" "}
              <span className="text-yellow-300">Today</span>
            </h2>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 leading-relaxed max-w-4xl mx-auto humanist-text">
              Join 200+ medical professionals who used Bleepy Simulator's AI-powered clinical skills 
              training to excel in their practice. Start your free practice today and boost your confidence.
            </p>
            {status === "authenticated" ? (
              <Link href="/dashboard" className="block w-full sm:w-auto mb-8">
                <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 animate-float-slow">
                  <Play className="mr-3 h-6 w-6" />
                  Go to Dashboard
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signin" className="block w-full sm:w-auto mb-8">
                <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 animate-float-slow">
                  <Play className="mr-3 h-6 w-6" />
                  Begin Free Clinical Training
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            )}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 lg:space-x-12 text-blue-100 text-base sm:text-lg">
              {[
                { icon: Shield, text: "No credit card required" },
                { icon: Infinity, text: "Free forever plan" },
                { icon: Users, text: "200+ professionals trust us" }
              ].map((item, index) => (
                <div key={index} className={`flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 animate-float transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: `${index * 200}ms`}}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
