"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Message {
  role: 'doctor' | 'patient';
  content: string;
  timestamp: Date;
}

interface NewStationProps {
  stationConfig: {
    id: string;
    title: string;
    description: string;
    patientProfile: string;
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function NewStation({ stationConfig }: NewStationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleConnect = () => {
    setIsConnected(true);
    setError(null);
    
    // Start with patient greeting
    const greeting: Message = {
      role: 'patient',
      content: "Hello doctor, I'm here because I've been having some chest pain and I'm worried about it.",
      timestamp: new Date()
    };
    
    setMessages([greeting]);
    speakText(greeting.content);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setMessages([]);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel();
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !isConnected) return;

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

    try {
      // Call OpenAI API
      const response = await fetch('/api/openai/simple-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          systemPrompt: `You are David Brown, a 58-year-old delivery driver with chest pain. You are worried but cooperative. Keep responses short and natural. Only answer what you're asked.`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to get AI response');
      }

      const data = await response.json();
      
      // Add patient response
      const patientMessage: Message = {
        role: 'patient',
        content: data.response,
        timestamp: new Date()
      };

      setMessages([...updatedMessages, patientMessage]);
      await speakText(data.response);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to use a male voice
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('alex')
      );
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        reject(new Error('Speech synthesis error'));
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      recognitionRef.current.start();
    } else if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser. Please use the text input below.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
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
                  {stationConfig.title}
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
                  <h3 className="font-medium text-gray-900">Instructions</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Conduct a thorough consultation with the patient. Ask about their symptoms, medical history, and concerns.
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
                        <div className="text-sm font-medium mb-1">
                          {message.role === 'doctor' ? 'Doctor' : 'Patient'}
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
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Controls */}
              <div className="border-t border-gray-200 p-4">
                {!isConnected ? (
                  <Button onClick={handleConnect} className="w-full">
                    Start Consultation
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Voice Controls */}
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        onClick={isListening ? stopListening : startListening}
                        variant={isListening ? "destructive" : "default"}
                        disabled={isSpeaking}
                      >
                        {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                        {isListening ? 'Stop Listening' : 'Start Listening'}
                      </Button>
                      
                      <Button
                        onClick={() => window.speechSynthesis.cancel()}
                        variant="outline"
                        disabled={!isSpeaking}
                      >
                        <VolumeX className="h-4 w-4 mr-2" />
                        Stop Speaking
                      </Button>
                    </div>

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
