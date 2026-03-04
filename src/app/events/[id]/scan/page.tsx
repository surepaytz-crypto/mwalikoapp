"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { QrCode, ArrowLeft, RefreshCw, CheckCircle2, XCircle, Search, Key, Info, MapPin, Loader2, LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import jsQR from "jsqr";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type Checkpoint = "GATE" | "DRINKS" | "FOOD";
type ScanStatus = "idle" | "scanning" | "valid" | "invalid" | "used" | "sequence_error";

export default function ScanPage() {
  const { t } = useTranslation();
  const { id: eventId } = useParams();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint>("GATE");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedGuest, setScannedGuest] = useState<{ name: string, category: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const eventRef = useMemoFirebase(() => {
    if (!db || !eventId) return null;
    return doc(db, "events", eventId as string);
  }, [db, eventId]);
  const { data: event } = useDoc(eventRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
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
  }, [toast]);

  const verifyTicket = useCallback(async (ticketId: string) => {
    if (!db || !eventId || status === "scanning") return;
    setStatus("scanning");
    setScannedGuest(null);

    try {
      const cleanId = ticketId.trim();
      const q = query(
        collection(db, "events", eventId as string, "guestEvents"), 
        where("ticketId", "==", cleanId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setStatus("invalid");
        return;
      }

      const guestDoc = snapshot.docs[0];
      const guestData = guestDoc.data();
      const checkpointField = activeCheckpoint === "GATE" ? "scannedGate" : activeCheckpoint === "DRINKS" ? "scannedDrinks" : "scannedFood";

      // SECURITY SEQUENCING LOGIC
      // If scanning for Drinks or Food, guest MUST have passed the Gate first.
      if (activeCheckpoint !== "GATE" && !guestData.scannedGate) {
        setStatus("sequence_error");
        setScannedGuest({ name: guestData.guestName, category: guestData.category });
        return;
      }

      if (guestData[checkpointField]) {
        setStatus("used");
        setScannedGuest({ name: guestData.guestName, category: guestData.category });
        return;
      }

      await updateDoc(guestDoc.ref, { 
        [checkpointField]: true,
        updatedAt: new Date().toISOString()
      });

      const eRef = doc(db, "events", eventId as string);
      const statPath = `stats.${guestData.category}.${activeCheckpoint.toLowerCase()}`;
      await updateDoc(eRef, { [statPath]: increment(1) });

      setScannedGuest({ name: guestData.guestName, category: guestData.category });
      setStatus("valid");
    } catch (e: any) {
      console.error(e);
      setStatus("invalid");
    }
  }, [db, eventId, activeCheckpoint, status]);

  // QR Scanning Loop
  useEffect(() => {
    let animationFrameId: number;
    
    const scan = () => {
      if (videoRef.current && canvasRef.current && status === 'idle') {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            try {
              const parsed = JSON.parse(code.data);
              if (parsed.ticketId) {
                verifyTicket(parsed.ticketId);
              } else {
                verifyTicket(code.data);
              }
            } catch (e) {
              verifyTicket(code.data);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scan);
    };

    if (hasCameraPermission && status === 'idle') {
      scan();
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [hasCameraPermission, status, verifyTicket]);

  const handleManualCheck = () => {
    if (ticketIdInput.trim()) {
      verifyTicket(ticketIdInput.trim());
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-primary"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen bg-primary flex flex-col text-primary-foreground">
      <header className="p-4 flex items-center justify-between border-b border-white/10 bg-black/10">
        {userProfile?.userRole === "EventAdmin" ? (
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-white/10">
            <LogOut className="h-6 w-6" />
          </Button>
        )}
        <div className="text-center">
          <h1 className="font-headline text-xl font-bold">Mwaliko Scanner</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-60">{event?.nameEn || "Registry Verification"}</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 space-y-8">
        <div className="w-full max-w-xs space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-accent" />
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Selected Checkpoint</label>
          </div>
          <Select value={activeCheckpoint} onValueChange={(v) => setActiveCheckpoint(v as Checkpoint)}>
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
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80" autoPlay muted playsInline />
          <canvas ref={canvasRef} className="hidden" />

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
               <Button variant="ghost" className="mt-8 text-white/70 hover:text-white border border-white/20" onClick={() => setStatus("idle")}>Next Scan</Button>
            </div>
          )}

          {status === "invalid" && (
            <div className="absolute inset-0 bg-destructive flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20 text-center px-6">
               <XCircle className="h-24 w-24 text-white mb-4" />
               <h2 className="text-4xl font-black">{t('statusInvalid')}</h2>
               <p className="text-white/80 mt-2 font-bold">Ticket not found in Registry</p>
               <Button variant="ghost" className="mt-8 text-white/70 hover:text-white border border-white/20" onClick={() => setStatus("idle")}>Try Again</Button>
            </div>
          )}

          {status === "used" && (
            <div className="absolute inset-0 bg-orange-600 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20 text-center px-6">
               <Info className="h-24 w-24 text-white mb-4" />
               <h2 className="text-3xl font-black">{t('statusUsed')}</h2>
               <p className="mt-4 text-white/90 font-bold leading-tight">
                {scannedGuest?.name}<br/>already checked-in at {activeCheckpoint}
               </p>
               <Button variant="ghost" className="mt-8 text-white/70 hover:text-white border border-white/20" onClick={() => setStatus("idle")}>Acknowledge</Button>
            </div>
          )}

          {status === "sequence_error" && (
            <div className="absolute inset-0 bg-yellow-600 flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300 z-20 text-center px-6">
               <ShieldAlert className="h-24 w-24 text-white mb-4" />
               <h2 className="text-2xl font-black leading-tight">{t('statusSequenceError')}</h2>
               <p className="mt-4 text-white/90 font-bold text-sm">
                {scannedGuest?.name}<br/>must scan at GATE first.
               </p>
               <Button variant="ghost" className="mt-8 text-white/70 hover:text-white border border-white/20" onClick={() => setStatus("idle")}>Send to Gate</Button>
            </div>
          )}
          
          <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute top-10 left-10 w-16 h-16 border-t-4 border-l-4 border-accent rounded-tl-xl opacity-60"></div>
            <div className="absolute top-10 right-10 w-16 h-16 border-t-4 border-r-4 border-accent rounded-tr-xl opacity-60"></div>
            <div className="absolute bottom-10 left-10 w-16 h-16 border-b-4 border-l-4 border-accent rounded-bl-xl opacity-60"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 border-b-4 border-r-4 border-accent rounded-br-xl opacity-60"></div>
          </div>
        </div>

        {hasCameraPermission === false && (
          <Alert variant="destructive" className="max-w-xs">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              Please allow camera access in your browser settings to verify QR invitations.
            </AlertDescription>
          </Alert>
        )}

        <div className="w-full max-w-xs space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-2">
              <Key className="h-3 w-3 text-accent" /> {t('manualVerification')}
            </Label>
            <div className="flex gap-2">
              <Input 
                className="bg-white/10 border-white/30 text-white h-14 rounded-xl text-lg placeholder:text-white/20" 
                placeholder="Ticket ID (e.g. MW0IQ)"
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
        </div>
      </main>

      <footer className="p-8 text-center bg-black/30 border-t border-white/5">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-40">Mwaliko Premium &bull; Verified Entry System</p>
      </footer>
    </div>
  );
}
