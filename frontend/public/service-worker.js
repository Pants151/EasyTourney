const CACHE_NAME = 'easytourney-cache-v3'; // <- Hemos subido a v2
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Evento Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Archivos cacheados con éxito');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento Fetch: Intercepta las peticiones de la app
self.addEventListener('fetch', (event) => {
  // Si la petición es para Socket.io o para nuestra API del Backend,
  // no hacemos nada y dejamos que el navegador la maneje normalmente.
  if (event.request.url.includes('/socket.io/') || event.request.url.includes('/api/')) {
    return; // Salimos de la función
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
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Borra la v1 antigua
          }
        })
      );
    })
  );
});