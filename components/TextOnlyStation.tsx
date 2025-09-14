"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Message {
  role: 'doctor' | 'patient';
  content: string;
  timestamp: Date;
}

interface TextOnlyStationProps {
  stationConfig: {
    id: string;
    title: string;
    description: string;
    patientProfile: string;
  };
}

export default function TextOnlyStation({ stationConfig }: TextOnlyStationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConnect = () => {
    setIsConnected(true);
    setError(null);
    
    // Start with patient greeting using the configured opening line
    const greeting: Message = {
      role: 'patient',
      content: stationConfig.openingLine || "Hello doctor, I'm here because I've been having some chest pain and I'm worried about it.",
      timestamp: new Date()
    };
    
    setMessages([greeting]);
    toast.success("Consultation started!");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setMessages([]);
    toast.info("Consultation ended.");
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !isConnected) return;

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

    try {
      console.log('Calling OpenAI API...');
      
      // Call OpenAI API
      const response = await fetch('/api/openai/simple-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          systemPrompt: stationConfig.systemPrompt || `You are a patient with chest pain. Keep responses short and natural.`
        }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details || 'Failed to get AI response');
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      // Add patient response
      const patientMessage: Message = {
        role: 'patient',
        content: data.response,
        timestamp: new Date()
      };

      setMessages([...updatedMessages, patientMessage]);
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
                  {stationConfig.title} (Text Only)
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
                    Type your questions to the patient in the chat below.
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
                  <p className="text-sm text-red-700"><strong>Error:</strong> {error}</p>
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
