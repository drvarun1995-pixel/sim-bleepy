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
        className="flex-1 overflow-y-auto p-4 sm:p-6"
        style={{ 
          height: '100%',
          overflowAnchor: 'none', // Prevent automatic scroll anchoring
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #e2e8f0 100%)'
        }}
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pb-24">
          {messages.map((msg, index) => {
            if (
              msg.type === "user_message" ||
              msg.type === "assistant_message"
            ) {
              const isDoctor = msg.type === "user_message";
              const isPatient = msg.type === "assistant_message";
              // Try multiple ways to extract content from Hume messages
              let messageContent = "";
              if ((msg as any).message?.content) {
                messageContent = (msg as any).message.content;
              } else if ((msg as any).content) {
                messageContent = (msg as any).content;
              } else if ((msg as any).message?.text) {
                messageContent = (msg as any).message.text;
              } else if ((msg as any).text) {
                messageContent = (msg as any).text;
              } else {
                // Fallback: stringify the entire message for debugging
                messageContent = JSON.stringify(msg);
                console.warn('Could not extract content from message in StationChat:', msg);
              }
              
              // Debug log removed to reduce console spam
              
              return (
                <div
                  key={msg.type + index}
                  className={cn(
                    "w-full",
                    "rounded-xl",
                    "shadow-lg",
                    "transition-all duration-300 ease-out",
                    "hover:shadow-xl hover:scale-[1.02]",
                    "border border-white/20",
                    isDoctor && [
                      "bg-gradient-to-br from-blue-50 via-white to-blue-50/30",
                      "border-l-4 border-l-blue-500",
                      "shadow-blue-100/50"
                    ],
                    isPatient && [
                      "bg-gradient-to-br from-gray-50 via-white to-gray-50/30", 
                      "border-l-4 border-l-gray-400",
                      "shadow-gray-100/50"
                    ]
                  )}
                >
                  {/* Medical Record Header */}
                  <div className={cn(
                    "flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b",
                    isDoctor ? [
                      "bg-gradient-to-r from-blue-500/5 to-blue-100/20",
                      "border-blue-200/30"
                    ] : [
                      "bg-gradient-to-r from-gray-500/5 to-gray-100/20", 
                      "border-gray-200/30"
                    ]
                  )}>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={cn(
                        "w-3 h-3 rounded-full flex-shrink-0 shadow-sm",
                        isDoctor ? "bg-blue-500 shadow-blue-500/30" : "bg-gray-400 shadow-gray-400/30"
                      )} />
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <span className={cn(
                          "text-sm sm:text-base font-bold truncate",
                          isDoctor ? "text-blue-900" : "text-gray-800"
                        )}>
                          {isDoctor ? `Dr. ${session?.user?.name || 'Doctor'}` : "Patient"}
                        </span>
                        <span className={cn(
                          "text-xs font-medium px-3 py-1 rounded-full flex-shrink-0",
                          isDoctor ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-gray-100 text-gray-700 border border-gray-200"
                        )}>
                          {isDoctor ? "MD" : "ID: 12345"}
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "text-xs font-mono flex-shrink-0 px-2 py-1 rounded",
                      isDoctor ? "text-blue-700 bg-blue-50" : "text-gray-600 bg-gray-50"
                    )}>
                      {msg.receivedAt.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </div>
                  </div>
                  
                  {/* Medical Record Content */}
                  <div className="px-4 sm:px-5 py-4 sm:py-5">
                    <div className={cn(
                      "leading-relaxed text-sm sm:text-base break-words",
                      isDoctor ? "text-blue-900 font-medium" : "text-gray-800 font-normal"
                    )}>
                      {messageContent}
                    </div>
                    
                    {/* Medical Record Footer */}
                    <div className={cn(
                      "mt-4 pt-3 border-t",
                      isDoctor ? "border-blue-100" : "border-gray-100"
                    )}>
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn(
                          "font-medium",
                          isDoctor ? "text-blue-600" : "text-gray-500"
                        )}>
                          Consultation Note
                        </span>
                        <span className={cn(
                          "font-mono",
                          isDoctor ? "text-blue-500 bg-blue-50 px-2 py-1 rounded" : "text-gray-400 bg-gray-50 px-2 py-1 rounded"
                        )}>
                          ID: {index + 1}
                        </span>
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
