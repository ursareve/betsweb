// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: false,
  backend: 'http://localhost:4200', // Put your backend here
  apiUrl: 'http://194.163.187.97/api',
  version: 'v1',
  apiAccessKey: '7rN2kLp9QxWbV5mJt3Yf',
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
