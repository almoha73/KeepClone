// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB0AwDHYpFH-8X2s9L7PqfNGQPUzz5DWyY",
  authDomain: "mon-app-de-notes.firebaseapp.com",
  projectId: "mon-app-de-notes",
  storageBucket: "mon-app-de-notes.firebasestorage.app",
  messagingSenderId: "933526243076",
  appId: "1:933526243076:web:ebba9035b16deb6fa7b251",
  measurementId: "G-E8978T42DJ"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);

// Exports des services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;