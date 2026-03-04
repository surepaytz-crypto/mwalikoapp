
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ArrowLeft, RefreshCw, CheckCircle2, XCircle, ShieldCheck, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Checkpoint = "MAIN_ENTRANCE" | "SECURITY_CHECK" | "VIP_LOUNGE";

export default function ScanPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint>("MAIN_ENTRANCE");
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
      setScanResult(Math.random() > 0.2 ? 'success' : 'error');
    }, 1200);
  };

  const getCheckpointTitle = (cp: Checkpoint) => {
    switch (cp) {
      case "MAIN_ENTRANCE": return "Point 1: Main Entrance";
      case "SECURITY_CHECK": return "Point 2: Security Check";
      case "VIP_LOUNGE": return "Point 3: VIP Lounge";
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col text-primary-foreground">
      <header className="p-4 flex items-center justify-between border-b border-white/10">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="font-headline text-lg font-bold">Event Scanner</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50">3-Point Logic Active</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        {/* Checkpoint Selector */}
        <div className="w-full max-w-xs space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest opacity-60">Active Scan Point</label>
          <Select 
            value={activeCheckpoint} 
            onValueChange={(v) => setActiveCheckpoint(v as Checkpoint)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
              <SelectValue placeholder="Select Scan Point" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MAIN_ENTRANCE">1. Main Entrance</SelectItem>
              <SelectItem value="SECURITY_CHECK">2. Security Check</SelectItem>
              <SelectItem value="VIP_LOUNGE">3. VIP Lounge</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full max-w-xs aspect-square border-4 border-accent rounded-3xl overflow-hidden bg-black/40 flex items-center justify-center">
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover" 
            autoPlay 
            muted 
            playsInline
          />

          {isScanning && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-4 z-10 backdrop-blur-sm">
               <RefreshCw className="h-12 w-12 text-accent animate-spin" />
               <p className="text-sm font-medium tracking-widest uppercase">Validating at {activeCheckpoint.replace('_', ' ')}...</p>
            </div>
          )}

          {scanResult === 'success' && (
            <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20">
               <CheckCircle2 className="h-20 w-20 text-white mb-4" />
               <h2 className="text-2xl font-bold">Access Granted</h2>
               <p className="text-white/90 font-medium">Verified for {activeCheckpoint.replace('_', ' ')}</p>
            </div>
          )}

          {scanResult === 'error' && (
            <div className="absolute inset-0 bg-destructive/90 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20">
               <XCircle className="h-20 w-20 text-white mb-4" />
               <h2 className="text-2xl font-bold">Invalid Entry</h2>
               <p className="text-white/90">Code not recognized</p>
            </div>
          )}
          
          <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-accent"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-accent"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-accent"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-accent"></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-accent/20 animate-pulse"></div>
          </div>
        </div>

        {hasCameraPermission === false && (
          <Alert variant="destructive" className="max-w-xs">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Camera Required</AlertTitle>
            <AlertDescription>
              Please allow camera access to scan invitations.
            </AlertDescription>
          </Alert>
        )}

        <div className="w-full max-w-sm space-y-4">
          <Button 
            className="w-full h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl"
            onClick={simulateScan}
            disabled={isScanning || hasCameraPermission === false}
          >
            {isScanning ? "Scanning..." : "Simulate Verification"}
          </Button>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-12 bg-white/5 border-white/20 text-white hover:bg-white/10"
              onClick={() => setScanResult(null)}
            >
              Clear
            </Button>
            <Button 
              variant="outline" 
              className="h-12 bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <Search className="mr-2 h-4 w-4" /> Lookup
            </Button>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center bg-black/20 border-t border-white/5">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ShieldCheck className="h-3 w-3 text-accent" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Secure Entry Protocol 2.4.0</p>
        </div>
      </footer>
    </div>
  );
}
