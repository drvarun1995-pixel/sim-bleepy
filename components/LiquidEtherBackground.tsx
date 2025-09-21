"use client";

import { useEffect, useRef, useState } from 'react';

interface LiquidEtherBackgroundProps {
  className?: string;
  colors?: string[];
  intensity?: 'low' | 'medium' | 'high';
}

export const LiquidEtherBackground = ({
  colors = ['#5227FF', '#FF9FFC', '#B19EEF'],
  className = '',
  intensity = 'medium'
}: LiquidEtherBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation settings based on intensity
    const settings = {
      low: { particles: 20, speed: 0.3, size: 3, connections: 80 },
      medium: { particles: 35, speed: 0.5, size: 4, connections: 120 },
      high: { particles: 50, speed: 0.8, size: 5, connections: 150 }
    };

    const config = settings[intensity];

    // Enhanced particle system with fluid-like behavior
    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      size: number = 0;
      color: string = '';
      opacity: number = 0;
      life: number = 0;
      maxLife: number = 0;

      constructor() {
        const rect = canvas?.getBoundingClientRect();
        if (!rect) return;
        this.x = Math.random() * rect.width;
        this.y = Math.random() * rect.height;
        this.vx = (Math.random() - 0.5) * config.speed;
        this.vy = (Math.random() - 0.5) * config.speed;
        this.size = Math.random() * config.size + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.8 + 0.2;
        this.life = 0;
        this.maxLife = Math.random() * 400 + 300;
      }

      update() {
        this.life++;
        const rect = canvas?.getBoundingClientRect();
        if (!rect) return;

        // Fluid-like movement with mouse interaction
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * 0.02;
          this.vx += dx * force * 0.001;
          this.vy += dy * force * 0.001;
        }

        // Add some randomness for fluid-like behavior
        this.vx += (Math.random() - 0.5) * 0.001;
        this.vy += (Math.random() - 0.5) * 0.001;

        // Apply velocity with some damping
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Limit velocity
        const maxVel = config.speed * 2;
        const vel = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (vel > maxVel) {
          this.vx = (this.vx / vel) * maxVel;
          this.vy = (this.vy / vel) * maxVel;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges with smooth transition
        if (this.x < -50) this.x = rect.width + 50;
        if (this.x > rect.width + 50) this.x = -50;
        if (this.y < -50) this.y = rect.height + 50;
        if (this.y > rect.height + 50) this.y = -50;

        // Fade in/out effect
        const lifeRatio = this.life / this.maxLife;
        if (lifeRatio < 0.1) {
          this.opacity = lifeRatio * 10;
        } else if (lifeRatio > 0.9) {
          this.opacity = (1 - lifeRatio) * 10;
        } else {
          this.opacity = 0.8 + Math.sin(this.life * 0.01) * 0.2;
        }

        // Reset particle if it's too old
        if (this.life > this.maxLife) {
          this.x = Math.random() * rect.width;
          this.y = Math.random() * rect.height;
          this.vx = (Math.random() - 0.5) * config.speed;
          this.vy = (Math.random() - 0.5) * config.speed;
          this.life = 0;
          this.opacity = Math.random() * 0.8 + 0.2;
        }
      }

      draw() {
        if (!ctx) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Create radial gradient for glow effect
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 3
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color + '80');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a bright center
        ctx.globalAlpha = this.opacity * 0.8;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }

    // Connection system for fluid-like connections
    class Connection {
      static draw(p1: Particle, p2: Particle) {
        if (!ctx) return;
        
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = config.connections;

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.4;
          
          ctx.save();
          ctx.globalAlpha = opacity;
          
          // Create gradient for connection
          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          gradient.addColorStop(0, p1.color + '40');
          gradient.addColorStop(0.5, '#ffffff20');
          gradient.addColorStop(1, p2.color + '40');
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          
          ctx.restore();
        }
      }
    }

    // Initialize particles
    const particles: Particle[] = [];
    for (let i = 0; i < config.particles; i++) {
      particles.push(new Particle());
    }

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Animation loop
    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!ctx) return;
      
      // Clear canvas with subtle fade for trails
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(0, 0, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.update();
        particle.draw();

        // Draw connections
        for (let i = index + 1; i < particles.length; i++) {
          Connection.draw(particle, particles[i]);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Intersection Observer for performance
    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0].isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [colors, intensity, isVisible]);

  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
        }}
      />
      
      {/* Additional gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-purple-50/20 pointer-events-none" />
      
      {/* Subtle noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default LiquidEtherBackground;
