'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-3538378268-f65f4',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  
  const isMissingConfig = !firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined' || firebaseConfig.apiKey === '';
  
  if (isMissingConfig && typeof window !== 'undefined') {
    // In production/hosting this would come from environment variables.
    // In Studio, the user must click "Link Project".
    throw new Error("Firebase API key is missing. Please click the 'Link Project' button in the Studio toolbar above to connect your project.");
  }
  
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
