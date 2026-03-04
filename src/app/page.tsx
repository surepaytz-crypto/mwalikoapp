"use client";

import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Calendar, Users, QrCode, Sparkles } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-lux');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[85vh] w-full overflow-hidden">
          <Image
            src={heroImage?.imageUrl || "https://picsum.photos/seed/mwaliko1/1200/800"}
            alt="Luxurious Event"
            fill
            className="object-cover brightness-50"
            priority
            data-ai-hint="luxury event"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="container px-4 text-center text-white">
              <h1 className="mb-6 font-headline text-5xl font-bold tracking-tight md:text-7xl">
                {t('tagline')}
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg font-light md:text-xl text-white/80">
                {t('luxuryDescription')}
              </p>
              <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button size="lg" className="h-14 px-10 text-lg bg-accent text-accent-foreground hover:bg-accent/90 border-none shadow-xl">
                  {t('createEvent')}
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white text-white hover:bg-white/10 backdrop-blur-md">
                  {t('login')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-headline text-4xl font-bold text-primary">Core Services</h2>
              <div className="mx-auto h-1 w-20 bg-accent"></div>
            </div>

            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              <FeatureCard 
                icon={<Calendar className="h-8 w-8 text-accent" />}
                title={t('events')}
                description="Manage multiple entry phases and venues with refined ease."
              />
              <FeatureCard 
                icon={<Users className="h-8 w-8 text-accent" />}
                title={t('guests')}
                description="Effortless guest listing and personalized categories for your elite attendees."
              />
              <FeatureCard 
                icon={<QrCode className="h-8 w-8 text-accent" />}
                title={t('scan')}
                description="Swift validation using our state-of-the-art QR verification system."
              />
            </div>
          </div>
        </section>

        {/* GenAI Highlight Section */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">AI Powered</span>
                </div>
                <h2 className="font-headline text-4xl md:text-5xl font-bold">Personalized Excellence</h2>
                <p className="text-lg text-primary-foreground/70 font-light leading-relaxed">
                  Our AI engine crafts unique invitation content and templates that match the prestige of your event. 
                  Send personalized WhatsApp messages and luxurious digital cards in seconds.
                </p>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Try AI Designer
                </Button>
              </div>
              <div className="flex-1 w-full max-w-lg aspect-video rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                    <QrCode className="h-8 w-8 text-accent" />
                  </div>
                  <p className="text-sm font-medium italic opacity-50">Secure QR Integration Preview</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Mwaliko App. {t('tagline')}
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group flex flex-col items-center text-center p-8 rounded-2xl border bg-card transition-all hover:shadow-xl hover:-translate-y-1">
      <div className="mb-6 p-4 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
        {icon}
      </div>
      <h3 className="mb-4 font-headline text-2xl font-bold text-primary">{title}</h3>
      <p className="text-muted-foreground font-light leading-relaxed">
        {description}
      </p>
    </div>
  );
}