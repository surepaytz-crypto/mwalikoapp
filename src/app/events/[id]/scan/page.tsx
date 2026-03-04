
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ArrowLeft, RefreshCw, CheckCircle2, XCircle, ShieldCheck, Search, Key, Info } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";

type Checkpoint = "GATE" | "DRINKS" | "FOOD";
type ScanStatus = "idle" | "scanning" | "valid" | "invalid" | "used";

export default function ScanPage() {
  const { t } = useTranslation();
  const { id: eventId } = useParams();
  const { toast } = useToast();
  const db = useFirestore();
  
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint>("GATE");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedGuest, setScannedGuest] = useState<{ name: string, category: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
  }, []);

  const verifyTicket = async (ticketId: string) => {
    if (!db || !eventId) return;
    setStatus("scanning");
    setScannedGuest(null);

    try {
      const q = query(
        collection(db, "events", eventId as string, "guestEvents"), 
        where("ticketId", "==", ticketId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setStatus("invalid");
        return;
      }

      const guestDoc = snapshot.docs[0];
      const guestData = guestDoc.data();
      const checkpointField = activeCheckpoint === "GATE" ? "scannedGate" : activeCheckpoint === "DRINKS" ? "scannedDrinks" : "scannedFood";

      if (guestData[checkpointField]) {
        setStatus("used");
        setScannedGuest({ name: guestData.guestName, category: guestData.category });
        return;
      }

      // Mark as scanned
      await updateDoc(guestDoc.ref, {
        [checkpointField]: true
      });

      // Update aggregate stats on parent event
      const eventRef = doc(db, "events", eventId as string);
      const statPath = `stats.${guestData.category}.${activeCheckpoint.toLowerCase()}`;
      await updateDoc(eventRef, {
        [statPath]: increment(1)
      });

      setScannedGuest({ name: guestData.guestName, category: guestData.category });
      setStatus("valid");
    } catch (e: any) {
      console.error(e);
      setStatus("invalid");
    }
  };

  const handleManualCheck = () => {
    if (ticketIdInput.trim()) {
      verifyTicket(ticketIdInput.trim());
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
          <h1 className="font-headline text-lg font-bold">Mwaliko Scanner</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50">3-Point Scan Logic</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 space-y-6">
        <div className="w-full max-w-xs space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest opacity-60">Active Scan Point</label>
          <Select 
            value={activeCheckpoint} 
            onValueChange={(v) => setActiveCheckpoint(v as Checkpoint)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
              <SelectValue placeholder="Select Point" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GATE">{t('checkpointGate')}</SelectItem>
              <SelectItem value="DRINKS">{t('checkpointDrinks')}</SelectItem>
              <SelectItem value="FOOD">{t('checkpointFood')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full max-w-xs aspect-square border-4 border-accent rounded-3xl overflow-hidden bg-black/40 flex items-center justify-center shadow-2xl">
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover" 
            autoPlay 
            muted 
            playsInline
          />

          {status === "scanning" && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-4 z-10 backdrop-blur-sm">
               <RefreshCw className="h-12 w-12 text-accent animate-spin" />
               <p className="text-sm font-medium tracking-widest uppercase">Validating...</p>
            </div>
          )}

          {status === "valid" && (
            <div className="absolute inset-0 bg-green-500/95 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20 text-center px-4">
               <CheckCircle2 className="h-20 w-20 text-white mb-4" />
               <h2 className="text-3xl font-bold">{t('statusValid')}</h2>
               <p className="mt-2 text-white/90 font-bold text-lg">{scannedGuest?.name}</p>
               <p className="text-xs uppercase tracking-widest opacity-80">{scannedGuest?.category}</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="absolute inset-0 bg-destructive/95 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20">
               <XCircle className="h-20 w-20 text-white mb-4" />
               <h2 className="text-3xl font-bold">{t('statusInvalid')}</h2>
               <p className="text-white/90 mt-2">No record found</p>
            </div>
          )}

          {status === "used" && (
            <div className="absolute inset-0 bg-orange-500/95 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20 text-center px-4">
               <Info className="h-20 w-20 text-white mb-4" />
               <h2 className="text-2xl font-bold">{t('statusUsed')}</h2>
               <p className="mt-2 text-white/90 font-medium">{scannedGuest?.name} already checked into {activeCheckpoint}</p>
            </div>
          )}
          
          <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-accent"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-accent"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-accent"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-accent"></div>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest opacity-60 flex items-center gap-1">
              <Key className="h-3 w-3" /> {t('manualVerification')}
            </Label>
            <div className="flex gap-2">
              <Input 
                className="bg-white/10 border-white/20 text-white h-12" 
                placeholder="MW-XXXXXX"
                value={ticketIdInput}
                onChange={(e) => setTicketIdInput(e.target.value)}
              />
              <Button onClick={handleManualCheck} className="h-12 bg-accent text-accent-foreground">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10"
            onClick={() => {
              setStatus("idle");
              setTicketIdInput("");
            }}
          >
            Reset Scanner
          </Button>
        </div>
      </main>

      <footer className="p-6 text-center bg-black/20 border-t border-white/5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Mwaliko Premium Registry &bull; Verified Entry</p>
      </footer>
    </div>
  );
}
