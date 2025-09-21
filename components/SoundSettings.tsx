"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX, Settings, Bell } from 'lucide-react';
import { audioNotifications } from '@/utils/audioNotifications';

interface SoundSettingsProps {
  className?: string;
}

export function SoundSettings({ className }: SoundSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Initialize with current settings
    setIsEnabled(audioNotifications.isAudioEnabled());
    setVolume(audioNotifications.getVolume());
  }, []);

  const handleToggleSound = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    audioNotifications.setEnabled(newEnabled);
    
    // Save preference to localStorage
    localStorage.setItem('audioNotificationsEnabled', newEnabled.toString());
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioNotifications.setVolume(newVolume);
    
    // Save preference to localStorage
    localStorage.setItem('audioVolume', newVolume.toString());
    
    // Test sound at new volume
    if (isEnabled) {
      audioNotifications.playSystemBeep('notification');
    }
  };

  const testSound = (type: 'start' | 'end' | 'notification' | 'early-end' = 'notification') => {
    if (isEnabled) {
      const soundMap = {
        'start': 'station-start',
        'end': 'station-end',
        'notification': 'time-warning',
        'early-end': 'station-end-early'
      };
      audioNotifications.playSound(`test-${type}`, `/sounds/${soundMap[type]}.mp3`).catch(() => {
        audioNotifications.playSystemBeep(type === 'early-end' ? 'end' : type);
      });
    }
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem('audioNotificationsEnabled');
    const savedVolume = localStorage.getItem('audioVolume');
    
    if (savedEnabled !== null) {
      const enabled = savedEnabled === 'true';
      setIsEnabled(enabled);
      audioNotifications.setEnabled(enabled);
    }
    
    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      if (!isNaN(vol)) {
        setVolume(vol);
        audioNotifications.setVolume(vol);
      }
    }
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <CardTitle className="text-lg">Audio Notifications</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Control sound notifications for station events
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isEnabled ? (
                <Volume2 className="w-4 h-4 text-green-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {isEnabled ? 'Audio Enabled' : 'Audio Disabled'}
              </span>
            </div>
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              onClick={handleToggleSound}
            >
              {isEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>

          {/* Volume Control */}
          {isEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Volume</span>
                <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <VolumeX className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <Volume2 className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          {/* Test Sounds */}
          {isEnabled && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Test Sounds</span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('start')}
                >
                  Start
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('notification')}
                >
                  Warning
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('early-end')}
                >
                  Early End
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('end')}
                >
                  Final End
                </Button>
              </div>
            </div>
          )}

          {/* Sound Events Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>• <strong>Start:</strong> Plays when session begins</div>
            <div>• <strong>Warning:</strong> Plays at 7:00 (1 min remaining)</div>
            <div>• <strong>Early End:</strong> Plays at 7:55 (5 sec remaining)</div>
            <div>• <strong>Final End:</strong> Plays when session ends at 8:00</div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
