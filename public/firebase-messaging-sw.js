// Give the service worker access to Firebase Messaging.
// NOTE: This file is dynamically compiled and served by server.ts on the fly with proper credentials injected.
// This is to prevent exposing API keys in version control or static production bundles.
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

// Fallback configuration
firebase.initializeApp({
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message (static fallback) ', payload);
  const notificationTitle = (payload.notification && payload.notification.title) || 'Floravia Alert';
  const notificationOptions = {
    body: (payload.notification && payload.notification.body) || 'New botanical intelligence update.',
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

