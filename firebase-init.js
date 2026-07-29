// firebase-init.js
// Ensure that the Firebase Compat libraries are included in your HTML before this file runs.

const firebaseConfig = {
  apiKey: "AIzaSyALJ6HXG7DNbTD4CWCXv1zxBCGcixcKjk8",
  authDomain: "siriba-resort-watamu.firebaseapp.com",
  projectId: "siriba-resort-watamu",
  storageBucket: "siriba-resort-watamu.firebasestorage.app",
  messagingSenderId: "170227874136",
  appId: "1:170227874136:web:5355536036514779b6cd2d",
  measurementId: "G-WS2CTB1CH6"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
