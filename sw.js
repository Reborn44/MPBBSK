const CACHE_NAME = "mpbbsk-hlasovanie-cache-v1";
const URLS_TO_CACHE = [
    '/',
    'index.html',
    'style.css',
    'app.js',
    'whitelogo2.png',
    'favicon.png',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );

});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    )
})