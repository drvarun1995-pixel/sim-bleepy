"use client";

import { Button } from "@/components/ui/button";
import { Video, Play, BookOpen, Stethoscope, Target, MessageCircle, TrendingUp, Clock, CheckCircle, ArrowRight, Download, ExternalLink, Lightbulb, AlertCircle, Award, Brain, Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TutorialsPage() {
  const [activeCategory, setActiveCategory] = useState("getting-started");

  const tutorials = {
    "getting-started": [
      {
        title: "Creating Your Bleepy Account",
        duration: "3 min",
        difficulty: "Beginner",
        description: "Learn how to sign up and set up your account with approved university email addresses.",
        topics: ["Account creation", "Email verification", "Profile setup"],
        icon: "🎯"
      },
      {
        title: "Navigating the Dashboard",
        duration: "5 min",
        difficulty: "Beginner",
        description: "Complete tour of the dashboard interface and main features.",
        topics: ["Dashboard overview", "Navigation", "Key features"],
        icon: "📊"
      },
      {
        title: "Choosing Your First Station",
        duration: "4 min",
        difficulty: "Beginner",
        description: "How to browse and select clinical stations that match your learning goals.",
        topics: ["Station categories", "Difficulty levels", "Recommendations"],
        icon: "🏥"
      }
    ],
    "clinical-stations": [
      {
        title: "History Taking Fundamentals",
        duration: "10 min",
        difficulty: "Beginner",
        description: "Master the art of taking a comprehensive medical history from AI patients.",
        topics: ["Opening questions", "SOCRATES framework", "Closing consultation"],
        icon: "💬"
      },
      {
        title: "Physical Examination Techniques",
        duration: "12 min",
        difficulty: "Intermediate",
        description: "Learn systematic approaches to physical examinations in various scenarios.",
        topics: ["Inspection", "Palpation", "Percussion", "Auscultation"],
        icon: "👨‍⚕️"
      },
      {
        title: "Emergency Scenarios",
        duration: "15 min",
        difficulty: "Advanced",
        description: "Handle acute medical emergencies with confidence and proper protocols.",
        topics: ["ABC assessment", "Rapid triage", "Critical decisions"],
        icon: "🚨"
      },
      {
        title: "Chest Pain Assessment",
        duration: "10 min",
        difficulty: "Intermediate",
        description: "Differentiate between cardiac and non-cardiac causes of chest pain.",
        topics: ["Red flags", "Risk stratification", "Diagnostic approach"],
        icon: "❤️"
      },
      {
        title: "Abdominal Pain Evaluation",
        duration: "12 min",
        difficulty: "Intermediate",
        description: "Systematic approach to evaluating patients with abdominal pain.",
        topics: ["Site specificity", "Associated symptoms", "Differential diagnosis"],
        icon: "🔍"
      }
    ],
    "communication": [
      {
        title: "Building Rapport with AI Patients",
        duration: "8 min",
        difficulty: "Beginner",
        description: "Techniques for establishing trust and connection with virtual patients.",
        topics: ["Active listening", "Empathy expressions", "Body language cues"],
        icon: "🤝"
      },
      {
        title: "Breaking Bad News",
        duration: "15 min",
        difficulty: "Advanced",
        description: "SPIKES protocol for delivering difficult information to patients.",
        topics: ["Setting", "Perception", "Information", "Knowledge", "Empathy", "Strategy"],
        icon: "💔"
      },
      {
        title: "Explaining Medical Conditions",
        duration: "10 min",
        difficulty: "Intermediate",
        description: "Clear communication of diagnoses and treatment plans.",
        topics: ["Avoiding jargon", "Checking understanding", "Addressing concerns"],
        icon: "📝"
      },
      {
        title: "Dealing with Difficult Conversations",
        duration: "12 min",
        difficulty: "Advanced",
        description: "Strategies for managing challenging patient interactions.",
        topics: ["Conflict resolution", "De-escalation", "Professional boundaries"],
        icon: "⚖️"
      }
    ],
    "performance": [
      {
        title: "Understanding Your Feedback",
        duration: "6 min",
        difficulty: "Beginner",
        description: "How to interpret AI-generated feedback and performance scores.",
        topics: ["Score breakdown", "Feedback categories", "Improvement metrics"],
        icon: "📈"
      },
      {
        title: "Tracking Your Progress",
        duration: "5 min",
        difficulty: "Beginner",
        description: "Using analytics to monitor your clinical skills development.",
        topics: ["Progress dashboard", "Trends analysis", "Goal setting"],
        icon: "📊"
      },
      {
        title: "Gamification & Achievements",
        duration: "4 min",
        difficulty: "Beginner",
        description: "Earn XP, unlock badges, and climb the leaderboard.",
        topics: ["XP system", "Badge collection", "Leaderboards"],
        icon: "🏆"
      },
      {
        title: "Targeting Weak Areas",
        duration: "8 min",
        difficulty: "Intermediate",
        description: "Identify and improve specific clinical competencies.",
        topics: ["Skills gap analysis", "Focused practice", "Improvement plans"],
        icon: "🎯"
      }
    ],
    "advanced": [
      {
        title: "Time Management in Consultations",
        duration: "10 min",
        difficulty: "Advanced",
        description: "Optimize your 8-minute consultation time for maximum effectiveness.",
        topics: ["Time allocation", "Prioritization", "Efficiency strategies"],
        icon: "⏱️"
      },
      {
        title: "Clinical Reasoning Frameworks",
        duration: "15 min",
        difficulty: "Advanced",
        description: "Apply systematic clinical reasoning to complex cases.",
        topics: ["Differential diagnosis", "Pattern recognition", "Decision-making"],
        icon: "🧠"
      },
      {
        title: "OSCE Preparation Strategies",
        duration: "20 min",
        difficulty: "Advanced",
        description: "Comprehensive guide to using Bleepy for OSCE exam preparation.",
        topics: ["Exam techniques", "Common scenarios", "Marking criteria"],
        icon: "📚"
      },
      {
        title: "Multi-System Cases",
        duration: "18 min",
        difficulty: "Advanced",
        description: "Approach patients with multiple presenting complaints.",
        topics: ["Holistic assessment", "Priority setting", "Complex histories"],
        icon: "🔄"
      }
    ]
  };

  const categories = [
    { id: "getting-started", name: "Getting Started", icon: Play, color: "text-green-600" },
    { id: "clinical-stations", name: "Clinical Stations", icon: Stethoscope, color: "text-blue-600" },
    { id: "communication", name: "Communication Skills", icon: MessageCircle, color: "text-purple-600" },
    { id: "performance", name: "Performance & Progress", icon: TrendingUp, color: "text-orange-600" },
    { id: "advanced", name: "Advanced Techniques", icon: Brain, color: "text-red-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Bleepy Tutorials
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Master clinical skills with our comprehensive video guides and step-by-step tutorials.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid sm:grid-cols-4 gap-4 mb-12">
            {[
              { icon: <Video className="h-6 w-6" />, value: "25+", label: "Video Tutorials" },
              { icon: <Clock className="h-6 w-6" />, value: "4 hours", label: "Total Content" },
              { icon: <Target className="h-6 w-6" />, value: "5", label: "Categories" },
              { icon: <Award className="h-6 w-6" />, value: "Free", label: "All Content" }
            ].map((stat, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100/50 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-purple-600 mb-3 mx-auto">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Category Navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100/50 mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <category.icon className="h-5 w-5" />
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tutorials Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {tutorials[activeCategory as keyof typeof tutorials].map((tutorial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                {/* Tutorial Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{tutorial.icon}</div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tutorial.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-100' :
                      tutorial.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-100' :
                      'bg-red-500/20 text-red-100'
                    }`}>
                      {tutorial.difficulty}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tutorial.title}</h3>
                  <div className="flex items-center text-white/80 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {tutorial.duration}
                  </div>
                </div>

                {/* Tutorial Content */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4">{tutorial.description}</p>
                  
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-900 mb-2">What You'll Learn:</div>
                    <div className="flex flex-wrap gap-2">
                      {tutorial.topics.map((topic, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Tutorial
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tips Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Lightbulb className="h-6 w-6 mr-2 text-yellow-600" />
              Quick Tips for Success
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Practice Regularly</h3>
                  <p className="text-sm text-gray-600">
                    Consistent practice is key. Aim for at least 3 sessions per week to build and maintain skills.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Review Your Feedback</h3>
                  <p className="text-sm text-gray-600">
                    Don't skip the feedback! It's personalized to help you improve specific areas.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Focus on Weak Areas</h3>
                  <p className="text-sm text-gray-600">
                    Use your performance data to identify and target areas needing improvement.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Empathy Matters</h3>
                  <p className="text-sm text-gray-600">
                    Our AI detects emotional cues. Practice showing genuine empathy and compassion.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Common Questions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="h-6 w-6 mr-2 text-blue-600" />
              Common Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How long should I spend on each tutorial?</h3>
                <p className="text-gray-600">
                  Each tutorial is designed to be completed in one sitting. Watch at your own pace and feel free to replay sections.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I download tutorials for offline viewing?</h3>
                <p className="text-gray-600">
                  Currently, tutorials are available for streaming only. We're working on adding download functionality soon!
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Are new tutorials added regularly?</h3>
                <p className="text-gray-600">
                  Yes! We add new content monthly based on user feedback and emerging clinical education needs.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Do I need to watch tutorials in order?</h3>
                <p className="text-gray-600">
                  While we recommend starting with "Getting Started" tutorials, you can watch any tutorial that interests you. Each is self-contained.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
              <p className="text-white/90 mb-6">
                Put your knowledge into practice with real clinical scenarios.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/stations">
                  <Button className="bg-white text-purple-700 hover:bg-gray-50 font-semibold shadow-lg">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Browse Clinical Stations
                  </Button>
                </Link>
                <Link href="/getting-started">
                  <Button className="bg-white/20 text-white border-2 border-white hover:bg-white/30 font-semibold shadow-lg backdrop-blur-sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Getting Started Guide
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Link href="/downloads" className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <Download className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Study Materials</h3>
              <p className="text-sm text-gray-600">Download session notes and teaching resources</p>
              <div className="flex items-center text-green-600 text-sm mt-3">
                Download Now <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </Link>

            <Link href="/dashboard" className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <TrendingUp className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Your Progress</h3>
              <p className="text-sm text-gray-600">Track your improvement and achievements</p>
              <div className="flex items-center text-blue-600 text-sm mt-3">
                View Dashboard <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </Link>

            <Link href="/calendar" className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <BookOpen className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Live Events</h3>
              <p className="text-sm text-gray-600">Join educational sessions and workshops</p>
              <div className="flex items-center text-purple-600 text-sm mt-3">
                View Events <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
