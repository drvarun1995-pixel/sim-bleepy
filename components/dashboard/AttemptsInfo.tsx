"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface AttemptsData {
  canAttempt: boolean;
  isAdmin: boolean;
  hasAttemptedToday: boolean;
  attemptsToday: number;
  attemptsRemaining: number;
  maxAttemptsPerDay: number;
  message: string;
  resetTime?: string;
}

export function AttemptsInfo() {
  const [attemptsData, setAttemptsData] = useState<AttemptsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAttemptLimit();
  }, []);

  const checkAttemptLimit = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attempts/check-limit');
      const data = await response.json();
      
      if (response.ok) {
        setAttemptsData(data);
      } else {
        console.error('Error fetching attempt limit:', data.error);
        toast.error('Error loading attempt information', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error checking attempt limit:', error);
      toast.error('Error loading attempt information', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const formatResetTime = (resetTime: string) => {
    try {
      const date = new Date(resetTime);
      return date.toLocaleTimeString('en-GB', { 
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'tomorrow';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Available Attempts */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Available Attempts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {attemptsData?.isAdmin ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                <span className="text-xl font-bold text-yellow-600">Unlimited</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Admin users have unlimited access to all stations
                </p>
                
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Unlimited daily attempts</li>
                  <li>• Full access to all features</li>
                  <li>• Advanced admin controls</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-blue-600">
                  {attemptsData?.attemptsRemaining || 0}/{attemptsData?.maxAttemptsPerDay || 3}
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Practice clinical scenarios with AI-powered patients
                </p>
                
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {attemptsData?.attemptsRemaining || 0} attempts remaining today</li>
                  <li>• 8-minute consultation sessions</li>
                  <li>• Real-time feedback & scoring</li>
                  <li>• Progress tracking</li>
                </ul>
                
                {attemptsData?.resetTime && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>Resets at {formatResetTime(attemptsData.resetTime)} (London time)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscribe for More */}
      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Subscribe for More</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-purple-600" />
              <span className="text-xl font-bold text-purple-600">Premium</span>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Get unlimited access to all clinical stations
              </p>
              
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Unlimited daily attempts</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
                <li>• New stations first</li>
              </ul>
              
              <Button 
                size="sm" 
                className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled
              >
                <Crown className="w-4 h-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
