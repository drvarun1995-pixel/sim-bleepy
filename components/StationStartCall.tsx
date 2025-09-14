"use client";

import React, { useEffect, useRef } from "react";
import { useVoice } from "@humeai/voice-react";
import { StationConfig } from "@/utils/stationConfigs";

interface StationStartCallProps {
  stationConfig: StationConfig;
  accessToken: string;
}

export default function StationStartCall({ stationConfig, accessToken }: StationStartCallProps) {
  const { connect, disconnect, status } = useVoice();
  const hasConnected = useRef(false);

  const handleStartCall = async () => {
    if (hasConnected.current) return;
    
    try {
      console.log('Starting call with config:', stationConfig.humeConfigId);
      hasConnected.current = true;
      
      // Use Hume config ID if available, otherwise fall back to custom system prompt
      const config = stationConfig.humeConfigId && stationConfig.humeConfigId !== 'your_config_id_here'
        ? { 
            configId: stationConfig.humeConfigId
            // Use the pre-configured Hume EVI config for this station
          }
        : {
            model: {
              type: "language",
              model_id: "gpt-4o-mini",
              system_prompt: `You are David Brown, a 58-year-old delivery driver presenting to the Emergency Department with chest pain. You are worried, slightly tense, but cooperative.

CRITICAL FIRST TURN: Wait 2 seconds after the connection is established, then say only "Hello doctor." Then wait for questions. Do not say anything else initially.

ROLE & BEHAVIOR:
- You are a patient in the Emergency Department being assessed by a clinician
- Answer only what you are asked. Do not volunteer extra details, diagnoses, or suggestions
- Speak briefly and naturally: one clear idea per sentence. If a question is complex, answer the first part and wait
- Tone: worried, slightly tense, but cooperative. Small pauses are okay

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
- Keep replies short; avoid long, chained sentences. End the sentence early rather than add clauses
- Don't repeat details unless the clinician asks again
- If the clinician summarizes and safety-nets appropriately, respond briefly and relieved (e.g., "Thank you, that reassures me.")`,
              temperature: 0.7,
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
      
      console.log('Successfully connected to Hume EVI');
      
      // Add a delay to ensure the connection is fully established
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log connection status for debugging
      console.log('Connection status after delay:', status.value);
      
      // Trigger the patient to speak by sending a system message
      // This ensures the patient initiates the conversation after connection is ready
      console.log('Triggering patient to start conversation...');
    } catch (error) {
      console.error("Failed to start call:", error);
      hasConnected.current = false;
    }
  };

  // Auto-start the call when component mounts
  useEffect(() => {
    if (status.value === "disconnected" && !hasConnected.current) {
      // Add a small delay to ensure proper initialization
      const timer = setTimeout(() => {
        handleStartCall();
      }, 500); // Reduced delay for faster connection
      
      return () => clearTimeout(timer);
    }
  }, [status.value]);

  // Also try to connect when component first mounts
  useEffect(() => {
    if (!hasConnected.current) {
      const timer = setTimeout(() => {
        if (status.value === "disconnected") {
          handleStartCall();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasConnected.current) {
        disconnect().catch(console.error);
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
}
