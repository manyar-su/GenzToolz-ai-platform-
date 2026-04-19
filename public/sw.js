const CACHE = 'genztools-v6'
const STATIC = ['/favicon.svg', '/manifest.json']

self.addEventListener('install', e => {
  // Jangan cache index.html — selalu ambil dari network
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  // Hapus semua cache lama
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Selalu network-first untuk: HTML, API, navigasi
  if (
    e.request.method !== 'GET' ||
    e.request.url.includes('/api/') ||
    e.request.headers.get('accept')?.includes('text/html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html')
  ) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
    return
  }

  // Cache-first untuk assets (JS, CSS, images)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return response
      })
    })
  )
})
