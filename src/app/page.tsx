"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set target date to 7 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    const targetTime = targetDate.getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center relative overflow-hidden font-body text-primary-foreground p-6">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <Image 
          src="https://picsum.photos/seed/mwaliko-launch/1920/1080"
          alt="Luxury Backdrop"
          fill
          priority
          className="object-cover"
          data-ai-hint="luxury event"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/80 to-primary"></div>
      </div>

      <div className="z-10 w-full max-w-4xl text-center space-y-12">
        {/* Brand Identity */}
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000 flex flex-col items-center">
          <Logo size="xl" variant="gold" className="mb-6 shadow-[0_0_40px_rgba(212,175,55,0.3)]" />
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter">
            Mwaliko App<span className="text-accent">.</span>
          </h1>
          <p className="text-accent font-bold uppercase tracking-[0.4em] text-sm md:text-base">
            Elegance is Arriving
          </p>
        </div>

        {/* Countdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-2xl mx-auto">
          <TimeBlock value={timeLeft.days} label="Days" />
          <TimeBlock value={timeLeft.hours} label="Hours" />
          <TimeBlock value={timeLeft.minutes} label="Minutes" />
          <TimeBlock value={timeLeft.seconds} label="Seconds" />
        </div>

        {/* Mission Statement */}
        <div className="max-w-xl mx-auto space-y-6">
          <p className="text-lg md:text-xl font-light leading-relaxed opacity-80">
            We are refining the ultimate registry and security experience for distinguished celebrations. Hosted by <strong>360 Digital</strong>.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
             <div className="relative flex-1 w-full">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                <Input 
                  placeholder="Enter your email for early access" 
                  className="h-14 pl-12 bg-white/5 border-white/20 text-white placeholder:text-white/30 rounded-xl"
                />
             </div>
             <Button className="h-14 px-8 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent/90 shadow-xl w-full sm:w-auto">
                Notify Me <ArrowRight className="ml-2 h-4 w-4" />
             </Button>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="pt-20 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4 text-accent" /> Secure Invitation System
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs font-bold uppercase tracking-tighter">Chacha Steven</p>
            <p className="text-[10px] uppercase tracking-widest">Founder, 360 Digital</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center shadow-2xl transition-transform hover:scale-105 duration-300">
      <span className="text-4xl md:text-6xl font-black font-mono text-white mb-2 tracking-tighter">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-accent opacity-80">
        {label}
      </span>
    </div>
  );
}
