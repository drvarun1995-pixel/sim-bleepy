"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TextTypeProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  showCursor?: boolean;
  cursorChar?: string;
  onComplete?: () => void;
  startOnMount?: boolean;
}

export function TextType({
  text,
  className,
  speed = 50,
  delay = 0,
  showCursor = true,
  cursorChar = "|",
  onComplete,
  startOnMount = true,
}: TextTypeProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursorState, setShowCursorState] = useState(true);

  useEffect(() => {
    if (!startOnMount) return;

    const timer = setTimeout(() => {
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, startOnMount]);

  useEffect(() => {
    if (!isTyping) return;

    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);

      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      if (onComplete) {
        onComplete();
      }
    }
  }, [displayedText, text, speed, isTyping, onComplete]);

  // Cursor blink animation
  useEffect(() => {
    if (!showCursor) return;

    const interval = setInterval(() => {
      setShowCursorState((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [showCursor]);

  return (
    <span className={cn("inline-block", className)}>
      {displayedText}
      {showCursor && isTyping && (
        <span className={cn(showCursorState ? "opacity-100" : "opacity-0")}>
          {cursorChar}
        </span>
      )}
    </span>
  );
}

