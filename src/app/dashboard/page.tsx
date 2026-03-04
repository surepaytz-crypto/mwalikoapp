"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, QrCode, CheckCircle2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useMemo } from "react";

export default function Dashboard() {
  const { t } = useTranslation();
  const db = useFirestore();

  // Create a stable reference for the events collection
  const eventsCollectionRef = useMemo(() => (db ? collection(db, "events") : null), [db]);
  const { data: events, loading, error } = useCollection(eventsCollectionRef);

  const handleCreateMockEvent = () => {
    if (!db) return;
    addDoc(collection(db, "events"), {
      name: "New Luxury Gala",
      type: "Gala",
      date: new Date().toISOString().split('T')[0],
      venue: "The Grand Ballroom",
      status: "Planning",
      guestCount: 0,
      scannedCount: 0,
      createdAt: serverTimestamp(),
    });
  };

  const stats = useMemo(() => {
    if (!events) return { totalEvents: 0, totalGuests: 0, totalScanned: 0 };
    return events.reduce((acc, event) => ({
      totalEvents: acc.totalEvents + 1,
      totalGuests: acc.totalGuests + (event.guestCount || 0),
      totalScanned: acc.totalScanned + (event.scannedCount || 0),
    }), { totalEvents: 0, totalGuests: 0, totalScanned: 0 });
  }, [events]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">{t('dashboard')}</h1>
            <p className="text-muted-foreground">{t('welcome')}, Admin</p>
          </div>
          <Button 
            onClick={handleCreateMockEvent}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('createEvent')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Calendar className="h-5 w-5" />} title={t('events')} value={stats.totalEvents.toString()} label="Active events" />
          <StatCard icon={<Users className="h-5 w-5" />} title={t('totalGuests')} value={stats.totalGuests.toString()} label="Expected attendees" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} title={t('rsvpStatus')} value={stats.totalScanned.toString()} label="Total check-ins" />
          <StatCard icon={<QrCode className="h-5 w-5" />} title={t('scanned')} value={stats.totalScanned.toString()} label="Validated codes" />
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-2xl font-bold">{t('events')}</h2>
            <Button variant="outline" size="sm">{t('actions')}</Button>
          </div>
          
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
              Error loading events. Please check your permissions.
            </div>
          )}

          {!loading && !error && events?.length === 0 && (
            <div className="p-12 border-2 border-dashed rounded-2xl text-center text-muted-foreground">
              <p>{t('noEvents')}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {events?.map((event) => (
              <EventItem 
                key={event.id}
                id={event.id}
                name={event.name}
                date={event.date}
                guests={event.guestCount?.toString() || "0"}
                status={event.status}
              />
            ))}
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