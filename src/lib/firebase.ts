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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseDefaults.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseDefaults.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseDefaults.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseDefaults.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseDefaults.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseDefaults.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseDefaults.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || "",
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== "measurementId" && !value)
  .map(([key]) => key);

if (missingFirebaseConfig.length > 0) {
  throw new Error(
    `Missing Firebase web configuration: ${missingFirebaseConfig.join(", ")}. Set the corresponding VITE_FIREBASE_* variables.`
  );
}

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific databaseId if configured
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
