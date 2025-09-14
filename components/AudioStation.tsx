"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Message {
  role: 'doctor' | 'patient';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
}

interface AudioStationProps {
  stationConfig: {
    id: string;
    title: string;
    description: string;
    patientProfile: string;
    audioPromptId?: string;
    openingLine?: string;
    systemPrompt?: string;
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function AudioStation({ stationConfig }: AudioStationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioMode, setAudioMode] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.continuous = true; // Continuous listening
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        if (transcript && transcript.trim()) {
          // Add a small delay to ensure the recognition has finished
          setTimeout(() => {
            handleSendMessage(transcript.trim());
          }, 100);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Restart listening if no speech detected
          if (isConnected) {
            recognition.start();
          }
        } else {
          setIsListening(false);
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Automatically restart listening if still connected
        if (isConnected && audioMode) {
          recognition.start();
        } else {
          setIsListening(false);
        }
      };
    } else {
      console.log('Speech recognition not supported, falling back to text mode');
      setAudioMode(false);
      setError('Speech recognition not supported in this browser. Using text mode.');
    }
  }, [isConnected, audioMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const playAudio = (audioBase64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const audioBlob = new Blob([Buffer.from(audioBase64, 'base64')], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          reject(error);
        };
        
        setIsSpeaking(true);
        audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsSpeaking(false);
        reject(error);
      }
    });
  };

  const handleConnect = async () => {
    setIsConnected(true);
    setError(null);
    
    // Start continuous listening if in audio mode
    if (audioMode && recognitionRef.current) {
      recognitionRef.current.start();
    }
    
    // Get initial patient greeting
    try {
      setIsLoading(true);
      const response = await fetch('/api/openai/audio-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: stationConfig.audioPromptId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add patient greeting to messages
        const greeting: Message = {
          role: 'patient',
          content: data.response,
          timestamp: new Date(),
          isAudio: audioMode
        };
        
        setMessages([greeting]);
        
        // Play audio if available
        if (data.audioResponse && audioMode) {
          await playAudio(data.audioResponse);
        }
      }
    } catch (error) {
      console.error('Error getting initial audio:', error);
      // Fallback greeting
      const greeting: Message = {
        role: 'patient',
        content: stationConfig.openingLine || "Hello doctor, I'm here because I've been having some chest pain and I'm worried about it.",
        timestamp: new Date(),
        isAudio: false
      };
      setMessages([greeting]);
    } finally {
      setIsLoading(false);
    }
    
    toast.success("Consultation started! You can now speak or type to the patient.");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setMessages([]);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    toast.info("Consultation ended.");
  };

  const handleMuteToggle = () => {
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    console.log('handleSendMessage called with:', { content, isConnected, messagesLength: messages.length });
    
    if (!content.trim() || !isConnected) {
      console.log('Message not sent - empty content or not connected:', { content, isConnected });
      return;
    }

    console.log('Sending message:', content);
    setIsLoading(true);
    setError(null);

    // Add doctor message
    const doctorMessage: Message = {
      role: 'doctor',
      content: content.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, doctorMessage];
    setMessages(updatedMessages);
    console.log('Doctor message added to chat:', doctorMessage);

    try {
      console.log('Calling OpenAI Audio API...');
      
      let audioBase64 = null;
      
      if (audioMode) {
        // For audio mode, we'll need to capture the user's speech
        // For now, we'll use text input but call the audio API
        const response = await fetch('/api/openai/audio-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptId: stationConfig.audioPromptId,
            audioBase64: audioBase64, // This would be captured from speech
            messages: updatedMessages
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to get AI response');
        }

        const data = await response.json();
        console.log('Audio API Response:', data);
        
        // Add patient response
        const patientMessage: Message = {
          role: 'patient',
          content: data.response,
          timestamp: new Date(),
          isAudio: true
        };

        setMessages([...updatedMessages, patientMessage]);
        
        // Play audio response
        if (data.audioResponse) {
          await playAudio(data.audioResponse);
        }
        
      } else {
        // Fallback to text mode
        const response = await fetch('/api/openai/simple-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            systemPrompt: stationConfig.systemPrompt || `You are a patient with chest pain. Keep responses short and natural.`
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to get AI response');
        }

        const data = await response.json();
        
        const patientMessage: Message = {
          role: 'patient',
          content: data.response,
          timestamp: new Date(),
          isAudio: false
        };

        setMessages([...updatedMessages, patientMessage]);
      }
      
      toast.success("Patient responded!");

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to get AI response: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleSendMessage(textInput);
      setTextInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {stationConfig.title} {audioMode ? '(Audio)' : '(Text)'}
                </h1>
                <p className="text-sm text-gray-600">
                  {stationConfig.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAudioMode(!audioMode)}
              >
                {audioMode ? 'Switch to Text' : 'Switch to Audio'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Patient Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Patient Profile</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Patient</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {stationConfig.patientProfile}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Mode</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {audioMode ? 'Audio conversation with OpenAI TTS' : 'Text conversation'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Click "Start Consultation" to begin your conversation with the patient.</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'doctor' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'doctor'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1 flex items-center gap-2">
                          {message.role === 'doctor' ? 'Doctor' : 'Patient'}
                          {message.isAudio && <Volume2 className="h-3 w-3" />}
                        </div>
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="text-sm font-medium mb-1">Patient</div>
                      <div className="text-sm">Thinking...</div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border-t border-red-200">
                  <p className="text-sm text-red-700"><strong>Error:</strong> {error}</p>
                </div>
              )}

              {/* Controls */}
              <div className="border-t border-gray-200 p-4">
                {!isConnected ? (
                  <Button onClick={handleConnect} className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Start Consultation
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Audio Controls */}
                    {audioMode && (
                      <div className="flex justify-center space-x-4">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          <span className="text-sm text-gray-600">
                            {isListening ? 'Listening...' : 'Microphone'}
                          </span>
                        </div>
                        <Button
                          onClick={handleMuteToggle}
                          variant="outline"
                          disabled={!isSpeaking}
                        >
                          {isSpeaking ? <><VolumeX className="w-4 h-4 mr-2" /> Mute AI</> : <><Volume2 className="w-4 h-4 mr-2" /> AI Audio</>}
                        </Button>
                      </div>
                    )}

                    {/* Text Input */}
                    <form onSubmit={handleTextSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type your message to the patient..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <Button
                        type="submit"
                        disabled={!textInput.trim() || isLoading}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </form>

                    <Button
                      onClick={handleDisconnect}
                      variant="destructive"
                      className="w-full"
                    >
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End Consultation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
