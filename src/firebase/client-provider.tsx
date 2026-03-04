'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from './index';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const firebase = useMemo(() => {
    if (!mounted) return null;
    return initializeFirebase();
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  // If firebase initialization returned null, it means config is missing
  if (!firebase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-md border-accent/50 bg-accent/5">
          <LinkIcon className="h-5 w-5 text-accent" />
          <AlertTitle className="text-accent font-headline text-xl">Configuration Required</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>Your Firebase API key is missing. This happens when the project hasn't been synchronized with the code yet.</p>
            <div className="bg-background/50 p-4 rounded-lg border border-accent/20">
              <p className="font-bold text-sm mb-2 uppercase tracking-wider">How to fix:</p>
              <ol className="list-decimal ml-4 text-sm space-y-2 opacity-80">
                <li>Look at the <strong>top center</strong> of this window.</li>
                <li>Click the pill that says <code className="bg-accent/20 px-1 rounded text-accent">studio-3538378268-f65f4</code>.</li>
                <li>Ensure the project is correctly "Linked" or "Synced".</li>
              </ol>
            </div>
            <p className="text-xs italic opacity-60">Once linked, refresh this page to continue.</p>
          </AlertDescription>
        </Alert>
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
