// Firebase Cloud Messaging compatible Service Worker
// Handles both FCM background push and local notification clicks

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ── Firebase init (must match app config) ────────────────────────────────────
// These values are safe to be public — they identify the project, not secrets.
firebase.initializeApp({
  apiKey: 'AIzaSyCW4ZS2g9fV-ktNvjMJK5kCKlEEKsX2POo',
  authDomain: 'menu-ordering-app-fe429.firebaseapp.com',
  projectId: 'menu-ordering-app-fe429',
  storageBucket: 'menu-ordering-app-fe429.firebasestorage.app',
  messagingSenderId: '36544456072',
  appId: '1:36544456072:web:e05d3097e797202deb063d',
});

const messaging = firebase.messaging();

// ── Background message handler (tab closed / not focused) ────────────────────
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, image, data } = payload.notification || {};
  const notifTitle = title || 'Restaurant Update';
  const notifOptions = {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    image: image,
    tag: data?.tag || `fcm-${Date.now()}`,
    data: data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };
  return self.registration.showNotification(notifTitle, notifOptions);
});

// ── Service Worker lifecycle ──────────────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  let targetUrl = '/';

  if (data.type === 'order_update' || data.type === 'payment_update' || data.type === 'waiter_response') {
    targetUrl = `/menu/${data.userId || ''}/table/${data.tableNumber || '1'}`;
  } else if (action === 'view_menu') {
    targetUrl = `/menu/${data.userId || ''}/table/${data.tableNumber || '1'}`;
  } else if (action === 'view_bill') {
    targetUrl = `/menu/${data.userId || ''}/table/${data.tableNumber || '1'}?action=view_bill`;
  } else if (action === 'retry_payment') {
    targetUrl = `/menu/${data.userId || ''}/table/${data.tableNumber || '1'}?action=retry_payment`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if already open
      const existingClient = clients.find((c) => c.url.includes(targetUrl));
      if (existingClient) {
        return existingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ── Background sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});