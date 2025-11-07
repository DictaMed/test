// Service Worker pour DictaMed PWA - Version améliorée
const CACHE_NAME = 'dictamed-v2.0';
const OFFLINE_PAGE = '/offline.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/offline.html',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des fichiers essentiels');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Erreur lors de la mise en cache:', error);
      })
  );
  // Forcer l'activation immédiate
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prendre le contrôle immédiat de toutes les pages
  return self.clients.claim();
});

// Stratégie de cache améliorée : Network First avec timeout, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Ignorer les requêtes vers des domaines externes (webhooks N8N)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    // Essayer le réseau d'abord avec un timeout
    Promise.race([
      fetch(event.request)
        .then((response) => {
          // Vérifier si c'est une réponse valide
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Cloner la réponse car elle ne peut être consommée qu'une fois
          const responseClone = response.clone();
          
          // Mettre à jour le cache avec la nouvelle réponse
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          
          return response;
        }),
      // Timeout de 5 secondes
      new Promise((resolve, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ])
    .catch(() => {
      // En cas d'échec réseau ou timeout, utiliser le cache
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Récupération depuis le cache:', event.request.url);
          return cachedResponse;
        }
        
        // Si pas de cache et que c'est un document HTML, retourner la page offline
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match(OFFLINE_PAGE).then((offlinePage) => {
            if (offlinePage) {
              return offlinePage;
            }
            
            // Fallback ultime si la page offline n'est pas en cache
            return new Response(
              `<!DOCTYPE html>
              <html lang="fr">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hors ligne - DictaMed</title>
                <style>
                  body { 
                    font-family: system-ui, sans-serif; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    min-height: 100vh; 
                    margin: 0;
                    background: linear-gradient(135deg, #e0f2fe 0%, #dcfce7 100%);
                    color: #1e293b;
                    text-align: center;
                    padding: 20px;
                  }
                  .container {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                  }
                  h1 { color: #2563eb; margin-bottom: 16px; }
                  p { color: #64748b; line-height: 1.6; margin-bottom: 24px; }
                  button {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>📡 Mode Hors Ligne</h1>
                  <p>Vous n'êtes pas connecté à Internet.<br>Veuillez vérifier votre connexion.</p>
                  <button onclick="location.reload()">🔄 Réessayer</button>
                </div>
              </body>
              </html>`,
              { 
                headers: { 
                  'Content-Type': 'text/html; charset=utf-8' 
                } 
              }
            );
          });
        }
        
        // Pour les autres ressources, retourner une erreur
        return new Response('Ressource non disponible hors ligne', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Synchronisation en arrière-plan (si supporté)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-recordings') {
    event.waitUntil(syncRecordings());
  }
});

async function syncRecordings() {
  console.log('[Service Worker] Synchronisation des enregistrements...');
  // Cette fonction pourrait être utilisée pour synchroniser 
  // les enregistrements en attente quand la connexion est restaurée
}

// Notifications push (préparé pour futur usage)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'DictaMed';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: data.url || '/'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
