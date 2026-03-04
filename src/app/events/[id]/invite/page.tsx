
"use client";

import { useState, useRef } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, QrCode, User, MapPin, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function InvitePage() {
  const { t } = useTranslation();
  const [guestName, setGuestName] = useState("");
  const [eventName, setEventName] = useState("Luxury Gala Night");
  const [venue, setVenue] = useState("Serena Hotel Ballroom");
  const [date, setDate] = useState("2024-12-15");
  const invitationRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    // Simple implementation: use window.print() or a more sophisticated PDF generator
    // For this MVP, we'll provide a print-friendly view
    window.print();
  };

  const qrData = JSON.stringify({
    guest: guestName || "Guest",
    event: eventName,
    id: Math.random().toString(36).substring(7)
  });

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/20 rounded-xl">
                <QrCode className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="font-headline text-3xl font-bold">Invitation Generator</h1>
                <p className="text-muted-foreground">Create and print secure guest invitations</p>
              </div>
            </div>
            <Button onClick={handleDownload} className="bg-accent text-accent-foreground">
              <Printer className="mr-2 h-4 w-4" /> Print Invitation
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur print:hidden">
              <CardHeader>
                <CardTitle>Invitation Details</CardTitle>
                <CardDescription>Enter guest details to generate a unique invitation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Guest Name</Label>
                  <Input 
                    value={guestName} 
                    onChange={(e) => setGuestName(e.target.value)} 
                    placeholder="e.g. Honorable John Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input 
                    value={eventName} 
                    onChange={(e) => setEventName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input 
                    value={venue} 
                    onChange={(e) => setVenue(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date"
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invitation Preview Section */}
            <div className="flex justify-center">
              <div 
                ref={invitationRef}
                className="w-full max-w-md bg-white border shadow-2xl rounded-none p-12 text-center space-y-8 flex flex-col items-center justify-center min-h-[600px] border-black/10"
              >
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Official Invitation</span>
                  <h2 className="font-headline text-4xl font-bold text-primary">{eventName}</h2>
                </div>

                <div className="w-full h-px bg-accent/30 mx-auto max-w-[100px]"></div>

                <div className="space-y-4">
                  <p className="text-sm font-light text-muted-foreground italic">You are cordially invited,</p>
                  <h3 className="text-2xl font-semibold border-b border-black/5 pb-2 inline-block">
                    {guestName || "Guest Name"}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full text-sm font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span>{venue}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <User className="h-4 w-4 text-accent" />
                    <span>{date}</span>
                  </div>
                </div>

                <div className="p-4 bg-white border-2 border-primary/10 rounded-xl">
                  <QRCodeSVG 
                    value={qrData} 
                    size={180} 
                    level={"H"}
                    includeMargin={true}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Unique Access Code</p>
                  <p className="text-xs font-mono opacity-60">MW-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                </div>

                <footer className="pt-8 border-t border-black/5 w-full">
                  <p className="text-[10px] uppercase tracking-widest opacity-50">Mwaliko Premium Registry &bull; Verified Entry</p>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0;
            margin: 0;
          }
          .container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
          }
          main {
            padding: 0 !important;
          }
          .lg\\:grid-cols-2 {
            display: block !important;
          }
          .max-w-md {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
