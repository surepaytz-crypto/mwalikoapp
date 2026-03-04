
"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, QrCode, Loader2, Plus, TrendingUp, GlassWater, Utensils, DoorOpen, Settings, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [newCategory, setNewCategory] = useState("");

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "events"), where("eventAdminId", "==", user.uid));
  }, [db, user]);
  
  const { data: events, isLoading } = useCollection(eventsQuery);

  const handleCreateMockEvent = () => {
    if (!db || !user) return;
    addDoc(collection(db, "events"), {
      nameEn: "Luxury Gala Night",
      nameSw: "Usiku wa Fahari",
      type: "Gala",
      startDate: new Date(Date.now() + 86400000 * 7).toISOString(), 
      venue: "Serena Hotel Ballroom",
      status: "Planning",
      guestCapacity: 500,
      categories: ["VIP", "Standard", "VVIP", "Press", "Staff"],
      isActive: true,
      eventAdminId: user.uid,
      stats: {
        "VIP": { gate: 0, drinks: 0, food: 0, total: 150 },
        "Standard": { gate: 0, drinks: 0, food: 0, total: 350 },
        "VVIP": { gate: 0, drinks: 0, food: 0, total: 20 },
        "Press": { gate: 0, drinks: 0, food: 0, total: 30 },
        "Staff": { gate: 0, drinks: 0, food: 0, total: 50 },
      }
    });
  };

  const handleAddCategory = (eventId: string) => {
    if (!db || !newCategory.trim()) return;
    const eventRef = doc(db, "events", eventId);
    updateDoc(eventRef, {
      categories: arrayUnion(newCategory.trim())
    });
    setNewCategory("");
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;
  if (!user) return null;

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
          <div className="flex gap-2">
            {activeEvent && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-accent text-accent">
                    <Tag className="mr-2 h-4 w-4" /> {t('manageCategories')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('manageCategories')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {activeEvent.categories?.map((cat: string) => (
                        <div key={cat} className="px-3 py-1 bg-accent/10 rounded-full text-xs font-bold border border-accent/20">
                          {cat}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder={t('categoryName')} 
                        value={newCategory} 
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                      <Button onClick={() => handleAddCategory(activeEvent.id)}>{t('addCategory')}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button onClick={handleCreateMockEvent} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> {t('createEvent')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Calendar className="h-5 w-5" />} title={t('events')} value={events?.length.toString() || "0"} label="Active Projects" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} title="Entry Logic" value="3-Point" label="Gate, Drinks, Food" />
          <StatCard icon={<Users className="h-5 w-5" />} title="Total Registry" value={activeEvent ? activeEvent.guestCapacity?.toString() : "0"} label="Dynamic Categories" />
          <StatCard icon={<QrCode className="h-5 w-5" />} title="Registry Verified" value={activeEvent ? `${activeEvent.categories?.length || 0} Types` : "0 Types"} label="Unique Tiers" />
        </div>

        {activeEvent && (
          <div className="mt-12 space-y-8">
            <h2 className="font-headline text-2xl font-bold">Category Analytics - {activeEvent.nameEn}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ScanAnalyticsCard 
                icon={<DoorOpen className="h-5 w-5 text-accent" />} 
                title={t('checkpointGate')} 
                event={activeEvent}
                checkpoint="gate"
              />
              <ScanAnalyticsCard 
                icon={<GlassWater className="h-5 w-5 text-accent" />} 
                title={t('checkpointDrinks')} 
                event={activeEvent}
                checkpoint="drinks"
              />
              <ScanAnalyticsCard 
                icon={<Utensils className="h-5 w-5 text-accent" />} 
                title={t('checkpointFood')} 
                event={activeEvent}
                checkpoint="food"
              />
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="font-headline text-2xl font-bold mb-6">{t('events')}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {events?.map((event) => (
              <EventItem 
                key={event.id}
                id={event.id}
                name={event.nameEn || "Untitled"}
                date={event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"}
                guests={event.guestCapacity?.toString() || "0"}
                status={event.status || "Planning"}
              />
            ))}
            {!isLoading && events?.length === 0 && (
              <p className="text-muted-foreground col-span-2 text-center py-10 bg-muted/20 rounded-xl border-2 border-dashed">
                {t('noEvents')}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ScanAnalyticsCard({ icon, title, event, checkpoint }: { icon: React.ReactNode, title: string, event: any, checkpoint: string }) {
  // Mock aggregation for UI demonstration
  const categories = event.categories || ["VIP", "Standard"];
  const totalScanned = categories.reduce((acc: number, cat: string) => acc + (event.stats?.[cat]?.[checkpoint] || 0), 0);
  const totalPossible = event.guestCapacity || 100;
  const percentage = totalPossible > 0 ? (totalScanned / totalPossible) * 100 : 0;

  return (
    <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <div className="p-2 bg-accent/10 rounded-lg">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-bold">{totalScanned} / {totalPossible} Scanned</span>
          <span className="text-accent font-bold">{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="grid grid-cols-2 gap-2 pt-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {categories.map((cat: string) => (
            <div key={cat} className="bg-muted/50 p-2 rounded-lg text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{cat}</p>
              <p className="text-xs font-bold">{event.stats?.[cat]?.[checkpoint] || 0} / {event.stats?.[cat]?.total || "?"}</p>
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
