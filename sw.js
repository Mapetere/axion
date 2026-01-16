/**
 * Axion Service Worker
 * Enables push notifications and offline support
 */

const CACHE_NAME = 'axion-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/animations.css',
    '/js/cycle.js',
    '/js/storage.js',
    '/js/notifications.js',
    '/js/messages-db.js',
    '/js/app.js',
    '/data/messages.json',
    '/pages/dashboard.html',
    '/pages/partner.html',
    '/pages/settings.html',
    '/pages/auth.html',
    '/pages/onboarding.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Axion: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((err) => {
                console.log('Axion: Cache failed, continuing anyway', err);
            })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    let data = {
        title: 'Axion',
        body: 'System state update available.',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png'
    };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: data.badge || '/icons/badge-72.png',
        vibrate: [200, 100, 200],
        tag: 'axion-notification',
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Open Axion' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        data: {
            url: data.url || '/pages/partner.html'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if open
                for (const client of clientList) {
                    if (client.url.includes('axion') || client.url.includes('partner')) {
                        return client.focus();
                    }
                }
                // Open new window
                return clients.openWindow(event.notification.data.url || '/pages/partner.html');
            })
    );
});

// Periodic sync for daily notifications (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'axion-daily-check') {
        event.waitUntil(checkAndNotify());
    }
});

async function checkAndNotify() {
    const notification = {
        title: 'Axion',
        body: 'Daily system state update available.',
        icon: '/icons/icon-192.png'
    };

    return self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        tag: 'axion-daily',
        requireInteraction: false
    });
}
