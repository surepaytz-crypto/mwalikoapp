"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { QrCode, User, MapPin, Printer, MessageSquare, ShieldCheck, Loader2, Image as ImageIcon, Sparkles, Check, Save, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useParams } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { aiWhatsappInvitationGenerator } from "@/ai/flows/ai-whatsapp-invitation-generator";

type TemplateId = "royal-gold" | "modern-minimal" | "garden-floral" | "arch-romantic" | "send-off" | "mchango" | "white-gold" | "soft-blush" | "heritage" | "minimal-formal";

interface TemplateDefinition {
  id: TemplateId;
  name: string;
  hasPhoto: boolean;
  style: string;
  description: string;
}

const TEMPLATES: TemplateDefinition[] = [
  { id: "royal-gold", name: "Royal Gold (Photo)", hasPhoto: true, style: "bg-zinc-900 text-amber-200 border-amber-500/30", description: "Luxurious deep charcoal with gold accents and patterns." },
  { id: "modern-minimal", name: "Modern Minimal (Photo)", hasPhoto: true, style: "bg-white text-zinc-900 border-zinc-200", description: "Clean, high-contrast typography on a white background." },
  { id: "garden-floral", name: "Garden Floral (Photo)", hasPhoto: true, style: "bg-rose-50 text-rose-900 border-rose-200", description: "Soft rose tones with elegant floral illustrations." },
  { id: "arch-romantic", name: "Arch Romantic (Photo)", hasPhoto: true, style: "bg-stone-100 text-stone-800 border-stone-200", description: "Minimalist stone textures with romantic arch frames." },
  { id: "send-off", name: "Send-off Floral", hasPhoto: false, style: "bg-emerald-50 text-emerald-900 border-emerald-200", description: "Lush greenery and emerald accents for celebratory send-offs." },
  { id: "mchango", name: "Mchango Logic", hasPhoto: false, style: "bg-blue-50 text-blue-900 border-blue-200", description: "Professional blue design focused on community and support." },
  { id: "white-gold", name: "White & Gold Modern", hasPhoto: false, style: "bg-white text-zinc-800 border-amber-500", description: "Pristine white with metallic gold highlights." },
  { id: "soft-blush", name: "Soft Blush Premium", hasPhoto: false, style: "bg-pink-50 text-pink-900 border-pink-200", description: "Delicate pink palette for intimate celebrations." },
  { id: "heritage", name: "Heritage Elegant", hasPhoto: false, style: "bg-orange-50 text-orange-950 border-orange-200", description: "Warm orange tones with traditional heritage patterns." },
  { id: "minimal-formal", name: "Minimal Formal", hasPhoto: false, style: "bg-zinc-50 text-zinc-900 border-zinc-300", description: "Sophisticated grey and black for formal receptions." },
];

export default function InvitePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const db = useFirestore();
  const { toast } = useToast();
  
  // Registry State
  const [guestName, setGuestName] = useState("");
  const [category, setCategory] = useState("");
  const [ticketId, setTicketId] = useState(""); 
  
  // Invitation Editor State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("royal-gold");
  const [inviteTitle, setInviteTitle] = useState("Official Invitation");
  const [hostText, setHostText] = useState("Together with their families");
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [rsvpText, setRsvpText] = useState("Kindly RSVP by October 1st");
  const [dressCode, setDressCode] = useState("Elegant & Formal");
  const [footerText, setFooterText] = useState("Mwaliko Premium Registry • Verified");
  const [showPhoto, setShowPhoto] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const invitationRef = useRef<HTMLDivElement>(null);

  const eventRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "events", id as string);
  }, [db, id]);

  const { data: event, isLoading } = useDoc(eventRef);

  const generateTicketId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomPart;
  };

  useEffect(() => {
    setTicketId(generateTicketId());
  }, []);

  useEffect(() => {
    if (event) {
      if (event.categories?.length > 0 && !category) setCategory(event.categories[0]);
      
      const settings = event.invitationSettings;
      if (settings) {
        if (settings.templateId) setSelectedTemplate(settings.templateId as TemplateId);
        if (settings.title) setInviteTitle(settings.title);
        if (settings.hostText) setHostText(settings.hostText);
        if (settings.brideName) setBrideName(settings.brideName);
        if (settings.groomName) setGroomName(settings.groomName);
        if (settings.rsvpText) setRsvpText(settings.rsvpText);
        if (settings.dressCode) setDressCode(settings.dressCode);
        if (settings.footerText) setFooterText(settings.footerText);
        if (settings.showPhoto !== undefined) setShowPhoto(settings.showPhoto);
      } else {
        const names = event.nameEn?.split("&").map(n => n.trim()) || [];
        if (names.length >= 2) {
          setBrideName(names[0]);
          setGroomName(names[1]);
        }
      }
    }
  }, [event]);

  const handleSaveSettings = async () => {
    if (!db || !id) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "events", id as string), {
        invitationSettings: {
          templateId: selectedTemplate,
          title: inviteTitle,
          hostText,
          brideName,
          groomName,
          rsvpText,
          dressCode,
          footerText,
          showPhoto
        }
      });
      toast({ title: "Settings Saved", description: "Invitation template and content updated successfully." });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    const name = guestName || "Mgeni Rasmi";
    const eventName = event?.nameEn || "tukio letu";
    const cat = category || "STANDARD";
    
    const whatsappMessage = `Habari ${name}, Karibu kwenye ${eventName}\n\nTICKET ID: ${ticketId}\nCATEGORY: ${cat}\n\nAsante na karibu sana.\n\nCard Powered by 360 Digital. TEL: 0614 320 858`;
    
    try {
      // 1. Get QR code as data URI
      const qrCanvas = qrCanvasRef.current;
      if (!qrCanvas) throw new Error("QR Canvas not found");
      const qrDataUri = qrCanvas.toDataURL("image/png");

      // 2. Call AI Flow to generate high-end invitation image
      const template = TEMPLATES.find(t => t.id === selectedTemplate);
      const aiResponse = await aiWhatsappInvitationGenerator({
        eventName: event?.nameEn || "Event",
        eventType: event?.nameEn.includes("Harusi") ? "Wedding" : "Event",
        eventDate: event?.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD",
        eventTime: "7:00 PM",
        eventVenue: event?.venue || "Venue TBD",
        guestName: name,
        desiredTone: "luxurious",
        brandingDescription: template?.description || "Elegant and premium",
        thematicElements: template?.name || "Premium celebration",
        qrCodeImage: qrDataUri
      });

      // 3. Share via Web Share API (if supported) to include image
      const response = await fetch(aiResponse.invitationCardImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `invitation-${ticketId}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invitation for ${name}`,
          text: whatsappMessage,
        });
      } else {
        // Fallback for desktop: Open WhatsApp with text and trigger image download
        const link = document.createElement('a');
        link.href = aiResponse.invitationCardImageUrl;
        link.download = `Invitation_${name.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
        toast({ title: "Sharing Support", description: "Card downloaded. Send the image manually to WhatsApp." });
      }
    } catch (e: any) {
      console.error(e);
      const isQuotaError = e.message?.includes('AI service is currently busy') || e.message?.includes('429');
      toast({ 
        variant: "destructive", 
        title: isQuotaError ? "Service Busy" : "Share Failed", 
        description: isQuotaError 
          ? e.message 
          : "Could not generate invitation image. Please check your connection." 
      });
    } finally {
      setIsSharing(false);
    }
  };

  const qrData = JSON.stringify({ ticketId, eventId: id });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;

  const currentTemplateDef = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 print:hidden gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/20 rounded-xl">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="font-headline text-3xl font-bold">Invitation Center</h1>
                <p className="text-muted-foreground">{event?.nameEn} &bull; Live Designer</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-primary text-primary-foreground">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save Design
              </Button>
              <Button onClick={handleShareWhatsApp} disabled={isSharing} className="bg-green-600 hover:bg-green-700 text-white">
                {isSharing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <MessageSquare className="mr-2 h-4 w-4" />} WhatsApp
              </Button>
              <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6 print:hidden">
              <Tabs defaultValue="template" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="template">Template</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="guest">Guest</TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="pt-4 space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => setSelectedTemplate(tmpl.id)}
                        className={cn(
                          "relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg",
                          selectedTemplate === tmpl.id 
                            ? "border-accent bg-accent/5 ring-2 ring-accent/20" 
                            : "border-muted bg-card grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                        )}
                      >
                        <div className={cn("h-2 w-10 rounded-full mb-3", tmpl.style.split(' ')[0])}></div>
                        <p className="font-bold text-xs uppercase tracking-tight">{tmpl.name}</p>
                        {selectedTemplate === tmpl.id && (
                          <div className="absolute top-2 right-2 p-1 bg-accent rounded-full">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {currentTemplateDef.hasPhoto && (
                    <Card className="border-accent/20 bg-accent/5">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-5 w-5 text-accent" />
                          <div className="text-sm">
                            <p className="font-bold">Photo Support</p>
                            <p className="text-xs text-muted-foreground">Toggle event poster visibility</p>
                          </div>
                        </div>
                        <Switch checked={showPhoto} onCheckedChange={setShowPhoto} />
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="content" className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Invitation Title</Label>
                    <Input value={inviteTitle} onChange={(e) => setInviteTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Host Text</Label>
                    <Input value={hostText} onChange={(e) => setHostText(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bride Name</Label>
                      <Input value={brideName} onChange={(e) => setBrideName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Groom Name</Label>
                      <Input value={groomName} onChange={(e) => setGroomName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>RSVP Text</Label>
                    <Input value={rsvpText} onChange={(e) => setRsvpText(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dress Code / Theme</Label>
                    <Input value={dressCode} onChange={(e) => setDressCode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Footer Branding</Label>
                    <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} />
                  </div>
                </TabsContent>

                <TabsContent value="guest" className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Live Guest Preview</Label>
                    <Input 
                      value={guestName} 
                      onChange={(e) => setGuestName(e.target.value)} 
                      placeholder="Type guest name to preview..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
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
                  <div className="space-y-2">
                    <Label>Ticket ID</Label>
                    <div className="flex gap-2">
                      <Input value={ticketId} readOnly className="bg-muted font-mono" />
                      <Button variant="outline" size="sm" onClick={() => setTicketId(generateTicketId())}>Regen</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Card className="border-none bg-muted/30">
                <CardContent className="p-4 flex items-start gap-4">
                  <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-1" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Secure Registry Binding:</strong> QR codes and Ticket IDs are dynamically generated and linked to your 3-point scanning database. Changes here reflect in real-time.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 flex justify-center sticky top-24 h-fit">
              <div 
                ref={invitationRef}
                className={cn(
                  "w-full max-w-[420px] aspect-[9/16] shadow-2xl overflow-hidden relative flex flex-col items-center p-8 text-center",
                  currentTemplateDef.style
                )}
              >
                {selectedTemplate === 'heritage' && (
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900 to-transparent"></div>
                )}
                {selectedTemplate === 'garden-floral' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/40 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                )}

                <div className="z-10 w-full space-y-6 flex flex-col h-full">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">{inviteTitle}</span>
                    <p className="text-xs italic opacity-80">{hostText}</p>
                  </div>

                  <div className="py-4">
                    <h2 className="font-headline text-5xl font-bold leading-tight">
                      {brideName || "Bride"} <br/>
                      <span className="text-2xl font-light italic text-accent">&</span> <br/>
                      {groomName || "Groom"}
                    </h2>
                  </div>

                  {currentTemplateDef.hasPhoto && showPhoto && (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl border-4 border-white/10 group">
                      <Image 
                        src={event?.posterUrl || "https://picsum.photos/seed/wedding/800/450"} 
                        alt="Event"
                        fill
                        className="object-cover"
                        data-ai-hint="wedding event"
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div className="space-y-2">
                      <p className="text-xs font-light italic opacity-60">You are cordially invited,</p>
                      <h3 className="text-2xl font-semibold px-4 border-b border-accent/20 pb-1 inline-block">
                        {guestName || "Guest Name"}
                      </h3>
                      <div className="pt-2">
                         <span className="px-3 py-1 bg-accent/10 rounded-full text-[9px] font-bold uppercase tracking-widest border border-accent/20">
                            {category || "STANDARD"}
                         </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-medium border-y border-accent/10 py-4">
                      <div className="flex flex-col items-center gap-1 border-r border-accent/10">
                        <MapPin className="h-3 w-3 opacity-60" />
                        <span className="truncate w-full">{event?.venue || "Venue TBD"}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <User className="h-3 w-3 opacity-60" />
                        <span>{event?.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"}</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="p-3 bg-white rounded-xl shadow-inner border border-zinc-100">
                        <QRCodeCanvas 
                          ref={qrCanvasRef}
                          value={qrData} 
                          size={140} 
                          level={"H"}
                          includeMargin={false}
                          fgColor={selectedTemplate === 'royal-gold' ? '#D4AF37' : '#000000'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">Security Access ID</p>
                      <p className="text-lg font-mono font-bold tracking-[0.2em]">{ticketId}</p>
                    </div>
                    
                    <div className="space-y-1 border-t border-accent/10 pt-4">
                       <p className="text-[9px] opacity-60">{rsvpText}</p>
                       <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">{footerText}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .container { max-width: 100% !important; width: 100% !important; padding: 0 !important; }
          .max-w-[420px] { box-shadow: none !important; border: 1px solid #eee !important; margin: 0 auto !important; height: 100vh !important; }
        }
      `}</style>
    </div>
  );
}
