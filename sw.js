const CACHE_NAME = 'matutonet-cache-v2'; // Mudamos para v2 para forçar a atualização
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './logo.png'
];

// Instalação: Salva a estrutura básica
self.addEventListener('install', event => {
  self.skipWaiting(); // Força a atualização imediata
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Ativação: Limpa caches da V1 bugada
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interceptador de Rede
self.addEventListener('fetch', event => {
  // Ignora requisições do Firebase (para não bugar o banco de dados)
  if (event.request.url.includes('firestore') || event.request.url.includes('firebaseio')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a internet funcionou, atualiza o cache silenciosamente
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Se estiver offline, pega do cache
        return caches.match(event.request);
      })
  );
});
