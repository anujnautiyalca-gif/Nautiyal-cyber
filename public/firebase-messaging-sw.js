/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker for Nautiyal Cyber Cafe (Web & Android PWA)
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDBwXi_ZP6IfczcSRdHFAODzmxKVb6hqKM',
  authDomain: 'horizontal-bit-cbcxw.firebaseapp.com',
  projectId: 'horizontal-bit-cbcxw',
  storageBucket: 'horizontal-bit-cbcxw.firebasestorage.app',
  messagingSenderId: '2615264968',
  appId: '1:2615264968:web:838f5e81374d410f7fc7fd',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    (payload.notification && payload.notification.title) ||
    (payload.data && payload.data.title) ||
    'Nautiyal Cyber Cafe';
  const notificationOptions = {
    body:
      (payload.notification && payload.notification.body) ||
      (payload.data && payload.data.body) ||
      'New service or application update available.',
    icon: '/logo-circle.png',
    badge: '/logo-circle.png',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
