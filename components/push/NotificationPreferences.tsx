'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from './PushNotificationProvider';
import { toast } from 'sonner';

interface NotificationPreferencesData {
  teaching_events: boolean;
  bookings: boolean;
  certificates: boolean;
  feedback: boolean;
  announcements: boolean;
  leaderboard_updates: boolean;
  quiz_reminders: boolean;
}

export function NotificationPreferences() {
  const { isSubscribed, subscribe, unsubscribe, isSupported, permission } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferencesData>({
    teaching_events: true,
    bookings: true,
    certificates: true,
    feedback: true,
    announcements: true,
    leaderboard_updates: false,
    quiz_reminders: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isSubscribed) {
      fetchPreferences();
    } else {
      setIsLoading(false);
    }
  }, [isSubscribed]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/push/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferencesData) => {
    if (!isSubscribed) {
      toast.error('Please enable push notifications first');
      return;
    }

    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);

    try {
      setIsSaving(true);
      const response = await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      toast.success('Preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      // Revert on error
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      await subscribe();
      toast.success('Push notifications enabled');
      await fetchPreferences();
    } catch (error: any) {
      toast.error(error.message || 'Failed to enable push notifications');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe();
      toast.success('Push notifications disabled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable push notifications');
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Notification permission was denied. Please enable it in your browser settings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive notifications for events, bookings, certificates, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isSubscribed ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enable push notifications to stay updated on events, bookings, and more.
            </p>
            <Button onClick={handleSubscribe} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Enable Push Notifications
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Currently enabled
                </p>
              </div>
              <Button variant="outline" onClick={handleUnsubscribe} size="sm">
                <BellOff className="h-4 w-4 mr-2" />
                Disable
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Notification Types</Label>
                  <div className="space-y-3 pl-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="teaching_events">Teaching Events</Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Reminders, updates, and cancellations
                        </p>
                      </div>
                      <Switch
                        id="teaching_events"
                        checked={preferences.teaching_events}
                        onCheckedChange={() => handleToggle('teaching_events')}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="bookings">Bookings</Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Reminders and waitlist updates
                        </p>
                      </div>
                      <Switch
                        id="bookings"
                        checked={preferences.bookings}
                        onCheckedChange={() => handleToggle('bookings')}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="certificates">Certificates</Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          When certificates are available
                        </p>
                      </div>
                      <Switch
                        id="certificates"
                        checked={preferences.certificates}
                        onCheckedChange={() => handleToggle('certificates')}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="feedback">Feedback</Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Feedback requests after events
                        </p>
                      </div>
                      <Switch
                        id="feedback"
                        checked={preferences.feedback}
                        onCheckedChange={() => handleToggle('feedback')}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="announcements">Announcements</Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Important announcements
                        </p>
                      </div>
                      <Switch
                        id="announcements"
                        checked={preferences.announcements}
                        onCheckedChange={() => handleToggle('announcements')}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

