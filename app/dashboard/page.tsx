"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Stethoscope, Clock, CheckCircle, Diamond, ArrowLeft, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [attemptLimitChecked, setAttemptLimitChecked] = useState(false);
  const [canAttempt, setCanAttempt] = useState(true);
  const [attemptLimitMessage, setAttemptLimitMessage] = useState('');
  const [resetTime, setResetTime] = useState('');

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (status === 'loading' || !session?.user?.email) {
        setAdminCheckLoading(true);
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();
        setIsAdmin(data.isAdmin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [status, session]);

  // Check attempt limit for non-admin users
  useEffect(() => {
    const checkAttemptLimit = async () => {
      if (status === 'loading' || !session?.user?.email || isAdmin) {
        return;
      }

      try {
        const response = await fetch('/api/attempts/check-limit');
        const data = await response.json();
        
        if (response.ok) {
          setCanAttempt(data.canAttempt);
          setAttemptLimitMessage(data.message);
          setResetTime(data.resetTime || '');
          setAttemptLimitChecked(true);
        }
      } catch (error) {
        console.error('Error checking attempt limit:', error);
      }
    };

    if (!adminCheckLoading && !isAdmin) {
      checkAttemptLimit();
    }
  }, [status, session, isAdmin, adminCheckLoading]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  const scenarios = [
    {
      id: "chest-pain",
      title: "Chest Pain Assessment",
      description: "A 55-year-old man presents with chest pain. You are the doctor in the emergency department.",
      keyAreas: ["Physical examination", "Communication", "Diagnosis"],
      difficulty: "Intermediate",
      available: true,
      icon: <Stethoscope className="h-6 w-6" />
    },
    {
      id: "shortness-breath",
      title: "Shortness of Breath in an Asthmatic Patient",
      description: "A 30-year-old asthmatic patient presents with increasing dyspnea and cough. The patient also reports that the cough is worse at night and has further worsened.",
      keyAreas: ["Physical examination", "Communication", "Diagnosis"],
      difficulty: "Advanced",
      available: false,
      icon: <Stethoscope className="h-6 w-6" />
    }
  ];

  const handleStartScenario = (scenarioId: string) => {
    if (scenarioId === "chest-pain") {
      router.push(`/station/${scenarioId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-modern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 text-sm sm:text-base">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Link>
              <div className="flex items-center space-x-3">
                <img src="/bleepy-logo.svg" alt="Bleepy Simulator" className="w-8 h-8 sm:w-10 sm:h-10" />
                <span className="text-xl sm:text-2xl font-bold text-gradient">Bleepy Simulator</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/history" className="text-gray-600 hover:text-gray-900 text-sm sm:text-base">History</Link>
              {!adminCheckLoading && isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                    <span className="sm:hidden">Admin</span>
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="text-xs sm:text-sm">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="gradient-cool border-b border-white/20 shadow-modern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in-up">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Welcome back{session.user?.name ? `, ${session.user.name}` : ''} 👋
              </h1>
              <p className="text-gray-600 text-base sm:text-lg font-medium">REAL-TIME LIVE Clinical Practice Sessions</p>
            </div>
            {!isAdmin && attemptLimitChecked && (
              <div className={`px-4 py-2 rounded-modern text-sm font-medium shadow-modern animate-slide-in-right ${
                canAttempt 
                  ? 'gradient-success text-white' 
                  : 'gradient-secondary text-white'
              }`}>
                {canAttempt ? '1 attempt remaining today' : (
                  <div className="text-center">
                    <div>Daily limit reached</div>
                    {resetTime && (
                      <div className="text-xs opacity-90 mt-1">
                        Resets at {new Date(resetTime).toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })} (London)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Stats Bar */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center p-4 rounded-modern bg-white/80 shadow-modern hover-lift animate-fade-in-up">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2">{scenarios.length}</div>
              <div className="text-sm font-medium text-gray-600">Available Scenarios</div>
            </div>
            <div className="text-center p-4 rounded-modern bg-white/80 shadow-modern hover-lift animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-center mb-2">
                <Diamond className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 ${isAdmin ? 'text-emerald-500' : 'text-blue-500'}`} />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">
                  {isAdmin ? '∞' : '1'}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-600">
                {isAdmin ? 'Unlimited Access' : 'Daily Attempts'}
              </div>
            </div>
            <div className="text-center p-4 rounded-modern bg-white/80 shadow-modern hover-lift animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-2" />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">8 min</span>
              </div>
              <div className="text-sm font-medium text-gray-600">Session Duration</div>
            </div>
            <div className="text-center p-4 rounded-modern bg-white/80 shadow-modern hover-lift animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 mr-2" />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">100%</span>
              </div>
              <div className="text-sm font-medium text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-4">Choose a Scenario</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Select a clinical scenario to practice your OSCE skills with AI-powered patient interactions</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {scenarios.map((scenario, index) => (
            <div
              key={scenario.id}
              className="bg-white/90 backdrop-blur-sm rounded-modern-lg shadow-modern-lg border border-gray-200/50 p-6 sm:p-8 hover-lift transition-all duration-300 animate-fade-in-up"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-primary rounded-modern flex items-center justify-center text-white shadow-modern">
                    {scenario.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">{scenario.title}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-modern text-sm font-medium ${
                      scenario.difficulty === 'Advanced' 
                        ? 'gradient-secondary text-white' 
                        : scenario.difficulty === 'Intermediate'
                        ? 'gradient-warm text-white'
                        : 'gradient-success text-white'
                    }`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                </div>
                {scenario.available && (
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">{scenario.description}</p>
              
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {scenario.keyAreas.map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-modern text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => handleStartScenario(scenario.id)}
                  disabled={!scenario.available || (!isAdmin && !canAttempt)}
                  className={`w-full py-3 text-sm font-semibold rounded-modern transition-all duration-300 ${
                    scenario.available && (isAdmin || canAttempt)
                      ? 'gradient-primary text-white shadow-modern hover:shadow-modern-lg hover:scale-105'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {!scenario.available 
                    ? 'Coming Soon'
                    : !isAdmin && !attemptLimitChecked
                    ? 'Checking...'
                    : !isAdmin && !canAttempt
                    ? 'Daily Limit Reached'
                    : 'Start Scenario'
                  }
                </Button>
                {!isAdmin && attemptLimitMessage && scenario.available && (
                  <p className={`text-xs text-center font-medium ${
                    canAttempt ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {attemptLimitMessage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
