"use client";

import { Button } from "@/components/ui/button";
import { Heart, Stethoscope, Clock, Target, BarChart3, MessageCircle, Star, CheckCircle, ArrowRight, Shield, Infinity, Users, Play, Zap, Award, TrendingUp, Calendar as CalendarIcon, BookOpen, GraduationCap, UserCheck, MapPin, ArrowUpRight, Brain, Activity } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Calendar from "@/components/Calendar";

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
      {/* Hero Section - Basildon Hospital Teaching Hub */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 mb-6 shadow-sm">
              <MapPin className="h-4 w-4 mr-2" />
              Basildon Hospital
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight serif-title">
              Central Hub for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Medical Education
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto humanist-text">
              Connecting ARU, UCL, and Foundation Year Doctors through innovative teaching and AI-powered training
            </p>

            {/* Student Groups Quick View */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Student Groups</h3>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* ARU Students */}
                <div className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">ARU Students</h4>
                  <p className="text-gray-600 mb-4 text-center text-sm">Anglia Ruskin University</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 text-sm">Active Students</span>
                      <span className="font-bold text-blue-600">48</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 text-sm">This Month</span>
                      <span className="font-bold text-blue-600">12 events</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 text-sm">Next Session</span>
                      <span className="font-bold text-blue-600">Oct 5</span>
                    </div>
                  </div>
                </div>

                {/* UCL Students */}
                <div className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-100 hover:border-purple-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">UCL Students</h4>
                  <p className="text-gray-600 mb-4 text-center text-sm">University College London</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 text-sm">Active Students</span>
                      <span className="font-bold text-purple-600">62</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 text-sm">This Month</span>
                      <span className="font-bold text-purple-600">8 events</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 text-sm">Next Session</span>
                      <span className="font-bold text-purple-600">Oct 7</span>
                    </div>
                  </div>
                </div>

                {/* Foundation Year Doctors */}
                <div className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-green-100 hover:border-green-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <UserCheck className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">Foundation Year</h4>
                  <p className="text-gray-600 mb-4 text-center text-sm">FY1 & FY2 Doctors</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 text-sm">Active Doctors</span>
                      <span className="font-bold text-green-600">42</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 text-sm">This Month</span>
                      <span className="font-bold text-green-600">10 events</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-600 text-sm">Next Session</span>
                      <span className="font-bold text-green-600">Oct 8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#calendar">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  View Teaching Calendar
                </Button>
              </Link>
              {status === "authenticated" && (
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    <Brain className="mr-2 h-5 w-5" />
                    Access AI Simulator
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Teaching Calendar Section */}
      <section id="calendar" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 mb-6 shadow-sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Teaching Calendar
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 serif-title">
              Teaching <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Calendar</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto humanist-text">
              Stay updated with all teaching events happening at Basildon Hospital
            </p>
          </div>

          {/* Calendar Component */}
          <Calendar showEventsList={true} maxEventsToShow={5} />

          <div className="text-center mt-8">
            <Link href="/events">
              <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                View Full Calendar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* AI Simulator Preview Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute top-10 left-10 opacity-20 animate-float-slow">
          <div className="w-32 h-32 bg-yellow-300 rounded-full blur-2xl"></div>
        </div>
        <div className="absolute bottom-10 right-10 opacity-20 animate-float">
          <div className="w-40 h-40 bg-pink-300 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white mb-6">
                <Brain className="h-4 w-4 mr-2" />
                Premium Feature
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight serif-title">
                AI Patient Simulator
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Practice with realistic AI patients, receive instant expert feedback, and master clinical skills through immersive voice consultations. Available exclusively through your dashboard.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: MessageCircle, text: "Natural voice conversations" },
                  { icon: CheckCircle, text: "Instant clinical feedback" },
                  { icon: BarChart3, text: "Performance analytics" },
                  { icon: Target, text: "Multiple clinical scenarios" }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <span className="text-lg">{feature.text}</span>
                  </div>
                ))}
              </div>
              {status === "authenticated" ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <Play className="mr-2 h-5 w-5" />
                    Access Simulator
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <Play className="mr-2 h-5 w-5" />
                    Sign In to Access
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Active Scenario</h4>
                      <p className="text-sm text-gray-600">Chest Pain Assessment</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    Live
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm text-gray-700">"I've been having chest pain for the past 2 hours..."</p>
                  </div>
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                    <p className="text-sm text-gray-700">"Can you describe the pain in more detail?"</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm">
                    <span className="text-gray-600">Score: </span>
                    <span className="font-bold text-green-600">8.5/10</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    3:24
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
