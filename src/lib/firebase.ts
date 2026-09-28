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
  getDocFromServer,
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
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

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
  getDocFromServer,
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
