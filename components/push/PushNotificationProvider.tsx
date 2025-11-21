'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface PushNotificationContextType {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  isLoading: boolean;
  unsupportedReason?: string;
  browserInfo?: {
    name: string;
    isMobile: boolean;
    isIOS: boolean;
    isSafari: boolean;
    isFirefox: boolean;
  };
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

export function usePushNotifications() {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotifications must be used within PushNotificationProvider');
  }
  return context;
}

interface PushNotificationProviderProps {
  children: ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [unsupportedReason, setUnsupportedReason] = useState<string | undefined>();
  const [browserInfo, setBrowserInfo] = useState<{
    name: string;
    isMobile: boolean;
    isIOS: boolean;
    isSafari: boolean;
    isFirefox: boolean;
  } | undefined>();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect browser info
    const userAgent = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isMobile = isIOS || isAndroid;
    // Chrome detection: Chrome on Android or Chrome on iOS (CriOS)
    const isChrome = /Chrome/i.test(userAgent) && !/Edg|OPR|FxiOS/i.test(userAgent) || /CriOS/i.test(userAgent);
    // Safari detection: Safari but not Chrome (CriOS) or Firefox (FxiOS)
    const isSafari = /Safari/i.test(userAgent) && !/Chrome|CriOS|FxiOS|Edg|OPR/i.test(userAgent);
    const isFirefox = /Firefox|FxiOS/i.test(userAgent);
    const browserName = getBrowserName();

    const info = {
      name: browserName,
      isMobile,
      isIOS,
      isSafari: isSafari, // Only true Safari, not Chrome on iOS
      isFirefox,
    };
    setBrowserInfo(info);

    // Check basic support
    if (!('Notification' in window)) {
      setIsSupported(false);
      setUnsupportedReason('Your browser does not support notifications');
      setIsLoading(false);
      return;
    }

    if (!('serviceWorker' in navigator)) {
      setIsSupported(false);
      setUnsupportedReason('Your browser does not support service workers');
      setIsLoading(false);
      return;
    }

    // Chrome on mobile (both iOS and Android) supports push notifications - allow it
    if (isChrome && isMobile) {
      // Chrome is supported, continue to PushManager check
    }
    // Check for PushManager support (critical for Web Push API)
    // Safari on iOS doesn't support PushManager (but Chrome on iOS does)
    // Firefox on mobile (FxiOS) has limited support
    else if (isIOS && isSafari) {
      setIsSupported(false);
      setUnsupportedReason('Safari on iOS does not support push notifications. Please use Chrome or another supported browser.');
      setIsLoading(false);
      return;
    }
    // Firefox on mobile (FxiOS) - check if it's actually Firefox mobile
    else if (isMobile && isFirefox && /FxiOS/i.test(userAgent)) {
      setIsSupported(false);
      setUnsupportedReason('Firefox on mobile has limited push notification support. Please use Chrome or another supported browser.');
      setIsLoading(false);
      return;
    }

    // Check if PushManager is available (async check)
    navigator.serviceWorker.ready
      .then((registration) => {
        if (!registration.pushManager) {
          setIsSupported(false);
          setUnsupportedReason('Your browser does not support the Push API');
          setIsLoading(false);
          return;
        }

        setIsSupported(true);
        setPermission(Notification.permission);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

      // Check existing subscription
      checkSubscription();
    }).catch((error) => {
      console.error('Service Worker ready check failed:', error);
      setIsSupported(false);
      setUnsupportedReason('Unable to initialize push notifications');
      setIsLoading(false);
    });
  }, [session]);

  const checkSubscription = async () => {
    if (!isSupported || !session) {
      setIsLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Verify subscription exists in database
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(subscription.getKey('auth')!),
            },
            deviceInfo: {
              browser: getBrowserName(),
              os: getOSName(),
              userAgent: navigator.userAgent,
            },
          }),
        });

        if (response.ok) {
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    if (!isSupported || !session) {
      return;
    }

    try {
      setIsLoading(true);

      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      // Register service worker and subscribe
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!),
          },
          deviceInfo: {
            browser: getBrowserName(),
            os: getOSName(),
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setIsSubscribed(true);
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) {
      return;
    }

    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push service
        await subscription.unsubscribe();

        // Remove from database
        await fetch('/api/push/unsubscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PushNotificationContext.Provider
      value={{
        isSupported,
        isSubscribed,
        permission,
        subscribe,
        unsubscribe,
        isLoading,
        unsupportedReason,
        browserInfo,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as BufferSource;
}

function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
  if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
  if (userAgent.indexOf('Safari') > -1) return 'Safari';
  if (userAgent.indexOf('Edge') > -1) return 'Edge';
  return 'Unknown';
}

function getOSName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Windows') > -1) return 'Windows';
  if (userAgent.indexOf('Mac') > -1) return 'macOS';
  if (userAgent.indexOf('Linux') > -1) return 'Linux';
  if (userAgent.indexOf('Android') > -1) return 'Android';
  if (userAgent.indexOf('iOS') > -1) return 'iOS';
  return 'Unknown';
}

