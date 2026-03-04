
"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, QrCode, Loader2, Plus, TrendingUp, GlassWater, Utensils, DoorOpen, Settings, Tag, UserPlus, Shield, FileSpreadsheet, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, doc, updateDoc, arrayUnion, writeBatch, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [newCategory, setNewCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Staff form state
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffCheckpoint, setStaffCheckpoint] = useState<"GATE" | "DRINKS" | "FOOD">("GATE");

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "events"), where("eventAdminId", "==", user.uid));
  }, [db, user]);
  
  const { data: events, isLoading } = useCollection(eventsQuery);
  const activeEvent = events && events.length > 0 ? events[0] : null;

  const staffQuery = useMemoFirebase(() => {
    if (!db || !activeEvent) return null;
    return collection(db, "events", activeEvent.id, "staffAssignments");
  }, [db, activeEvent]);
  const { data: staffList } = useCollection(staffQuery);

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
    
    const mockData = [
      { ticketId: "ML0IQ", name: "Hon. Kassim Majaliwa", category: "VIP" },
      { ticketId: "MW123", name: "John Doe", category: "Standard" },
      { ticketId: "MA98M", name: "Jane Smith", category: "Standard" },
      { ticketId: "MLK72", name: "Salum Khalfan", category: "VVIP" },
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
      toast({ title: "Import Successful", description: `${mockData.length} guests imported.` });
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

  const handleAddStaff = () => {
    if (!db || !activeEvent || !staffUsername || !staffPassword) {
      toast({ variant: "destructive", title: "Error", description: "Username and password required" });
      return;
    }
    
    addDoc(collection(db, "events", activeEvent.id, "staffAssignments"), {
      username: staffUsername,
      password: staffPassword,
      assignedCheckpoint: staffCheckpoint,
      eventId: activeEvent.id,
      createdAt: new Date().toISOString()
    });

    setStaffUsername("");
    setStaffPassword("");
    toast({ title: "Staff Added", description: `${staffUsername} assigned to ${staffCheckpoint}` });
  };

  const handleDeleteStaff = (staffId: string) => {
    if (!db || !activeEvent) return;
    deleteDoc(doc(db, "events", activeEvent.id, "staffAssignments", staffId));
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">{t('dashboard')}</h1>
            <p className="text-muted-foreground">Premium registry and 3-point analytics</p>
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
                    <DialogDescription>Format: Ticket Number, Name, Category</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg border-muted-foreground/20 bg-muted/5">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
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
          <StatCard icon={<TrendingUp className="h-5 w-5" />} title="Checkpoint" value="3-Point" label="Gate, Drinks, Food" />
          <StatCard icon={<Users className="h-5 w-5" />} title="Capacity" value={activeEvent ? activeEvent.guestCapacity?.toString() : "0"} label="Total Invitations" />
          <StatCard icon={<QrCode className="h-5 w-5" />} title="Tiers" value={activeEvent ? `${activeEvent.categories?.length || 0}` : "0"} label="Active Categories" />
        </div>

        {activeEvent && (
          <Tabs defaultValue="analytics" className="mt-12">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
              <TabsTrigger value="analytics">Live Category Stats</TabsTrigger>
              <TabsTrigger value="staff">Staff Management</TabsTrigger>
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
                         <DialogDescription>Define all guest tiers.</DialogDescription>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-accent" />
                      Add Scanning Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)} placeholder="e.g. juma_gate" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Assigned Checkpoint</Label>
                      <Select value={staffCheckpoint} onValueChange={(v: any) => setStaffCheckpoint(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GATE">{t('checkpointGate')}</SelectItem>
                          <SelectItem value="DRINKS">{t('checkpointDrinks')}</SelectItem>
                          <SelectItem value="FOOD">{t('checkpointFood')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full bg-accent text-accent-foreground" onClick={handleAddStaff}>
                      Assign Staff
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Staff List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {staffList?.map((staff) => (
                        <div key={staff.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-accent/10 rounded-full flex items-center justify-center">
                              <Shield className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-bold">{staff.username}</p>
                              <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">{staff.assignedCheckpoint}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteStaff(staff.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {(!staffList || staffList.length === 0) && (
                        <p className="text-center py-8 text-muted-foreground italic">No staff members assigned yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
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
        <div className="grid grid-cols-1 gap-2 pt-2 max-h-48 overflow-y-auto pr-1">
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
