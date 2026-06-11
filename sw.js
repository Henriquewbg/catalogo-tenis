importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const CACHE = "vault-v2";
const ASSETS = ["./vault.html", "./manifest.json"];

firebase.initializeApp({
  apiKey: "AIzaSyCZ-3uEkchuCj70QPl9282zNddWB0bsNmk",
  authDomain: "vault-sneakers.firebaseapp.com",
  projectId: "vault-sneakers",
  storageBucket: "vault-sneakers.firebasestorage.app",
  messagingSenderId: "1087512082503",
  appId: "1:1087512082503:web:2196dc915767ed1cf15962"
});

const messaging = firebase.messaging();

// Handle background push from Firebase
messaging.onBackgroundMessage(payload => {
  const {title, body} = payload.notification || {};
  self.registration.showNotification(title || 'Vault', {
    body: body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
  });
});

// Handle scheduled drops via postMessage from the app
const scheduledTimers = {};

self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SCHEDULE_DROPS'){
    // Clear old timers
    Object.values(scheduledTimers).forEach(t => clearTimeout(t));
    Object.keys(scheduledTimers).forEach(k => delete scheduledTimers[k]);

    const now = Date.now();
    (e.data.drops || []).forEach(drop => {
      const ts = drop.dropTs;
      const ts24 = ts - 24 * 60 * 60 * 1000;

      if(ts24 > now){
        scheduledTimers[`${drop.id}_24`] = setTimeout(() => {
          self.registration.showNotification(`Drop amanhã: ${drop.model}`, {
            body: `${drop.brand} • às ${drop.dropTime} • Retail ${drop.retail}`,
            icon: './icon-192.png',
            tag: `drop_24_${drop.id}`,
            data: { url: './' }
          });
        }, ts24 - now);
      }

      if(ts > now){
        scheduledTimers[`${drop.id}_now`] = setTimeout(() => {
          self.registration.showNotification(`🔥 Drop agora: ${drop.model}`, {
            body: `${drop.brand} está dropando agora! Retail ${drop.retail}`,
            icon: './icon-192.png',
            tag: `drop_now_${drop.id}`,
            data: { url: './' }
          });
        }, ts - now);
      }
    });
  }
});

// Open app on notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.openWindow(url));
});

// Cache
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
