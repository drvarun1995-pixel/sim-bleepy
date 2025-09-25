"use client";

import React, { useEffect, useRef, useState } from "react";
import { useVoice } from "@humeai/voice-react";
import { StationConfig } from "@/utils/stationConfigs";

// All stations now use Hume EVI configurations only
// Custom system prompts have been removed in favor of Hume dashboard configurations

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
      
      // All stations now use Hume EVI configurations only
      if (!stationConfig.humeConfigId || stationConfig.humeConfigId === 'your_config_id_here') {
        throw new Error(`No Hume EVI configuration found for station: ${stationConfig.id}. Please ensure the environment variable is set correctly.`);
      }
      
      console.log('Using Hume EVI config:', stationConfig.humeConfigId);
      
      const config = { 
        configId: stationConfig.humeConfigId
        // Use the pre-configured Hume EVI config for this station
      };
      
      console.log('Final config: Hume EVI config:', stationConfig.humeConfigId);

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
