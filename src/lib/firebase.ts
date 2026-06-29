import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

function missingFirebaseProxy<T extends object>(serviceName: string): T {
  return new Proxy({} as T, {
    get() {
      throw new Error(`Firebase ${serviceName} is not configured. Please set VITE_FIREBASE_* environment variables.`);
    },
  });
}

const app = isFirebaseConfigured ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;

export const auth: Auth = app ? getAuth(app) : missingFirebaseProxy<Auth>('Auth');
export const db: Firestore = app ? getFirestore(app) : missingFirebaseProxy<Firestore>('Firestore');

export function requireAuth(): Auth {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Auth is not configured. Please set VITE_FIREBASE_* environment variables.');
  }
  return auth;
}

export function requireDb(): Firestore {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Firestore is not configured. Please set VITE_FIREBASE_* environment variables.');
  }
  return db;
}
