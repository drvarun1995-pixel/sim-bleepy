"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, Stethoscope, Clock, Target, BarChart3, MessageCircle, Star, 
  CheckCircle, ArrowRight, Shield, Infinity, Users, Play, Zap, Award, 
  TrendingUp, Calendar as CalendarIcon, BookOpen, GraduationCap, UserCheck, 
  MapPin, ArrowUpRight, Brain, Activity, Sparkles, FileText, Download,
  Building2, Activity as ActivityIcon, TrendingDown, Rocket, Star as StarIcon,
  Flame, Gem, Crown, Lightbulb, BookMarked, Video, Headphones, Mic,
  Bell, ExternalLink, TrendingUp as TrendingUpIcon, Eye, CalendarDays,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Calendar from "@/components/Calendar";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({
    aru: { studentCount: 0, activeStudents: 0, eventsThisMonth: 0 },
    ucl: { studentCount: 0, activeStudents: 0, eventsThisMonth: 0 },
    foundationYear: { doctorCount: 0, activeDoctors: 0, eventsThisMonth: 0 }
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    fetchStats();
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const testimonials = [
      {
        name: "Anirudh Suresh",
        role: "Clinical Teaching Fellow",
        quote: "Bleepy has transformed how we deliver medical education. The platform provides a seamless experience for both educators and students, making it incredibly easy to coordinate teaching sessions and manage resources all in one place. Our students love the intuitive interface and the ability to access materials anytime.",
        rating: 5
      },
      {
        name: "Thanuji Rangana",
        role: "Clinical Teaching Fellow",
        quote: "As a CTF, Bleepy has streamlined our entire teaching workflow. The platform's comprehensive features have significantly reduced administrative burden, allowing us to focus more on actual teaching and student engagement. It's been a game-changer for our medical education program.",
        rating: 5
      }
    ];

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/homepage-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch homepage stats:', error);
    }
  };


  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 min-h-screen overflow-x-hidden">
      {/* Hero Section 1 - Main Hero */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-0 right-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse"
            style={{
              transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
            }}
          ></div>
          <div 
            className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-pulse"
            style={{
              animationDelay: '1s',
              transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)`
            }}
          ></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-20 left-20 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl animate-bounce" style={{animationDuration: '3s'}}></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-300/20 rounded-full blur-2xl animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Location Badge */}
            <div className="flex justify-center mb-6 animate-fade-in">
              <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold bg-white/90 backdrop-blur-md border-2 border-blue-300 text-blue-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <MapPin className="h-4 w-4 mr-2 animate-pulse" />
                Basildon Hospital
              </div>
            </div>

            {/* Main Heading with Animation */}
            <div className="text-center mb-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-4 leading-tight animate-slide-up">
                Central Hub for{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Medical Education
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{animationDelay: '0.2s'}}>
                Connecting ARU, UCL, and Foundation Year Doctors through innovative teaching and AI-powered training
              </p>
            </div>

            {/* Animated Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 backdrop-blur-sm border-2 border-blue-300/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                <CardContent className="p-5 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-blue-600 mr-2 animate-bounce" style={{animationDuration: '2s'}} />
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      {stats.aru.studentCount + stats.ucl.studentCount + stats.foundationYear.doctorCount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Total Students & Doctors</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 backdrop-blur-sm border-2 border-purple-300/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                <CardContent className="p-5 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CalendarIcon className="h-6 w-6 text-purple-600 mr-2 animate-pulse" />
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                      {stats.aru.eventsThisMonth + stats.ucl.eventsThisMonth + stats.foundationYear.eventsThisMonth}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Events This Month</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 backdrop-blur-sm border-2 border-indigo-300/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                <CardContent className="p-5 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ActivityIcon className="h-6 w-6 text-indigo-600 mr-2 animate-pulse" style={{animationDelay: '0.5s'}} />
                    <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                      {stats.aru.activeStudents + stats.ucl.activeStudents + stats.foundationYear.activeDoctors}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Active Users</p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Buttons with Enhanced Animations */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <Link href="#calendar">
                <Button 
                  size="lg" 
                  className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-10 py-7 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 rounded-2xl overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                  <CalendarIcon className="mr-2 h-6 w-6 group-hover:rotate-12 transition-transform" />
                  View Teaching Calendar
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              {status === "authenticated" ? (
                <Link href="/dashboard">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="group bg-white/90 backdrop-blur-md border-3 border-purple-500 text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent px-10 py-7 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 rounded-2xl"
                  >
                    <Sparkles className="mr-2 h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="group bg-white/90 backdrop-blur-md border-3 border-purple-500 text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent px-10 py-7 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 rounded-2xl"
                  >
                    <Sparkles className="mr-2 h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section 2 - Student Groups with Enhanced Design */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white mb-6 shadow-lg animate-pulse">
              <Users className="h-5 w-5 mr-2" />
              Our Community
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
              Student <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Groups</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Three distinct groups, one unified platform for medical education excellence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {/* ARU Students Card - Enhanced */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 via-white to-blue-100/50 hover:from-blue-100 hover:via-white hover:to-blue-200 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-blue-600/30 rounded-full -mr-20 -mt-20 group-hover:scale-150 group-hover:rotate-180 transition-all duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-300/20 to-transparent rounded-full -ml-16 -mb-16 group-hover:scale-125 transition-all duration-700"></div>
              <CardContent className="p-10 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 group-hover:shadow-blue-500/50">
                    <GraduationCap className="h-10 w-10 text-white" />
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold shadow-lg animate-pulse">
                    ARU
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">ARU Students</h3>
                <p className="text-gray-600 mb-8 text-base font-medium">Anglia Ruskin University</p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-blue-200 group-hover:border-blue-400 transition-all shadow-md">
                    <span className="text-gray-700 text-sm font-semibold">Total Students</span>
                    <span className="font-bold text-blue-600 text-xl">{stats.aru.studentCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-blue-200 group-hover:border-blue-400 transition-all shadow-md">
                    <span className="text-gray-700 text-sm font-semibold">Active Students</span>
                    <span className="font-bold text-blue-600 text-xl">{stats.aru.activeStudents}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-blue-200 group-hover:border-blue-400 transition-all shadow-md">
                    <span className="text-gray-700 text-sm font-semibold">Events This Month</span>
                    <span className="font-bold text-blue-600 text-xl">{stats.aru.eventsThisMonth}</span>
                  </div>
                </div>
                <div className="pt-6 border-t-2 border-blue-200">
                  <div className="flex items-center text-blue-600 text-sm font-bold group-hover:gap-3 transition-all cursor-pointer">
                    <span>View Details</span>
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* UCL Students Card - Enhanced */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 via-white to-pink-100/50 hover:from-purple-100 hover:via-white hover:to-pink-200 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/30 to-pink-600/30 rounded-full -mr-20 -mt-20 group-hover:scale-150 group-hover:rotate-180 transition-all duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-300/20 to-transparent rounded-full -ml-16 -mb-16 group-hover:scale-125 transition-all duration-700"></div>
              <CardContent className="p-10 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 group-hover:shadow-purple-500/50">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-xs font-bold shadow-lg animate-pulse" style={{animationDelay: '0.3s'}}>
                    UCL
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">UCL Students</h3>
                <p className="text-gray-600 mb-8 text-base font-medium">University College London</p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-purple-200 group-hover:border-purple-400 transition-all shadow-md">
                    <span className="text-gray-700 text-sm font-semibold">Total Students</span>
                    <span className="font-bold text-purple-600 text-xl">{stats.ucl.studentCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-purple-200 group-hover:border-purple-400 transition-all shadow-md">
                    <span className="text-gray-700 text-sm font-semibold">Active Students</span>
                    <span className="font-bold text-purple-600 text-xl">{stats.ucl.activeStudents}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-purple-200 group-hover:border-purple-400 transition-all shadow-md">
                    <span className="text-gray-700 text-sm font-semibold">Events This Month</span>
                    <span className="font-bold text-purple-600 text-xl">{stats.ucl.eventsThisMonth}</span>
                  </div>
                </div>
                <div className="pt-6 border-t-2 border-purple-200">
                  <div className="flex items-center text-purple-600 text-sm font-bold group-hover:gap-3 transition-all cursor-pointer">
                    <span>View Details</span>
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Foundation Year Doctors Card - Enhanced */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 via-white to-teal-100/50 hover:from-emerald-100 hover:via-white hover:to-teal-200 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-teal-600/30 rounded-full -mr-20 -mt-20 group-hover:scale-150 group-hover:rotate-180 transition-all duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-300/20 to-transparent rounded-full -ml-16 -mb-16 group-hover:scale-125 transition-all duration-700"></div>
              <CardContent className="p-10 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 group-hover:shadow-emerald-500/50">
                    <UserCheck className="h-10 w-10 text-white" />
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-xs font-bold shadow-lg animate-pulse" style={{animationDelay: '0.6s'}}>
                    FY
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">Foundation Year</h3>
                <p className="text-gray-600 mb-8 text-base font-medium">FY1 & FY2 Doctors</p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-emerald-200 group-hover:border-emerald-400 transition-all shadow-md">
                    <span className="text-gray-700 text-sm font-semibold">Total Doctors</span>
                    <span className="font-bold text-emerald-600 text-xl">{stats.foundationYear.doctorCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-emerald-200 group-hover:border-emerald-400 transition-all shadow-md">
                    <span className="text-gray-700 text-sm font-semibold">Active Doctors</span>
                    <span className="font-bold text-emerald-600 text-xl">{stats.foundationYear.activeDoctors}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-emerald-200 group-hover:border-emerald-400 transition-all shadow-md">
                    <span className="text-gray-700 text-sm font-semibold">Events This Month</span>
                    <span className="font-bold text-emerald-600 text-xl">{stats.foundationYear.eventsThisMonth}</span>
                  </div>
                </div>
                <div className="pt-6 border-t-2 border-emerald-200">
                  <div className="flex items-center text-emerald-600 text-sm font-bold group-hover:gap-3 transition-all cursor-pointer">
                    <span>View Details</span>
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Hero Section 3 - Teaching Calendar - KEEP AS IS */}
      <section id="calendar" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50/80 via-white to-purple-50/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/10 via-transparent to-purple-200/10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white mb-6 shadow-lg animate-pulse">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Teaching Calendar
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
              Teaching <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Calendar</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Stay updated with all teaching events happening at Basildon Hospital
            </p>
          </div>

          <div className="text-center mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <Link href={status === "authenticated" ? "/calendar" : "/auth/signin"}>
              <Button 
                size="lg" 
                variant="outline" 
                className="group border-3 border-blue-500 text-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white hover:border-transparent rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 px-8 py-6 text-lg font-bold"
              >
                {status === "authenticated" ? "View Full Calendar" : "Sign In to View Calendar"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Calendar Component - Show events list when date is selected */}
          <div>
            <Calendar showEventsList={true} maxEventsToShow={5} clickableEvents={false} showEventDetails={false} centerContent={true} />
          </div>
        </div>
      </section>

      {/* Hero Section 4 - Features with Enhanced Design */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-rose-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `linear-gradient(45deg, transparent 30%, rgba(99, 102, 241, 0.1) 50%, transparent 70%), linear-gradient(-45deg, transparent 30%, rgba(236, 72, 153, 0.1) 50%, transparent 70%)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white mb-6 shadow-lg">
              <Sparkles className="h-5 w-5 mr-2 animate-spin" style={{animationDuration: '3s'}} />
              Platform Features
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
              Everything You Need for <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Medical Education</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: CalendarIcon, title: "Event Management", description: "Comprehensive teaching calendar with booking and attendance tracking", iconClass: "bg-gradient-to-br from-blue-500 to-cyan-500", hoverClass: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10" },
              { icon: Brain, title: "AI Simulator", description: "Practice with realistic AI patients and receive instant expert feedback", iconClass: "bg-gradient-to-br from-purple-500 to-pink-500", hoverClass: "bg-gradient-to-br from-purple-500/10 to-pink-500/10" },
              { icon: FileText, title: "Learning Resources", description: "Access study materials, recordings, and practice resources", iconClass: "bg-gradient-to-br from-indigo-500 to-blue-500", hoverClass: "bg-gradient-to-br from-indigo-500/10 to-blue-500/10" },
              { icon: BarChart3, title: "Analytics Dashboard", description: "Track your progress and performance with detailed analytics", iconClass: "bg-gradient-to-br from-pink-500 to-rose-500", hoverClass: "bg-gradient-to-br from-pink-500/10 to-rose-500/10" },
              { icon: Award, title: "Certificates", description: "Earn certificates for completed training sessions and events", iconClass: "bg-gradient-to-br from-amber-500 to-orange-500", hoverClass: "bg-gradient-to-br from-amber-500/10 to-orange-500/10" },
              { icon: MessageCircle, title: "Feedback System", description: "Provide and receive feedback to improve teaching quality", iconClass: "bg-gradient-to-br from-emerald-500 to-teal-500", hoverClass: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10" },
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-3 border-gray-300/50 hover:border-purple-400 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slide-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                  background: feature.hoverClass.includes('blue') ? 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))' :
                  feature.hoverClass.includes('purple') ? 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))' :
                  feature.hoverClass.includes('indigo') ? 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.1), rgba(59, 130, 246, 0.1))' :
                  feature.hoverClass.includes('pink') ? 'linear-gradient(to bottom right, rgba(236, 72, 153, 0.1), rgba(244, 63, 94, 0.1))' :
                  feature.hoverClass.includes('amber') ? 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.1))' :
                  'linear-gradient(to bottom right, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.1))'
                }}></div>
                <CardContent className="p-8 relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-xl" style={{
                    background: feature.iconClass.includes('blue') ? 'linear-gradient(to bottom right, #3b82f6, #06b6d4)' :
                    feature.iconClass.includes('purple') ? 'linear-gradient(to bottom right, #a855f7, #ec4899)' :
                    feature.iconClass.includes('indigo') ? 'linear-gradient(to bottom right, #6366f1, #3b82f6)' :
                    feature.iconClass.includes('pink') ? 'linear-gradient(to bottom right, #ec4899, #f43f5e)' :
                    feature.iconClass.includes('amber') ? 'linear-gradient(to bottom right, #f59e0b, #f97316)' :
                    'linear-gradient(to bottom right, #10b981, #14b8a6)'
                  }}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">{feature.title}</h3>
                  <p className="text-gray-600 text-base leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Section 5 - AI Simulator with Enhanced Design */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 via-indigo-600 via-pink-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-white/20 backdrop-blur-md text-white mb-8 border-2 border-white/30 shadow-lg">
                <Brain className="h-5 w-5 mr-2 animate-pulse" />
                Premium Feature
              </div>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                AI Patient Simulator
              </h2>
              <p className="text-2xl text-blue-100 mb-10 leading-relaxed">
                Practice with realistic AI patients, receive instant expert feedback, and master clinical skills through immersive voice consultations.
              </p>
              <div className="space-y-5 mb-10">
                {[
                  { icon: MessageCircle, text: "Natural voice conversations" },
                  { icon: CheckCircle, text: "Instant clinical feedback" },
                  { icon: BarChart3, text: "Performance analytics" },
                  { icon: Target, text: "Multiple clinical scenarios" }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-5 text-white animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30 shadow-lg group-hover:scale-110 transition-transform">
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <span className="text-xl font-semibold">{feature.text}</span>
                  </div>
                ))}
              </div>
              {status === "authenticated" ? (
                <Link href="/stations">
                  <Button 
                    size="lg" 
                    className="group bg-white text-purple-600 hover:bg-gray-100 hover:text-purple-700 px-10 py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 rounded-2xl overflow-hidden relative"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                    <Play className="mr-3 h-6 w-6 group-hover:scale-125 transition-transform" />
                    Access Simulator
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button 
                    size="lg" 
                    className="group bg-white text-purple-600 hover:bg-gray-100 hover:text-purple-700 px-10 py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 rounded-2xl overflow-hidden relative"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                    <Play className="mr-3 h-6 w-6 group-hover:scale-125 transition-transform" />
                    Sign In to Access
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 border-2 border-white/20 shadow-2xl animate-slide-up" style={{animationDelay: '0.3s'}}>
              <Card className="bg-white rounded-3xl p-8 shadow-2xl border-0">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                      <Activity className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xl">Active Scenario</h4>
                      <p className="text-sm text-gray-600 font-medium">Chest Pain Assessment</p>
                    </div>
                  </div>
                  <span className="px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold flex items-center border-2 border-emerald-200 shadow-lg">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                    Live
                  </span>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-5 rounded-xl shadow-md">
                    <p className="text-sm text-gray-700 font-medium">"I've been having chest pain for the past 2 hours..."</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 p-5 rounded-xl shadow-md">
                    <p className="text-sm text-gray-700 font-medium">"Can you describe the pain in more detail?"</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
                  <div className="text-base">
                    <span className="text-gray-600 font-medium">Score: </span>
                    <span className="font-bold text-emerald-600 text-2xl">8.5/10</span>
                  </div>
                  <div className="text-base text-gray-600 flex items-center font-medium">
                    <Clock className="h-5 w-5 mr-2" />
                    3:24
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section 6 - Testimonials Slider */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(71, 85, 105, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(100, 116, 139, 0.1) 0%, transparent 50%)`,
          }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-slate-500 via-gray-500 to-slate-600 text-white mb-6 shadow-lg">
              <Star className="h-5 w-5 mr-2" />
              Testimonials
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
              What Our <span className="bg-gradient-to-r from-slate-600 via-gray-600 to-slate-700 bg-clip-text text-transparent">Educators</span> Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Hear from Clinical Teaching Fellows about their experience with Bleepy
            </p>
          </div>

          <div className="relative">
            {/* Testimonials Container */}
            <div className="relative overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {[
                  {
                    name: "Anirudh Suresh",
                    role: "Clinical Teaching Fellow",
                    quote: "Bleepy has transformed how we deliver medical education. The platform provides a seamless experience for both educators and students, making it incredibly easy to coordinate teaching sessions and manage resources all in one place. Our students love the intuitive interface and the ability to access materials anytime.",
                    rating: 5
                  },
                  {
                    name: "Thanuji Rangana",
                    role: "Clinical Teaching Fellow",
                    quote: "As a CTF, Bleepy has streamlined our entire teaching workflow. The platform's comprehensive features have significantly reduced administrative burden, allowing us to focus more on actual teaching and student engagement. It's been a game-changer for our medical education program.",
                    rating: 5
                  }
                ].map((testimonial, index) => (
                  <div 
                    key={index}
                    className="w-full flex-shrink-0 px-4"
                  >
                    <Card className="group relative overflow-hidden border-2 border-gray-200 hover:border-slate-400 bg-white/90 backdrop-blur-sm shadow-2xl transition-all duration-500">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 via-gray-500 to-slate-600"></div>
                      <CardContent className="p-10 relative z-10">
                        <div className="flex items-center justify-center mb-6">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-6 w-6 text-amber-400 fill-amber-400 mx-1" />
                          ))}
                        </div>
                        <blockquote className="text-xl text-gray-700 leading-relaxed mb-8 italic text-center max-w-3xl mx-auto">
                          "{testimonial.quote}"
                        </blockquote>
                        <div className="flex items-center justify-center pt-6 border-t border-gray-100">
                          <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                            <div className="text-sm text-gray-600">{testimonial.role}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? 1 : prev - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all duration-300 hover:scale-110 z-20 border-2 border-gray-200"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev === 1 ? 0 : prev + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all duration-300 hover:scale-110 z-20 border-2 border-gray-200"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 text-slate-600" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center items-center gap-2 mt-8">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`transition-all duration-300 rounded-full ${
                    currentTestimonial === index
                      ? 'w-3 h-3 bg-slate-600'
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section 7 - Getting Started */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-96 h-96 bg-amber-300 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-300 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white mb-6 shadow-lg">
              <Lightbulb className="h-5 w-5 mr-2" />
              Getting Started
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
              Your Learning <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">Journey</span> Starts Here
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Simple steps to maximize your medical education experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                step: "01",
                icon: UserCheck,
                title: "Create Your Profile",
                description: "Set up your profile with your university, year, and specialty. Personalize your learning experience.",
                color: "from-amber-500 to-orange-500"
              },
              { 
                step: "02",
                icon: CalendarIcon,
                title: "Explore & Book Events",
                description: "Browse the teaching calendar, discover relevant sessions, and book your spot in advance.",
                color: "from-orange-500 to-red-500"
              },
              { 
                step: "03",
                icon: Target,
                title: "Track Your Progress",
                description: "Monitor your attendance, complete feedback, earn certificates, and build your portfolio.",
                color: "from-red-500 to-pink-500"
              },
            ].map((item, index) => (
              <div 
                key={index}
                className="relative group animate-slide-up"
                style={{animationDelay: `${index * 0.15}s`}}
              >
                <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-amber-400 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{
                        background: item.color.includes('amber-500') && item.color.includes('orange-500') ? 'linear-gradient(to bottom right, #f59e0b, #f97316)' :
                        item.color.includes('orange-500') && item.color.includes('red-500') ? 'linear-gradient(to bottom right, #f97316, #ef4444)' :
                        'linear-gradient(to bottom right, #ef4444, #ec4899)'
                      }}>
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-6xl font-bold text-gray-200 group-hover:text-amber-200 transition-colors">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-amber-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {status !== "authenticated" && (
            <div className="text-center mt-12 animate-fade-in" style={{animationDelay: '0.5s'}}>
              <Link href="/auth/signin">
                <Button 
                  size="lg" 
                  className="group bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 px-8 py-6 text-lg font-bold"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
