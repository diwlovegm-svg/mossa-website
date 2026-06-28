const CACHE_NAME = 'mossa-coupon-srirayong-v2026-06-28-a';

const APP_SHELL = [
  './',
  './index.html',
  './claim/',
  './claim/index.html',
  './admin/',
  './admin/index.html',
  './config/',
  './config/index.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './shared/styles.css',
  './shared/pwa.js',
  './shared/runtimeConfig.js',
  './shared/campaignConfig.js',
  './shared/couponTemplate.js',
  './shared/apiClient.js',
  './shared/couponRenderer.js',
  './app.js',
  './claim/claim.js',
  './admin/admin.js',
  './config/config.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './offline.html'));
    return;
  }

  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) return cache.match(fallbackUrl);
    throw new Error('Network unavailable');
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}
