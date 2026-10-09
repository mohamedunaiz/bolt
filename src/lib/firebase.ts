/// <reference types="vite/client" />

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import firebaseDefaults from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseDefaults.apiKey || "demo-api-key",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseDefaults.authDomain || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseDefaults.projectId || "demo-project",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseDefaults.storageBucket || "demo-project.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseDefaults.messagingSenderId || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseDefaults.appId || "1:000000000000:web:demo",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseDefaults.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || "",
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== "measurementId" && !value)
  .map(([key]) => key);

if (missingFirebaseConfig.length > 0) {
  console.warn(
    `[Firebase] Web configuration is incomplete (${missingFirebaseConfig.join(", ")}). Firebase-backed features will remain unavailable until VITE_FIREBASE_* variables are configured.`
  );
}

export const firebaseConfigured = missingFirebaseConfig.length === 0;

// Keep the app shell usable in environments without Firebase variables. Auth and
// Firestore calls are guarded by their existing service-level error handling.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = firebaseConfigured
  ? getAuth(app)
  : ({ currentUser: null } as ReturnType<typeof getAuth>);
export const googleProvider = new GoogleAuthProvider();

// Keep both overloads explicit so TypeScript can verify the default and
// named-database paths against the Firebase SDK's overloaded signatures.
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
};

export type { FirebaseUser };
