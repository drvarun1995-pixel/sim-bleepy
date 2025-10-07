"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, CheckCircle, XCircle, AlertTriangle, Target, Clock, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getStationConfig } from "@/utils/stationConfigs";
import { ScoringResult, ConsultationMessage } from "@/utils/openaiService";

interface StationPageProps {
  params: {
    stationId: string;
  };
}

interface ConsultationData {
  stationConfig: any;
  conversationMessages: ConsultationMessage[];
  duration: number;
}

export default function ResultsPage({ params }: StationPageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const stationConfig = getStationConfig(params.stationId);
  const [scoreData, setScoreData] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultationData, setConsultationData] = useState<ConsultationData | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/results/${params.stationId}`)}`);
    }
  }, [status, router, params.stationId]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Get consultation data from sessionStorage
        const storedData = sessionStorage.getItem('consultationData');
        if (!storedData) {
          throw new Error('No consultation data found');
        }

        const data: ConsultationData = JSON.parse(storedData);
        setConsultationData(data);

        // Call OpenAI API to generate real score
        const response = await fetch('/api/score-consultation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: data.conversationMessages,
            stationType: data.stationConfig.name,
            duration: data.duration,
            correctDiagnosis: data.stationConfig.correctDiagnosis,
            diagnosisCriteria: data.stationConfig.diagnosisCriteria
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate score');
        }

        const score = await response.json();
        setScoreData(score);
        
        // Update attempt in database with scoring data
        try {
          const attemptId = sessionStorage.getItem('currentAttemptId');
          if (attemptId) {
            const updateResponse = await fetch('/api/attempts', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                attemptId,
                endTime: new Date().toISOString(),
                duration: data.duration,
                scores: score,
                overallBand: score.status,
                transcript: data.conversationMessages
              })
            });
            
            if (updateResponse.ok) {
              console.log('Attempt updated with scoring data');
            } else {
              const errorData = await updateResponse.json();
              console.error('Failed to update attempt:', errorData);
            }
          }
        } catch (error) {
          console.error('Error updating attempt with scores:', error);
        }
        
        // Save to consultation history in localStorage
        const historyEntry = {
          id: Date.now().toString(),
          stationName: data.stationConfig.name,
          date: new Date().toISOString(),
          duration: data.duration / 60, // Convert to minutes
          score: score.totalScore,
          maxScore: score.maxScore,
          status: score.status,
          totalMessages: data.conversationMessages.length,
          messages: data.conversationMessages,
          examinerNotes: score.examinerNotes,
          strengths: score.strengths,
          areasForImprovement: score.areasForImprovement,
          nextSteps: score.nextSteps,
          detailedAnalysis: score.detailedAnalysis,
          domainScores: score.domainScores
        };
        
        // Get existing history
        const existingHistory = localStorage.getItem('consultationHistory');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        
        // Add new entry
        history.push(historyEntry);
        
        // Keep only last 50 entries to prevent localStorage from getting too large
        const trimmedHistory = history.slice(-50);
        
        // Save back to localStorage
        localStorage.setItem('consultationHistory', JSON.stringify(trimmedHistory));
        
        // Clear the stored data
        sessionStorage.removeItem('consultationData');
        
      } catch (error) {
        console.error('Error fetching results:', error);
        
        // Fallback to mock data if OpenAI fails
        const fallbackScore: ScoringResult = {
          totalScore: 0,
          maxScore: 12,
          status: "FAIL",
          domainScores: {
            dataGathering: 0,
            clinicalManagement: 0,
            interpersonalSkills: 0
          },
          examinerNotes: "Unable to analyze consultation due to technical error. Please ensure you have a meaningful conversation with the patient and try again.",
          strengths: [],
          areasForImprovement: [
            "Technical error prevented analysis",
            "Please ensure stable internet connection",
            "Try conducting a full consultation"
          ],
          nextSteps: [
            "Check your internet connection",
            "Ensure you have a complete conversation with the patient",
            "Try the consultation again"
          ],
          detailedAnalysis: {
            communication: "Unable to analyze due to technical error",
            clinicalReasoning: "Unable to analyze due to technical error",
            patientSafety: "Unable to analyze due to technical error",
            professionalism: "Unable to analyze due to technical error"
          }
        };
        
        setScoreData(fallbackScore);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [params.stationId]);

  if (!stationConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Station Not Found</h1>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication or processing results
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Results</h2>
          <p className="text-gray-600">Analyzing your consultation...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  if (!scoreData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Results</h1>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusColor = (status: string) => {
    return status === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
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
            <div className="flex items-center space-x-2">
              <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy Simulator" className="w-6 h-6 sm:w-8 sm:h-8" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Bleepy Simulator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Score Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-4 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Clinical Station Score</h1>
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">{scoreData.totalScore}</div>
            <div className="text-lg sm:text-xl lg:text-2xl text-gray-500">out of {scoreData.maxScore}</div>
          </div>
          <div className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4">Official Clinical Scoring</div>
          <div className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(scoreData.status)}`}>
            {scoreData.status === "PASS" ? (
              <>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Pass
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Needs Improvement
              </>
            )}
          </div>
        </div>

        {/* Scoring System Info */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
            {scoreData.ukOSCEScores ? "UK Medical School OSCE Assessment" : "Official Clinical Scoring System"}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {scoreData.ukOSCEScores ? (
              <>
                Your consultation has been evaluated using the UK Medical School OSCE assessment criteria with the UCL 5-domain scheme. 
                Each domain is graded as Excellent, Clear Pass, Borderline Pass, Borderline Fail, or Clear Fail, with an overall grade from A-E. 
                This matches the real UK medical school OSCE examination standards.
              </>
            ) : (
              <>
                Your consultation has been evaluated using the official clinical marking scheme. Each domain is scored out of 4 marks, 
                with a maximum total of {scoreData.maxScore} marks per station. This matches the real clinical examination scoring criteria.
              </>
            )}
          </p>
        </div>

        {/* UK OSCE Scores (for joint pain assessment) */}
        {scoreData.ukOSCEScores && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">UK Medical School OSCE Assessment</h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                { name: "Communication Skills", score: scoreData.ukOSCEScores.communicationSkills },
                { name: "Data Gathering", score: scoreData.ukOSCEScores.dataGathering },
                { name: "Structure", score: scoreData.ukOSCEScores.structure },
                { name: "Summary", score: scoreData.ukOSCEScores.summary },
                { name: "Investigations & Management", score: scoreData.ukOSCEScores.investigationsManagement }
              ].map((domain, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{domain.name}</span>
                    <div className="text-right max-w-xs">
                      <p className="text-sm text-gray-700">{domain.score}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900">Overall Grade:</span>
                  <span className={`font-bold text-lg px-3 py-1 rounded ${
                    scoreData.ukOSCEScores.overallGrade === 'A' ? 'bg-green-100 text-green-800' :
                    scoreData.ukOSCEScores.overallGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                    scoreData.ukOSCEScores.overallGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                    scoreData.ukOSCEScores.overallGrade === 'D' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {scoreData.ukOSCEScores.overallGrade}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Diagnosis Check:</strong> {scoreData.ukOSCEScores.diagnosisCheck}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Domain Scores */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Clinical Domain Scores</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { name: "Data Gathering, Technical & Assessment Skills", score: scoreData.domainScores.dataGathering, max: 4 },
              { name: "Clinical Management Skills", score: scoreData.domainScores.clinicalManagement, max: 4 },
              { name: "Interpersonal Skills", score: scoreData.domainScores.interpersonalSkills, max: 4 }
            ].map((domain, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{domain.name}</span>
                  <span className={`font-bold text-sm sm:text-base ${getScoreColor(domain.score, domain.max)}`}>
                    {domain.score}/{domain.max}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (domain.score / domain.max) >= 0.7 ? "bg-green-500" :
                      (domain.score / domain.max) >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${(domain.score / domain.max) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Examiner Notes */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Examiner Notes</h2>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <p className="text-sm sm:text-base text-gray-700">{scoreData.examinerNotes}</p>
          </div>
        </div>

        {/* Strengths and Areas for Improvement */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Strengths</h2>
            <ul className="space-y-2">
              {scoreData.strengths.map((strength, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Areas for Improvement</h2>
            <ul className="space-y-2">
              {scoreData.areasForImprovement.map((area, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Diagnosis Evaluation */}
        {scoreData.diagnosisEvaluation && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Diagnosis Evaluation</h2>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Correct Diagnosis</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 font-medium text-sm sm:text-base">{scoreData.diagnosisEvaluation.correctDiagnosis}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Your Diagnosis</h3>
                <div className={`border rounded-lg p-3 ${
                  scoreData.diagnosisEvaluation.diagnosisCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`font-medium text-sm sm:text-base ${
                    scoreData.diagnosisEvaluation.diagnosisCorrect 
                      ? 'text-green-800' 
                      : 'text-red-800'
                  }`}>
                    {scoreData.diagnosisEvaluation.doctorDiagnosis || 'No diagnosis provided'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Diagnosis Analysis</h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="text-gray-700 text-sm sm:text-base">{scoreData.diagnosisEvaluation.diagnosisReasoning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Analysis */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Detailed Analysis</h2>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Communication Skills</h3>
              <p className="text-gray-700 text-xs sm:text-sm">{scoreData.detailedAnalysis.communication}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Clinical Reasoning</h3>
              <p className="text-gray-700 text-xs sm:text-sm">{scoreData.detailedAnalysis.clinicalReasoning}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Patient Safety</h3>
              <p className="text-gray-700 text-xs sm:text-sm">{scoreData.detailedAnalysis.patientSafety}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Professionalism</h3>
              <p className="text-gray-700 text-xs sm:text-sm">{scoreData.detailedAnalysis.professionalism}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Next Steps for Improvement</h2>
          <ol className="space-y-2 sm:space-y-3">
            {scoreData.nextSteps.map((step, index) => (
              <li key={index} className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <span className="text-gray-700 text-sm sm:text-base">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Transcript Section */}
        {consultationData && consultationData.conversationMessages.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
              Consultation Transcript
            </h2>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {consultationData.conversationMessages
                  .filter((msg, index, array) => {
                    // Remove duplicates based on content, role, and timestamp
                    return array.findIndex(m => 
                      m.content === msg.content && 
                      m.role === msg.role && 
                      Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 1000 // Within 1 second
                    ) === index;
                  })
                  .filter(msg => msg.content && msg.content.trim().length > 0) // Remove empty messages
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Sort by timestamp
                  .map((msg, index) => (
                    <div
                      key={`${msg.role}-${msg.timestamp}-${index}`}
                      className={`p-3 rounded-lg ${
                        msg.role === 'doctor'
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'bg-gray-100 border-l-4 border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          msg.role === 'doctor' ? 'text-blue-900' : 'text-gray-800'
                        }`}>
                          {msg.role === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Patient'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        msg.role === 'doctor' ? 'text-blue-800' : 'text-gray-700'
                      }`}>
                        {msg.content}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 text-center">
              Total messages: {consultationData.conversationMessages.length} | 
              Duration: {Math.round(consultationData.duration / 60)} minutes
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base">
              Practice Another Scenario
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full text-sm sm:text-base">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
