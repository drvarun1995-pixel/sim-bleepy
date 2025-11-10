"use client";

import { Button } from "@/components/ui/button";
import { Play, User, Stethoscope, CheckCircle, ArrowRight, BookOpen, Video, Target, Award, Zap, Clock, Brain, Heart, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { useSession } from 'next-auth/react';

export default function GettingStartedPage() {
  const { data: session, status } = useSession();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Getting Started with Bleepy
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Welcome to Bleepy! Your comprehensive platform for clinical training, events, resources, and progress tracking. Follow this guide to explore all features.
            </p>
          </div>

          {/* Quick Start Steps */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <User className="h-8 w-8" />,
                title: "Create Account",
                description: "Sign up for your free account",
                time: "2 minutes"
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: "Explore Features",
                description: "Discover all platform capabilities",
                time: "3 minutes"
              },
              {
                icon: <Play className="h-8 w-8" />,
                title: "Start Learning",
                description: "Begin your training journey",
                time: "5 minutes"
              }
            ].map((step, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 mx-auto">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                <div className="flex items-center justify-center text-xs text-purple-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {step.time}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Setup Guide */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 space-y-12">
            
            {/* Step 1: Create Account */}
            <section>
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                    Create Your Account
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Get started with a free Bleepy account to access clinical training, events, resources, and progress tracking.
                  </p>
                </div>
              </div>
              
              <div className="ml-16 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approved Email Domains
                  </h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>University College London:</strong> @ucl.ac.uk</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>Anglia Ruskin University:</strong> @aru.ac.uk, @student.aru.ac.uk</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>NHS:</strong> @nhs.net</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Account Setup Process</h3>
                  <ol className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2 text-purple-600">1.</span>
                      <span>Click "Sign Up" in the top right corner</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2 text-purple-600">2.</span>
                      <span>Enter your institutional email address</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2 text-purple-600">3.</span>
                      <span>Create a strong password (minimum 8 characters)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2 text-purple-600">4.</span>
                      <span>Verify your email address by clicking the link sent to your inbox</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2 text-purple-600">5.</span>
                      <span>Complete your profile with your name and university details</span>
                    </li>
                  </ol>
                </div>

                {!session && (
                  <Link href="/auth/signin?mode=signup">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                      <User className="h-4 w-4 mr-2" />
                      Create Free Account
                    </Button>
                  </Link>
                )}
                {session && (
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                      <Target className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </Link>
                )}
              </div>
            </section>

            {/* Step 2: Explore Dashboard */}
            <section>
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  2
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Explore Your Dashboard & All Features
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Discover the comprehensive suite of tools available: AI training, live events, study resources, progress tracking, and gamification.
                  </p>
                </div>
              </div>
              
              <div className="ml-16 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Complete Platform Features
                  </h3>
                  <p className="text-blue-800 text-sm mb-4">
                    Bleepy is a comprehensive clinical education platform featuring AI training, live events, study resources, progress analytics, gamification, and more - all designed to support your complete learning journey.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <Stethoscope className="h-6 w-6 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">AI Patient Simulator</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Practice with 5 AI-powered clinical scenarios including chest pain, falls assessment, shortness of breath, joint pain, and abdominal pain.
                    </p>
                    {session ? (
                      <Link href="/stations" className="text-xs text-blue-600 hover:underline flex items-center">
                        Browse Stations <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    ) : (
                      <Link href="/auth/signin?mode=signup" className="text-xs text-blue-600 hover:underline flex items-center">
                        Sign Up to Browse <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <Calendar className="h-6 w-6 text-purple-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Events & Teaching Sessions</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Access your university's teaching calendar with live sessions, tutorials, and educational events tailored to your program.
                    </p>
                    <Link href="/events" className="text-xs text-purple-600 hover:underline flex items-center">
                      View Events <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <BookOpen className="h-6 w-6 text-green-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Study Materials & Downloads</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Download lecture notes, teaching resources, session materials, and study guides from your educators and past teaching sessions.
                    </p>
                    <Link href="/downloads" className="text-xs text-green-600 hover:underline flex items-center">
                      Browse Downloads <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <TrendingUp className="h-6 w-6 text-orange-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Performance Analytics</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Track your progress with detailed analytics showing your performance trends, strengths, and areas for improvement across all stations.
                    </p>
                    {session ? (
                      <Link href="/dashboard/progress" className="text-xs text-orange-600 hover:underline flex items-center">
                        View Progress <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    ) : (
                      <Link href="/auth/signin?mode=signup" className="text-xs text-orange-600 hover:underline flex items-center">
                        Sign Up to View <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <Award className="h-6 w-6 text-yellow-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Gamification & Achievements</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Earn XP points, unlock badges, and compete on leaderboards as you complete clinical stations and reach learning milestones.
                    </p>
                    <Link href="/dashboard/gamification" className="text-xs text-yellow-600 hover:underline flex items-center">
                      View Achievements <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <Clock className="h-6 w-6 text-indigo-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Session History & Review</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Review all your past consultations with detailed feedback, performance scores, and AI-generated insights for continuous improvement.
                    </p>
                    {session ? (
                      <Link href="/dashboard/progress" className="text-xs text-indigo-600 hover:underline flex items-center">
                        Review Sessions <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    ) : (
                      <Link href="/auth/signin?mode=signup" className="text-xs text-indigo-600 hover:underline flex items-center">
                        Sign Up to Review <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-semibold text-purple-900 mb-3">🎓 University-Specific Features</h3>
                  <ul className="space-y-2 text-purple-800 text-sm">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>UCL & ARU Students:</strong> Access your university's specific teaching calendar and resources</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>Foundation Doctors:</strong> Specialized stations for FY1/FY2 training requirements</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>All Users:</strong> Daily session limits (3 per day for students) to encourage quality practice</span>
                    </li>
                  </ul>
                </div>

                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                    <Target className="h-4 w-4 mr-2" />
                    Explore Your Dashboard
                  </Button>
                </Link>
              </div>
            </section>

            {/* Step 3: Your First Station */}
            <section>
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  3
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Complete Your First Station
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Start with a beginner-friendly scenario to get comfortable with the platform.
                  </p>
                </div>
              </div>
              
              <div className="ml-16 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Recommended First Stations
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">Chest Pain Assessment</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        A 58-year-old man presents with chest pain. Assess them in the GP clinic using SOCRATES and cardiac risk factors.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          8 minutes • Difficulty: Intermediate
                        </div>
                        <Link href="/station/chest-pain" className="text-xs text-blue-600 hover:underline">
                          Start Station →
                        </Link>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">Shortness of Breath Assessment</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        A 68-year-old man with worsening breathlessness. Assess respiratory symptoms and COPD history.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          8 minutes • Difficulty: Intermediate
                        </div>
                        <Link href="/station/shortness-of-breath" className="text-xs text-blue-600 hover:underline">
                          Start Station →
                        </Link>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">Abdominal Pain Assessment</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        A 24-year-old student with lower abdominal pain. Practice taking sexual and contraceptive history.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          8 minutes • Difficulty: Intermediate
                        </div>
                        <Link href="/station/abdominal-pain" className="text-xs text-blue-600 hover:underline">
                          Start Station →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">During Your Session</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <Brain className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Speak Naturally:</strong> Our AI understands conversational language - talk as you would with a real patient</span>
                    </li>
                    <li className="flex items-start">
                      <Heart className="h-5 w-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Show Empathy:</strong> The AI detects emotional cues - practice compassionate communication</span>
                    </li>
                    <li className="flex items-start">
                      <Target className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Cover Key Areas:</strong> Make sure to complete all essential parts of the consultation</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Manage Time:</strong> You have 8 minutes - practice efficient history taking</span>
                    </li>
                  </ul>
                </div>

                <Link href="/scenarios">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                    <Play className="h-4 w-4 mr-2" />
                    Browse Clinical Stations
                  </Button>
                </Link>
              </div>
            </section>

            {/* Step 4: Review Feedback */}
            <section>
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  4
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Review Your Performance
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Learn from detailed AI-generated feedback and expert insights.
                  </p>
                </div>
              </div>
              
              <div className="ml-16 space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-semibold text-purple-900 mb-3">What You'll Receive</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900 text-sm">Performance Score</h4>
                        <p className="text-xs text-purple-700">Overall rating based on clinical competency</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900 text-sm">Detailed Feedback</h4>
                        <p className="text-xs text-purple-700">Specific areas of strength and improvement</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900 text-sm">Communication Analysis</h4>
                        <p className="text-xs text-purple-700">Empathy and rapport-building assessment</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900 text-sm">Action Points</h4>
                        <p className="text-xs text-purple-700">Personalized recommendations for improvement</p>
                      </div>
                    </div>
                  </div>
                </div>

                {session ? (
                  <Link href="/dashboard/progress">
                    <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Session History
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signin?mode=signup">
                    <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Sign Up to View History
                    </Button>
                  </Link>
                )}
              </div>
            </section>
          </div>

          {/* Next Steps */}
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4 text-center">Ready to Get Started?</h2>
            <p className="text-center text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of medical students and professionals improving their clinical skills with AI-powered training.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!session && (
                <Link href="/auth/signin?mode=signup">
                  <Button className="bg-white text-purple-700 hover:bg-gray-50 font-semibold shadow-lg">
                    <User className="h-4 w-4 mr-2" />
                    Create Free Account
                  </Button>
                </Link>
              )}
              <Link href="/tutorials">
                <Button className="bg-white/20 text-white border-2 border-white hover:bg-white/30 font-semibold shadow-lg backdrop-blur-sm">
                  <Video className="h-4 w-4 mr-2" />
                  Watch Tutorials
                </Button>
              </Link>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Link href="/tutorials" className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <Video className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Tutorials</h3>
              <p className="text-sm text-gray-600">Step-by-step guides for using Bleepy effectively</p>
              <div className="flex items-center text-purple-600 text-sm mt-3">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </Link>

            {session ? (
              <Link href="/stations" className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <Stethoscope className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Clinical Scenarios</h3>
                <p className="text-sm text-gray-600">Explore our full library of training stations</p>
                <div className="flex items-center text-blue-600 text-sm mt-3">
                  Browse All <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            ) : (
              <Link href="/auth/signin?mode=signup" className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <Stethoscope className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Clinical Scenarios</h3>
                <p className="text-sm text-gray-600">Explore our full library of training stations</p>
                <div className="flex items-center text-blue-600 text-sm mt-3">
                  Sign Up to Browse <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            )}

            {session ? (
              <Link href="/calendar" className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <BookOpen className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Training Events</h3>
                <p className="text-sm text-gray-600">Join live sessions and educational events</p>
                <div className="flex items-center text-green-600 text-sm mt-3">
                  View Events <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            ) : (
              <Link href="/auth/signin?mode=signup" className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <BookOpen className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Training Events</h3>
                <p className="text-sm text-gray-600">Join live sessions and educational events</p>
                <div className="flex items-center text-green-600 text-sm mt-3">
                  Sign Up to View <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
