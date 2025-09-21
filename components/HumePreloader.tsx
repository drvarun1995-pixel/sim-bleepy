"use client";

import { useEffect } from 'react';
import { humePreloader } from '@/utils/humePreloader';

export function HumePreloader() {
  useEffect(() => {
    // Preload Hume components when this component mounts
    humePreloader.preload().catch(console.warn);
  }, []);

  // This component doesn't render anything visible
  return null;
}
