/**
 * Service Worker for Web Push Notifications and PWA Offline Support
 * Handles push events, notification display, and offline caching
 */

const CACHE_NAME = 'bleepy-dynamic-v1';
const STATIC_CACHE_NAME = 'bleepy-static-v1';
const APP_URL = self.location.origin;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/Bleepy-Logo-1-1.webp',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).catch((error) => {
      console.error('Service Worker install error:', error);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API routes and external URLs
  if (url.pathname.startsWith('/api/') || !url.origin.startsWith(APP_URL)) {
    return;
  }

  // Skip auth routes (they need to be fresh)
  if (url.pathname.startsWith('/auth/')) {
    return;
  }

  // Network-first strategy for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to offline page if available
            return caches.match('/');
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(STATIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push event - show notification when push message is received
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/logo.png', // Will use existing logo
    badge: '/logo.png',
    url: '/',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        image: payload.image,
        url: payload.url || notificationData.url,
        data: payload.data || notificationData.data,
      };
    } catch (e) {
      console.error('Error parsing push payload:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    image: notificationData.image,
    data: {
      url: notificationData.url,
      ...notificationData.data,
    },
    tag: notificationData.data.id || 'default',
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click event - open the URL when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event - track when notification is dismissed
self.addEventListener('notificationclose', (event) => {
  // Optional: Track notification dismissal
  // Could send analytics event here
});

