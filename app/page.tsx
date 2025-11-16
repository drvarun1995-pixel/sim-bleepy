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
  ChevronLeft, ChevronRight, Mail, QrCode, Gamepad2, Trophy, LayoutGrid,
  Settings, Lock, Globe, Cpu, Database, Cloud, Send,
  MessageSquare, TrendingDown as TrendingDownIcon, Layers, FolderOpen, 
  FileCheck2, Wand, Bot, Megaphone, TrendingUp as LineChart, PieChart
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Calendar from "@/components/Calendar";
import { SplitText, TextType, BlurText, ScrollRevealText } from "@/components/animations";

// Scroll reveal hook using Intersection Observer
function useScrollReveal() {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const observersRef = useRef<IntersectionObserver[]>([]);

  useEffect(() => {
    // Observe all elements after they're set
    const observeElements = () => {
      Object.keys(refs.current).forEach((key) => {
        const element = refs.current[key];
        if (!element || isVisible[key]) return;

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible((prev) => ({ ...prev, [key]: true }));
              observer.unobserve(entry.target);
            }
          },
          { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
        );

        observer.observe(element);
        observersRef.current.push(observer);
      });
    };

    // Small delay to ensure refs are set
    const timeoutId = setTimeout(observeElements, 100);
    
    // Also observe immediately
    observeElements();

    return () => {
      clearTimeout(timeoutId);
      observersRef.current.forEach((obs) => obs.disconnect());
      observersRef.current = [];
    };
  }, [isVisible]);

  const setRef = (key: string) => (el: HTMLDivElement | null) => {
    if (refs.current[key] !== el) {
      refs.current[key] = el;
      
      // Set up observer for this element
      if (el && !isVisible[key]) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible((prev) => ({ ...prev, [key]: true }));
              observer.unobserve(entry.target);
            }
          },
          { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
        );

        observer.observe(el);
        observersRef.current.push(observer);
      }
    }
  };

  return { isVisible, setRef };
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isVisible, setRef } = useScrollReveal();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({
    aru: { studentCount: 0, activeStudents: 0, eventsThisMonth: 0 },
    ucl: { studentCount: 0, activeStudents: 0, eventsThisMonth: 0 },
    foundationYear: { doctorCount: 0, activeDoctors: 0, eventsThisMonth: 0 }
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
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
      
      {/* ============================================
          HERO SECTION 1 - COMPELLING PITCH
          ============================================ */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[95vh] flex items-center">
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
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="text-center max-w-5xl mx-auto">
            {/* Location Badge */}
            <div className="flex justify-center mb-6 animate-fade-in">
              <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold bg-white/90 backdrop-blur-md border-2 border-blue-300 text-blue-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <MapPin className="h-4 w-4 mr-2 animate-pulse" />
                Basildon Hospital
              </div>
            </div>

            {/* Main Pitch Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-6 leading-tight">
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-y-0">
                <SplitText
                  delay={0}
                  duration={0.8}
                  stagger={0.08}
                  direction="up"
                  className="whitespace-nowrap"
                >
                  The Complete Platform for
                </SplitText>
                <SplitText
                  delay={0.4}
                  duration={0.8}
                  stagger={0.06}
                  direction="up"
                  className="whitespace-nowrap"
                  gradientClassName="bg-gradient-to-r from-blue-600 via-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]"
                >
                  Medical Education
                </SplitText>
              </div>
            </h1>
            
            {/* Value Proposition */}
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-4">
              <TextType
                text="Empowering the next generation of medical professionals"
                speed={40}
                delay={1.2}
                showCursor={true}
                className="block"
              />
            </p>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12 animate-slide-up line-clamp-2" style={{animationDelay: '0.4s'}}>
              Experience seamless event coordination, AI-powered clinical simulations, automated attendance tracking, and instant certificate generation—all designed to accelerate your journey.
            </p>

            {/* Key Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 backdrop-blur-sm border-2 border-blue-300/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                <CardContent className="p-5 text-center">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-2 animate-bounce" style={{animationDuration: '2s'}} />
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {stats.aru.studentCount + stats.ucl.studentCount + stats.foundationYear.doctorCount}
                  </div>
                  <p className="text-sm text-gray-700 font-medium mt-1">Active Learners</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 backdrop-blur-sm border-2 border-purple-300/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                <CardContent className="p-5 text-center">
                  <CalendarIcon className="h-6 w-6 text-purple-600 mx-auto mb-2 animate-pulse" />
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    {stats.aru.eventsThisMonth + stats.ucl.eventsThisMonth + stats.foundationYear.eventsThisMonth}
                  </div>
                  <p className="text-sm text-gray-700 font-medium mt-1">Events This Month</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 backdrop-blur-sm border-2 border-indigo-300/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                <CardContent className="p-5 text-center">
                  <ActivityIcon className="h-6 w-6 text-indigo-600 mx-auto mb-2 animate-pulse" style={{animationDelay: '0.5s'}} />
                  <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                    {stats.aru.activeStudents + stats.ucl.activeStudents + stats.foundationYear.activeDoctors}
                  </div>
                  <p className="text-sm text-gray-700 font-medium mt-1">Active Users</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/20 backdrop-blur-sm border-2 border-pink-300/50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                <CardContent className="p-5 text-center">
                  <Award className="h-6 w-6 text-pink-600 mx-auto mb-2 animate-pulse" style={{animationDelay: '1s'}} />
                  <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">
                    100%
                  </div>
                  <p className="text-sm text-gray-700 font-medium mt-1">Automated</p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{animationDelay: '0.8s'}}>
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
                    className="group relative bg-white/90 backdrop-blur-md border-2 border-purple-500 text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-purple-600 px-10 py-7 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-500 ease-out rounded-2xl overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Sparkles className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
                      Go to Dashboard
                    </span>
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

      {/* ============================================
          FEATURE GALLERY SECTION
          ============================================ */}
      <section 
        ref={setRef('features-gallery')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white mb-6 shadow-lg animate-pulse">
              <Sparkles className="h-5 w-5 mr-2" />
              Platform Features
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              <ScrollRevealText
                blur={true}
                opacity={true}
                direction="up"
                duration={1}
              >
                Everything You Need in{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  One Platform
                </span>
              </ScrollRevealText>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A comprehensive suite of tools designed specifically for medical education
            </p>
          </div>

          {/* Feature Grid - 3 columns on mobile, 2 on md, 3 on lg, 4 on xl */}
          <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[
              { icon: CalendarIcon, title: "Event Management", color: "from-blue-500 to-cyan-500", desc: "Complete calendar system" },
              { icon: Brain, title: "AI Simulator", color: "from-purple-500 to-pink-500", desc: "Realistic patient practice" },
              { icon: FileText, title: "Learning Resources", color: "from-indigo-500 to-blue-500", desc: "Study materials library" },
              { icon: LayoutGrid, title: "Personalized Dashboard", color: "from-pink-500 to-rose-500", desc: "Tailored experience" },
              { icon: Award, title: "Certificates", color: "from-amber-500 to-orange-500", desc: "Automated accreditation" },
              { icon: QrCode, title: "QR Attendance", color: "from-emerald-500 to-teal-500", desc: "Instant check-in" },
              { icon: MessageSquare, title: "Feedback System", color: "from-teal-500 to-cyan-500", desc: "Real-time insights" },
              { icon: Wand, title: "Fully Automated", color: "from-violet-500 to-purple-500", desc: "Smart workflows" },
              { icon: Gamepad2, title: "Games Hub", color: "from-blue-600 to-indigo-600", desc: "Practice & Challenge" },
              { icon: Mail, title: "Custom Emails", color: "from-rose-500 to-pink-500", desc: "Targeted communication" },
              { icon: BarChart3, title: "Analytics", color: "from-green-500 to-emerald-500", desc: "Data-driven insights" },
              { icon: FolderOpen, title: "Portfolio Management", color: "from-orange-500 to-red-500", desc: "IMT evidence tracking" },
            ].map((feature, index) => (
              <ScrollRevealText
                key={index}
                blur={false}
                opacity={true}
                direction="up"
                duration={0.6}
                threshold={0.1}
                className="block h-full"
              >
                <Card className="group relative overflow-hidden border-2 border-gray-200/50 hover:border-purple-400 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 hover:scale-105 h-full flex flex-col">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <CardContent className="p-3 sm:p-4 md:p-6 relative z-10 flex flex-col h-full items-center text-center">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-xl bg-gradient-to-br ${feature.color} flex-shrink-0`}>
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all flex-shrink-0 leading-tight" style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 flex-grow hidden sm:block text-center">{feature.desc}</p>
                </CardContent>
              </Card>
              </ScrollRevealText>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          INDIVIDUAL FEATURE SECTIONS
          ============================================ */}

      {/* Event Management */}
      <section 
        ref={setRef('event-management')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-700 mb-6">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Core Feature
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                <BlurText
                  delay={0}
                  duration={1}
                  direction="top"
                  blur={15}
                  className="block"
                >
                  Complete <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Event Management</span>
                </BlurText>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Organize, schedule, and manage all teaching events in one place. From bedside teaching to grand rounds, our comprehensive calendar system keeps everything organized and accessible.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: CheckCircle, text: "Intuitive calendar interface with advanced filtering" },
                  { icon: CheckCircle, text: "Bulk event import from Excel files" },
                  { icon: CheckCircle, text: "Automatic email notifications and calendar sync" },
                  { icon: CheckCircle, text: "Role-based access and event categorization" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <item.icon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-lg">{item.text}</span>
                  </li>
                ))}
              </ul>
              {status === "authenticated" ? (
                <Link href="/calendar">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl">
                    View Calendar <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-6 text-lg font-bold rounded-xl">
                    Sign In to Access <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
            <ScrollRevealText
              blur={false}
              opacity={true}
              direction="right"
              duration={0.8}
              threshold={0.1}
              className="relative block"
            >
              <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-blue-200 p-8 rounded-2xl">
                <div className="space-y-4">
                  {[
                    { title: "Core Teaching Session", time: "Monday, 10:00 AM - Cardiology Ward", icon: CalendarIcon, bgClass: "from-blue-50 to-cyan-50", borderClass: "border-blue-200", iconClass: "text-blue-600" },
                    { title: "Grand Rounds", time: "Wednesday, 2:00 PM - Lecture Hall", icon: Users, bgClass: "from-blue-50 to-cyan-50", borderClass: "border-cyan-200", iconClass: "text-cyan-600" },
                    { title: "Bedside Teaching", time: "Friday, 9:00 AM - Ward 12", icon: Stethoscope, bgClass: "from-blue-50 to-cyan-50", borderClass: "border-blue-200", iconClass: "text-blue-600" },
                  ].map((event, i) => (
                    <ScrollRevealText
                      key={i}
                      blur={false}
                      opacity={true}
                      direction="right"
                      duration={0.6}
                      threshold={0.1}
                      className="block"
                    >
                      <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${event.bgClass} rounded-xl border ${event.borderClass} transition-all duration-700 transform hover:scale-105 hover:shadow-lg`}>
                      <div>
                        <h3 className="font-bold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600">{event.time}</p>
                      </div>
                      <event.icon className={`h-8 w-8 ${event.iconClass}`} />
                      </div>
                    </ScrollRevealText>
                  ))}
                </div>
              </Card>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* AI Patient Simulator */}
      <section 
        ref={setRef('ai-simulator')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-white/20 backdrop-blur-md text-white mb-6 border-2 border-white/30">
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Premium Feature
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
                <ScrollRevealText
                  blur={true}
                  opacity={true}
                  direction="left"
                  duration={1.2}
                  threshold={0.1}
                  className="block"
                >
                  <BlurText
                    delay={0}
                    duration={1.2}
                    direction="top"
                    blur={20}
                    className="block"
                  >
                    AI Patient Simulator
                  </BlurText>
                </ScrollRevealText>
              </h2>
              <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                Practice realistic clinical consultations with AI-powered patients. Receive instant expert feedback and master your clinical skills through immersive voice-based interactions.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: MessageCircle, text: "Natural voice conversations with AI patients" },
                  { icon: CheckCircle, text: "Instant clinical feedback and scoring" },
                  { icon: BarChart3, text: "Performance analytics and progress tracking" },
                  { icon: Target, text: "Multiple clinical scenarios and stations" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <item.icon className="h-6 w-6 text-purple-200 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-100 text-lg">{item.text}</span>
                  </li>
                ))}
              </ul>
              {status === "authenticated" ? (
                <Link href="/stations">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 hover:text-purple-700 px-8 py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 rounded-xl">
                    <Play className="mr-2 h-5 w-5" />
                    Access Simulator
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-6 text-lg font-bold rounded-xl">
                    <Play className="mr-2 h-5 w-5" />
                    Sign In to Access
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="relative">
              <Card className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/20 shadow-2xl">
                <Card className="bg-white rounded-3xl p-6 shadow-2xl border-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                        <Activity className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-xl">Active Scenario</h4>
                        <p className="text-sm text-gray-600">Chest Pain Assessment</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold flex items-center border-2 border-emerald-200">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                      Live
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-5 rounded-xl">
                      <p className="text-sm text-gray-700 font-medium">"I've been having chest pain for the past 2 hours..."</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 p-5 rounded-xl">
                      <p className="text-sm text-gray-700 font-medium">"Can you describe the pain in more detail?"</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
                    <div>
                      <span className="text-gray-600 font-medium">Score: </span>
                      <span className="font-bold text-emerald-600 text-2xl">8.5/10</span>
                    </div>
                    <div className="text-gray-600 flex items-center font-medium">
                      <Clock className="h-5 w-5 mr-2" />
                      3:24
                    </div>
                  </div>
                </Card>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Games Hub - Practice & Challenge */}
      <section 
        ref={setRef('games-hub')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-indigo-100 text-indigo-700 mb-6">
              <Gamepad2 className="h-4 w-4 mr-2" />
              New Feature
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              <ScrollRevealText
                blur={true}
                opacity={true}
                direction="up"
                duration={1}
                threshold={0.1}
                className="block"
              >
                <BlurText
                  delay={0}
                  duration={1}
                  direction="top"
                  blur={15}
                  className="block"
                >
                  Gamified Learning with <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Practice & Challenge</span>
                </BlurText>
              </ScrollRevealText>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Make learning fun and competitive with our games hub featuring solo practice mode and multiplayer challenge sessions with leaderboards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Practice Mode */}
            <ScrollRevealText
              blur={false}
              opacity={true}
              direction="up"
              duration={0.8}
              threshold={0.1}
              className="block"
            >
              <Card className="group relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/20 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
              <CardContent className="p-8 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Practice Mode</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Solo practice sessions to master your skills at your own pace. Earn XP, track accuracy, and build streaks.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    { icon: CheckCircle, text: "Unlimited solo practice sessions" },
                    { icon: CheckCircle, text: "XP and accuracy tracking" },
                    { icon: CheckCircle, text: "Personal progress dashboard" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <item.icon className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/games/practice">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl">
                    Start Practicing <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            </ScrollRevealText>

            {/* Challenge Mode */}
            <ScrollRevealText
              blur={false}
              opacity={true}
              direction="up"
              duration={0.8}
              threshold={0.1}
              className="block"
            >
              <Card className="group relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
              <CardContent className="p-8 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Challenge Mode</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Compete in real-time multiplayer quizzes with music and leaderboards. Host or join live challenge sessions.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    { icon: CheckCircle, text: "Real-time multiplayer competitions" },
                    { icon: CheckCircle, text: "Music and leaderboard features" },
                    { icon: CheckCircle, text: "Host or join live challenges" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <item.icon className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/games/challenge">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl">
                    Join Challenge <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* QR Attendance & Automation */}
      <section 
        ref={setRef('qr-attendance')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700 mb-6">
                <QrCode className="h-4 w-4 mr-2" />
                Automation Feature
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                <ScrollRevealText
                  blur={true}
                  opacity={true}
                  direction="right"
                  duration={1}
                  threshold={0.1}
                  className="block"
                >
                  <BlurText
                    delay={0}
                    duration={1}
                    direction="top"
                    blur={15}
                    className="block"
                  >
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">QR Code Attendance</span> & Automation
                  </BlurText>
                </ScrollRevealText>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Streamline attendance tracking with instant QR code scanning. Our fully automated system handles check-ins, certificate generation, and feedback collection seamlessly.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: QrCode, text: "Instant QR code check-in at events" },
                  { icon: Award, text: "Automatic certificate generation after feedback" },
                  { icon: MessageSquare, text: "Automated feedback collection and analysis" },
                  { icon: Wand, text: "Smart workflows that save hours of admin work" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <item.icon className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-lg">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 relative">
              <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-emerald-200 p-8 rounded-2xl">
                <div className="text-center mb-6">
                  <div className="w-48 h-48 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center border-4 border-emerald-300 shadow-lg">
                    <QrCode className="h-32 w-32 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <div>
                      <h4 className="font-bold text-gray-900">Scan to Check In</h4>
                      <p className="text-sm text-gray-600">Event attendance recorded</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <div>
                      <h4 className="font-bold text-gray-900">Auto Certificate</h4>
                      <p className="text-sm text-gray-600">Generated after feedback</p>
                    </div>
                    <Award className="h-8 w-8 text-teal-600" />
                  </div>
                </div>
              </Card>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Email System */}
      <section 
        ref={setRef('email-system')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-rose-200 p-8 rounded-2xl">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200">
                    <Mail className="h-8 w-8 text-rose-600" />
                    <div>
                      <h4 className="font-bold text-gray-900">Custom Email Campaigns</h4>
                      <p className="text-sm text-gray-600">Targeted communication</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200">
                    <p className="text-sm text-gray-700 mb-2 font-medium">Rich text editor with:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Images and tables</li>
                      <li>• Profile-based filtering</li>
                      <li>• Delivery tracking</li>
                      <li>• Email logs and analytics</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
                  <div>
                    <span className="text-gray-600 font-medium">Success Rate: </span>
                    <span className="font-bold text-emerald-600 text-2xl">98%</span>
                  </div>
                  <BarChart3 className="h-8 w-8 text-rose-600" />
                </div>
              </Card>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-rose-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-rose-100 text-rose-700 mb-6">
                <Mail className="h-4 w-4 mr-2" />
                Communication
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                <ScrollRevealText
                  blur={true}
                  opacity={true}
                  direction="left"
                  duration={1}
                  threshold={0.1}
                  className="block"
                >
                  <BlurText
                    delay={0}
                    duration={1}
                    direction="top"
                    blur={15}
                    className="block"
                  >
                    <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Custom Email System</span> for Targeted Communication
                  </BlurText>
                </ScrollRevealText>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Send beautifully designed emails to specific groups of students. Use our rich text editor with images and tables, filter by profile, and track delivery in real-time.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: Send, text: "Rich text editor with images and tables" },
                  { icon: Users, text: "Profile-based recipient filtering (university, year, role)" },
                  { icon: Eye, text: "Complete email logs with delivery tracking" },
                  { icon: BarChart3, text: "Success/failure metrics and analytics" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <item.icon className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-lg">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics & Insights */}
      <section 
        ref={setRef('analytics')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-indigo-100 text-indigo-700 mb-6">
              <LineChart className="h-4 w-4 mr-2" />
              Data & Insights
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              <ScrollRevealText
                blur={true}
                opacity={true}
                direction="up"
                duration={1}
                threshold={0.1}
                className="block"
              >
                <BlurText
                  delay={0}
                  duration={1}
                  direction="top"
                  blur={15}
                  className="block"
                >
                  Powerful <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Analytics & Insights</span>
                </BlurText>
              </ScrollRevealText>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Track engagement, monitor performance, and make data-driven decisions with comprehensive analytics dashboards.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: "Activity Over Time", desc: "Track user engagement trends", color: "from-blue-500 to-indigo-500" },
              { icon: Users, title: "Active Users", desc: "Monitor daily and monthly active users", color: "from-purple-500 to-pink-500" },
              { icon: Download, title: "Resource Analytics", desc: "Track downloads and resource usage", color: "from-indigo-500 to-purple-500" },
            ].map((item, i) => (
              <ScrollRevealText
                key={i}
                blur={false}
                opacity={true}
                direction="up"
                duration={0.6}
                threshold={0.1}
                className="block"
              >
                <Card className="group relative overflow-hidden border-2 border-gray-200 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <CardContent className="p-8 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 transition-all duration-500 shadow-xl bg-gradient-to-br ${item.color}`}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
              </ScrollRevealText>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          TEACHING CALENDAR SECTION - KEEP AS IS
          ============================================ */}
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

      {/* ============================================
          STUDENT GROUPS SECTION
          ============================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 relative overflow-hidden">
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
            {/* ARU Students Card */}
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

            {/* UCL Students Card */}
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

            {/* Foundation Year Doctors Card */}
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

      {/* ============================================
          TESTIMONIALS SECTION
          ============================================ */}
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

      {/* ============================================
          GETTING STARTED / CTA SECTION
          ============================================ */}
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
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform bg-gradient-to-br ${item.color}`}>
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