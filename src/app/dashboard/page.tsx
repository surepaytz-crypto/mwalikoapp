
"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, QrCode, Loader2, Plus, TrendingUp, GlassWater, Utensils, DoorOpen, Settings, Tag, UserPlus, Shield, FileSpreadsheet, Upload, Trash2, Image as ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, doc, updateDoc, arrayUnion, writeBatch, deleteDoc, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Create Event Form State
  const [eventName, setEventName] = useState("");
  const [eventCapacity, setEventCapacity] = useState("500");
  const [eventPoster, setEventPoster] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Edit Event Form State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editEventName, setEditEventName] = useState("");
  const [editEventCapacity, setEditEventCapacity] = useState("");
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);

  // Staff form state
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffCheckpoint, setStaffCheckpoint] = useState<"GATE" | "DRINKS" | "FOOD">("GATE");
  const [selectedEventForStaff, setSelectedEventForStaff] = useState<string>("");

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "events"), where("eventAdminId", "==", user.uid));
  }, [db, user]);
  
  const { data: events, isLoading: eventsLoading } = useCollection(eventsQuery);

  useEffect(() => {
    if (events && events.length > 0 && !activeEventId) {
      setActiveEventId(events[0].id);
    }
  }, [events, activeEventId]);

  const activeEvent = events?.find(e => e.id === activeEventId) || null;

  const staffQuery = useMemoFirebase(() => {
    if (!db || !activeEventId) return null;
    return collection(db, "events", activeEventId, "staffAssignments");
  }, [db, activeEventId]);
  const { data: staffList } = useCollection(staffQuery);

  const generateShortId = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  };

  const handleCreateEvent = async () => {
    if (!db || !user || !eventName) return;
    setIsCreatingEvent(true);
    try {
      const shortId = generateShortId();
      const newEvent = {
        shortId,
        nameEn: eventName,
        nameSw: eventName,
        startDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        venue: "Venue TBD",
        guestCapacity: parseInt(eventCapacity),
        categories: [], // Categories start empty as requested
        isActive: true,
        eventAdminId: user.uid,
        posterUrl: eventPoster || "https://picsum.photos/seed/mwaliko-poster/400/600",
        stats: {} // Stats start empty
      };
      const docRef = await addDoc(collection(db, "events"), newEvent);
      setActiveEventId(docRef.id);
      setEventName("");
      toast({ title: "Event Created", description: `${eventName} (ID: ${shortId}) is ready.` });
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!db || !activeEventId || !editEventName) return;
    setIsUpdatingEvent(true);
    try {
      await updateDoc(doc(db, "events", activeEventId), {
        nameEn: editEventName,
        nameSw: editEventName,
        guestCapacity: parseInt(editEventCapacity)
      });
      setIsEditDialogOpen(false);
      toast({ title: "Event Updated", description: "Changes have been saved successfully." });
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!db || !activeEventId) return;
    try {
      await deleteDoc(doc(db, "events", activeEventId));
      setActiveEventId(null);
      toast({ title: "Event Deleted", description: "The event has been removed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message });
    }
  };

  const openEditDialog = (e: any) => {
    setEditEventName(e.nameEn);
    setEditEventCapacity(e.guestCapacity.toString());
    setIsEditDialogOpen(true);
  };

  const handleCreateDemoEvent = () => {
    if (!db || !user) return;
    const shortId = "PIMA1";
    addDoc(collection(db, "events"), {
      shortId,
      nameEn: "Harusi ya Pima na Jenifa",
      nameSw: "Harusi ya Pima na Jenifa",
      startDate: new Date(Date.now() + 86400000 * 30).toISOString(), 
      venue: "Mlimani City Hall, Dar es Salaam",
      guestCapacity: 1000,
      categories: [], // Start empty, will be populated by "CSV import" simulation
      isActive: true,
      eventAdminId: user.uid,
      stats: {}
    });
    toast({ title: "Demo Event Created", description: "Harusi ya Pima na Jenifa is now active." });
  };

  const handleCsvSimulation = async (eventId: string) => {
    if (!db) return;
    setIsUploading(true);
    
    // Format: Ticket Number, Name, Category
    const mockData = [
      { ticketId: "ML0IQ", name: "Hon. Kassim Majaliwa", category: "VVIP" },
      { ticketId: "MA98M", name: "Mama Pima", category: "Family" },
      { ticketId: "MW123", name: "Juma Nature", category: "VIP" },
      { ticketId: "MA001", name: "Jenifa's Bestie", category: "Friends" },
      { ticketId: "ML777", name: "Cloud FM Reporter", category: "Press" },
    ];

    try {
      // 1. Detect unique categories from the imported data
      const importedCategories = Array.from(new Set(mockData.map(item => item.category)));
      
      const batch = writeBatch(db);
      const eventDocRef = doc(db, "events", eventId);

      // 2. Prepare the category and stats update
      // We use arrayUnion to add only new categories
      const statsUpdate: any = {
        categories: arrayUnion(...importedCategories)
      };

      // Initialize stats for each detected category (if not already there)
      importedCategories.forEach(cat => {
        statsUpdate[`stats.${cat}.gate`] = 0;
        statsUpdate[`stats.${cat}.drinks`] = 0;
        statsUpdate[`stats.${cat}.food`] = 0;
      });

      batch.update(eventDocRef, statsUpdate);

      // 3. Create guest records
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
      toast({ title: "Import Successful", description: `${mockData.length} guests imported. Categories detected: ${importedCategories.join(", ")}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed", description: e.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddStaff = () => {
    if (!db || !selectedEventForStaff || !staffUsername || !staffPassword) {
      toast({ variant: "destructive", title: "Error", description: "Missing fields" });
      return;
    }
    
    const event = events?.find(e => e.id === selectedEventForStaff);
    
    addDoc(collection(db, "events", selectedEventForStaff, "staffAssignments"), {
      username: staffUsername,
      password: staffPassword,
      assignedCheckpoint: staffCheckpoint,
      eventId: selectedEventForStaff,
      eventName: event?.nameEn || "Unknown",
      createdAt: new Date().toISOString()
    });

    setStaffUsername("");
    setStaffPassword("");
    toast({ title: "Staff Assigned", description: `${staffUsername} assigned to ${event?.nameEn} @ ${staffCheckpoint}` });
  };

  const handleDeleteStaff = (staffId: string) => {
    if (!db || !activeEventId) return;
    deleteDoc(doc(db, "events", activeEventId, "staffAssignments", staffId));
  };

  const simulateUpload = () => {
    toast({ title: "Uploading Poster...", description: "Simulating file transfer." });
    setEventPoster("https://picsum.photos/seed/mwaliko-p/400/600");
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || eventsLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">{t('dashboard')}</h1>
            <p className="text-muted-foreground">Mwaliko Premium Registry &bull; Real-time Analytics</p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl">
                  <Plus className="mr-2 h-4 w-4" /> {t('createEvent')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('createEvent')}</DialogTitle>
                  <DialogDescription>Setup your new premium registry.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">{t('eventName')}</Label>
                    <Input id="name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">{t('capacity')}</Label>
                    <Input id="capacity" type="number" value={eventCapacity} onChange={(e) => setEventCapacity(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('eventPoster')}</Label>
                    <Button variant="outline" onClick={simulateUpload} className="w-full">
                      {eventPoster ? <ImageIcon className="mr-2 h-4 w-4 text-green-500" /> : <Upload className="mr-2 h-4 w-4" />}
                      {eventPoster ? "Poster Attached" : "Upload Image"}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateEvent} disabled={isCreatingEvent || !eventName}>
                    {isCreatingEvent ? <Loader2 className="animate-spin" /> : t('save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {(!events || events.length === 0) && (
              <Button variant="outline" onClick={handleCreateDemoEvent} className="border-accent text-accent">
                {t('createDemo')}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatStat icon={<Calendar className="h-5 w-5" />} title={t('events')} value={events?.length.toString() || "0"} label="Total Created" />
          <StatStat icon={<TrendingUp className="h-5 w-5" />} title="Logic" value="3-Point" label="Gate, Drinks, Food" />
          <StatStat icon={<Users className="h-5 w-5" />} title="Total Cap" value={events?.reduce((acc, e) => acc + (e.guestCapacity || 0), 0).toString() || "0"} label="Registered Capacity" />
          <StatStat icon={<Shield className="h-5 w-5" />} title="Active" value={events?.length.toString() || "0"} label="Events Live" />
        </div>

        {events && events.length > 0 && (
          <div className="mb-8">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 block">{t('selectEvent')}</Label>
            <div className="flex flex-wrap gap-2">
              {events.map((e) => (
                <div 
                  key={e.id}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-4 py-2 transition-all cursor-pointer border",
                    activeEventId === e.id 
                      ? "bg-primary text-primary-foreground shadow-lg border-primary" 
                      : "bg-background text-foreground border-input hover:bg-accent/10"
                  )}
                  onClick={() => setActiveEventId(e.id)}
                >
                  <span className="text-sm font-bold whitespace-nowrap">
                    {e.shortId} &bull; {e.nameEn}
                  </span>
                  {activeEventId === e.id && (
                    <div className="flex items-center gap-1 border-l border-white/20 pl-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full hover:bg-white/20 text-white p-0"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEditDialog(e);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full hover:bg-red-500/50 text-white p-0"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(ev) => ev.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the event "{e.nameEn}" and all its guest data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeEvent && (
          <>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Event</DialogTitle>
                  <DialogDescription>Update your event details.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">{t('eventName')}</Label>
                    <Input id="edit-name" value={editEventName} onChange={(e) => setEditEventName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-capacity">{t('capacity')}</Label>
                    <Input id="edit-capacity" type="number" value={editEventCapacity} onChange={(e) => setEditEventCapacity(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpdateEvent} disabled={isUpdatingEvent || !editEventName}>
                    {isUpdatingEvent ? <Loader2 className="animate-spin" /> : t('save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Tabs defaultValue="analytics" className="mt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                 <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                  <TabsTrigger value="analytics">Live Analytics</TabsTrigger>
                  <TabsTrigger value="staff">Staff Access</TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-accent text-accent">
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('importGuests')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('uploadCsv')}</DialogTitle>
                        <DialogDescription>{t('importFormat')}</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg border-muted-foreground/20 bg-muted/5">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <Button onClick={() => handleCsvSimulation(activeEvent.id)} disabled={isUploading}>
                          {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('processing')}</> : "Simulate CSV Import"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Link href={`/events/${activeEvent.id}/scan`}>
                     <Button className="bg-primary text-primary-foreground">
                        <QrCode className="mr-2 h-4 w-4" /> Go to Scanner
                     </Button>
                  </Link>
                  <Link href={`/events/${activeEvent.id}/invite`}>
                     <Button variant="outline">
                        {t('generateInvite')}
                     </Button>
                  </Link>
                </div>
              </div>
              
              <TabsContent value="analytics" className="space-y-8">
                <div className="flex items-center justify-between">
                   <h2 className="font-headline text-2xl font-bold">Registry Stats: {activeEvent.nameEn} ({activeEvent.shortId})</h2>
                </div>

                {(!activeEvent.categories || activeEvent.categories.length === 0) ? (
                  <Card className="p-12 text-center border-dashed">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Categories Detected</h3>
                    <p className="text-muted-foreground">Import your guest list via CSV to automatically detect and display categories.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CategoryScanCard 
                      icon={<DoorOpen className="h-5 w-5 text-accent" />} 
                      title={t('checkpointGate')} 
                      event={activeEvent}
                      checkpoint="gate"
                    />
                    <CategoryScanCard 
                      icon={<GlassWater className="h-5 w-5 text-accent" />} 
                      title={t('checkpointDrinks')} 
                      event={activeEvent}
                      checkpoint="drinks"
                    />
                    <CategoryScanCard 
                      icon={<Utensils className="h-5 w-5 text-accent" />} 
                      title={t('checkpointFood')} 
                      event={activeEvent}
                      checkpoint="food"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="staff">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-1 border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-accent" />
                        Pin Security Staff
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('selectEvent')}</Label>
                        <Select value={selectedEventForStaff} onValueChange={setSelectedEventForStaff}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pick Event" />
                          </SelectTrigger>
                          <SelectContent>
                            {events?.map((e) => (
                              <SelectItem key={e.id} value={e.id}>{e.shortId} &bull; {e.nameEn}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('staffUsername')}</Label>
                        <Input value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)} placeholder="e.g. juma_gate" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('staffPassword')}</Label>
                        <Input type="password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('assignedCheckpoint')}</Label>
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
                        Save Staff Member
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Assigned Team for {activeEvent.nameEn}</CardTitle>
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
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                                  {staff.assignedCheckpoint} &bull; PINNED TO EVENT
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteStaff(staff.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {(!staffList || staffList.length === 0) && (
                          <p className="text-center py-8 text-muted-foreground italic">No staff pinned to this event yet.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

function CategoryScanCard({ icon, title, event, checkpoint }: { icon: React.ReactNode, title: string, event: any, checkpoint: string }) {
  const categories = event.categories || [];
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

function StatStat({ icon, title, value, label }: { icon: React.ReactNode, title: string, value: string, label: string }) {
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
