const CACHE_NAME = 'nutrivize-v2.2.1';
const STATIC_CACHE = 'nutrivize-static-v2.2.1';
const DYNAMIC_CACHE = 'nutrivize-dynamic-v2.2.1';

// Enhanced cache strategy for better PWA performance
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Network-first resources (API calls)
const networkFirstPaths = [
  '/api/',
  '/auth/',
  '/food-logs',
  '/analytics'
];

// Cache-first resources (static assets)
const cacheFirstPaths = [
  '/icons/',
  '/static/',
  '.js',
  '.css',
  '.woff',
  '.woff2',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(urlsToCache);
      }),
      // Create offline fallback page
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.add('/offline.html');
      })
    ]).catch((error) => {
      console.error('[SW] Cache install failed:', error);
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

// Enhanced fetch strategy with network/cache optimization
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (isNetworkFirst(url.pathname)) {
    event.respondWith(networkFirst(request));
  } else if (isCacheFirst(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Network-first strategy for API calls and dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'You are offline. Some features may not be available.',
          offline: true
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        }
      );
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch:', request.url, error);
    throw error;
  }
}

// Stale-while-revalidate strategy for general content
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Fetch in the background to update cache
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Background fetch failed:', error);
    });
  
  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

// Helper functions
function isNetworkFirst(pathname) {
  return networkFirstPaths.some(path => pathname.includes(path));
}

function isCacheFirst(pathname) {
  return cacheFirstPaths.some(path => pathname.includes(path));
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    console.log('[SW] Syncing offline data...');
    
    // Get pending food logs from IndexedDB
    const db = await openIndexedDB();
    const pendingLogs = await getPendingLogs(db);
    
    // Sync each pending log
    for (const log of pendingLogs) {
      try {
        await fetch('/api/food-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(log.data)
        });
        
        // Remove from pending queue
        await removePendingLog(db, log.id);
        console.log('[SW] Synced offline log:', log.id);
      } catch (error) {
        console.error('[SW] Failed to sync log:', log.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers for offline data storage
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NutrivizeOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingLogs')) {
        db.createObjectStore('pendingLogs', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function getPendingLogs(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingLogs'], 'readonly');
    const store = transaction.objectStore('pendingLogs');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingLog(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingLogs'], 'readwrite');
    const store = transaction.objectStore('pendingLogs');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notifications for meal reminders and insights
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Check out your nutrition insights!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || '1',
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icons/icon-96x96.png'
      }
    ],
    requireInteraction: data.urgent || false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Nutrivize', 
      options
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

console.log('[SW] Service Worker loaded successfully');
