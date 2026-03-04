"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, QrCode, CheckCircle2, Loader2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();

  // Create a stable reference for the events collection filtered by the user's ID
  // This is required to satisfy Firestore Security Rules for 'list' operations
  const eventsCollectionRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "events"), where("eventAdminId", "==", user.uid));
  }, [db, user]);
  
  const { data: events, loading, error } = useCollection(eventsCollectionRef);

  const handleCreateMockEvent = () => {
    if (!db || !user) return;
    
    // Using eventAdminId to match security rules and schema
    addDoc(collection(db, "events"), {
      name: "Luxury Gala Night",
      nameEn: "Luxury Gala Night",
      nameSw: "Usiku wa Fahari",
      type: "Gala",
      startDate: new Date(Date.now() + 86400000 * 7).toISOString(), 
      endDate: new Date(Date.now() + 86400000 * 7 + 3600000 * 4).toISOString(),
      venueId: "mock-venue-id",
      venue: "Serena Hotel Ballroom",
      status: "Planning",
      guestCapacity: 150,
      guestCount: 150,
      scannedCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      eventAdminId: user.uid,
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

  useEffect(() => {
    if (!authLoading && !user && db) {
      router.push("/login");
    }
  }, [user, authLoading, router, db]);

  if (!db) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Firebase Not Connected</AlertTitle>
            <AlertDescription>
              The dashboard requires a connected Firebase project to function.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">{t('dashboard')}</h1>
            <p className="text-muted-foreground">{t('welcome')}, {user.email?.split('@')[0]}</p>
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
              Error loading events. Please ensure you have permission to view this content.
            </div>
          )}

          {!loading && !error && events?.length === 0 && (
            <div className="p-12 border-2 border-dashed rounded-2xl text-center text-muted-foreground">
              <p>{t('noEvents')}</p>
              <Button variant="link" onClick={handleCreateMockEvent} className="text-accent mt-2">
                Create your first event now
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {events?.map((event) => (
              <EventItem 
                key={event.id}
                id={event.id}
                name={event.nameEn || event.name || "Untitled Event"}
                date={event.startDate ? new Date(event.startDate).toLocaleDateString() : (event.date || "TBD")}
                guests={event.guestCount?.toString() || "0"}
                status={event.status || "Planning"}
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
          <Link href={`/events/${id}/invite`}>
            <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wider text-accent">Invite</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
