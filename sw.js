/**
 * MoodSync Service Worker
 * Enables push notifications and offline support
 */

const CACHE_NAME = 'moodsync-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/animations.css',
    '/js/cycle.js',
    '/js/storage.js',
    '/js/notifications.js',
    '/js/app.js',
    '/pages/dashboard.html',
    '/pages/partner.html',
    '/pages/onboarding.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('MoodSync: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((err) => {
                console.log('MoodSync: Cache failed, continuing anyway', err);
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
        title: '💕 MoodSync',
        body: 'Check in with your partner today!',
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
        tag: 'moodsync-notification',
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Open MoodSync' },
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
                    if (client.url.includes('moodsync') || client.url.includes('partner')) {
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
    if (event.tag === 'moodsync-daily-check') {
        event.waitUntil(checkAndNotify());
    }
});

async function checkAndNotify() {
    // This would check cycle data and send appropriate notification
    // In a real app, this would fetch from a server
    const notification = {
        title: '💕 MoodSync Reminder',
        body: 'Check in on how she\'s feeling today!',
        icon: '/icons/icon-192.png'
    };

    return self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        tag: 'moodsync-daily',
        requireInteraction: false
    });
}
