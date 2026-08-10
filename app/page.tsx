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
import dynamic from "next/dynamic";
import Calendar from "@/components/Calendar";
import { BlurText, ScrollRevealText, RevealGroup, RevealItem } from "@/components/animations";

const BleepyThreeScene = dynamic(
  () => import("@/components/home/BleepyThreeScene").then((mod) => mod.BleepyThreeScene),
  { ssr: false }
);

function getScrollRevealOptions() {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return {
    threshold: mobile ? 0.01 : 0.1,
    rootMargin: mobile ? "0px 0px -8px 0px" : "0px 0px -100px 0px",
  };
}

function isInViewport(el: Element, rootMargin: string) {
  const bottom = Math.abs(parseInt(rootMargin.split(/\s+/)[2] ?? "0", 10) || 0);
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight - bottom && rect.bottom > 0;
}

// Scroll reveal hook using Intersection Observer
function useScrollReveal() {
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const observersRef = useRef<IntersectionObserver[]>([]);

  const observeElement = (key: string, element: HTMLDivElement) => {
    if (isVisible[key]) return;

    const { threshold, rootMargin } = getScrollRevealOptions();

    if (isInViewport(element, rootMargin)) {
      setIsVisible((prev) => ({ ...prev, [key]: true }));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, [key]: true }));
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    observersRef.current.push(observer);
  };

  useEffect(() => {
    const observeElements = () => {
      Object.keys(refs.current).forEach((key) => {
        const element = refs.current[key];
        if (element) observeElement(key, element);
      });
    };

    const timeoutId = window.setTimeout(observeElements, 100);
    observeElements();

    return () => {
      window.clearTimeout(timeoutId);
      observersRef.current.forEach((obs) => obs.disconnect());
      observersRef.current = [];
    };
  }, [isVisible]);

  const setRef = (key: string) => (el: HTMLDivElement | null) => {
    if (refs.current[key] !== el) {
      refs.current[key] = el;
      if (el) observeElement(key, el);
    }
  };

  return { isVisible, setRef };
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isVisible, setRef } = useScrollReveal();
  const [stats, setStats] = useState({
    aru: { studentCount: 0, activeStudents: 0, eventsThisMonth: 0 },
    ucl: { studentCount: 0, activeStudents: 0, eventsThisMonth: 0 },
    foundationYear: { doctorCount: 0, activeDoctors: 0, eventsThisMonth: 0 }
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    fetchStats();
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
      <div className="min-h-screen bg-[#060818] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-cyan-500/20">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bleepy-home bg-[#060818] min-h-screen overflow-x-hidden">
      
      {/* ============================================
          HERO SECTION 1 - COMPELLING PITCH
          ============================================ */}
      <section className="relative min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 overflow-hidden -mt-16 pt-16">
        <BleepyThreeScene />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="bleepy-hero-orb absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="bleepy-hero-orb bleepy-hero-orb-delay absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative flex-1 flex items-center justify-center z-10 w-full">
          <RevealGroup immediate className="max-w-4xl mx-auto w-full text-center px-2">
            <RevealItem delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-cyan-400/10 border border-cyan-400/20 text-white mb-10">
                <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
                Next-generation medical education platform
              </div>
            </RevealItem>

            <RevealItem delay={150}>
              <h1 className="font-display text-[clamp(1.65rem,7.5vw,2.75rem)] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6rem] font-bold mb-10 leading-[1.08] sm:leading-[1.05] tracking-tight max-w-full px-1">
                <span className="block text-white sm:whitespace-nowrap bleepy-hero-line">Where medical minds</span>
                <span
                  className="block bleepy-hero-gradient-line sm:whitespace-nowrap bleepy-hero-line bleepy-hero-line-delay"
                  style={{
                    background: "linear-gradient(90deg, #22d3ee 0%, #67e8f9 50%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "#22d3ee",
                  }}
                >
                  come alive
                </span>
              </h1>
            </RevealItem>

            <RevealItem delay={320}>
              <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
                Educators organise live teaching sessions. Students book, attend, and learn through AI patient simulations, SBA games, and automatic feedback — all in one immersive platform.
              </p>
            </RevealItem>

            <RevealItem delay={500}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
                {status === "authenticated" ? (
                  <Link href="/dashboard" className="bleepy-hero-cta">
                    <Button size="sm" className="bleepy-btn-primary bleepy-hero-cta-btn px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold group border-0 h-auto w-full sm:w-auto">
                      Go to Dashboard
                      <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signin" className="bleepy-hero-cta">
                    <Button size="sm" className="bleepy-btn-primary bleepy-hero-cta-btn px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold group border-0 h-auto w-full sm:w-auto">
                      Get Started Free
                      <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
                <Link href="#calendar" className="bleepy-hero-cta bleepy-hero-cta-delay">
                  <Button size="sm" className="bleepy-btn-ghost bleepy-hero-cta-btn px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold h-auto w-full sm:w-auto">
                    <CalendarIcon className="mr-1.5 h-4 w-4" />
                    View Teaching Calendar
                  </Button>
                </Link>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>

        <RevealGroup immediate className="relative z-10 pb-10 flex flex-col items-center gap-6 text-slate-500 text-sm">
          <RevealItem delay={700}>
            <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <MapPin className="h-3 w-3 mr-2 text-cyan-400" />
              Basildon Hospital
            </div>
          </RevealItem>
          <RevealItem delay={850}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2">
                <div className="w-1 h-2 bg-slate-400 rounded-full animate-bounce" />
              </div>
              <span>Scroll to explore</span>
            </div>
          </RevealItem>
        </RevealGroup>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#060818] relative">
        <RevealGroup className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, value: stats.aru.studentCount + stats.ucl.studentCount + stats.foundationYear.doctorCount, label: "Active Learners" },
            { icon: CalendarIcon, value: stats.aru.eventsThisMonth + stats.ucl.eventsThisMonth + stats.foundationYear.eventsThisMonth, label: "Events This Month" },
            { icon: ActivityIcon, value: stats.aru.activeStudents + stats.ucl.activeStudents + stats.foundationYear.activeDoctors, label: "Active Users" },
            { icon: Award, value: "100%", label: "Automated" },
          ].map((stat, index) => (
            <RevealItem key={index} delay={index * 90} className="h-full">
              <Card className="bleepy-card hover:border-cyan-400/30 transition-all duration-300 hover:-translate-y-1 border-0 h-full">
                <CardContent className="p-5 text-center">
                  <stat.icon className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold font-display bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent">{stat.value}</div>
                  <p className="text-sm text-slate-400 font-medium mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ============================================
          FEATURE GALLERY SECTION
          ============================================ */}
      <section 
        id="features-gallery"
        ref={setRef('features-gallery')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[#060818] relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <RevealGroup className="text-center mb-16">
            <RevealItem delay={0}>
              <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 mb-6 shadow-lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Platform Features
              </div>
            </RevealItem>
            <RevealItem delay={100}>
              <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6">
                Everything You Need in{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  One Platform
                </span>
              </h2>
            </RevealItem>
            <RevealItem delay={200}>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                A comprehensive suite of tools designed specifically for medical education
              </p>
            </RevealItem>
          </RevealGroup>

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
                blur={true}
                opacity={true}
                scale={true}
                direction="up"
                duration={0.75}
                threshold={0.08}
                delay={index * 55}
                className="block h-full"
              >
                <Card className="group relative overflow-hidden bleepy-card hover:border-cyan-400/30 hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 hover:scale-105 h-full flex flex-col">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <CardContent className="p-3 sm:p-4 md:p-6 relative z-10 flex flex-col h-full items-center text-center">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-xl bg-gradient-to-br ${feature.color} flex-shrink-0`}>
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white mb-1 sm:mb-2 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all flex-shrink-0 leading-tight" style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 flex-grow hidden sm:block text-center">{feature.desc}</p>
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
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[#080b18] relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <RevealGroup>
              <RevealItem delay={0}>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-700 mb-6">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Core Feature
                </div>
              </RevealItem>
              <RevealItem delay={90}>
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  Complete <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Event Management</span>
                </h2>
              </RevealItem>
              <RevealItem delay={180}>
                <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                  Organize, schedule, and manage all teaching events in one place. From bedside teaching to grand rounds, our comprehensive calendar system keeps everything organized and accessible.
                </p>
              </RevealItem>
              <RevealItem delay={270}>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: CheckCircle, text: "Intuitive calendar interface with advanced filtering" },
                    { icon: CheckCircle, text: "Bulk event import from Excel files" },
                    { icon: CheckCircle, text: "Automatic email notifications and calendar sync" },
                    { icon: CheckCircle, text: "Role-based access and event categorization" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <item.icon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-lg">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </RevealItem>
              <RevealItem delay={360}>
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
              </RevealItem>
            </RevealGroup>
            <ScrollRevealText
              blur={true}
              opacity={true}
              scale={true}
              direction="right"
              duration={0.85}
              threshold={0.1}
              delay={120}
              className="relative block"
            >
              <Card className="bg-sky-400/15 backdrop-blur-xl shadow-2xl shadow-blue-500/10 border border-sky-300/25 p-6 rounded-2xl bleepy-glow-sky">
                <div className="space-y-3">
                  {[
                    { title: "Core Teaching Session", time: "Monday, 10:00 AM - Cardiology Ward", icon: CalendarIcon, bgClass: "from-sky-300/45 to-blue-300/35", borderClass: "border-sky-300/40", iconClass: "text-blue-500" },
                    { title: "Grand Rounds", time: "Wednesday, 2:00 PM - Lecture Hall", icon: Users, bgClass: "from-sky-300/45 to-cyan-300/35", borderClass: "border-cyan-300/40", iconClass: "text-cyan-500" },
                    { title: "Bedside Teaching", time: "Friday, 9:00 AM - Ward 12", icon: Stethoscope, bgClass: "from-sky-300/45 to-blue-300/35", borderClass: "border-sky-300/40", iconClass: "text-blue-500" },
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
                      <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${event.bgClass} rounded-xl border ${event.borderClass} transition-all duration-700 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10`}>
                      <div>
                        <h3 className="font-bold text-white">{event.title}</h3>
                        <p className="text-sm text-sky-100/80">{event.time}</p>
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

      {/* QR Attendance & Automation */}
      <section 
        ref={setRef('qr-attendance')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[#060818] relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <RevealGroup>
                <RevealItem delay={0}>
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700 mb-6">
                    <QrCode className="h-4 w-4 mr-2" />
                    Automation Feature
                  </div>
                </RevealItem>
                <RevealItem delay={90}>
                  <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">QR Code Attendance</span> & Automation
                  </h2>
                </RevealItem>
                <RevealItem delay={180}>
                  <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                    Streamline attendance tracking with instant QR code scanning. Our fully automated system handles check-ins, certificate generation, and feedback collection seamlessly.
                  </p>
                </RevealItem>
                <RevealItem delay={270}>
                  <ul className="space-y-4 mb-8">
                    {[
                      { icon: QrCode, text: "Instant QR code check-in at events" },
                      { icon: Award, text: "Automatic certificate generation after feedback" },
                      { icon: MessageSquare, text: "Automated feedback collection and analysis" },
                      { icon: Wand, text: "Smart workflows that save hours of admin work" },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <item.icon className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300 text-lg">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </RevealItem>
              </RevealGroup>
            </div>
            <ScrollRevealText
              blur={true}
              scale={true}
              opacity={true}
              direction="left"
              duration={0.85}
              threshold={0.1}
              delay={100}
              className="order-1 lg:order-2 relative block"
            >
              <Card className="bg-emerald-300/15 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 border border-emerald-300/25 p-8 rounded-2xl bleepy-glow-emerald">
                <div className="text-center mb-6">
                  <div className="w-48 h-48 mx-auto bg-gradient-to-br from-emerald-200/60 to-teal-200/50 rounded-2xl flex items-center justify-center border border-emerald-300/50 shadow-lg">
                    <QrCode className="h-32 w-32 text-emerald-700" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-300/45 to-teal-300/35 rounded-xl border border-emerald-300/40">
                    <div>
                      <h3 className="font-bold text-white">Scan to Check In</h3>
                      <p className="text-sm text-emerald-100/80">Event attendance recorded</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-300/45 to-teal-300/35 rounded-xl border border-emerald-300/40">
                    <div>
                      <h3 className="font-bold text-white">Auto Certificate</h3>
                      <p className="text-sm text-emerald-100/80">Generated after feedback</p>
                    </div>
                    <Award className="h-8 w-8 text-teal-600" />
                  </div>
                </div>
              </Card>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* Custom Email System */}
      <section 
        ref={setRef('email-system')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[#080b18] relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollRevealText
              blur={true}
              scale={true}
              opacity={true}
              direction="right"
              duration={0.85}
              threshold={0.1}
              className="relative block"
            >
              <Card className="bg-rose-300/15 backdrop-blur-xl shadow-2xl shadow-rose-500/10 border border-rose-300/25 p-8 rounded-2xl bleepy-glow-rose">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-rose-300/45 to-pink-300/35 rounded-xl border border-rose-300/40">
                    <Mail className="h-8 w-8 text-rose-500" />
                    <div>
                      <h3 className="font-bold text-white">Custom Email Campaigns</h3>
                      <p className="text-sm text-rose-100/80">Targeted communication</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-rose-300/40 to-pink-300/30 rounded-xl border border-rose-300/35">
                    <p className="text-sm text-rose-50/90 mb-2 font-medium">Rich text editor with:</p>
                    <ul className="space-y-1 text-sm text-rose-100/75">
                      <li>• Images and tables</li>
                      <li>• Profile-based filtering</li>
                      <li>• Delivery tracking</li>
                      <li>• Email logs and analytics</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-rose-300/30">
                  <div>
                    <span className="text-rose-100/80 font-medium">Success Rate: </span>
                    <span className="font-bold text-emerald-500 text-2xl">98%</span>
                  </div>
                  <BarChart3 className="h-8 w-8 text-rose-500" />
                </div>
              </Card>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-rose-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </ScrollRevealText>
            <RevealGroup>
              <RevealItem delay={0}>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-rose-100 text-rose-700 mb-6">
                  <Mail className="h-4 w-4 mr-2" />
                  Communication
                </div>
              </RevealItem>
              <RevealItem delay={90}>
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Custom Email System</span> for Targeted Communication
                </h2>
              </RevealItem>
              <RevealItem delay={180}>
                <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                  Send beautifully designed emails to specific groups of students. Use our rich text editor with images and tables, filter by profile, and track delivery in real-time.
                </p>
              </RevealItem>
              <RevealItem delay={270}>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Send, text: "Rich text editor with images and tables" },
                    { icon: Users, text: "Profile-based recipient filtering (university, year, role)" },
                    { icon: Eye, text: "Complete email logs with delivery tracking" },
                    { icon: BarChart3, text: "Success/failure metrics and analytics" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <item.icon className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-lg">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </RevealItem>
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Analytics & Insights */}
      <section 
        ref={setRef('analytics')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[#080b18] relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <RevealGroup className="text-center mb-16">
            <RevealItem delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-cyan-400/10 border border-cyan-400/20 text-white mb-6">
                <LineChart className="h-4 w-4 mr-2 text-cyan-400" />
                Data & Insights
              </div>
            </RevealItem>
            <RevealItem delay={100}>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Powerful <span className="bleepy-gradient-text">Analytics & Insights</span>
              </h2>
            </RevealItem>
            <RevealItem delay={200}>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Track engagement, monitor performance, and make data-driven decisions with comprehensive analytics dashboards.
              </p>
            </RevealItem>
          </RevealGroup>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: "Activity Over Time", desc: "Track user engagement trends", color: "from-blue-500 to-cyan-500", accent: "text-cyan-400" },
              { icon: Users, title: "Active Users", desc: "Monitor daily and monthly active users", color: "from-purple-500 to-violet-500", accent: "text-violet-400" },
              { icon: Download, title: "Resource Analytics", desc: "Track downloads and resource usage", color: "from-indigo-500 to-blue-500", accent: "text-blue-400" },
            ].map((item, i) => (
              <ScrollRevealText
                key={i}
                blur={true}
                scale={true}
                opacity={true}
                direction="up"
                duration={0.75}
                threshold={0.1}
                delay={i * 100}
                className="block"
              >
                <Card className="group relative overflow-hidden bleepy-card hover:border-cyan-400/30 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-700 transform hover:-translate-y-2 border-0">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <CardContent className="p-8 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-xl bg-gradient-to-br ${item.color}`}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
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
      <section id="calendar" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#080b18] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/10 via-transparent to-purple-200/10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 mb-6 shadow-lg animate-pulse">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Teaching Calendar
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6 animate-slide-up">
              Teaching <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Calendar</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#060818] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <RevealGroup className="text-center mb-16">
            <RevealItem delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-violet-400/10 border border-violet-400/20 text-violet-400 mb-6">
                <Users className="h-5 w-5 mr-2" />
                Our Community
              </div>
            </RevealItem>
            <RevealItem delay={100}>
              <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6">
                Student <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Groups</span>
              </h2>
            </RevealItem>
            <RevealItem delay={200}>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Three distinct groups, one unified platform for medical education excellence
              </p>
            </RevealItem>
          </RevealGroup>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {/* ARU Students Card */}
            <ScrollRevealText blur scale opacity direction="up" duration={0.75} delay={0} threshold={0.1} className="block h-full">
            <Card className="group relative overflow-hidden bleepy-card border border-blue-400/25 hover:border-blue-400/40 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-all duration-700"></div>
              <CardContent className="p-10 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                    <GraduationCap className="h-10 w-10 text-white" />
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold shadow-lg">
                    ARU
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">ARU Students</h3>
                <p className="text-slate-400 mb-8 text-base font-medium">Anglia Ruskin University</p>
                <div className="space-y-3">
                  {[
                    { label: "Total Students", value: stats.aru.studentCount },
                    { label: "Active Students", value: stats.aru.activeStudents },
                    { label: "Events This Month", value: stats.aru.eventsThisMonth },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between p-4 bg-blue-400/15 rounded-xl border border-blue-400/25">
                      <span className="text-slate-400 text-sm font-medium">{row.label}</span>
                      <span className="font-bold text-cyan-400 text-xl">{row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </ScrollRevealText>

            {/* UCL Students Card */}
            <ScrollRevealText blur scale opacity direction="up" duration={0.75} delay={100} threshold={0.1} className="block h-full">
            <Card className="group relative overflow-hidden bleepy-card border border-violet-400/25 hover:border-violet-400/40 shadow-2xl hover:shadow-violet-500/10 transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-400/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-all duration-700"></div>
              <CardContent className="p-10 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-violet-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-xs font-bold shadow-lg">
                    UCL
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">UCL Students</h3>
                <p className="text-slate-400 mb-8 text-base font-medium">University College London</p>
                <div className="space-y-3">
                  {[
                    { label: "Total Students", value: stats.ucl.studentCount },
                    { label: "Active Students", value: stats.ucl.activeStudents },
                    { label: "Events This Month", value: stats.ucl.eventsThisMonth },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between p-4 bg-violet-400/15 rounded-xl border border-violet-400/25">
                      <span className="text-slate-400 text-sm font-medium">{row.label}</span>
                      <span className="font-bold text-violet-400 text-xl">{row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </ScrollRevealText>

            {/* Foundation Year Doctors Card */}
            <ScrollRevealText blur scale opacity direction="up" duration={0.75} delay={200} threshold={0.1} className="block h-full">
            <Card className="group relative overflow-hidden bleepy-card border border-emerald-400/25 hover:border-emerald-400/40 shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-all duration-700"></div>
              <CardContent className="p-10 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                    <UserCheck className="h-10 w-10 text-white" />
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-xs font-bold shadow-lg">
                    FY
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Foundation Year</h3>
                <p className="text-slate-400 mb-8 text-base font-medium">FY1 & FY2 Doctors</p>
                <div className="space-y-3">
                  {[
                    { label: "Total Doctors", value: stats.foundationYear.doctorCount },
                    { label: "Active Doctors", value: stats.foundationYear.activeDoctors },
                    { label: "Events This Month", value: stats.foundationYear.eventsThisMonth },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between p-4 bg-emerald-400/15 rounded-xl border border-emerald-400/25">
                      <span className="text-slate-400 text-sm font-medium">{row.label}</span>
                      <span className="font-bold text-emerald-400 text-xl">{row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* AI Patient Simulator */}
      <section 
        ref={setRef('ai-simulator')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[#060818] relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <RevealGroup className="text-white">
              <RevealItem delay={0}>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-white/20 backdrop-blur-md text-white mb-6 border-2 border-white/30">
                  <Brain className="h-4 w-4 mr-2 animate-pulse" />
                  Premium Feature
                </div>
              </RevealItem>
              <RevealItem delay={90}>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
                  AI Patient Simulator
                </h2>
              </RevealItem>
              <RevealItem delay={180}>
                <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                  Practice realistic clinical consultations with AI-powered patients. Receive instant expert feedback and master your clinical skills through immersive voice-based interactions.
                </p>
              </RevealItem>
              <RevealItem delay={270}>
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
              </RevealItem>
              <RevealItem delay={360}>
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
              </RevealItem>
            </RevealGroup>

            <ScrollRevealText blur scale opacity direction="left" duration={0.85} threshold={0.1} delay={120} className="relative block">
              <Card className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-2xl bleepy-glow-white">
                <div className="bg-gradient-to-br from-[#f0f7ff] to-[#e8f0fe] rounded-2xl p-6 shadow-inner">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Scenario</p>
                        <h3 className="font-semibold text-slate-700 text-lg">Chest Pain Assessment</h3>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center border border-emerald-200">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1.5" />
                      Live
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-blue-500 p-4 rounded-xl">
                      <p className="text-sm text-slate-600 font-medium">&ldquo;I&apos;ve been having chest pain for the past 2 hours...&rdquo;</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-100 to-purple-50 border-l-4 border-purple-500 p-4 rounded-xl">
                      <p className="text-sm text-slate-600 font-medium">&ldquo;Can you describe the pain in more detail?&rdquo;</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500 font-medium text-sm">Score: </span>
                      <span className="font-bold text-emerald-600 text-xl">8.5/10</span>
                    </div>
                    <div className="text-slate-500 flex items-center font-medium text-sm">
                      <Clock className="h-4 w-4 mr-1.5" />
                      3:24
                    </div>
                  </div>
                </div>
              </Card>
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* Games Hub - Practice & Challenge */}
      <section 
        ref={setRef('games-hub')}
        className="py-24 px-4 sm:px-6 lg:px-8 bg-[#080b18] relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <RevealGroup className="text-center mb-16">
            <RevealItem delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-cyan-400/10 border border-cyan-400/20 text-white mb-6">
                <Gamepad2 className="h-4 w-4 mr-2 text-cyan-400" />
                New Feature
              </div>
            </RevealItem>
            <RevealItem delay={100}>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Gamified Learning with <span className="bleepy-gradient-text">Practice & Challenge</span>
              </h2>
            </RevealItem>
            <RevealItem delay={200}>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Make learning fun and competitive with our games hub featuring solo practice mode and multiplayer challenge sessions with leaderboards.
              </p>
            </RevealItem>
          </RevealGroup>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Practice Mode */}
            <ScrollRevealText
              blur={true}
              scale={true}
              opacity={true}
              direction="up"
              duration={0.8}
              threshold={0.1}
              delay={0}
              className="block"
            >
              <Card className="group relative overflow-hidden bleepy-card border border-blue-400/25 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-700 transform hover:-translate-y-2 bleepy-glow-blue">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-xl">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Practice Mode</h3>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    Solo practice sessions to master your skills at your own pace. Earn XP, track accuracy, and build streaks.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {[
                      { icon: CheckCircle, text: "Unlimited solo practice sessions" },
                      { icon: CheckCircle, text: "XP and accuracy tracking" },
                      { icon: CheckCircle, text: "Personal progress dashboard" },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <item.icon className="h-5 w-5 text-cyan-400" />
                        <span className="text-slate-300">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/games/practice">
                    <Button className="w-full bleepy-btn-primary border-0 rounded-xl">
                      Start Practicing <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollRevealText>

            {/* Challenge Mode */}
            <ScrollRevealText
              blur={true}
              scale={true}
              opacity={true}
              direction="up"
              duration={0.8}
              threshold={0.1}
              delay={120}
              className="block"
            >
              <Card className="group relative overflow-hidden bleepy-card border border-violet-400/25 hover:border-violet-400/40 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-700 transform hover:-translate-y-2 bleepy-glow-violet">
                <div className="absolute top-0 right-0 w-40 h-40 bg-violet-400/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-xl">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Challenge Mode</h3>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    Compete in real-time multiplayer quizzes with music and leaderboards. Host or join live challenge sessions.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {[
                      { icon: CheckCircle, text: "Real-time multiplayer competitions" },
                      { icon: CheckCircle, text: "Music and leaderboard features" },
                      { icon: CheckCircle, text: "Host or join live challenges" },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <item.icon className="h-5 w-5 text-violet-400" />
                        <span className="text-slate-300">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/games/challenge">
                    <Button className="w-full bleepy-btn-primary border-0 rounded-xl">
                      Join Challenge <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS SECTION
          ============================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#060818] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(71, 85, 105, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(100, 116, 139, 0.1) 0%, transparent 50%)`,
          }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-medium bg-cyan-400/10 border border-cyan-400/20 text-white mb-6">
              <Star className="h-5 w-5 mr-2 text-cyan-400" />
              Testimonials
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6 animate-slide-up max-w-[52rem] mx-auto">
              <span className="block sm:whitespace-nowrap">What Our <span className="bleepy-gradient-text-inline">Educators</span></span>
              <span className="block sm:whitespace-nowrap">Say</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
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
                    <Card className="group relative overflow-hidden bleepy-card border border-white/10 hover:border-cyan-400/30 shadow-2xl transition-all duration-500">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-violet-400"></div>
                      <CardContent className="p-10 relative z-10">
                        <div className="flex items-center justify-center mb-6">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-6 w-6 text-amber-400 fill-amber-400 mx-1" />
                          ))}
                        </div>
                        <blockquote className="text-xl text-slate-300 leading-relaxed mb-8 italic text-center max-w-3xl mx-auto">
                          &ldquo;{testimonial.quote}&rdquo;
                        </blockquote>
                        <div className="flex items-center justify-center pt-6 border-t border-white/10">
                          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-violet-400 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-white text-lg">{testimonial.name}</div>
                            <div className="text-sm text-slate-400">{testimonial.role}</div>
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
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bleepy-card rounded-full flex items-center justify-center hover:border-cyan-400/40 transition-all duration-300 hover:scale-110 z-20 border border-white/10"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 text-slate-300" />
            </button>
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev === 1 ? 0 : prev + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bleepy-card rounded-full flex items-center justify-center hover:border-cyan-400/40 transition-all duration-300 hover:scale-110 z-20 border border-white/10"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 text-slate-300" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center items-center gap-2 mt-8">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`transition-all duration-300 rounded-full ${
                    currentTestimonial === index
                      ? 'w-3 h-3 bg-cyan-400'
                      : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#080b18] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* Darker orbs — amber/orange blobs were failing Lighthouse contrast against white/slate text. */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-violet-700/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 mb-6">
              <Lightbulb className="h-5 w-5 mr-2" />
              Getting Started
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold font-display text-white mb-6 animate-slide-up max-w-[56rem] mx-auto">
              <span className="block sm:whitespace-nowrap">Your Learning <span className="bleepy-gradient-text-inline">Journey</span></span>
              <span className="block sm:whitespace-nowrap">Starts Here</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
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
                color: "from-cyan-500 to-blue-500",
                border: "border-cyan-400/25 hover:border-cyan-400/40"
              },
              { 
                step: "02",
                icon: CalendarIcon,
                title: "Explore & Book Events",
                description: "Browse the teaching calendar, discover relevant sessions, and book your spot in advance.",
                color: "from-blue-500 to-violet-500",
                border: "border-blue-400/25 hover:border-blue-400/40"
              },
              { 
                step: "03",
                icon: Target,
                title: "Track Your Progress",
                description: "Monitor your attendance, complete feedback, earn certificates, and build your portfolio.",
                color: "from-violet-500 to-purple-500",
                border: "border-violet-400/25 hover:border-violet-400/40"
              },
            ].map((item, index) => (
              <div 
                key={index}
                className="relative group animate-slide-up"
                style={{animationDelay: `${index * 0.15}s`}}
              >
                <Card className={`relative overflow-hidden bg-[#0d1220] ${item.border} hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-500 transform hover:-translate-y-2 h-full border`}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-violet-400"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform bg-gradient-to-br ${item.color}`}>
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <div
                        className="text-6xl font-bold text-slate-500 group-hover:text-cyan-300/50 transition-colors"
                        aria-hidden="true"
                      >
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {item.title}
                    </h3>
                    <p className="text-slate-200 leading-relaxed">
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
                  className="group bleepy-btn-primary px-8 py-6 text-lg font-semibold border-0"
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