'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      toast.success('Bleepy has been installed!', {
        description: 'You can now access it from your home screen.',
      });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show install prompt (Android/Chrome)
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('Installing Bleepy...', {
          description: 'Please follow the prompts to complete installation.',
        });
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleShowIOSInstructions = () => {
    setShowIOSInstructions(true);
  };

  // If already installed, show success state
  if (isInstalled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            App Installed
          </CardTitle>
          <CardDescription>
            Bleepy is installed on your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can access Bleepy from your home screen. Push notifications are enabled when installed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // iOS - show instructions button
  if (isIOS) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-purple-600" />
            Install Bleepy App
          </CardTitle>
          <CardDescription>
            Add Bleepy to your home screen for quick access and push notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showIOSInstructions ? (
            <>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Quick access from home screen</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Works offline</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Push notifications (iOS 16.4+)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Faster loading</span>
                </div>
              </div>
              <Button 
                onClick={handleShowIOSInstructions} 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Show Installation Instructions
              </Button>
            </>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                How to install on iOS:
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                <li>Tap the <strong>Share</strong> button <span className="text-lg">⎋</span> at the bottom of your screen</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> in the top right corner</li>
                <li>Bleepy will appear on your home screen!</li>
              </ol>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                💡 Once installed, you'll be able to receive push notifications on iOS 16.4+
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Android/Chrome - show install button if available
  if (!deferredPrompt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-600" />
            Install Bleepy App
          </CardTitle>
          <CardDescription>
            Install Bleepy for quick access, offline support, and push notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Install prompt not available. Your browser may not support PWA installation, or the app is already installed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Android/Chrome - show install button
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-purple-600" />
          Install Bleepy App
        </CardTitle>
        <CardDescription>
          Install Bleepy for quick access, offline support, and push notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Quick access from home screen</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Works offline</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Push notifications</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Faster loading</span>
          </div>
        </div>
        <Button 
          onClick={handleInstall} 
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Install App
        </Button>
      </CardContent>
    </Card>
  );
}

