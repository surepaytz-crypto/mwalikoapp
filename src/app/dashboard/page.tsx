"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, QrCode, Loader2, Plus, TrendingUp, GlassWater, Utensils, DoorOpen, Settings, Tag, UserPlus, Shield, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, doc, updateDoc, arrayUnion, writeBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [newCategory, setNewCategory] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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
      categories: ["VIP", "Standard", "VVIP"],
      isActive: true,
      eventAdminId: user.uid,
      stats: {}
    });
  };

  const handleCsvSimulation = async (eventId: string) => {
    if (!db) return;
    setIsUploading(true);
    
    // New CSV Format matching request: Ticket Number, Name, Category
    const mockData = [
      { ticketId: "ML-A12", name: "Hon. Kassim Majaliwa", category: "VIP" },
      { ticketId: "MW-0IQ", name: "John Doe", category: "Standard" },
      { ticketId: "MA-98M", name: "Jane Smith", category: "Standard" },
      { ticketId: "ML-K72", name: "Salum Khalfan", category: "VVIP" },
    ];

    try {
      const batch = writeBatch(db);
      mockData.forEach((item) => {
        const guestRef = doc(collection(db, "events", eventId, "guestEvents"));
        batch.set(guestRef, {
          guestName: item.name,
          ticketId: item.ticketId,
          category: item.category,
          eventId: eventId,
          scannedGate: false,
          scannedDrinks: false,
          scannedFood: false,
          qrCodeData: JSON.stringify({ eventId, ticketId: item.ticketId }),
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
      toast({ title: "Import Successful", description: `${mockData.length} guests imported with new ticket format (e.g., MW-0IQ).` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed", description: e.message });
    } finally {
      setIsUploading(false);
    }
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
            <p className="text-muted-foreground">Premium registry and real-time checkpoint analytics</p>
          </div>
          <div className="flex gap-2">
            {activeEvent && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-accent text-accent">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('importGuests')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('uploadCsv')}</DialogTitle>
                    <DialogDescription>Format required: Ticket Number, Name, Category</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg border-muted-foreground/20 bg-muted/5">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4 text-center px-4">Ensure CSV columns are exactly: Ticket Number, Name, Category</p>
                    <Button onClick={() => handleCsvSimulation(activeEvent.id)} disabled={isUploading}>
                      {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('processing')}</> : "Simulate CSV Import"}
                    </Button>
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
          <StatCard icon={<Calendar className="h-5 w-5" />} title={t('events')} value={events?.length.toString() || "0"} label="Total Events" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} title="Security Point" value="3-Point" label="Gate, Drinks, Food" />
          <StatCard icon={<Users className="h-5 w-5" />} title="Capacity" value={activeEvent ? activeEvent.guestCapacity?.toString() : "0"} label="Total Invitations" />
          <StatCard icon={<QrCode className="h-5 w-5" />} title="Tiers" value={activeEvent ? `${activeEvent.categories?.length || 0}` : "0"} label="Active Categories" />
        </div>

        {activeEvent && (
          <Tabs defaultValue="analytics" className="mt-12">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
              <TabsTrigger value="analytics">Live Category Stats</TabsTrigger>
              <TabsTrigger value="staff">Staff Access</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="space-y-8">
              <div className="flex items-center justify-between">
                 <h2 className="font-headline text-2xl font-bold">Registry Stats: {activeEvent.nameEn}</h2>
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-accent underline decoration-accent/30 underline-offset-4">
                        <Settings className="mr-2 h-4 w-4" /> {t('manageCategories')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                       <DialogHeader>
                         <DialogTitle>{t('manageCategories')}</DialogTitle>
                         <DialogDescription>Define all guest tiers for this event.</DialogDescription>
                       </DialogHeader>
                       <div className="space-y-4 py-4">
                          <div className="flex flex-wrap gap-2">
                             {activeEvent.categories?.map((c: string) => (
                               <div key={c} className="px-2 py-1 bg-accent/10 border border-accent/20 rounded text-xs font-bold text-accent">{c}</div>
                             ))}
                          </div>
                          <div className="flex gap-2">
                             <Input placeholder={t('categoryName')} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                             <Button onClick={() => handleAddCategory(activeEvent.id)}>{t('addCategory')}</Button>
                          </div>
                       </div>
                    </DialogContent>
                 </Dialog>
              </div>

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
            </TabsContent>

            <TabsContent value="staff">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-accent" />
                    Assign Scanning Staff
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Staff Email or User ID</Label>
                      <Input 
                        placeholder="scanner@mwaliko.com" 
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                      />
                    </div>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" /> Add Scanner
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-6 bg-muted/20 text-center">
                    <h4 className="text-sm font-bold mb-2">Authenticated Scanners</h4>
                    <p className="text-xs text-muted-foreground italic">List of staff members authorized to use the QR scanner for this event.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-12">
          <h2 className="font-headline text-2xl font-bold mb-6">Active Projects</h2>
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
              <div className="col-span-2 text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
                <p className="text-muted-foreground mb-4">{t('noEvents')}</p>
                <Button onClick={handleCreateMockEvent} variant="outline" className="border-accent text-accent">Initialize New Event</Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ScanAnalyticsCard({ icon, title, event, checkpoint }: { icon: React.ReactNode, title: string, event: any, checkpoint: string }) {
  const categories = event.categories || ["VIP", "Standard"];
  const totalPossible = event.guestCapacity || 100;
  const totalScanned = categories.reduce((acc: number, cat: string) => acc + (event.stats?.[cat]?.[checkpoint] || 0), 0);
  const percentage = totalPossible > 0 ? (totalScanned / totalPossible) * 100 : 0;

  return (
    <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <div className="p-2 bg-accent/10 rounded-lg">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-bold">{totalScanned} Check-ins</span>
          <span className="text-accent font-bold">{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="grid grid-cols-1 gap-2 pt-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {categories.map((cat: string) => (
            <div key={cat} className="bg-muted/30 p-2 rounded-lg flex justify-between items-center text-xs">
              <span className="uppercase font-bold text-muted-foreground">{cat}</span>
              <span className="font-bold">{event.stats?.[cat]?.[checkpoint] || 0} Scanned</span>
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
    <div className="flex items-center justify-between p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all group">
      <div className="space-y-1">
        <h3 className="font-bold text-lg group-hover:text-accent transition-colors">{name}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-3 w-3" /> {date} &bull; <Users className="h-3 w-3" /> {guests} Max
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest">{status}</div>
        <div className="flex gap-2">
          <Link href={`/events/${id}/scan`}><Button variant="outline" size="sm" className="text-xs"><QrCode className="mr-1 h-3 w-3" /> Scan</Button></Link>
          <Link href={`/events/${id}/invite`}><Button variant="ghost" size="sm" className="text-xs text-accent">Manage</Button></Link>
        </div>
      </div>
    </div>
  );
}
