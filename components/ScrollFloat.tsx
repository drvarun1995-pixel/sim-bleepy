"use client";

import { useEffect, useState } from 'react';

interface ScrollFloatProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  intensity?: number;
}

export const ScrollFloat = ({ 
  children, 
  className = '', 
  speed = 0.5, 
  direction = 'up',
  intensity = 20 
}: ScrollFloatProps) => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    const element = document.getElementById('scroll-float-element');
    if (element) {
      observer.observe(element);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const getTransform = () => {
    const baseTransform = isVisible ? 0 : (direction === 'up' ? intensity : -intensity);
    const scrollOffset = scrollY * speed;
    
    switch (direction) {
      case 'up':
        return `translateY(${baseTransform - scrollOffset}px)`;
      case 'down':
        return `translateY(${baseTransform + scrollOffset}px)`;
      case 'left':
        return `translateX(${baseTransform - scrollOffset}px)`;
      case 'right':
        return `translateX(${baseTransform + scrollOffset}px)`;
      default:
        return `translateY(${baseTransform - scrollOffset}px)`;
    }
  };

  return (
    <div
      id="scroll-float-element"
      className={`transition-all duration-1000 ease-out ${className}`}
      style={{
        transform: getTransform(),
        opacity: isVisible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
};

// Parallax scroll effect for background elements
export const ParallaxScroll = ({ 
  children, 
  className = '', 
  speed = 0.5 
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={className}
      style={{
        transform: `translateY(${scrollY * speed}px)`,
      }}
    >
      {children}
    </div>
  );
};

// Floating animation for elements
export const FloatingElement = ({ 
  children, 
  className = '', 
  duration = 3,
  intensity = 10 
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  intensity?: number;
}) => {
  return (
    <div
      className={`animate-float ${className}`}
      style={{
        animation: `float ${duration}s ease-in-out infinite`,
        '--float-intensity': `${intensity}px`
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

