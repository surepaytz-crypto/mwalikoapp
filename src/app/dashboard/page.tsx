
"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, QrCode, Loader2, Plus, TrendingUp, GlassWater, Utensils, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc } from "firebase/firestore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();

  const eventsCollectionRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "events"), where("eventAdminId", "==", user.uid));
  }, [db, user]);
  
  const { data: events, loading } = useCollection(eventsCollectionRef);

  const handleCreateMockEvent = () => {
    if (!db || !user) return;
    addDoc(collection(db, "events"), {
      name: "Luxury Gala Night",
      nameEn: "Luxury Gala Night",
      nameSw: "Usiku wa Fahari",
      type: "Gala",
      startDate: new Date(Date.now() + 86400000 * 7).toISOString(), 
      venue: "Serena Hotel Ballroom",
      status: "Planning",
      guestCapacity: 500,
      vipGuestsCount: 150,
      standardGuestsCount: 350,
      scannedGate: 0,
      scannedDrinks: 0,
      scannedFood: 0,
      vipScannedGate: 0,
      vipScannedDrinks: 0,
      vipScannedFood: 0,
      standardScannedGate: 0,
      standardScannedDrinks: 0,
      standardScannedFood: 0,
      isActive: true,
      eventAdminId: user.uid,
    });
  };

  useEffect(() => {
    if (!authLoading && !user && db) {
      router.push("/login");
    }
  }, [user, authLoading, router, db]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;
  if (!user) return null;

  // Aggregate stats from all events (for demo purposes we'll use the first active event if it exists)
  const activeEvent = events && events.length > 0 ? events[0] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">{t('dashboard')}</h1>
            <p className="text-muted-foreground">Managing your premium event access</p>
          </div>
          <Button onClick={handleCreateMockEvent} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> {t('createEvent')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Calendar className="h-5 w-5" />} title={t('events')} value={events?.length.toString() || "0"} label="Active Projects" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} title="Entry Logic" value="3-Point" label="Gate, Drinks, Food" />
          <StatCard icon={<Users className="h-5 w-5" />} title="Total Registry" value={activeEvent ? activeEvent.guestCapacity?.toString() : "0"} label="VIP & Standard" />
          <StatCard icon={<QrCode className="h-5 w-5" />} title="Registry Verified" value={activeEvent ? `${Math.round((activeEvent.scannedGate / activeEvent.guestCapacity) * 100)}%` : "0%"} label="Check-in rate" />
        </div>

        <div className="mt-12 space-y-8">
          <h2 className="font-headline text-2xl font-bold">Category Analytics {activeEvent && ` - ${activeEvent.nameEn}`}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScanAnalyticsCard 
              icon={<DoorOpen className="h-5 w-5 text-accent" />} 
              title={t('checkpointGate')} 
              current={activeEvent?.scannedGate || 0} 
              total={activeEvent?.guestCapacity || 500}
              breakdown={[
                { name: t('categoryVIP'), val: `${activeEvent?.vipScannedGate || 0}/${activeEvent?.vipGuestsCount || 150}` },
                { name: t('categoryStandard'), val: `${activeEvent?.standardScannedGate || 0}/${activeEvent?.standardGuestsCount || 350}` }
              ]}
            />
            <ScanAnalyticsCard 
              icon={<GlassWater className="h-5 w-5 text-accent" />} 
              title={t('checkpointDrinks')} 
              current={activeEvent?.scannedDrinks || 0} 
              total={activeEvent?.guestCapacity || 500}
              breakdown={[
                { name: t('categoryVIP'), val: `${activeEvent?.vipScannedDrinks || 0}/${activeEvent?.vipGuestsCount || 150}` },
                { name: t('categoryStandard'), val: `${activeEvent?.standardScannedDrinks || 0}/${activeEvent?.standardGuestsCount || 350}` }
              ]}
            />
            <ScanAnalyticsCard 
              icon={<Utensils className="h-5 w-5 text-accent" />} 
              title={t('checkpointFood')} 
              current={activeEvent?.scannedFood || 0} 
              total={activeEvent?.guestCapacity || 500}
              breakdown={[
                { name: t('categoryVIP'), val: `${activeEvent?.vipScannedFood || 0}/${activeEvent?.vipGuestsCount || 150}` },
                { name: t('categoryStandard'), val: `${activeEvent?.standardScannedFood || 0}/${activeEvent?.standardGuestsCount || 350}` }
              ]}
            />
          </div>

          <div className="mt-12">
            <h2 className="font-headline text-2xl font-bold mb-6">{t('events')}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {events?.map((event) => (
                <EventItem 
                  key={event.id}
                  id={event.id}
                  name={event.nameEn || event.name || "Untitled"}
                  date={event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"}
                  guests={event.guestCapacity?.toString() || "0"}
                  status={event.status || "Planning"}
                />
              ))}
              {!loading && events?.length === 0 && (
                <p className="text-muted-foreground col-span-2 text-center py-10 bg-muted/20 rounded-xl border-2 border-dashed">
                  {t('noEvents')}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScanAnalyticsCard({ icon, title, current, total, breakdown }: { icon: React.ReactNode, title: string, current: number, total: number, breakdown: {name: string, val: string}[] }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <div className="p-2 bg-accent/10 rounded-lg">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-bold">{current} / {total} Total</span>
          <span className="text-accent font-bold">{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          {breakdown.map((item, idx) => (
            <div key={idx} className="bg-muted/50 p-2 rounded-lg text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{item.name}</p>
              <p className="text-xs font-bold">{item.val}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-3 w-3" /> {date} &bull; <Users className="h-3 w-3" /> {guests} Max
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest">{status}</div>
        <div className="flex gap-2">
          <Link href={`/events/${id}/scan`}><Button variant="outline" size="sm" className="text-xs"><QrCode className="mr-1 h-3 w-3" /> Scan</Button></Link>
          <Link href={`/events/${id}/invite`}><Button variant="ghost" size="sm" className="text-xs text-accent">Invite</Button></Link>
        </div>
      </div>
    </div>
  );
}
