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
  const { isSubscribed, subscribe, unsubscribe, isSupported, permission, unsupportedReason, browserInfo, debugInfo } = usePushNotifications();
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
    const getUnsupportedMessage = () => {
      if (browserInfo?.isIOS) {
        return {
          title: 'iOS Browsers Not Supported',
          description: 'All browsers on iPhone and iPad (including Chrome) use WebKit and do not support web push notifications. This is an iOS limitation, not a browser limitation.',
          suggestion: 'To receive push notifications, please use Chrome on Android, desktop, or another supported browser'
        };
      }
      if (browserInfo?.isMobile && browserInfo?.isFirefox) {
        return {
          title: 'Firefox Mobile Not Supported',
          description: 'Firefox on mobile devices has limited push notification support. To receive push notifications, please use Chrome or another supported browser.',
          suggestion: 'Try using Chrome for Android or iOS'
        };
      }
      return {
        title: 'Push Notifications Not Supported',
        description: unsupportedReason || 'Your browser does not support web push notifications.',
        suggestion: 'Please use a modern browser like Chrome, Firefox (desktop), or Edge',
        debugInfo: `Browser: ${browserInfo?.name || 'Unknown'}, Mobile: ${browserInfo?.isMobile ? 'Yes' : 'No'}, iOS: ${browserInfo?.isIOS ? 'Yes' : 'No'}, Safari: ${browserInfo?.isSafari ? 'Yes' : 'No'}, Firefox: ${browserInfo?.isFirefox ? 'Yes' : 'No'}`
      };
    };

    const message = getUnsupportedMessage();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            {message.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
              {message.description}
            </p>
            {message.suggestion && (
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                💡 {message.suggestion}
              </p>
            )}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Supported Browsers:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Chrome (Desktop & Mobile)</li>
              <li>Firefox (Desktop only)</li>
              <li>Edge (Desktop & Mobile)</li>
              <li>Opera (Desktop & Mobile)</li>
            </ul>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              ❌ Not supported: All iOS browsers (Safari, Chrome, Firefox), Firefox on mobile
            </p>
          </div>
          
          {/* Debug Information - Always visible */}
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Debug Information:
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
              {message.debugInfo}
            </p>
            {debugInfo && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-mono break-all">
                Full: {debugInfo}
              </p>
            )}
            {unsupportedReason && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Reason: {unsupportedReason}
              </p>
            )}
          </div>
        </CardContent>
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

