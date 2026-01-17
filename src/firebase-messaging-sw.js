importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAeQowCM4rVVsrydCGio9XS2CWshGqgZY4",
  authDomain: "betsweb-beeba.firebaseapp.com",
  projectId: "betsweb-beeba",
  messagingSenderId: "1085400983296",
  appId: "1:1085400983296:web:28d660f998a2921675f5e5",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: '/assets/icons/icon-72x72.png'
    }
  );
});
