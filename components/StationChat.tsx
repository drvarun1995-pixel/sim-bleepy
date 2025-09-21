"use client";

import { cn } from "@/utils";
import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "motion/react";
import React, { ComponentRef, forwardRef } from "react";
import { StationConfig } from "@/utils/stationConfigs";

interface StationChatProps {
  stationConfig: StationConfig;
}


const StationChat = forwardRef<
  ComponentRef<typeof motion.div>,
  StationChatProps
>(function StationChat({ stationConfig }, ref) {
  const { messages } = useVoice();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Debug: Log messages in StationChat
  React.useEffect(() => {
    if (messages && messages.length > 0) {
      console.log('StationChat received messages:', messages);
      console.log('StationChat message count:', messages.length);
      console.log('Message types:', messages.map(msg => ({ type: msg.type, content: (msg as any).message?.content || (msg as any).content })));
    } else {
      console.log('StationChat: No messages yet, messages array:', messages);
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <motion.div
      layoutScroll
      className={"grow overflow-auto p-6 bg-gray-50"}
      ref={ref}
    >
      <motion.div
        className={"max-w-4xl mx-auto w-full flex flex-col gap-3 pb-24"}
      >
        <AnimatePresence mode={"popLayout"}>
          {messages.map((msg, index) => {
            if (
              msg.type === "user_message" ||
              msg.type === "assistant_message"
            ) {
              const isDoctor = msg.type === "user_message";
              const isPatient = msg.type === "assistant_message";
              const messageContent = (msg as any).message?.content || (msg as any).content || "";
              
              // Debug log for each message being rendered
              console.log(`Rendering message ${index}:`, {
                type: msg.type,
                content: messageContent,
                isDoctor,
                isPatient,
                receivedAt: msg.receivedAt
              });
              
              return (
                <motion.div
                  key={msg.type + index}
                  className={cn(
                    "w-full",
                    "bg-white",
                    "border-l-4 border-gray-200",
                    "shadow-sm",
                    "rounded-r-lg",
                    isDoctor && "border-l-blue-500",
                    isPatient && "border-l-gray-400"
                  )}
                  initial={{
                    opacity: 0,
                    x: -20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: 0,
                  }}
                >
                  {/* Medical Record Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isDoctor ? "bg-blue-500" : "bg-gray-400"
                      )} />
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {isDoctor ? "Dr. [Doctor]" : "Patient"}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          {isDoctor ? "MD" : "ID: 12345"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {msg.receivedAt.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </div>
                  </div>
                  
                  {/* Medical Record Content */}
                  <div className="px-4 py-4">
                    <div className="text-gray-900 leading-relaxed font-medium">
                      {messageContent}
                    </div>
                    
                    {/* Medical Record Footer */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Consultation Note</span>
                        <span>Session ID: {index + 1}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }

            return null;
          })}
        </AnimatePresence>
        
        {/* Scroll anchor for auto-scroll */}
        <div ref={messagesEndRef} />
      </motion.div>
    </motion.div>
  );
});

export default StationChat;