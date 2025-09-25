"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiltedStationCard } from "@/components/TiltedStationCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Stethoscope, 
  Clock, 
  CheckCircle, 
  Diamond, 
  ArrowLeft, 
  LogOut, 
  Settings,
  TrendingUp,
  Users,
  Activity,
  Target,
  Play,
  Star,
  Award,
  Zap,
  Shield
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function EnhancedDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [attemptLimitChecked, setAttemptLimitChecked] = useState(false);
  const [canAttempt, setCanAttempt] = useState(true);
  const [attemptLimitMessage, setAttemptLimitMessage] = useState('');
  const [resetTime, setResetTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [startingScenario, setStartingScenario] = useState<string | null>(null);

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

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard...</h2>
          <p className="text-gray-600">Setting up your clinical practice environment</p>
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
      icon: <Stethoscope className="h-6 w-6" />,
      color: "from-blue-500 to-purple-500",
      stats: { completion: 85, avgScore: 8.2 }
    },
    {
      id: "falls-assessment",
      title: "Falls Assessment",
      description: "A 72-year-old patient presents after a fall at home. You are assessing them in the emergency department.",
      keyAreas: ["History taking", "Fall risk assessment", "Communication", "Red flag screening"],
      difficulty: "Advanced",
      available: true,
      icon: <Stethoscope className="h-6 w-6" />,
      color: "from-purple-500 to-pink-500",
      stats: { completion: 92, avgScore: 8.7 }
    },
    {
      id: "shortness-of-breath",
      title: "Shortness of Breath Assessment",
      description: "A 68-year-old man presents with worsening breathlessness. You are assessing them in the emergency department.",
      keyAreas: ["History taking", "Respiratory assessment", "Communication", "Red flag screening"],
      difficulty: "Intermediate",
      available: true,
      icon: <Stethoscope className="h-6 w-6" />,
      color: "from-green-500 to-teal-500",
      stats: { completion: 78, avgScore: 7.9 }
    }
  ];

  const handleStartScenario = async (scenarioId: string) => {
    if (startingScenario) return; // Prevent multiple clicks
    
    console.log('Starting scenario:', scenarioId);
    setStartingScenario(scenarioId);
    
    try {
      if (scenarioId === "chest-pain" || scenarioId === "falls-assessment" || scenarioId === "shortness-of-breath") {
        router.push(`/station/${scenarioId}`);
      }
    } catch (error) {
      console.error('Error starting scenario:', error);
    } finally {
      // Reset after a short delay to allow navigation
      setTimeout(() => setStartingScenario(null), 1000);
    }
  };

  const dashboardStats = [
    { label: "Available Scenarios", value: scenarios.filter(s => s.available).length, icon: Target, color: "text-blue-600" },
    { label: "Daily Attempts", value: isAdmin ? "∞" : "1", icon: Diamond, color: isAdmin ? "text-emerald-600" : "text-blue-500" },
    { label: "Session Duration", value: "8 min", icon: Clock, color: "text-purple-600" },
    { label: "Success Rate", value: "100%", icon: CheckCircle, color: "text-green-600" }
  ];

  return (
    <div className="min-h-screen relative">

      {/* Welcome Banner */}
      <div className="gradient-cool border-b border-white/20 shadow-modern relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in-up">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Welcome back{session.user?.name ? `, ${session.user.name}` : ''} 👋
              </h1>
              <p className="text-gray-600 text-base sm:text-lg font-medium">REAL-TIME LIVE Clinical Practice Sessions</p>
            </div>
            {!isAdmin && attemptLimitChecked && (
              <Badge variant={canAttempt ? "success" : "destructive"} className="animate-slide-in-right">
                {canAttempt ? (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    1 attempt remaining today
                  </>
                ) : (
                  <div className="text-center">
                    <div>Daily limit reached</div>
                    {resetTime && (
                      <div className="text-xs opacity-90 mt-1">
                        Resets at {new Date(resetTime).toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })} (London)
                      </div>
                    )}
                  </div>
                )}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Bar */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {dashboardStats.map((stat, index) => (
              <Card key={index} variant="glass" className="text-center p-4 hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{animationDelay: `${index * 100}ms`}}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 ${stat.color}`} />
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {stat.value}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 serif-title">
            Choose a Scenario
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto humanist-text">
            Select a clinical scenario to practice your OSCE skills with AI-powered patient interactions
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 items-stretch">
          {scenarios.map((scenario, index) => (
            <TiltedStationCard
              key={scenario.id}
              scenario={scenario}
              index={index}
              onStart={handleStartScenario}
              isAdmin={isAdmin}
              canAttempt={canAttempt}
              attemptLimitChecked={attemptLimitChecked}
              attemptLimitMessage={attemptLimitMessage}
              isStarting={startingScenario === scenario.id}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <Card variant="glass" className="p-8">
            <CardContent>
              <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent serif-title">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 transition-colors duration-300">
                  <Activity className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">View Analytics</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 transition-colors duration-300">
                  <Award className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Achievements</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 transition-colors duration-300">
                  <Users className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">Community</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
