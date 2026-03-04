'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error: any) => {
      // Surfacing contextual error for developer debugging
      console.error('Firebase Permission Error:', error);
      
      // We throw a standard error here which will be caught by Next.js error boundary
      // or shown in the dev overlay.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
