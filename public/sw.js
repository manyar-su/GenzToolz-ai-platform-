const CACHE = 'genztools-v1'
const STATIC = ['/', '/index.html', '/favicon.svg', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Only cache GET, skip API calls
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
