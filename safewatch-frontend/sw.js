const CACHE_NAME = 'safewatch-v1';
const urlsToCache = [
    '/', '/index.html', '/pages/paciente.html', '/pages/admin.html',
    '/css/style.css', '/js/auth.js', '/js/dashboard.js', '/js/voz.js',
    '/js/charts.js', '/js/mapa.js', '/js/admin.js', '/manifest.json'
];
self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
});
self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});