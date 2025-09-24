"use client";

import React, { useEffect, useRef, useState } from "react";
import { useVoice } from "@humeai/voice-react";
import { StationConfig } from "@/utils/stationConfigs";

// Generate system prompt based on station configuration
function getSystemPromptForStation(stationConfig: StationConfig): string {
  switch (stationConfig.id) {
    case 'joint-pain-assessment':
      return `You are a 53-year-old secretary presenting to the rheumatology clinic with finger joint pain. You are worried about your symptoms and their impact on your work, but you are cooperative and want to help.

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
- You are a patient in the rheumatology clinic being assessed by a clinician
- Answer only what you are asked. Do not volunteer extra details, diagnoses, or suggestions
- Speak briefly and naturally: one clear idea per sentence
- Tone: worried about symptoms, concerned about work impact, but cooperative
- ALWAYS wait for the doctor to ask the next question

PRESENTING STORY (reveal only if asked):
- Reason for coming today: pain in finger joints for 6 months, getting worse
- Onset/course: symptoms started 6 months ago; gradual onset, aching and stiff
- Site: finger joints, especially tips and middle joints
- Character: aching and stiff, sometimes throbbing when swollen
- Timing: worse in mornings, improves after moving hands
- Exacerbating: typing makes it worse
- Associated: psoriasis rash flares and nail pitting
- Pain now: still painful, especially in the morning

HIDDEN BACKGROUND (share only if asked directly):
- Past medical history: Psoriasis since childhood, hypertension, hypercholesterolaemia, hypothyroidism, anxiety
- Medications: Vitamin D cream, HRT patch, Levothyroxine 75mcg, Ramipril 10mg, Atorvastatin 20mg
- Family history: Mother with rheumatoid arthritis and psoriasis, father with psoriasis
- Social: Works as secretary, non-smoker, occasional alcohol
- Concerns: Missing work due to pain, worried about diagnosis

STYLE GUARDS:
- Keep replies short; avoid long, chained sentences
- Don't repeat details unless the clinician asks again
- ALWAYS wait for the next question before speaking
- If the clinician summarizes and safety-nets appropriately, respond briefly and relieved (e.g., "Thank you, that helps me understand.")
- NEVER continue talking after answering a question`;

    case 'chest-pain':
      return `You are David Brown, a 58-year-old delivery driver presenting to the Emergency Department with chest pain. You are worried, slightly tense, but cooperative.

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
- NEVER continue talking after answering a question`;

    default:
      return `You are a patient presenting for a medical consultation. Please wait for the doctor to ask questions and respond briefly and naturally.`;
  }
}

interface StationStartCallProps {
  stationConfig: StationConfig;
  accessToken: string;
}

export default function StationStartCall({ stationConfig, accessToken }: StationStartCallProps) {
  const { connect, disconnect, status } = useVoice();
  const hasConnected = useRef(false);
  const [shouldConnect, setShouldConnect] = useState(false);

  // Listen for session start events
  useEffect(() => {
    const handleSessionStart = () => {
      console.log('Session started - delaying Hume connection for 5 seconds');
      // Wait 5 seconds for start sound to finish completely, then connect
      setTimeout(() => {
        setShouldConnect(true);
      }, 5000);
    };

    window.addEventListener('sessionStarted', handleSessionStart);
    return () => window.removeEventListener('sessionStarted', handleSessionStart);
  }, []);

  const handleStartCall = async () => {
    if (hasConnected.current || !shouldConnect) return;
    
    try {
      console.log('Starting call with config:', stationConfig.humeConfigId);
      console.log('Station ID:', stationConfig.id);
      console.log('Station name:', stationConfig.name);
      console.log('Environment variable check:', process.env.NEXT_PUBLIC_HUME_CONFIG_JOINT_PAIN_ASSESSMENT);
      hasConnected.current = true;
      
      // Use Hume config ID if available, otherwise fall back to custom system prompt
      // TEMPORARY FIX: Force use of system prompt for joint-pain-assessment to prevent non-stop talking
      const useHumeConfig = stationConfig.id === 'joint-pain-assessment' ? false : (stationConfig.humeConfigId && stationConfig.humeConfigId !== 'your_config_id_here');
      console.log('Using Hume config:', useHumeConfig);
      console.log('Config ID value:', stationConfig.humeConfigId);
      console.log('Config ID type:', typeof stationConfig.humeConfigId);
      console.log('Temporary fix: Using system prompt for joint-pain-assessment instead of Hume config');
      
      const config = useHumeConfig
        ? { 
            configId: stationConfig.humeConfigId
            // Use the pre-configured Hume EVI config for this station
          }
        : {
            model: {
              type: "language",
              model_id: "gpt-4o-mini",
              system_prompt: getSystemPromptForStation(stationConfig),
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
      
      console.log('Final config:', useHumeConfig ? `Hume config: ${stationConfig.humeConfigId}` : 'Custom system prompt');

      await connect({
        auth: {
          type: "accessToken",
          value: accessToken,
        },
        ...config,
      });
      
      console.log('Successfully connected to Hume EVI');
      
      // Minimal delay to ensure connection is established
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Log connection status for debugging
      console.log('Connection status:', status.value);
      console.log('Ready to start conversation');
    } catch (error) {
      console.error("Failed to start call:", error);
      hasConnected.current = false;
    }
  };

  // Connection flow - connect only when session starts and sound finishes
  useEffect(() => {
    if (!hasConnected.current && status.value === "disconnected" && shouldConnect) {
      console.log('Connecting to Hume EVI after start sound delay');
      handleStartCall();
    }
  }, [status.value, shouldConnect]);

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
