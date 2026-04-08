const CACHE_NAME = 'diario-cozy-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación del service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activación del service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones y servir desde cache cuando sea posible
self.addEventListener('fetch', event => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') return;
  
  // No cachear peticiones a la API de Anthropic
  if (event.request.url.includes('anthropic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devolverlo
        if (response) {
          return response;
        }
        
        // Si no, hacer fetch y cachear si es exitoso
        return fetch(event.request).then(response => {
          // Verificar si es una respuesta válida
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clonar la respuesta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});
