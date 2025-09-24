"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Mic, MicOff, Phone, Stethoscope, CheckCircle, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StationConfig } from "@/utils/stationConfigs";
import { VoiceProvider } from "@humeai/voice-react";
import { useVoice } from "@humeai/voice-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import { ConsultationMessage } from "@/utils/openaiService";
import { audioNotifications } from "@/utils/audioNotifications";
import { SoundSettings } from "@/components/SoundSettings";

// Dynamically import the StationChat component to avoid SSR issues
const StationChat = dynamic(() => import("@/components/StationChat"), {
  ssr: false,
});

// Dynamically import the optimized StationStartCall component to avoid SSR issues
const StationStartCall = dynamic(() => import("@/components/OptimizedStationStartCall"), {
  ssr: false,
});

interface StationInterfaceProps {
  stationConfig: StationConfig;
  accessToken: string;
}

function StationContent({ stationConfig, accessToken }: { stationConfig: StationConfig; accessToken: string }) {
  const [timeRemaining, setTimeRemaining] = useState(stationConfig.duration * 60);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<ConsultationMessage[]>([]);
  const [messageBuffer, setMessageBuffer] = useState<ConsultationMessage[]>([]);
  const [voiceActivity, setVoiceActivity] = useState<number[]>([0, 0, 0, 0, 0]);
  const [attemptLimitChecked, setAttemptLimitChecked] = useState(false);
  const [canAttempt, setCanAttempt] = useState(true);
  const [attemptLimitMessage, setAttemptLimitMessage] = useState('');
  const [resetTime, setResetTime] = useState('');
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const voiceActivityRef = useRef<NodeJS.Timeout | null>(null);

  const { disconnect, status, isMuted, unmute, mute, messages } = useVoice();

  // Initialize message capture immediately on mount
  useEffect(() => {
    console.log('StationInterface mounted, initial messages:', messages);
    console.log('Initial connection status:', status.value);
  }, []);

  // Check attempt limit on component mount
  useEffect(() => {
    checkAttemptLimit();
  }, []);

  // Capture conversation messages for scoring - use buffer to capture early messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      console.log('Raw messages from Hume:', messages);
      console.log('Total messages received:', messages.length);
      console.log('Session active:', isSessionActive);
      
      const consultationMessages: ConsultationMessage[] = messages
        .filter(msg => msg.type === "user_message" || msg.type === "assistant_message")
        .map(msg => ({
          role: msg.type === "user_message" ? "doctor" : "patient",
          content: (msg as any).message?.content || (msg as any).content || "",
          timestamp: msg.receivedAt || new Date()
        }));
      
      console.log('Filtered consultation messages:', consultationMessages);
      console.log('Number of consultation messages:', consultationMessages.length);
      
      // Always buffer messages, even before session starts
      setMessageBuffer(consultationMessages);
      
      // Always update conversation messages for display, regardless of session state
      // This ensures early patient messages are visible immediately
      setConversationMessages(consultationMessages);
    } else {
      // Log when no messages are received
      console.log('No messages received yet, messages array:', messages);
    }
  }, [messages, isSessionActive]);

  // Debug: Log all message types to understand what's being captured
  useEffect(() => {
    if (messages && messages.length > 0) {
      console.log('All message types received:', messages.map(msg => ({ type: msg.type, content: (msg as any).message?.content || (msg as any).content })));
    }
  }, [messages]);

  // Debug: Log connection status changes
  useEffect(() => {
    console.log('Hume EVI connection status changed:', status.value);
  }, [status.value]);

  // Voice activity simulation based on listening state
  useEffect(() => {
    if (status.value === 'connected' && isSessionActive) {
      // Start voice activity animation when listening
      voiceActivityRef.current = setInterval(() => {
        setVoiceActivity(prev => 
          prev.map(() => Math.random() * 0.8 + 0.2) // Random values between 0.2 and 1.0
        );
      }, 150); // Update every 150ms for smooth animation
    } else {
      // Stop animation and reset when not listening
      if (voiceActivityRef.current) {
        clearInterval(voiceActivityRef.current);
        voiceActivityRef.current = null;
      }
      setVoiceActivity([0, 0, 0, 0, 0]);
    }

    return () => {
      if (voiceActivityRef.current) {
        clearInterval(voiceActivityRef.current);
      }
    };
  }, [status.value, isSessionActive]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear timers
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (voiceActivityRef.current) {
        clearInterval(voiceActivityRef.current);
      }
      
      // Disconnect from Hume EVI if still connected
      if (status.value === "connected") {
        disconnect().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (isSessionActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Play station end sound before ending session
            audioNotifications.playSound('station-end', '/sounds/station-end.mp3').catch(() => {
              // Fallback to system beep if audio file not found
              audioNotifications.playSystemBeep('end');
            });
            handleEndSession();
            return 0;
          } else if (prev === 60) {
            // Play warning sound at 1 minute remaining (7 minutes)
            audioNotifications.playSound('time-warning', '/sounds/time-warning.mp3').catch(() => {
              // Fallback to system beep if audio file not found
              audioNotifications.playSystemBeep('notification');
            });
          } else if (prev === 5) {
            // Play early end sound at 5 seconds remaining (7:55 minutes)
            audioNotifications.playSound('station-end-early', '/sounds/station-end-early.mp3').catch(() => {
              // Fallback to system beep if audio file not found
              audioNotifications.playSystemBeep('end');
            });
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (voiceActivityRef.current) {
        clearInterval(voiceActivityRef.current);
      }
    };
  }, [isSessionActive, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkAttemptLimit = async () => {
    try {
      const response = await fetch('/api/attempts/check-limit');
      const data = await response.json();
      
      if (response.ok) {
        setCanAttempt(data.canAttempt);
        setAttemptLimitMessage(data.message);
        setResetTime(data.resetTime || '');
        setAttemptLimitChecked(true);
        
        if (!data.canAttempt) {
          toast.error(data.message);
        }
      } else {
        console.error('Error checking attempt limit:', data.error);
        toast.error('Error checking attempt limit');
      }
    } catch (error) {
      console.error('Error checking attempt limit:', error);
      toast.error('Error checking attempt limit');
    }
  };

  const handleStartSession = async () => {
    // Check attempt limit first
    if (!attemptLimitChecked) {
      await checkAttemptLimit();
    }
    
    if (!canAttempt) {
      toast.error(attemptLimitMessage);
      return;
    }
    
    setSessionStarted(true);
    setIsSessionActive(true);
    toast.success("Session started! Begin your consultation.");
    
    // Dispatch event to notify StationStartCall that session has started
    window.dispatchEvent(new CustomEvent('sessionStarted'));
    
    // Temporarily mute microphone to prevent start sound from being picked up
    const wasMuted = isMuted;
    console.log('Session starting - was muted:', wasMuted);
    if (!isMuted) {
      console.log('Muting microphone for start sound');
      mute();
    }
    
    // Play station start sound
    try {
      await audioNotifications.playSound('station-start', '/sounds/station-start.mp3');
    } catch {
      // Fallback to system beep if audio file not found
      await audioNotifications.playSystemBeep('start');
    }
    
    // Wait for the sound to finish, then unmute if it wasn't muted before
    setTimeout(() => {
      if (!wasMuted) {
        console.log('Unmuting microphone after start sound');
        unmute();
      }
    }, 2000); // Give 2 seconds for the sound to finish
    
    // Include any buffered messages from before the session started
    console.log('Starting session with buffered messages:', messageBuffer);
    setConversationMessages(messageBuffer);
    
    // Save attempt to database
    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationSlug: stationConfig.id,
          startTime: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store attempt ID for later use
        sessionStorage.setItem('currentAttemptId', data.attemptId);
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
    }
  };

  const handleEndSession = async () => {
    setIsSessionActive(false);
    
    // Clear any ongoing timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (voiceActivityRef.current) {
      clearInterval(voiceActivityRef.current);
      voiceActivityRef.current = null;
    }
    
    // Properly disconnect and wait for it to complete
    try {
      console.log('Disconnecting from Hume EVI...');
      await disconnect();
      console.log('Successfully disconnected from Hume EVI');
      
      // Add a longer delay to ensure connection is fully closed
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error disconnecting from Hume EVI:', error);
    }
    
    const duration = stationConfig.duration * 60 - timeRemaining;
    const endTime = new Date().toISOString();
    
    // Store conversation data in sessionStorage for the results page - include all messages
    const allMessages = [...messageBuffer, ...conversationMessages];
    console.log('Storing all messages for scoring:', allMessages);
    
    const sessionData = {
      stationConfig,
      conversationMessages: allMessages,
      duration
    };
    sessionStorage.setItem('consultationData', JSON.stringify(sessionData));
    
    // Update attempt in database
    try {
      const attemptId = sessionStorage.getItem('currentAttemptId');
      if (attemptId) {
        const response = await fetch('/api/attempts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attemptId,
            endTime,
            duration
          })
        });
        
        if (response.ok) {
          console.log('Attempt updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating attempt:', error);
    }
    
    // Navigate to results page
    router.push(`/results/${stationConfig.id}`);
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      unmute();
    } else {
      mute();
    }
  };


  if (!sessionStarted) {
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
                <div className="flex items-center space-x-1 sm:space-x-2 bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">Real-time Connected</span>
                  <span className="sm:hidden">Live</span>
                </div>
                <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                  OSCE Practice
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
          {/* Sound Settings */}
          <div className="flex justify-end">
            <SoundSettings className="w-full max-w-md" />
          </div>
          
          {/* Patient Scenario Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-modern-lg shadow-modern-lg border border-gray-200/50 p-6 sm:p-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-primary rounded-modern flex items-center justify-center shadow-modern">
                  <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{stationConfig.name}</h1>
                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed">{stationConfig.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="gradient-success text-white px-4 py-2 rounded-modern text-sm font-medium shadow-modern">Real-time Voice</span>
                <span className="bg-white border-2 border-gray-200 text-gray-700 px-4 py-2 rounded-modern text-sm font-medium shadow-modern">Hands-Free</span>
              </div>
            </div>
          </div>

          {/* Doctor Instructions Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-modern-lg shadow-modern-lg border border-gray-200/50 p-6 sm:p-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-warm rounded-modern flex items-center justify-center shadow-modern">
                <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">You are the doctor</h2>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-2">Just start speaking - the AI patient will respond automatically!</p>
                <p className="text-sm text-gray-500 font-medium">No buttons to press - voice activity is detected automatically</p>
              </div>
            </div>
          </div>

          {/* Ready State Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-modern-lg shadow-modern-lg border border-gray-200/50 p-6 sm:p-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-6 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-success rounded-modern flex items-center justify-center shadow-modern">
                  <Mic className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Ready to listen</h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span className="bg-gray-100 px-3 py-1 rounded-modern">Real-time conversation</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-modern">Speak naturally</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-modern">Auto voice detection</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={handleStartSession}
                  disabled={!canAttempt || !attemptLimitChecked}
                  className={`w-full sm:w-auto px-6 py-3 text-base font-semibold rounded-modern transition-all duration-300 ${
                    canAttempt 
                      ? 'gradient-primary text-white shadow-modern hover:shadow-modern-lg hover:scale-105' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {!attemptLimitChecked ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : canAttempt ? (
                    'Start Consultation'
                  ) : (
                    'Daily Limit Reached'
                  )}
                </Button>
                {attemptLimitMessage && (
                  <div className={`text-sm text-center font-medium ${
                    canAttempt ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    <p>{attemptLimitMessage}</p>
                    {!canAttempt && resetTime && (
                      <p className="opacity-75 mt-1">
                        Resets at {new Date(resetTime).toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })} (London)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-modern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600 hidden sm:block font-medium">
                {new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-3 py-2 rounded-modern text-sm font-medium shadow-modern">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Real-time Connected</span>
                <span className="sm:hidden">Live</span>
              </div>
              <div className="gradient-primary text-white px-3 py-2 rounded-modern text-sm font-medium shadow-modern">
                OSCE Practice
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">
        {/* Patient Scenario Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{stationConfig.name}</h1>
                <p className="text-gray-600 text-sm sm:text-base">{stationConfig.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">Real-time Voice</span>
              <span className="bg-white border border-blue-200 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">Hands-Free</span>
            </div>
          </div>
        </div>

        {/* Doctor Instructions Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">You are the doctor</h2>
              <p className="text-gray-600 text-sm sm:text-base">The patient will start the conversation. Listen and respond naturally!</p>
              <p className="text-xs sm:text-sm text-gray-500">No buttons to press - voice activity is detected automatically</p>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col relative" style={{ height: '500px' }}>
          <StationChat stationConfig={stationConfig} />
          <StationStartCall stationConfig={stationConfig} />
          
          {/* Call Control Panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  status.value === 'connected' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <Mic className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 ${
                    status.value === 'connected' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex space-x-1 items-end">
                  {voiceActivity.map((activity, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ease-out ${
                        status.value === 'connected' ? 'bg-green-400' : 'bg-blue-400'
                      }`}
                      style={{
                        height: `${activity * 20 + 4}px`,
                        opacity: activity > 0 ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                
                {/* Mute/Unmute Button */}
                {status.value === 'connected' && (
                  <Button
                    onClick={() => isMuted ? unmute() : mute()}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      isMuted 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {isMuted ? 'Unmute AI' : 'Mute AI'}
                  </Button>
                )}
              </div>
              <Button
                onClick={handleEndSession}
                className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base"
              >
                <span className="hidden sm:inline">End Call</span>
                <span className="sm:hidden">End</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Timer Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Time Remaining</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StationInterface({ stationConfig, accessToken }: StationInterfaceProps) {
  return (
    <VoiceProvider
      onError={(error) => {
        toast.error(error.message);
      }}
    >
      <StationContent stationConfig={stationConfig} accessToken={accessToken} />
    </VoiceProvider>
  );
}
