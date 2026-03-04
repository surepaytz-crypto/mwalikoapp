"use client";

import { useState } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Send, Loader2, Image as ImageIcon } from "lucide-react";
import { aiWhatsappInvitationGenerator } from "@/ai/flows/ai-whatsapp-invitation-generator";

export default function InvitePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{message: string, image: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      // Mocked QR code for demonstration since flow requires it
      const mockQr = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      
      const output = await aiWhatsappInvitationGenerator({
        eventName: formData.get('eventName') as string,
        eventType: formData.get('eventType') as string,
        eventDate: formData.get('eventDate') as string,
        eventTime: formData.get('eventTime') as string,
        eventVenue: formData.get('eventVenue') as string,
        guestName: formData.get('guestName') as string,
        desiredTone: formData.get('tone') as string,
        brandingDescription: "Elegant charcoal and gold theme with serif fonts.",
        thematicElements: formData.get('theme') as string,
        qrCodeImage: mockQr,
      });

      setResult({
        message: output.whatsappMessage,
        image: output.invitationCardImageUrl,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-accent/20 rounded-xl">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="font-headline text-3xl font-bold">{t('generateInvite')}</h1>
              <p className="text-muted-foreground">AI-crafted luxury for your distinguished guests</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Invite Details</CardTitle>
                <CardDescription>Enter the specifics for the AI to personalize the invitation.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Guest Name</Label>
                      <Input name="guestName" placeholder="e.g. Mr. & Mrs. Smith" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <select name="tone" className="w-full h-10 px-3 rounded-md border bg-background text-sm">
                        <option value="luxurious">Luxurious</option>
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="playful">Playful</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Event Details</Label>
                    <Input name="eventName" placeholder="Event Name" required />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Input name="eventType" placeholder="Type (e.g. Gala)" />
                      <Input name="eventDate" placeholder="Date" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Input name="eventTime" placeholder="Time" />
                      <Input name="eventVenue" placeholder="Venue" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Thematic Elements</Label>
                    <Textarea name="theme" placeholder="e.g. Midnight garden with gold floral arrangements" rows={3} />
                  </div>

                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {loading ? "Designing..." : "Generate Invitation"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-8">
              {result ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="border-accent/30 shadow-2xl overflow-hidden">
                    <div className="aspect-[4/5] relative bg-muted flex items-center justify-center">
                      <img src={result.image} alt="Generated Invite" className="object-contain w-full h-full" />
                    </div>
                  </Card>
                  
                  <Card className="border-none shadow-lg bg-accent/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-accent">WhatsApp Message</span>
                        <Button variant="ghost" size="sm" className="h-8 text-accent">Copy</Button>
                      </div>
                      <p className="text-sm font-light italic leading-relaxed whitespace-pre-wrap">
                        {result.message}
                      </p>
                      <Button className="w-full mt-6 bg-charcoal text-white hover:bg-charcoal/90">
                        <Send className="h-4 w-4 mr-2" /> Send to WhatsApp
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-full min-h-[400px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="font-light">Your generated invitation card will appear here after design processing.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}