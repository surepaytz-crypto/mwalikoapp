'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from './index';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initError, setInitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const firebase = useMemo(() => {
    if (!mounted) return null;
    try {
      return initializeFirebase();
    } catch (e: any) {
      console.error("Firebase Initialization Error:", e);
      setInitError(e.message);
      return null;
    }
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            {initError}
            <div className="mt-4 p-2 bg-black/5 rounded text-xs font-mono">
              Tip: LINK your Firebase project in the Studio toolbar above.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!firebase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <FirebaseProvider firebaseApp={firebase.firebaseApp} auth={firebase.auth} firestore={firebase.db}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
