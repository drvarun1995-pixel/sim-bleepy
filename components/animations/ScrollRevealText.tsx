"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealTextProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  blur?: boolean;
  opacity?: boolean;
  rotate?: boolean;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  delay?: number;
}

export function ScrollRevealText({
  children,
  className,
  threshold = 0.1,
  rootMargin = "0px 0px -100px 0px",
  blur = false,
  opacity = true,
  rotate = false,
  direction = "up",
  duration = 0.8,
  delay = 0,
}: ScrollRevealTextProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, delay]);

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case "up":
          return "translateY(30px)";
        case "down":
          return "translateY(-30px)";
        case "left":
          return "translateX(30px)";
        case "right":
          return "translateX(-30px)";
        default:
          return "translateY(0)";
      }
    }
    return "translateY(0) translateX(0)";
  };

  const getRotation = () => {
    if (rotate && !isVisible) return "rotate(5deg)";
    return "rotate(0deg)";
  };

  return (
    <span
      ref={ref}
      className={cn("inline-block", className)}
      style={{
        filter: blur ? (isVisible ? "blur(0px)" : "blur(10px)") : "blur(0px)",
        opacity: opacity ? (isVisible ? 1 : 0) : 1,
        transform: `${getTransform()} ${getRotation()}`,
        transition: `all ${duration}s ease-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </span>
  );
}

