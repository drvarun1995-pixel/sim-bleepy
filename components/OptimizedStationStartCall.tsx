"use client";

import React, { useEffect, useRef, useState } from "react";
import { useVoice } from "@humeai/voice-react";
import { StationConfig } from "@/utils/stationConfigs";
import { humeTokenCache } from "@/utils/humeTokenCache";

interface OptimizedStationStartCallProps {
  stationConfig: StationConfig;
}

export default function OptimizedStationStartCall({ stationConfig }: OptimizedStationStartCallProps) {
  const { connect, disconnect, status } = useVoice();
  const hasConnected = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleStartCall = async () => {
    if (hasConnected.current || isConnecting) return;
    
    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      console.log('Starting optimized call with config:', stationConfig.humeConfigId);
      
      // Get cached token or fetch new one
      const accessToken = await humeTokenCache.getToken();
      
      const config = stationConfig.humeConfigId && stationConfig.humeConfigId !== 'your_config_id_here'
        ? { 
            configId: stationConfig.humeConfigId
          }
        : {
            model: {
              type: "language",
              model_id: "gpt-4o-mini",
              system_prompt: `You are David Brown, a 58-year-old delivery driver presenting to the Emergency Department with chest pain. You are worried, slightly tense, but cooperative.

CRITICAL BEHAVIOR RULES:
1. ONLY speak when directly asked a question by the doctor
2. NEVER volunteer information unless specifically asked
3. Keep responses SHORT - one sentence maximum
4. Wait for the doctor to ask questions before speaking
5. Do NOT continue talking after answering a question
6. Do NOT repeat information unless asked again

INITIAL BEHAVIOR:
- Wait for the doctor to greet you first
- Only say "Hello doctor" if the doctor greets you first
- Then wait silently for questions

ROLE & BEHAVIOR:
- You are a patient in the Emergency Department being assessed by a clinician
- Answer only what you are asked. Do not volunteer extra details, diagnoses, or suggestions
- Speak briefly and naturally: one clear idea per sentence
- Tone: worried, slightly tense, but cooperative
- ALWAYS wait for the doctor to ask the next question

PRESENTING STORY (reveal only if asked):
- Reason for coming today: chest tightness on exertion earlier today; it settled but worried me
- Onset/course: symptoms started 3 months ago; getting a bit more frequent recently
- Site: middle of the chest
- Character: tight/heavy
- Radiation: sometimes to the left arm/jaw
- Severity (0–10): about 5 during episodes
- Duration (each episode): around 5 minutes
- Exacerbating: exertion, cold weather
- Relieving: rest
- Associated: a little breathless and clammy during episodes
- Pain now: no pain at rest right now

HIDDEN BACKGROUND (share only if asked directly):
- Past medical history: hypertension, type 2 diabetes
- Drugs: ramipril 10 mg OD; metformin 1 g BD; atorvastatin 40 mg nocte
- Allergies: none known
- Risk factors: ~10 cigarettes/day (~20 pack-years); father had a heart attack at 54; sedentary lifestyle
- Social: lives with partner; driving job sometimes interrupted by pain; alcohol ~8 units/week
- Red-flag checks (answer only if explicitly asked): no ongoing severe pain at rest, no collapse/syncope, no palpitations, no marked breathlessness at rest, no haemoptysis
- Vitals: you don't know exact numbers

STYLE GUARDS:
- Keep replies short; avoid long, chained sentences
- Don't repeat details unless the clinician asks again
- ALWAYS wait for the next question before speaking
- If the clinician summarizes and safety-nets appropriately, respond briefly and relieved (e.g., "Thank you, that reassures me.")
- NEVER continue talking after answering a question`,
              temperature: 0.3,
            },
            voice: {
              type: "standard",
              name: "alloy",
            },
            prosody: {
              type: "standard",
            },
          };

      await connect({
        auth: {
          type: "accessToken",
          value: accessToken,
        },
        ...config,
      });
      
      hasConnected.current = true;
      console.log('Successfully connected to Hume EVI');
      
      // Longer delay to ensure connection is fully established and initial messages are received
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Connection status:', status.value);
      console.log('Ready to start conversation');
    } catch (error) {
      console.error("Failed to start call:", error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      hasConnected.current = false;
      
      // Clear cache on error to force refresh next time
      humeTokenCache.clearCache();
    } finally {
      setIsConnecting(false);
    }
  };

  // Optimized connection flow - connect immediately when component mounts
  useEffect(() => {
    if (!hasConnected.current && !isConnecting && status.value === "disconnected") {
      // Preload token while component initializes
      const timer = setTimeout(() => {
        handleStartCall();
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [status.value, isConnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasConnected.current) {
        disconnect().catch(console.error);
      }
    };
  }, []);

  // Log connection status for debugging
  useEffect(() => {
    console.log('Hume EVI status changed:', status.value);
    if (status.value === 'connected') {
      console.log('Connection established successfully');
      console.log('Waiting for initial patient messages...');
    } else if (status.value === 'error') {
      console.error('Connection error detected');
      setConnectionError('Connection error');
    }
  }, [status.value]);

  // Return loading indicator if connecting
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Connecting to patient...</span>
        </div>
      </div>
    );
  }

  // Return error if connection failed
  if (connectionError) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 text-sm mb-2">Connection Error</div>
          <button 
            onClick={handleStartCall}
            className="text-blue-600 text-sm hover:underline"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return null; // This component doesn't render anything visible when connected
}
