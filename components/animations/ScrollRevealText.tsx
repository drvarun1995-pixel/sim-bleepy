"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getRevealRootMargin,
  getRevealThreshold,
  prefersReducedMotion,
  useLightweightAnimations,
} from "@/lib/useInViewReveal";

interface ScrollRevealTextProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  blur?: boolean;
  opacity?: boolean;
  rotate?: boolean;
  scale?: boolean;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  delay?: number;
}

function isElementInView(el: Element, rootMargin: string) {
  const parts = rootMargin.trim().split(/\s+/);
  const bottom = Math.abs(parseInt(parts[2] ?? "0", 10) || 0);
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight - bottom && rect.bottom > 0;
}

export function ScrollRevealText({
  children,
  className,
  threshold,
  rootMargin,
  blur = false,
  opacity = true,
  rotate = false,
  scale = false,
  direction = "up",
  duration = 0.8,
  delay = 0,
}: ScrollRevealTextProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lightweight = useLightweightAnimations();
  const useBlur = blur && !lightweight;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (prefersReducedMotion()) {
      setIsVisible(true);
      return;
    }

    const resolvedThreshold = threshold ?? getRevealThreshold(0.1);
    const resolvedMargin = rootMargin ?? getRevealRootMargin("0px 0px -80px 0px");

    if (isElementInView(element, resolvedMargin)) {
      const t = window.setTimeout(() => setIsVisible(true), delay);
      return () => window.clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(element);
        }
      },
      { threshold: resolvedThreshold, rootMargin: resolvedMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, delay]);

  const offset = lightweight ? 20 : 36;

  const getTransform = () => {
    const scaleVal = scale ? (isVisible ? "scale(1)" : "scale(0.94)") : "";
    let translate = "translateY(0) translateX(0)";

    if (!isVisible) {
      switch (direction) {
        case "up":
          translate = `translateY(${offset}px) translateX(0)`;
          break;
        case "down":
          translate = `translateY(-${offset}px) translateX(0)`;
          break;
        case "left":
          translate = `translateX(${offset}px) translateY(0)`;
          break;
        case "right":
          translate = `translateX(-${offset}px) translateY(0)`;
          break;
        default:
          translate = "translateY(0) translateX(0)";
      }
    }

    return `${translate} ${scaleVal}`.trim();
  };

  const getRotation = () => {
    if (rotate && !isVisible && !lightweight) return "rotate(5deg)";
    return "rotate(0deg)";
  };

  const transition = lightweight
    ? `opacity ${duration}s cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1)`
    : `opacity ${duration}s cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1), filter ${duration}s cubic-bezier(0.22, 1, 0.36, 1)`;

  return (
    <div
      ref={ref}
      className={cn("bleepy-scroll-reveal", className)}
      style={{
        filter: useBlur ? (isVisible ? "blur(0px)" : "blur(12px)") : undefined,
        opacity: opacity ? (isVisible ? 1 : 0) : 1,
        transform: `${getTransform()} ${getRotation()}`.trim(),
        transition,
        transitionDelay: `${delay}ms`,
        willChange: isVisible ? undefined : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
