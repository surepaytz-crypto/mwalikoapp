
"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calendar, Users, QrCode, ShieldCheck, GlassWater, Utensils, DoorOpen } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section with Video */}
        <section className="relative h-[85vh] w-full overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover brightness-50"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-people-walking-in-a-busy-street-4428-large.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="container px-4 text-center text-white">
              <h1 className="mb-6 font-headline text-5xl font-bold tracking-tight md:text-7xl">
                {t('tagline')}
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg font-light md:text-xl text-white/80">
                {t('luxuryDescription')}
              </p>
              <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-10 text-lg bg-accent text-accent-foreground hover:bg-accent/90 border-none shadow-xl font-bold">
                    {t('createEvent')}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" className="h-14 px-10 text-lg bg-accent text-accent-foreground hover:bg-accent/90 border-none shadow-xl font-bold">
                    {t('login')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-headline text-4xl font-bold text-primary">Premium Event Management</h2>
              <div className="mx-auto h-1 w-20 bg-accent"></div>
            </div>

            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              <FeatureCard 
                icon={<Calendar className="h-8 w-8 text-accent" />}
                title={t('events')}
                description="Manage multiple entry phases and venues with refined ease."
              />
              <FeatureCard 
                icon={<ShieldCheck className="h-8 w-8 text-accent" />}
                title="3-Point Scanning"
                description="Secure your event with specific check-ins for the Gate, Drinks, and Food areas."
              />
              <FeatureCard 
                icon={<QrCode className="h-8 w-8 text-accent" />}
                title="Print-Ready Invites"
                description="Generate high-resolution invitations with unique QR codes for physical printing."
              />
            </div>
          </div>
        </section>

        {/* 3-Point Logic Highlight */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6">Uncompromising Security Control</h2>
            <p className="text-lg text-primary-foreground/70 font-light leading-relaxed mb-10">
              Our 3-point scan logic ensures every phase of your event is tracked. Monitor guest access from the initial entry to refreshment collection.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                <DoorOpen className="h-8 w-8 text-accent mx-auto mb-4" />
                <div className="text-accent font-bold text-xl mb-2">1. Gate</div>
                <p className="text-sm opacity-60">Initial guest verification</p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                <GlassWater className="h-8 w-8 text-accent mx-auto mb-4" />
                <div className="text-accent font-bold text-xl mb-2">2. Drinks</div>
                <p className="text-sm opacity-60">Refreshment access control</p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                <Utensils className="h-8 w-8 text-accent mx-auto mb-4" />
                <div className="text-accent font-bold text-xl mb-2">3. Food</div>
                <p className="text-sm opacity-60">Catering verification</p>
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
