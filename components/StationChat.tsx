"use client";

import { cn } from "@/utils";
import { useVoice } from "@humeai/voice-react";
import React, { ComponentRef, forwardRef } from "react";
import { StationConfig } from "@/utils/stationConfigs";
import { useSession } from "next-auth/react";

interface StationChatProps {
  stationConfig: StationConfig;
}


const StationChat = forwardRef<
  HTMLDivElement,
  StationChatProps
>(function StationChat({ stationConfig }, ref) {
  const { messages } = useVoice();
  const { data: session } = useSession();
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const previousMessageCount = React.useRef(0);

  // Auto-scroll to bottom whenever new messages arrive
  React.useEffect(() => {
    if (messages && messages.length > previousMessageCount.current) {
      console.log(`StationChat: New message detected. Previous: ${previousMessageCount.current}, Current: ${messages.length}`);
      
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          const container = chatContainerRef.current;
          console.log('StationChat: Auto-scrolling to latest message');
          
          // Always scroll to the latest message using container.scrollTo
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100); // Shorter delay for better responsiveness

      previousMessageCount.current = messages.length;
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Initialize message count on mount and scroll to bottom if messages exist
  React.useEffect(() => {
    if (messages) {
      previousMessageCount.current = messages.length;
      
      // If there are existing messages, scroll to bottom on mount
      if (messages.length > 0) {
        const timer = setTimeout(() => {
          if (chatContainerRef.current) {
            console.log('StationChat: Scrolling to bottom on mount');
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 200);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <div
      className="flex-1 overflow-hidden flex flex-col"
      ref={ref}
      style={{ 
        height: '500px', // Fixed height on desktop
        minHeight: '400px' // Minimum height for mobile
      }}
    >
      {/* Fixed height scrollable container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50"
        style={{ 
          height: '100%',
          overflowAnchor: 'none', // Prevent automatic scroll anchoring
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-3 pb-24">
          {messages.map((msg, index) => {
            if (
              msg.type === "user_message" ||
              msg.type === "assistant_message"
            ) {
              const isDoctor = msg.type === "user_message";
              const isPatient = msg.type === "assistant_message";
              const messageContent = (msg as any).message?.content || (msg as any).content || "";
              
              // Debug log removed to reduce console spam
              
              return (
                <div
                  key={msg.type + index}
                  className={cn(
                    "w-full",
                    "bg-white",
                    "border-l-4 border-gray-200",
                    "shadow-sm",
                    "rounded-r-lg",
                    "transition-all duration-200", // Smooth transitions
                    isDoctor && "border-l-blue-500",
                    isPatient && "border-l-gray-400"
                  )}
                >
                  {/* Medical Record Header */}
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        isDoctor ? "bg-blue-500" : "bg-gray-400"
                      )} />
                      <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
                          {isDoctor ? `Dr. ${session?.user?.name || 'Doctor'}` : "Patient"}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded flex-shrink-0">
                          {isDoctor ? "MD" : "ID: 12345"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono flex-shrink-0">
                      {msg.receivedAt.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </div>
                  </div>
                  
                  {/* Medical Record Content */}
                  <div className="px-3 sm:px-4 py-3 sm:py-4">
                    <div className="text-gray-900 leading-relaxed font-medium text-sm sm:text-base break-words">
                      {messageContent}
                    </div>
                    
                    {/* Medical Record Footer */}
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Consultation Note</span>
                        <span>Session ID: {index + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        
        {/* Spacer to ensure last message is visible */}
        <div className="h-4" />
        </div>
      </div>
    </div>
  );
});

export default StationChat;
