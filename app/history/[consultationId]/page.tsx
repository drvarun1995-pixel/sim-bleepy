"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle, XCircle, MessageCircle, User, Stethoscope, BarChart3 } from "lucide-react";
import Link from "next/link";

interface ConsultationMessage {
  role: "doctor" | "patient";
  content: string;
  timestamp: Date;
}

interface ConsultationHistory {
  id: string;
  stationName: string;
  date: string;
  duration: number;
  score: number;
  maxScore: number;
  status: "PASS" | "FAIL";
  totalMessages: number;
  messages?: ConsultationMessage[];
  examinerNotes?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  nextSteps?: string[];
  detailedAnalysis?: {
    communication: string;
    clinicalReasoning: string;
    patientSafety: string;
    professionalism: string;
  };
  domainScores?: {
    dataGathering: number;
    clinicalManagement: number;
    interpersonalSkills: number;
  };
  diagnosisEvaluation?: {
    correctDiagnosis: string;
    doctorDiagnosis: string;
    diagnosisCorrect: boolean;
    diagnosisReasoning: string;
  };
}

export default function ConsultationDetailPage({ params }: { params: { consultationId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [consultation, setConsultation] = useState<ConsultationHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const loadConsultation = () => {
      try {
        const storedHistory = localStorage.getItem('consultationHistory');
        if (storedHistory) {
          const history = JSON.parse(storedHistory);
          const foundConsultation = history.find((c: ConsultationHistory) => c.id === params.consultationId);
          
          if (foundConsultation) {
            setConsultation(foundConsultation);
          } else {
            console.error('Consultation not found');
            router.push('/history');
          }
        } else {
          router.push('/history');
        }
      } catch (error) {
        console.error('Error loading consultation:', error);
        router.push('/history');
      } finally {
        setLoading(false);
      }
    };

    loadConsultation();
  }, [params.consultationId, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation details...</p>
        </div>
      </div>
    );
  }

  if (!session || !consultation) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
          <div className="flex justify-between items-center h-16">
            <Link href="/history" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {formatDate(consultation.date)}
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Bleepy Simulator
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Consultation Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{consultation.stationName}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(consultation.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{consultation.totalMessages} messages</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {consultation.score}/{consultation.maxScore}
              </div>
              <div className={`text-sm font-medium ${getScoreColor(consultation.score, consultation.maxScore)}`}>
                {Math.round((consultation.score / consultation.maxScore) * 100)}%
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(consultation.status)}`}>
                {consultation.status === "PASS" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Pass
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Needs Improvement
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Conversation */}
          <div className="space-y-6">
            {/* Conversation Messages */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h2 className="text-xl font-semibold text-gray-900">Medical Consultation Transcript</h2>
                  <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">Record #{consultation.id}</span>
                </div>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto bg-gray-50">
                {consultation.messages && consultation.messages.length > 0 ? (
                  <div className="space-y-3">
                    {consultation.messages.map((message, index) => {
                      const isDoctor = message.role === "doctor";
                      const isPatient = message.role === "patient";
                      
                      return (
                        <div
                          key={index}
                          className={`w-full bg-white border-l-4 shadow-sm rounded-r-lg ${
                            isDoctor ? "border-l-blue-500" : "border-l-gray-400"
                          }`}
                        >
                          {/* Medical Record Header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${
                                isDoctor ? "bg-blue-500" : "bg-gray-400"
                              }`} />
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {isDoctor ? "Dr. [Doctor]" : "Patient"}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                  {isDoctor ? "MD" : "ID: 12345"}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {new Date(message.timestamp).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                              })}
                            </div>
                          </div>
                          
                          {/* Medical Record Content */}
                          <div className="px-4 py-4">
                            <div className="text-gray-900 leading-relaxed font-medium">
                              {message.content}
                            </div>
                            
                            {/* Medical Record Footer */}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Consultation Note</span>
                                <span>Entry #{index + 1}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No consultation notes available</p>
                    <p className="text-gray-400 text-sm mt-1">Medical transcript will appear here during consultation</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Score Details */}
          <div className="space-y-6">
            {/* Domain Scores */}
            {consultation.domainScores && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Domain Scores</h2>
                <div className="space-y-4">
                  {[
                    { name: "Data Gathering", score: consultation.domainScores.dataGathering, max: 4 },
                    { name: "Clinical Management", score: consultation.domainScores.clinicalManagement, max: 4 },
                    { name: "Interpersonal Skills", score: consultation.domainScores.interpersonalSkills, max: 4 }
                  ].map((domain, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{domain.name}</span>
                        <span className={`font-bold ${getScoreColor(domain.score, domain.max)}`}>
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
            )}

            {/* Examiner Notes */}
            {consultation.examinerNotes && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Examiner Notes</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{consultation.examinerNotes}</p>
                </div>
              </div>
            )}

            {/* Strengths and Areas for Improvement */}
            {(consultation.strengths || consultation.areasForImprovement) && (
              <div className="grid gap-6">
                {consultation.strengths && consultation.strengths.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Strengths</h2>
                    <ul className="space-y-2">
                      {consultation.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {consultation.areasForImprovement && consultation.areasForImprovement.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Areas for Improvement</h2>
                    <ul className="space-y-2">
                      {consultation.areasForImprovement.map((area, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Diagnosis Evaluation */}
            {consultation.diagnosisEvaluation && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Diagnosis Evaluation</h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Correct Diagnosis</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 font-medium">{consultation.diagnosisEvaluation.correctDiagnosis}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Your Diagnosis</h3>
                    <div className={`border rounded-lg p-3 ${
                      consultation.diagnosisEvaluation.diagnosisCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <p className={`font-medium ${
                        consultation.diagnosisEvaluation.diagnosisCorrect 
                          ? 'text-green-800' 
                          : 'text-red-800'
                      }`}>
                        {consultation.diagnosisEvaluation.doctorDiagnosis || 'No diagnosis provided'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Diagnosis Analysis</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm">{consultation.diagnosisEvaluation.diagnosisReasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            {consultation.detailedAnalysis && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Analysis</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Communication Skills</h3>
                    <p className="text-gray-700 text-sm">{consultation.detailedAnalysis.communication}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Clinical Reasoning</h3>
                    <p className="text-gray-700 text-sm">{consultation.detailedAnalysis.clinicalReasoning}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Patient Safety</h3>
                    <p className="text-gray-700 text-sm">{consultation.detailedAnalysis.patientSafety}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Professionalism</h3>
                    <p className="text-gray-700 text-sm">{consultation.detailedAnalysis.professionalism}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {consultation.nextSteps && consultation.nextSteps.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
                <ol className="space-y-3">
                  {consultation.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Practice Another Scenario
            </Button>
          </Link>
          <Link href="/history" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to History
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
