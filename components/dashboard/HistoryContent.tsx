"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Calendar, User, Stethoscope } from "lucide-react";
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

export function HistoryContent() {
  const { data: session, status } = useSession();
  const [consultationHistory, setConsultationHistory] = useState<ConsultationHistory[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Progress
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review your past clinical practice sessions and track your progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{consultationHistory.length}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {consultationHistory.filter(h => h.status === "PASS").length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Passed</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {consultationHistory.filter(h => h.status === "FAIL").length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {consultationHistory.length > 0 
                  ? Math.round(consultationHistory.reduce((acc, h) => acc + h.duration, 0) / consultationHistory.length * 10) / 10
                  : 0
                }m
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg Duration</div>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Consultations</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading consultation history...</p>
          </div>
        ) : consultationHistory.length === 0 ? (
          <div className="p-8 text-center">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No consultations yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Start your first clinical practice session to see your history here.</p>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Start Practice Session
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {consultationHistory.map((consultation) => (
              <Link 
                key={consultation.id} 
                href={`/history/${consultation.id}`}
                className="block p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {consultation.stationName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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
                      <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        {consultation.score}/{consultation.maxScore}
                      </div>
                      <div className={`text-xs sm:text-sm font-medium ${
                        consultation.status === "PASS" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}>
                        {consultation.status}
                      </div>
                    </div>
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                      consultation.status === "PASS" 
                        ? "bg-green-100 dark:bg-green-900" 
                        : "bg-red-100 dark:bg-red-900"
                    }`}>
                      {consultation.status === "PASS" ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
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
  );
}
