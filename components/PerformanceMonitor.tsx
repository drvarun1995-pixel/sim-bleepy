'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          console.log('FID:', (entry as any).processingStart - entry.startTime);
        }
        if (entry.entryType === 'layout-shift') {
          console.log('CLS:', (entry as any).value);
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      console.log('Page Load Performance:', {
        DNS: navigation.domainLookupEnd - navigation.domainLookupStart,
        TCP: navigation.connectEnd - navigation.connectStart,
        TTFB: navigation.responseStart - navigation.requestStart,
        DOMContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        Load: navigation.loadEventEnd - navigation.fetchStart,
      });
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
