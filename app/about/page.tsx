"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { stationConfigs } from "@/utils/stationConfigs";
import { 
  Heart, 
  Stethoscope, 
  Users, 
  Target, 
  Award, 
  BookOpen, 
  Lightbulb, 
  Globe, 
  GraduationCap,
  Sparkles,
  Star,
  ArrowRight,
  Quote,
  ChevronDown,
  Play,
  CheckCircle,
  TrendingUp,
  Shield,
  Zap,
  MessageSquare,
  Mail
} from "lucide-react";

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const founders = [
    {
      name: "Dr. Varun Tyagi",
      title: "Clinical Teaching Fellow",
      role: "Co-Founder & CEO",
      image: "/varun-tyagi.png",
      bio: "A passionate clinical educator with extensive experience in medical simulation and AI-powered learning. Varun is dedicated to revolutionizing how medical students develop their clinical skills through innovative technology.",
      expertise: ["AI Integration", "Web Development", "Internal Medicine"]
    },
    {
      name: "Dr. Simran Mahmud",
      title: "Clinical Teaching Fellow", 
      role: "Co-Founder & CTO",
      image: "/simran-mahmud.png",
      bio: "An innovative technologist and medical educator who combines deep clinical knowledge with cutting-edge technology. Simran leads the technical development of Bleepy's AI-powered learning platform.",
      expertise: ["Medical Education", "Leadership", "Educational Design"]
    }
  ];

  const teamMembers = [
    {
      name: "Riya Mayor",
      title: "Software Developer & Technical Contributor",
      role: "Tech Organizer",
      image: "/riya-mayor.webp",
      bio: "A practical and detail-driven developer with hands-on experience in .NET, SQL, and front-end tools. Riya supports Bleepy's technical side by improving performance, structure, and reliability to keep the platform running smoothly for students and educators.",
      expertise: ["Software Development", "Database Management", "System Architecture"]
    },
    {
      name: "Rahul Tyagi",
      title: "Regulatory Affairs Leader",
      role: "Legal Advisor",
      image: "/rahul-tyagi.png",
      bio: "Dynamic and result-oriented regulatory leader with 15 years of experience in Regulatory Affairs, Clinical Site Operations, and Pharmacovigilance within the FMCG and Pharmaceutical sectors. Currently leading the Asia, Middle East & Africa Grooming Business of Procter & Gamble, ensuring seamless regulatory compliance while driving business growth through strategic initiatives.",
      expertise: ["Regulatory Affairs", "Clinical Research", "Compliance Management", "Business Leadership"]
    }
  ];

  // Calculate dynamic number of clinical scenarios
  const availableStations = Object.values(stationConfigs).filter(station => station.available).length;

  const stats = [
    { number: "300+", label: "Students Trained", icon: <Users className="h-8 w-8" /> },
    { number: `${availableStations}+`, label: "Clinical Scenarios", icon: <Stethoscope className="h-8 w-8" /> },
    { number: "2", label: "Partner Institutions", icon: <GraduationCap className="h-8 w-8" /> },
    { number: "95%", label: "Student Satisfaction", icon: <Award className="h-8 w-8" /> },
    { number: "1000+", label: "Certificates Generated", icon: <Award className="h-8 w-8" /> },
    { number: "500+", label: "QR Code Scans", icon: <Zap className="h-8 w-8" /> }
  ];

  const values = [
    {
      icon: <Heart className="h-12 w-12" />,
      title: "Student-Centered",
      description: "Every feature is designed with the student's learning journey in mind, ensuring maximum educational impact."
    },
    {
      icon: <Lightbulb className="h-12 w-12" />,
      title: "Innovation First",
      description: "We constantly push boundaries in medical education technology to create cutting-edge learning experiences."
    },
    {
      icon: <Shield className="h-12 w-12" />,
      title: "Clinical Excellence",
      description: "Our platform is built by clinicians for clinicians, ensuring the highest standards of medical accuracy."
    },
    {
      icon: <Globe className="h-12 w-12" />,
      title: "Global Impact",
      description: "We're committed to making quality medical education accessible to students worldwide."
    }
  ];

  const timeline = [
    {
      year: "2024",
      title: "Bleepy Founded",
      description: "Two clinical teaching fellows came together with a vision to revolutionize medical education through AI."
    },
    {
      year: "2024",
      title: "First AI Patient",
      description: "Launched our first AI-powered clinical scenario, proving the concept of realistic patient interactions."
    },
    {
      year: "2025",
      title: "Platform Launch",
      description: "Officially launched Bleepy with comprehensive clinical training modules and institutional partnerships."
    },
    {
      year: "2025",
      title: "Global Expansion",
      description: "Expanding to multiple medical institutions worldwide, training thousands of future healthcare professionals."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Meet the Visionaries
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              About <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Bleepy</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto mb-8">
              Founded by passionate clinical educators, Bleepy is transforming medical education through 
              AI-powered clinical simulations, QR code attendance tracking, digital certificates, and 
              comprehensive feedback systems that prepare the next generation of healthcare professionals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center text-purple-600">
                <Star className="h-5 w-5 mr-2 fill-current" />
                <span className="font-semibold">Innovation in Medical Education</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <div className="flex items-center text-blue-600">
                <Target className="h-5 w-5 mr-2" />
                <span className="font-semibold">Clinical Excellence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-purple-600 mb-4 flex justify-center">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Meet Our <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Founders</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Two clinical teaching fellows united by a shared vision to revolutionize medical education
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {founders.map((founder, index) => (
              <div 
                key={index}
                className={`bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100/50 hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Profile Image */}
                <div className="relative mb-6">
                  <div className="w-32 h-32 mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-1">
                      <div className="w-full h-full bg-white rounded-full p-2">
                        <Image
                          src={founder.image}
                          alt={founder.name}
                          width={120}
                          height={120}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Founder Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{founder.name}</h3>
                  <p className="text-purple-600 font-semibold mb-1">{founder.role}</p>
                  <p className="text-gray-600">{founder.title}</p>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">{founder.bio}</p>

                {/* Expertise */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Areas of Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {founder.expertise.map((area, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full text-sm font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Team</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The talented individuals who make Bleepy's mission possible
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div 
                key={index}
                className={`bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-700 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Profile Image */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-full p-1">
                      <div className="w-full h-full bg-white rounded-full p-2">
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={80}
                          height={80}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Member Info */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-green-600 font-semibold mb-1">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.title}</p>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed text-sm">{member.bio}</p>

                {/* Expertise */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Areas of Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.map((area, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-gradient-to-r from-green-100 to-teal-100 text-green-800 rounded-full text-xs font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Platform Features</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools and technologies that make Bleepy the complete medical education platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Stethoscope className="h-12 w-12" />,
                title: "AI-Powered Clinical Simulations",
                description: "Interactive scenarios with realistic patient interactions using advanced AI technology"
              },
              {
                icon: <Zap className="h-12 w-12" />,
                title: "QR Code Attendance Tracking",
                description: "Seamless attendance verification and event management through QR code scanning"
              },
              {
                icon: <Award className="h-12 w-12" />,
                title: "Digital Certificate Generation",
                description: "Automated certificate creation and delivery for completed training and events"
              },
              {
                icon: <MessageSquare className="h-12 w-12" />,
                title: "Comprehensive Feedback System",
                description: "Advanced feedback collection and analysis tools for continuous improvement"
              },
              {
                icon: <Heart className="h-12 w-12" />,
                title: "Hume EVI Emotion Analysis",
                description: "Voice-based emotion recognition for enhanced clinical training assessment"
              },
              {
                icon: <BookOpen className="h-12 w-12" />,
                title: "Event Management & Booking",
                description: "Complete event lifecycle management from creation to attendance tracking"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-purple-600 mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do at Bleepy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div 
                key={index}
                className={`text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-purple-600 mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Journey</span>
            </h2>
            <p className="text-xl text-gray-600">
              From concept to reality - the story of Bleepy's evolution
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-600 to-blue-600"></div>

            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div 
                  key={index}
                  className={`relative flex items-start ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  {/* Timeline Dot */}
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">{item.year}</span>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'ml-8' : 'mr-8'}`}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Quote className="h-16 w-16 text-white/80 mx-auto mb-6" />
            <blockquote className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-relaxed">
              "We believe that every medical student deserves access to world-class clinical training, 
              regardless of their location or resources. Bleepy is our commitment to democratizing 
              medical education through innovative technology."
            </blockquote>
            <div className="flex items-center justify-center space-x-4 text-white/90">
              <div className="flex items-center">
                <span className="font-semibold">Dr. Varun Tyagi</span>
                <span className="mx-2">•</span>
                <span className="font-semibold">Dr. Simran Mahmud</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-gray-100/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ready to Transform Medical Education?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of medical students and institutions already using Bleepy to enhance their clinical training.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <Play className="h-5 w-5 mr-2 inline" />
                Start Training Today
              </Link>
              <Link href="/getting-started" className="bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <BookOpen className="h-5 w-5 mr-2 inline" />
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Connect with Us Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Connect with <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Us</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Follow Bleepy on social media for updates, tips, and the latest in medical education
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-gray-100/50">
            <div className="flex flex-col items-center space-y-8">
              {/* Email */}
              <div className="flex items-center space-x-4">
                <Mail className="h-6 w-6 text-purple-600" />
                <a 
                  href="mailto:support@bleepy.co.uk"
                  className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors duration-300"
                >
                  support@bleepy.co.uk
                </a>
              </div>

              {/* Social Media Links */}
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="https://www.facebook.com/bleepyuk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Follow us on Facebook"
                  className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors duration-300 text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/bleepyuk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Follow us on Instagram"
                  className="w-12 h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity duration-300 text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://x.com/bleepyuk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Follow us on X (Twitter)"
                  className="w-12 h-12 bg-black rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors duration-300 text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.linkedin.com/company/bleepyuk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Follow us on LinkedIn"
                  className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center hover:bg-blue-800 transition-colors duration-300 text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.youtube.com/@bleepyuk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Follow us on YouTube"
                  className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors duration-300 text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a 
                  href="https://uk.pinterest.com/bleepyuk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Follow us on Pinterest"
                  className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors duration-300 text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="-143 145 512 512">
                    <path d="M-143,145v512h512V145H-143z M113,528.3c-12.6,0-24.8-1.9-36.3-5.3c4.9-7.7,10.2-17.6,12.9-27.4c1.6-5.7,9-35.2,9-35.2c4.4,8.5,17.4,15.9,31.3,15.9c41.2,0,69.1-37.5,69.1-87.7c0-38-32.2-73.3-81-73.3c-60.8,0-91.5,43.6-91.5,80c0,22,8.3,41.6,26.2,48.9c2.9,1.2,5.5,0,6.4-3.2c0.6-2.2,2-7.9,2.6-10.3c0.9-3.2,0.5-4.3-1.8-7.1c-5.1-6.1-8.4-13.9-8.4-25.1c0-32.3,24.2-61.3,63-61.3c34.4,0,53.3,21,53.3,49c0,36.9-16.3,68-40.6,68c-13.4,0-23.4-11.1-20.2-24.6c3.8-16.2,11.3-33.7,11.3-45.4c0-10.5-5.6-19.2-17.3-19.2c-13.7,0-24.7,14.2-24.7,33.1c0,12.1,4.1,20.2,4.1,20.2s-14,59.4-16.5,69.7c-2.3,9.7-2.6,20.5-2.2,29.4C16.5,497.8-15,452.7-15,400.3c0-70.7,57.3-128,128-128s128,57.3,128,128S183.7,528.3,113,528.3z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}