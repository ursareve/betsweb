export const environment = {
  production: true,
  backend: 'http://194.163.187.97/',
  apiUrl: 'http://194.163.187.97/api',
  version: 'v1',
  apiAccessKey: '7rN2kLp9QxWbV5mJt3Yf',
  // Servidor de notificaciones del backend
  notificationServer: {
    enabled: true,
    url: 'ws://194.163.187.97/push',
    reconnectAttempts: 5,
    reconnectDelay: 3000
  },
  // Firebase (mantener para uso futuro)
  firebaseConfig: {
    apiKey: "AIzaSyAeQowCM4rVVsrydCGio9XS2CWshGqgZY4",
    authDomain: "betsweb-beeba.firebaseapp.com",
    projectId: "betsweb-beeba",
    storageBucket: "betsweb-beeba.firebasestorage.app",
    messagingSenderId: "1085400983296",
    appId: "1:1085400983296:web:28d660f998a2921675f5e5",
    measurementId: "G-FMJE4L17W7",
    vapidKey: "BHfNP-oVakoiewB0cEFIDvzzFr8i6etnQlhrfGgzPO0HCvcg7BlFJDg0YeWVvwL7-Gx-OGvYyILSwZWw2gPU-Yk"
  }
};
