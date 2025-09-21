"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Stethoscope, 
  Clock, 
  CheckCircle, 
  Play,
  TrendingUp,
  Users,
  Award,
  Activity,
  Star,
  ArrowRight
} from "lucide-react";

interface TiltedStationCardProps {
  scenario: {
    id: string;
    title: string;
    description: string;
    keyAreas: string[];
    difficulty: string;
    available: boolean;
    icon: React.ReactNode;
    color: string;
    stats: {
      completion: number;
      avgScore: number;
    };
  };
  index: number;
  onStart: (scenarioId: string) => void;
  isAdmin: boolean;
  canAttempt: boolean;
  attemptLimitChecked: boolean;
  attemptLimitMessage?: string;
  isStarting?: boolean;
}

export const TiltedStationCard = ({
  scenario,
  index,
  onStart,
  isAdmin,
  canAttempt,
  attemptLimitChecked,
  attemptLimitMessage,
  isStarting = false
}: TiltedStationCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Tilt effect based on mouse position
  const tiltX = isHovered ? (mousePosition.y - 150) / 15 : 0;
  const tiltY = isHovered ? (mousePosition.x - 150) / 15 : 0;

  return (
    <div
      ref={cardRef}
      className="relative group perspective-1000"
      style={{
        animationDelay: `${index * 0.1}s`,
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Gradient Blinds Background */}
      <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
        {/* Animated blinds effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-12 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50"
              style={{
                top: `${i * 12.5}%`,
                transform: `translateX(${isHovered ? Math.sin(Date.now() / 1000 + i) * 20 : 0}px)`,
                transition: 'transform 0.5s ease-out'
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Card */}
      <Card 
        variant="glass" 
        className="relative overflow-hidden border-white/20 shadow-2xl group-hover:shadow-3xl transition-all duration-500 hover:scale-105"
      >
        {/* Shimmer Effect */}
        <div className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500"></div>
        
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Icon with 3D effect */}
              <div className={`w-16 h-16 bg-gradient-to-r ${scenario.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 relative`}>
                {scenario.icon}
                {/* Floating particles */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400 rounded-full animate-bounce opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{animationDelay: '0.5s'}}></div>
              </div>
              <div>
                <CardTitle className="text-xl mb-2 group-hover:text-purple-600 transition-colors duration-300 serif-title">
                  {scenario.title}
                </CardTitle>
                <Badge variant={
                  scenario.difficulty === 'Advanced' ? 'destructive' :
                  scenario.difficulty === 'Intermediate' ? 'warning' : 'success'
                } className="text-xs">
                  {scenario.difficulty}
                </Badge>
              </div>
            </div>
            {scenario.available && (
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          <p className="text-gray-600 text-sm mb-6 leading-relaxed humanist-text">
            {scenario.description}
          </p>
          
          {/* Enhanced Progress Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 group-hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-lg font-bold text-blue-600">{scenario.stats.completion}%</span>
              </div>
              <div className="text-xs text-gray-600 font-medium">Completion</div>
              <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-1000 group-hover:bg-blue-700" 
                  style={{ width: `${scenario.stats.completion}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 group-hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-lg font-bold text-green-600">{scenario.stats.avgScore}/10</span>
              </div>
              <div className="text-xs text-gray-600 font-medium">Avg Score</div>
              <div className="flex justify-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${i < Math.floor(scenario.stats.avgScore / 2) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Key Areas with enhanced styling */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-purple-600" />
              Key Areas
            </h4>
            <div className="flex flex-wrap gap-2">
              {scenario.keyAreas.map((area, areaIndex) => (
                <Badge 
                  key={areaIndex} 
                  variant="outline" 
                  className="text-xs hover:bg-purple-50 hover:border-purple-200 transition-all duration-300 cursor-default"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Action Button with enhanced effects */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (scenario.available && (isAdmin || canAttempt) && !isStarting) {
                onStart(scenario.id);
              }
            }}
            disabled={!scenario.available || (!isAdmin && !canAttempt) || isStarting}
            className={`w-full py-4 text-sm font-semibold rounded-xl transition-all duration-300 group relative overflow-hidden ${
              scenario.available && (isAdmin || canAttempt) && !isStarting
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Button shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="relative flex items-center justify-center pointer-events-none">
              {!scenario.available ? (
                'Coming Soon'
              ) : isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Starting...
                </>
              ) : !isAdmin && !attemptLimitChecked ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Checking...
                </>
              ) : !isAdmin && !canAttempt ? (
                'Daily Limit Reached'
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  Start Scenario
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </div>
          </Button>
          
          {!isAdmin && attemptLimitMessage && scenario.available && (
            <p className={`text-xs text-center font-medium mt-3 ${
              canAttempt ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {attemptLimitMessage}
            </p>
          )}
        </CardContent>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {/* Corner accent */}
        <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
      </Card>
    </div>
  );
};
