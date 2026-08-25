"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Volume2, VolumeX, Settings, Bell } from 'lucide-react';
import { audioNotifications } from '@/utils/audioNotifications';
import { cn } from '@/utils';

interface SoundSettingsProps {
  className?: string;
  variant?: 'card' | 'compact';
}

function SoundSettingsPanel({
  isEnabled,
  volume,
  onToggle,
  onVolumeChange,
}: {
  isEnabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
}) {
  const testSound = (type: 'start' | 'early-end' = 'start') => {
    if (!isEnabled) return;
    const soundMap = {
      start: 'station-start',
      'early-end': 'station-end-early',
    };
    audioNotifications.playSound(`test-${type}`, `/sounds/${soundMap[type]}.mp3`).catch(() => {
      audioNotifications.playSystemBeep(type === 'early-end' ? 'end' : type);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {isEnabled ? (
            <Volume2 className="w-4 h-4 text-green-600" />
          ) : (
            <VolumeX className="w-4 h-4 text-red-600" />
          )}
          <span className="text-sm font-medium">
            {isEnabled ? 'Alerts on' : 'Alerts off'}
          </span>
        </div>
        <Button
          variant={isEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={onToggle}
        >
          {isEnabled ? 'Disable' : 'Enable'}
        </Button>
      </div>

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
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-label="Notification volume"
            />
            <Volume2 className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}

      {isEnabled && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Test sounds</span>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => testSound('start')}>
              Start
            </Button>
            <Button variant="outline" size="sm" onClick={() => testSound('early-end')}>
              Early end
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <div>Start plays when the consultation begins.</div>
        <div>Early end plays with 5 seconds left on the timer.</div>
      </div>
    </div>
  );
}

export function SoundSettings({ className, variant = 'card' }: SoundSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const savedEnabled = localStorage.getItem('audioNotificationsEnabled');
    const savedVolume = localStorage.getItem('audioVolume');

    if (savedEnabled !== null) {
      const enabled = savedEnabled === 'true';
      setIsEnabled(enabled);
      audioNotifications.setEnabled(enabled);
    } else {
      setIsEnabled(audioNotifications.isAudioEnabled());
    }

    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      if (!isNaN(vol)) {
        setVolume(vol);
        audioNotifications.setVolume(vol);
      }
    } else {
      setVolume(audioNotifications.getVolume());
    }
  }, []);

  const handleToggleSound = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    audioNotifications.setEnabled(newEnabled);
    localStorage.setItem('audioNotificationsEnabled', newEnabled.toString());
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioNotifications.setVolume(newVolume);
    localStorage.setItem('audioVolume', newVolume.toString());

    if (isEnabled) {
      audioNotifications.playSystemBeep('notification');
    }
  };

  const panel = (
    <SoundSettingsPanel
      isEnabled={isEnabled}
      volume={volume}
      onToggle={handleToggleSound}
      onVolumeChange={handleVolumeChange}
    />
  );

  if (variant === 'compact') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:text-sm transition-colors',
              isEnabled
                ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
                : 'border-red-200 bg-red-50 text-red-700 hover:border-red-300'
            )}
            aria-label="Audio notification settings"
          >
            {isEnabled ? (
              <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">Audio</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">Audio notifications</p>
          {panel}
        </PopoverContent>
      </Popover>
    );
  }

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
        <CardContent>
          {panel}
        </CardContent>
      )}
    </Card>
  );
}
