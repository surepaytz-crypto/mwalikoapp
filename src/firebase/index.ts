'use client';

import { getFirebaseApp, getFirebaseAuth, getFirebaseDb } from './config';
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
export { useMemoFirebase } from './use-memo-firebase';

export function initializeFirebase() {
  const firebaseApp = getFirebaseApp();
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  
  if (!firebaseApp || !auth || !db) {
    return null;
  }
  
  return { firebaseApp, auth, db };
}
