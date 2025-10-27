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
  Zap
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
    }
  ];

  // Calculate dynamic number of clinical scenarios
  const availableStations = Object.values(stationConfigs).filter(station => station.available).length;

  const stats = [
    { number: "300+", label: "Students Trained", icon: <Users className="h-8 w-8" /> },
    { number: `${availableStations}+`, label: "Clinical Scenarios", icon: <Stethoscope className="h-8 w-8" /> },
    { number: "2", label: "Partner Institutions", icon: <GraduationCap className="h-8 w-8" /> },
    { number: "95%", label: "Student Satisfaction", icon: <Award className="h-8 w-8" /> }
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
              AI-powered clinical simulations that prepare the next generation of healthcare professionals.
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
    </div>
  );
}