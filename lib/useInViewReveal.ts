"use client";

import { useEffect, useState } from "react";

export function getRevealRootMargin(desktop = "0px 0px -60px 0px") {
  if (typeof window === "undefined") return desktop;
  return window.innerWidth < 768 ? "0px 0px -8px 0px" : desktop;
}

export function getRevealThreshold(desktop = 0.12) {
  if (typeof window === "undefined") return desktop;
  return window.innerWidth < 768 ? 0.01 : desktop;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/** True when blur/heavy filter animations should be skipped (mobile Safari, reduced motion). */
export function useLightweightAnimations() {
  const [lightweight, setLightweight] = useState(true);

  useEffect(() => {
    const update = () => {
      setLightweight(isMobileViewport() || prefersReducedMotion());
    };
    update();

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionMq.addEventListener("change", update);
    window.addEventListener("resize", update);

    return () => {
      motionMq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return lightweight;
}

export function useInViewReveal(
  ref: React.RefObject<Element | null>,
  options: {
    immediate?: boolean;
    threshold?: number;
    rootMargin?: string;
  } = {}
) {
  const { immediate = false, threshold, rootMargin } = options;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (immediate) {
      if (prefersReducedMotion()) {
        setVisible(true);
        return;
      }
      let frame2 = 0;
      const frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(frame1);
        cancelAnimationFrame(frame2);
      };
    }

    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const resolvedThreshold = threshold ?? getRevealThreshold();
    const resolvedMargin = rootMargin ?? getRevealRootMargin();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: resolvedThreshold, rootMargin: resolvedMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate, threshold, rootMargin, ref]);

  return visible;
}
