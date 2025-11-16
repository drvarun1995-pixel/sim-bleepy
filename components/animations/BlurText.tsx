"use client";

import { useEffect, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BlurTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "top" | "bottom" | "left" | "right";
  blur?: number;
}

export function BlurText({
  children,
  className,
  delay = 0,
  duration = 1,
  direction = "top",
  blur = 10,
}: BlurTextProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getGradient = (dir: string) => {
    switch (dir) {
      case "top":
        return "linear-gradient(to bottom, transparent, black)";
      case "bottom":
        return "linear-gradient(to top, transparent, black)";
      case "left":
        return "linear-gradient(to right, transparent, black)";
      case "right":
        return "linear-gradient(to left, transparent, black)";
      default:
        return "linear-gradient(to bottom, transparent, black)";
    }
  };

  return (
    <span
      className={cn("relative inline-block", className)}
      style={{
        filter: isVisible ? `blur(0px)` : `blur(${blur}px)`,
        opacity: isVisible ? 1 : 0.3,
        transition: `filter ${duration}s ease-out, opacity ${duration}s ease-out`,
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </span>
  );
}

