"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SplitTextProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  direction?: "up" | "down" | "left" | "right";
  onAnimationComplete?: () => void;
  gradientClassName?: string; // For gradient text support
}

export function SplitText({
  children,
  className,
  delay = 0,
  duration = 0.6,
  stagger = 0.03,
  direction = "up",
  onAnimationComplete,
  gradientClassName,
}: SplitTextProps) {
  const [isVisible, setIsVisible] = useState(false);
  const words = children.split(" ");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, words.length * stagger * 1000 + duration * 1000);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, stagger, words.length, onAnimationComplete]);

  const getTransform = (dir: string) => {
    switch (dir) {
      case "up":
        return "translateY(100%)";
      case "down":
        return "translateY(-100%)";
      case "left":
        return "translateX(100%)";
      case "right":
        return "translateX(-100%)";
      default:
        return "translateY(100%)";
    }
  };

  return (
    <span className={cn("inline-block", className)}>
      {words.map((word, wordIndex) => (
        <span
          key={wordIndex}
          className="inline-block overflow-hidden"
        >
          <span
            className={cn("inline-block", gradientClassName)}
            style={{
              transform: isVisible ? "translateY(0) translateX(0)" : getTransform(direction),
              opacity: isVisible ? 1 : 0,
              transition: `transform ${duration}s ease-out, opacity ${duration}s ease-out`,
              transitionDelay: `${delay + wordIndex * stagger}s`,
            }}
          >
            {word}
            {wordIndex < words.length - 1 && "\u00A0"}
          </span>
        </span>
      ))}
    </span>
  );
}

