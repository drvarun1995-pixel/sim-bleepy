'use client';

import { useState, useRef, useEffect } from 'react';

export default function RealtimeAudioChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready to connect');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Add confidence threshold to reduce false positives
      recognition.onnomatch = () => {
        console.log('No speech match found');
      };

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('Listening...');
      };

      recognition.onresult = async (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;
        
        console.log('Speech recognized:', { transcript, confidence });
        
        // Only process if transcript is meaningful and has decent confidence
        if (transcript && 
            transcript.trim().length > 2 && 
            confidence > 0.3 &&
            !transcript.trim().match(/^(uh|um|ah|er|mm|hmm)$/i)) {
          
          setStatus(`You said: "${transcript}"`);
          
          // Send to OpenAI Realtime API
          await sendToOpenAI(transcript.trim());
        } else {
          console.log('Low quality transcript, ignoring...', { transcript, confidence });
          setStatus('Listening...');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setStatus(`Recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        console.log('Recognition ended, restarting if connected...');
        setIsListening(false);
        
        // Automatically restart listening if still connected
        if (isConnected && !isSpeaking) {
          setTimeout(() => {
            console.log('Auto-restarting speech recognition...');
            recognition.start();
          }, 100);
        } else {
          setStatus('Recognition ended');
        }
      };
    } else {
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const sendToOpenAI = async (transcript: string) => {
    try {
      setStatus('Sending to AI...');
      
      const response = await fetch('/api/openai/realtime-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: transcript,
          conversation_history: conversationHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update conversation history
      setConversationHistory(data.conversation_history || []);
      
      // Speak the AI response
      speakResponse(data.response);
      
    } catch (err) {
      console.error('Error sending to OpenAI:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setStatus('Error occurred');
      
      // Still restart listening even on error
      setTimeout(() => {
        if (isConnected && recognitionRef.current) {
          recognitionRef.current.start();
        }
      }, 2000);
    }
  };

  const speakResponse = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setStatus('AI is speaking...');
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setStatus('Listening...');
        
        // Automatically start listening again if connected
        if (isConnected && recognitionRef.current) {
          setTimeout(() => {
            console.log('Starting listening after AI finished speaking...');
            recognitionRef.current?.start();
          }, 300);
        }
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        setStatus('Speech synthesis error');
      };
      
      synthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    } else {
      setError('Speech synthesis not supported in this browser');
    }
  };

  const startConversation = async () => {
    try {
      setError(null);
      setIsConnected(true);
      setConversationHistory([]);
      setStatus('Connected - AI is introducing itself...');
      
      // Start with AI introduction
      speakResponse("Hello! I'm your AI assistant. How can I help you today?");
      
      // Automatically start listening after AI finishes speaking
      setTimeout(() => {
        if (recognitionRef.current && isConnected) {
          console.log('Auto-starting listening after introduction...');
          recognitionRef.current.start();
        }
      }, 2000); // Give AI time to finish speaking
      
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation');
      setIsConnected(false);
      setStatus('Failed to connect');
    }
  };

  const stopConversation = () => {
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setStatus('Conversation ended');
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Stop speech synthesis
    if (synthesisRef.current) {
      speechSynthesis.cancel();
    }
    
    // Close websocket if open
    if (websocketRef.current) {
      websocketRef.current.close();
    }
  };


  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Voice Chat with AI</h1>
        <p className="text-gray-600 mb-6">Pure voice conversation - no text needed!</p>
        
        {/* Status Display */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? (isListening ? 'bg-green-500 animate-pulse' : isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-green-500') : 'bg-gray-400'
            }`}></div>
            <span className="font-medium">{status}</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="space-y-4">
          {!isConnected ? (
            <button
              onClick={startConversation}
              className="w-full px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold"
            >
              🎤 Start Voice Conversation
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={stopConversation}
                className="w-full px-8 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-lg font-semibold"
              >
                📞 End Conversation
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 text-sm text-gray-600 space-y-2">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click "Start Voice Conversation" to begin</li>
            <li>AI introduces itself and automatically starts listening</li>
            <li>Just speak naturally - no buttons to press!</li>
            <li>AI responds with voice and continues listening</li>
            <li>Conversation flows automatically</li>
          </ul>
        </div>

        {/* Browser Support Check */}
        {typeof window !== 'undefined' && !('webkitSpeechRecognition' in window) && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            ⚠️ Speech recognition not supported in this browser. Try Chrome or Edge.
          </div>
        )}
        
        {typeof window !== 'undefined' && !('speechSynthesis' in window) && (
          <div className="mt-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            ⚠️ Speech synthesis not supported in this browser.
          </div>
        )}
      </div>
    </div>
  );
}
