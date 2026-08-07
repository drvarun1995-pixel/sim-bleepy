"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useInViewReveal } from "@/lib/useInViewReveal";

interface RevealGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Animate immediately on mount (hero) vs on scroll into view */
  immediate?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export function RevealGroup({
  children,
  className,
  immediate = false,
  threshold,
  rootMargin,
}: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInViewReveal(ref, { immediate, threshold, rootMargin });

  return (
    <div
      ref={ref}
      className={cn("bleepy-reveal-group", visible && "bleepy-reveal-group-visible", className)}
    >
      {children}
    </div>
  );
}

interface RevealItemProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function RevealItem({ children, className, delay = 0 }: RevealItemProps) {
  return (
    <div
      className={cn("bleepy-reveal-item", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
