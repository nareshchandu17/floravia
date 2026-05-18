// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyCiMpO7iWPOnD6DwE82rZqeJIDozlnJU9c",
  authDomain: "gen-lang-client-0473261758.firebaseapp.com",
  projectId: "gen-lang-client-0473261758",
  storageBucket: "gen-lang-client-0473261758.firebasestorage.app",
  messagingSenderId: "785342812063",
  appId: "1:785342812063:web:666c6442f8d82276dc77aa"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // or a generic icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
