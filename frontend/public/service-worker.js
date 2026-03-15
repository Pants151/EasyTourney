const CACHE_NAME = 'easytourney-cache-v4';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/index.html'
];

// Evento Install
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Fuerza a que esta versión tome el mando inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos base');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento Fetch: Intercepta las peticiones de la app
self.addEventListener('fetch', (event) => {
  // Ignorar Socket.io (no se puede cachear)
  if (event.request.url.includes('/socket.io/')) {
    return;
  }

  // --- ESTRATEGIA PARA LA API (DATOS) ---
  if (event.request.url.includes('/api/')) {
    // Solo cacheamos peticiones GET
    if (event.request.method === 'GET') {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            // Guardamos copia de respuestas exitosas
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open('easytourney-data-cache').then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            console.log('Service Worker: Cargando API desde caché (Offline)');
            return caches.match(event.request);
          })
      );
      return;
    }
    return;
  }

  // Siempre ir a la red primero
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Para el resto (imágenes, CSS, HTML), buscamos en la caché
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      }).catch(() => {
        // Si falla todo (no hay internet y no está en caché)
        console.log('Fallo en la red y no hay caché para:', event.request.url);
      })
  );
});

// Evento Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Toma el control de las pestañas abiertas inmediatamente
  const cacheWhitelist = [CACHE_NAME, 'easytourney-data-cache'];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});