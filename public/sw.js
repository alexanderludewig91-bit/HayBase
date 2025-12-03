// Service Worker für DrBalance PWA
const CACHE_NAME = 'drbalance-v1'
const RUNTIME_CACHE = 'drbalance-runtime-v1'

// Assets die beim Installieren gecacht werden sollen
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

// Install Event - Cache wichtige Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
    .then(() => self.clients.claim())
  )
})

// Fetch Event - Network First Strategy für API, Cache First für Assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // API Requests - Network First
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone response for cache
          const responseToCache = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request)
        })
    )
    return
  }

  // Static Assets - Cache First
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          const responseToCache = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
      })
  )
})

