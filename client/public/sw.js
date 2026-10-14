// ToffeeCon 2026 Companion PWA Service Worker (v1.0.0)
const CACHE_NAME = 'toffeecon-pwa-v1';
const DYNAMIC_CACHE = 'toffeecon-dynamic-v1';

const STATIC_SHELL_ASSETS = [
    '/portal',
    '/portal?source=pwa',
    '/manifest.json',
    '/assets/toffeecon-logo.png',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

// Offline fallback response for dynamic API endpoints when disconnected
const OFFLINE_API_FALLBACK = {
    '/api/stage/state': {
        stageScene: 'ambient',
        stageSpeaker: {
            name: 'Keynote in Session',
            role: 'ToffeeCon Mainstage Arena',
            topic: 'Cached offline agenda available in your PWA Companion'
        }
    },
    '/api/vote': {
        error: 'Offline mode active. Your vote buzzer is queued for reconnect.',
        offline: true
    }
};

// Install: Cache core PWA shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_SHELL_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: Purge obsolete caches and claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Strategy:
// 1. Dynamic voting & keynote /api/ data -> Network-First with cache / offline fallback
// 2. Core PWA shell & static assets -> Cache-First with background revalidation
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Bypass non-GET requests (e.g. POST /api/vote is handled in UI with offline queue)
    if (request.method !== 'GET') {
        return;
    }

    // Dynamic API Data: Network-First Strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) return cachedResponse;

                    // Fallback stub for known endpoints
                    if (OFFLINE_API_FALLBACK[url.pathname]) {
                        return new Response(JSON.stringify(OFFLINE_API_FALLBACK[url.pathname]), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    return new Response(JSON.stringify({ offline: true, message: 'Offline mode active' }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    // Core PWA Shell & Static Assets: Cache-First Strategy
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Background update cache if online
                fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
                    }
                }).catch(() => {/* Offline, keep cached version */});
                return cachedResponse;
            }

            return fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    // For HTML navigation requests, return cached /portal shell
                    if (request.mode === 'navigate') {
                        const portalFallback = await caches.match('/portal');
                        if (portalFallback) return portalFallback;
                    }
                    return new Response('Offline - ToffeeCon Companion', { status: 503, statusText: 'Service Unavailable' });
                });
        })
    );
});
