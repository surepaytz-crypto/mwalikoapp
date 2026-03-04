"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ArrowLeft, Camera, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const simulateScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult(Math.random() > 0.3 ? 'success' : 'error');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col text-primary-foreground">
      <header className="p-4 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="font-headline text-xl font-bold">{t('qrScanner')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="relative w-full max-w-xs aspect-square border-4 border-accent rounded-3xl overflow-hidden bg-black/40 flex items-center justify-center">
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover" 
            autoPlay 
            muted 
            playsInline
          />

          {isScanning && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-4 z-10">
               <RefreshCw className="h-12 w-12 text-accent animate-spin" />
               <p className="text-sm font-medium tracking-widest uppercase">Verifying...</p>
            </div>
          )}

          {scanResult === 'success' && (
            <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center animate-in zoom-in-90 fade-in duration-300 z-20">
               <CheckCircle2 className="h-20 w-20 text-white mb-4" />
               <h2 className="text-2xl font-bold">Access Granted</h2>
               <p className="text-white/80">John Doe - V.I.P</p>
            </div>
          )}

          {scanResult === 'error' && (
            <div className="absolute inset-0 bg-destructive/90 flex flex-col items-center justify-center animate-in zoom-in-90 fade-in duration-300 z-20">
               <XCircle className="h-20 w-20 text-white mb-4" />
               <h2 className="text-2xl font-bold">Invalid Code</h2>
               <p className="text-white/80">Try again or check registry</p>
            </div>
          )}
          
          <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-accent"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-accent"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-accent"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-accent"></div>
          </div>
        </div>

        {hasCameraPermission === false && (
          <Alert variant="destructive" className="max-w-xs">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              Please allow camera access to use this feature.
            </AlertDescription>
          </Alert>
        )}

        <div className="w-full max-w-sm space-y-4">
          <Button 
            className="w-full h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={simulateScan}
            disabled={isScanning || hasCameraPermission === false}
          >
            {isScanning ? "Processing..." : t('scan')}
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-14 text-lg bg-white/5 border-white/20 text-white hover:bg-white/10"
            onClick={() => setScanResult(null)}
          >
            Reset
          </Button>
        </div>
      </main>

      <footer className="p-8 text-center bg-black/20">
        <p className="text-sm font-light opacity-60">Verified by Mwaliko Security</p>
      </footer>
    </div>
  );
}