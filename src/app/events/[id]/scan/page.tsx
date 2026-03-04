
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ArrowLeft, RefreshCw, CheckCircle2, XCircle, ShieldCheck, Search, Key, Info, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

type Checkpoint = "GATE" | "DRINKS" | "FOOD";
type ScanStatus = "idle" | "scanning" | "valid" | "invalid" | "used";

export default function ScanPage() {
  const { t } = useTranslation();
  const { id: eventId } = useParams();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint>("GATE");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedGuest, setScannedGuest] = useState<{ name: string, category: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Event info for validation
  const eventRef = useMemoFirebase(() => {
    if (!db || !eventId) return null;
    return doc(db, "events", eventId as string);
  }, [db, eventId]);
  const { data: event } = useDoc(eventRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading]);

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

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-primary"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen bg-primary flex flex-col text-primary-foreground">
      <header className="p-4 flex items-center justify-between border-b border-white/10 bg-black/10">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="font-headline text-xl font-bold">Mwaliko Scanner</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-60">{event?.nameEn || "Checking Registry"}</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 space-y-8">
        <div className="w-full max-w-xs space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-accent" />
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Active Checkpoint</label>
          </div>
          <Select 
            value={activeCheckpoint} 
            onValueChange={(v) => setActiveCheckpoint(v as Checkpoint)}
          >
            <SelectTrigger className="bg-white/10 border-white/30 text-white h-14 rounded-xl text-lg font-bold">
              <SelectValue placeholder="Select Point" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GATE">{t('checkpointGate')}</SelectItem>
              <SelectItem value="DRINKS">{t('checkpointDrinks')}</SelectItem>
              <SelectItem value="FOOD">{t('checkpointFood')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full max-w-xs aspect-square border-8 border-accent/40 rounded-[2.5rem] overflow-hidden bg-black/60 flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.2)]">
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover opacity-80" 
            autoPlay 
            muted 
            playsInline
          />

          {status === "scanning" && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-4 z-10 backdrop-blur-md">
               <RefreshCw className="h-16 w-16 text-accent animate-spin" />
               <p className="text-sm font-bold tracking-[0.2em] uppercase text-accent">Verifying...</p>
            </div>
          )}

          {status === "valid" && (
            <div className="absolute inset-0 bg-green-600 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20 text-center px-6">
               <CheckCircle2 className="h-24 w-24 text-white mb-4" />
               <h2 className="text-4xl font-black">{t('statusValid')}</h2>
               <div className="mt-4 space-y-1">
                 <p className="text-xl font-bold">{scannedGuest?.name}</p>
                 <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {scannedGuest?.category}
                 </div>
               </div>
               <Button 
                variant="ghost" 
                className="mt-8 text-white/70 hover:text-white"
                onClick={() => setStatus("idle")}
               >
                 Next Scan
               </Button>
            </div>
          )}

          {status === "invalid" && (
            <div className="absolute inset-0 bg-destructive flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20 text-center px-6">
               <XCircle className="h-24 w-24 text-white mb-4" />
               <h2 className="text-4xl font-black">{t('statusInvalid')}</h2>
               <p className="text-white/80 mt-2 font-bold">Ticket not recognized</p>
               <Button 
                variant="ghost" 
                className="mt-8 text-white/70 hover:text-white"
                onClick={() => setStatus("idle")}
               >
                 Try Again
               </Button>
            </div>
          )}

          {status === "used" && (
            <div className="absolute inset-0 bg-orange-600 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20 text-center px-6">
               <Info className="h-24 w-24 text-white mb-4" />
               <h2 className="text-3xl font-black">{t('statusUsed')}</h2>
               <p className="mt-4 text-white/90 font-bold leading-tight">
                {scannedGuest?.name}<br/>already used at {activeCheckpoint}
               </p>
               <Button 
                variant="ghost" 
                className="mt-8 text-white/70 hover:text-white"
                onClick={() => setStatus("idle")}
               >
                 Acknowledge
               </Button>
            </div>
          )}
          
          <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute top-10 left-10 w-16 h-16 border-t-4 border-l-4 border-accent rounded-tl-xl opacity-60"></div>
            <div className="absolute top-10 right-10 w-16 h-16 border-t-4 border-r-4 border-accent rounded-tr-xl opacity-60"></div>
            <div className="absolute bottom-10 left-10 w-16 h-16 border-b-4 border-l-4 border-accent rounded-bl-xl opacity-60"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 border-b-4 border-r-4 border-accent rounded-br-xl opacity-60"></div>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-2">
              <Key className="h-3 w-3 text-accent" /> {t('manualVerification')}
            </Label>
            <div className="flex gap-2">
              <Input 
                className="bg-white/10 border-white/30 text-white h-14 rounded-xl text-lg placeholder:text-white/20" 
                placeholder="Ticket ID (e.g. MW123)"
                value={ticketIdInput}
                onChange={(e) => setTicketIdInput(e.target.value)}
              />
              <Button onClick={handleManualCheck} className="h-14 w-14 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl">
                <Search className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <Button 
            className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl uppercase font-bold text-lg shadow-xl"
            onClick={handleManualCheck}
            disabled={status === "scanning"}
          >
            {status === "scanning" ? <Loader2 className="animate-spin" /> : "Verify Scan"}
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl uppercase text-[10px] font-bold tracking-widest"
            onClick={() => {
              setStatus("idle");
              setTicketIdInput("");
            }}
          >
            Reset Verification
          </Button>
        </div>
      </main>

      <footer className="p-8 text-center bg-black/30 border-t border-white/5">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-40">Mwaliko Premium &bull; High-Security Scanning</p>
      </footer>
    </div>
  );
}
