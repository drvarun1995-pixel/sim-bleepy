"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Stethoscope, 
  Clock, 
  Target, 
  BarChart3, 
  MessageCircle, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Shield, 
  Infinity, 
  Users, 
  Play, 
  Zap, 
  Award, 
  TrendingUp,
  Mic,
  MicOff,
  Volume2
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function EnhancedHero() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Emergency Medicine Resident",
      content: "Bleepy Simulator transformed my clinical practice. The AI patients are incredibly realistic, and the feedback helped me identify areas I never knew needed improvement.",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "Dr. Michael Rodriguez",
      role: "Internal Medicine Fellow",
      content: "The voice interactions are so natural. I felt like I was talking to real patients. My confidence in consultations has increased dramatically.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Dr. Emily Watson",
      role: "Family Medicine Resident",
      content: "The instant feedback system is game-changing. I can see exactly where I need to improve and track my progress over time.",
      rating: 5,
      avatar: "EW"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleVoiceDemo = () => {
    setIsVoiceActive(!isVoiceActive);
    // Simulate voice interaction
    if (audioRef.current) {
      if (isVoiceActive) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const stats = [
    { value: "95%", label: "Success Rate", color: "text-blue-600" },
    { value: "2K+", label: "Students", color: "text-green-600" },
    { value: "4.9★", label: "Rating", color: "text-purple-600" },
    { value: "50+", label: "Hospitals", color: "text-orange-600" }
  ];

  return (
    <section className="relative pt-8 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className={`order-2 lg:order-1 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 mb-6 shadow-sm border border-purple-200">
              <Zap className="h-4 w-4 mr-2 text-purple-600" />
              AI-Powered Medical Practice
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight serif-title">
              Master Clinical Skills with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent relative">
                AI Patient Consultations
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-30"></div>
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed humanist-text">
              Practice realistic clinical consultations with AI patients, get instant expert feedback, 
              and master your clinical skills in timed sessions. Join medical professionals who are 
              advancing their practice with cutting-edge AI technology.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {status === "authenticated" ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
                    <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
                    <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Start Free Practice
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              )}
              
              <Button
                variant="outline"
                size="lg"
                onClick={handleVoiceDemo}
                className="w-full sm:w-auto border-2 border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-4 text-lg font-semibold transition-all duration-300 group"
              >
                {isVoiceActive ? (
                  <>
                    <MicOff className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Stop Demo
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Voice Demo
                  </>
                )}
                {isVoiceActive && (
                  <div className="ml-2 flex space-x-1">
                    <div className="w-1 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-6 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                )}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-base font-medium text-gray-700">Trusted by 200+ medical professionals</span>
              </div>
              <Badge variant="success" className="text-sm">
                <Shield className="w-3 h-3 mr-1" />
                HIPAA Compliant
              </Badge>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, index) => (
                <Card key={index} variant="glass" className="text-center p-4 hover:scale-105 transition-all duration-300" style={{animationDelay: `${index * 100}ms`}}>
                  <CardContent className="p-0">
                    <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                    <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column - Interactive Demo */}
          <div className={`relative order-1 lg:order-2 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative">
              {/* Main Demo Card */}
              <Card variant="glass" className="p-6 lg:p-8 shadow-2xl border border-white/20 backdrop-blur-md">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <Stethoscope className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-base">Live Session</span>
                        <p className="text-xs text-gray-500">Chest Pain Assessment</p>
                      </div>
                    </div>
                    <Badge variant="success" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      Voice session active
                    </Badge>
                  </div>

                  {/* Chat Interface */}
                  <div className="space-y-4 mb-6">
                    <Card variant="glass" className="border-l-4 border-blue-500 bg-gradient-to-r from-gray-50 to-gray-100">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Patient: 45-year-old male</p>
                        <p className="text-gray-900 text-base leading-relaxed">
                          "Doctor, I've been having chest pain for the past 2 hours. It started when I was walking up the stairs and it's getting worse..."
                        </p>
                      </CardContent>
                    </Card>

                    <Card variant="glass" className="border-l-4 border-purple-500 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Your response:</p>
                        <p className="text-gray-900 text-base leading-relaxed">
                          "I understand you're concerned. Can you describe the pain in more detail? Is it sharp, dull, or crushing?"
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Session Stats */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <Card variant="success" className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200">
                      <CardContent className="px-4 py-3">
                        <span className="text-sm text-gray-600 font-medium">Score: </span>
                        <span className="font-bold text-green-600 text-lg">8.5/10</span>
                        <div className="text-xs text-gray-500 mt-1">Excellent clinical reasoning</div>
                      </CardContent>
                    </Card>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Session: 3:24</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Award className="h-4 w-4 text-yellow-800" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{animationDelay: '1s'}}>
                <CheckCircle className="h-4 w-4 text-green-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="mt-16 lg:mt-20">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 serif-title">What Medical Professionals Say</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto"></div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card variant="glass" className="p-8 shadow-xl">
              <CardContent className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg text-gray-700 italic mb-6 leading-relaxed humanist-text">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                    <div className="text-sm text-gray-600">{testimonials[currentTestimonial].role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Testimonial Indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-purple-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} loop>
        <source src="/audio/voice-demo.mp3" type="audio/mpeg" />
      </audio>
    </section>
  );
}
