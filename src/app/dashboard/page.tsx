"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">{t('dashboard')}</h1>
            <p className="text-muted-foreground">{t('welcome')}, Admin</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            {t('createEvent')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Calendar className="h-5 w-5" />} title={t('events')} value="12" label="Active this month" />
          <StatCard icon={<Users className="h-5 w-5" />} title={t('totalGuests')} value="1,248" label="+12% from last week" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} title={t('rsvpStatus')} value="842" label="Confirmed attendance" />
          <StatCard icon={<QrCode className="h-5 w-5" />} title={t('scanned')} value="312" label="Validated today" />
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-2xl font-bold">{t('events')}</h2>
            <Button variant="outline" size="sm">{t('actions')}</Button>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <EventItem 
              id="royal-gala-2024"
              name="Royal Gala Dinner 2024"
              date="Nov 24, 2024"
              guests="450"
              status="Ongoing"
            />
            <EventItem 
              id="tech-summit-2024"
              name="Modern Tech Summit"
              date="Dec 02, 2024"
              guests="800"
              status="Planning"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, label }: { icon: React.ReactNode, title: string, value: string, label: string }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-accent">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function EventItem({ id, name, date, guests, status }: { id: string, name: string, date: string, guests: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all">
      <div className="space-y-1">
        <h3 className="font-bold text-lg">{name}</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground font-light">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {date}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {guests} Guests</span>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-2">
        <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest mb-2">
          {status}
        </div>
        <div className="flex gap-2">
          <Link href={`/events/${id}/scan`}>
            <Button variant="outline" size="sm" className="text-xs font-bold uppercase tracking-wider">
              <QrCode className="mr-1 h-3 w-3" /> Scan
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wider text-accent">Manage</Button>
        </div>
      </div>
    </div>
  );
}