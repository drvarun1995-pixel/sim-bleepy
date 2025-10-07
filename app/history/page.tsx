"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle, XCircle, Calendar, User, Stethoscope } from "lucide-react";
import Link from "next/link";

interface ConsultationHistory {
  id: string;
  stationName: string;
  date: string;
  duration: number;
  score: number;
  maxScore: number;
  status: "PASS" | "FAIL";
  totalMessages: number;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [consultationHistory, setConsultationHistory] = useState<ConsultationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/history");
    }
  }, [status, router]);

  useEffect(() => {
    // Load real consultation history from localStorage
    const loadConsultationHistory = () => {
      try {
        const storedHistory = localStorage.getItem('consultationHistory');
        if (storedHistory) {
          const history = JSON.parse(storedHistory);
          // Sort by date (most recent first)
          const sortedHistory = history.sort((a: ConsultationHistory, b: ConsultationHistory) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setConsultationHistory(sortedHistory);
        } else {
          setConsultationHistory([]);
        }
      } catch (error) {
        console.error('Error loading consultation history:', error);
        setConsultationHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadConsultationHistory();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const formatDuration = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                {new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                Bleepy Simulator
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Consultation History</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Review your past clinical practice sessions and track your progress
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{consultationHistory.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Sessions</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {consultationHistory.filter(h => h.status === "PASS").length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Passed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {consultationHistory.filter(h => h.status === "FAIL").length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Failed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {consultationHistory.length > 0 
                    ? Math.round(consultationHistory.reduce((acc, h) => acc + h.duration, 0) / consultationHistory.length * 10) / 10
                    : 0
                  }m
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Avg Duration</div>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Consultations</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading consultation history...</p>
            </div>
          ) : consultationHistory.length === 0 ? (
            <div className="p-8 text-center">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No consultations yet</h3>
              <p className="text-gray-600 mb-4">Start your first clinical practice session to see your history here.</p>
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Start Practice Session
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {consultationHistory.map((consultation) => (
                <Link 
                  key={consultation.id} 
                  href={`/history/${consultation.id}`}
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {consultation.stationName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{formatDate(consultation.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{formatDuration(consultation.duration)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{consultation.totalMessages} messages</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                      <div className="text-right">
                        <div className="text-lg sm:text-xl font-semibold text-gray-900">
                          {consultation.score}/{consultation.maxScore}
                        </div>
                        <div className={`text-xs sm:text-sm font-medium ${
                          consultation.status === "PASS" ? "text-green-600" : "text-red-600"
                        }`}>
                          {consultation.status}
                        </div>
                      </div>
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                        consultation.status === "PASS" 
                          ? "bg-green-100" 
                          : "bg-red-100"
                      }`}>
                        {consultation.status === "PASS" ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                        )}
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
