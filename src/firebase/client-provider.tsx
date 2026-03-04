'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from './index';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize Firebase only once on the client
  const { firebaseApp, auth, db } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider firebaseApp={firebaseApp} auth={auth} firestore={db}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
