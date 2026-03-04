"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, QrCode, User, MapPin, Printer, MessageSquare, Send, Tag, Loader2, ShieldCheck, Hash } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function InvitePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [guestName, setGuestName] = useState("");
  const [category, setCategory] = useState("");
  const [ticketId, setTicketId] = useState(""); 
  const invitationRef = useRef<HTMLDivElement>(null);

  const eventRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "events", id as string);
  }, [db, id]);

  const { data: event, isLoading } = useDoc(eventRef);

  const generateTicketId = () => {
    const prefixes = ["ML", "MW", "MA"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 3; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${randomPart}`;
  };

  useEffect(() => {
    setTicketId(generateTicketId());
    if (event && event.categories && event.categories.length > 0 && !category) {
      setCategory(event.categories[0]);
    }
  }, [event]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `Habari ${guestName || "Mgeni Rasmi"}! Unakaribishwa kwa furaha kwenye ${event?.nameEn}. Ukumbi: ${event?.venue}. Tarehe: ${event?.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}. \n\nTafadhali tumia namba yako ya tiketi kwa uhakiki: ${ticketId}\n\nAu fungua picha ya QR hapa kwa kuingia langoni. Karibu sana!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareSMS = () => {
    const text = `Habari ${guestName || "Mgeni Rasmi"}! Karibu ${event?.nameEn} kule ${event?.venue}. Namba ya Tiketi yako ni ${ticketId}. Usipoteze ujumbe huu.`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
  };

  const qrData = JSON.stringify({
    ticketId: ticketId,
    eventId: id,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 print:hidden gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/20 rounded-xl">
                <QrCode className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="font-headline text-3xl font-bold">Invitation Center</h1>
                <p className="text-muted-foreground">{event?.nameEn} - Secure Registry</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleShareWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
              <Button onClick={handleShareSMS} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="mr-2 h-4 w-4" /> SMS
              </Button>
              <Button onClick={handlePrint} className="bg-primary text-primary-foreground">
                <Printer className="mr-2 h-4 w-4" /> Print Invitation
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6 print:hidden">
              <Card className="border-none shadow-xl bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Guest Entry</CardTitle>
                  <CardDescription>Details for digital and physical registry.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Guest Name</Label>
                    <Input 
                      value={guestName} 
                      onChange={(e) => setGuestName(e.target.value)} 
                      placeholder="e.g. Hon. John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ticket ID</Label>
                    <div className="flex gap-2">
                      <Input value={ticketId} readOnly className="bg-muted font-mono" />
                      <Button variant="outline" onClick={() => setTicketId(generateTicketId())}>
                        Regen
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Guest Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {event?.categories?.map((cat: string) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-accent/5 border-accent/20">
                 <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                       <ShieldCheck className="h-6 w-6 text-accent shrink-0 mt-1" />
                       <div>
                          <p className="font-bold text-sm">3-Point Scan Policy</p>
                          <p className="text-xs text-muted-foreground">Each guest is tracked at Gate, Drinks, and Food. Access is restricted per category.</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <div 
                ref={invitationRef}
                className="w-full max-w-md bg-white border shadow-2xl rounded-none p-12 text-center space-y-8 flex flex-col items-center justify-center min-h-[600px] border-black/10"
              >
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Official Invitation</span>
                  <h2 className="font-headline text-4xl font-bold text-primary">{event?.nameEn || "Luxury Event"}</h2>
                </div>

                <div className="w-full h-px bg-accent/30 mx-auto max-w-[100px]"></div>

                <div className="space-y-4">
                  <p className="text-sm font-light text-muted-foreground italic">Karibu sana,</p>
                  <h3 className="text-2xl font-semibold border-b border-black/5 pb-2 inline-block">
                    {guestName || "Mgeni Rasmi"}
                  </h3>
                  <div className="mt-2">
                     <span className="px-4 py-1 bg-accent/10 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-accent/20">
                        {category || "CATEGORY"}
                     </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full text-sm font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span>{event?.venue || "Serena Ballroom"}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <User className="h-4 w-4 text-accent" />
                    <span>{event?.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"}</span>
                  </div>
                </div>

                <div className="p-4 bg-white border-2 border-primary/10 rounded-xl shadow-lg">
                  {ticketId && (
                    <QRCodeSVG 
                      value={qrData} 
                      size={200} 
                      level={"H"}
                      includeMargin={true}
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t('ticketId')}</p>
                  <p className="text-xl font-mono font-bold text-primary tracking-wider">{ticketId || "GENERATING..."}</p>
                </div>

                <footer className="pt-8 border-t border-black/5 w-full">
                  <p className="text-[10px] uppercase tracking-widest opacity-50">Mwaliko Premium Registry &bull; Verified Registry</p>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .container { max-width: 100% !important; width: 100% !important; }
          .max-w-md { box-shadow: none !important; border: none !important; margin: 0 auto !important; }
        }
      `}</style>
    </div>
  );
}
