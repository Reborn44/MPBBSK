const CACHE_NAME = "mpbbsk-hlasovanie-cache-v3";
const URLS_TO_CACHE = [
    '/',
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'whitelogo2.png',
    'favicon.png',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
];

// 1. Install the service worker and cache the app shell.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and caching app shell');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// 2. Activate event: Clean up old caches.
// This is crucial for ensuring users get updated files when you release a new version.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Fetch event: Intercept network requests.
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Strategy for API calls (Supabase): Stale-While-Revalidate
    // This serves data from the cache immediately for speed,
    // then fetches a fresh version in the background for next time.
    if (request.url.includes('supabase.co')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                // 1. Respond with the cached version immediately.
                return cache.match(request).then((cachedResponse) => {
                    // 2. In the background, fetch a fresh version from the network.
                    const fetchedResponsePromise = fetch(request).then((networkResponse) => {
                        // 3. If successful, update the cache with the new data.
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                    // Return the cached version first, or wait for the network if not cached.
                    return cachedResponse || fetchedResponsePromise;
                });
            })
        );
        return; // End execution for API calls
    }

    // Strategy for all other requests (App Shell): Cache-First
    // This is ideal for static files that don't change often.
    event.respondWith(
        caches.match(request).then((response) => {
            // Return the cached response if it exists, otherwise fetch from the network.
            return response || fetch(request);
        })
    );
});