
"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Users, Calendar, QrCode, Loader2, Plus, GlassWater, Utensils, DoorOpen, UserPlus, Shield, FileSpreadsheet, Trash2, Image as ImageIcon, Pencil, FileText, CheckCircle, XCircle, CreditCard, Sparkles, Check, Info, ArrowRight, ShieldCheck, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, addDoc, doc, updateDoc, arrayUnion, writeBatch, deleteDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { sendEmailVerification } from "firebase/auth";

type PackageType = "Free" | "Premium";
type CreationStage = "plans" | "payment" | "details";

interface PlanConfig {
  type: PackageType;
  limit: number;
  price: string;
  duration: string;
  name: string;
}

const PLANS: PlanConfig[] = [
  { type: "Free", limit: 200, price: "0 TZS", duration: "1 Month", name: "Free Trial" },
  { type: "Premium", limit: 999999, price: "350,000 TZS", duration: "2 Months", name: "Premium Package" },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeEventId, setactiveEventId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportGuests, setReportGuests] = useState<any[]>([]);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  
  // Creation Wizard State
  const [creationStage, setCreationStage] = useState<CreationStage>("plans");
  const [selectedPlan, setSelectedPlan] = useState<PackageType>("Free");
  const [eventName, setEventName] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit Event Form State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editEventName, setEditEventName] = useState("");
  const [editPosterUrl, setEditPosterUrl] = useState("");
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);

  // Staff form state
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffCheckpoint, setStaffCheckpoint] = useState<"GATE" | "DRINKS" | "FOOD">("GATE");
  const [selectedEventForStaff, setSelectedEventForStaff] = useState<string>("");

  // Role & Subscription detection
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userProfile, isLoading: profileLoading } = useDoc(userDocRef);

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user || userProfile?.userRole !== "EventAdmin") return null;
    return query(collection(db, "events"), where("eventAdminId", "==", user.uid));
  }, [db, user, userProfile]);
  
  const { data: events, isLoading: eventsLoading } = useCollection(eventsQuery);

  const hasActivePremium = userProfile?.subscription?.type === "Premium" && 
    new Date(userProfile.subscription.expiryDate) > new Date();

  useEffect(() => {
    if (events && events.length > 0 && !activeEventId) {
      setactiveEventId(events[0].id);
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

  const resetWizard = () => {
    if (hasActivePremium) {
      setCreationStage("details");
      setSelectedPlan("Premium");
    } else {
      setCreationStage("plans");
    }
    setEventName("");
  };

  const handlePlanSelection = () => {
    const hasUsedFreeTrial = events?.some(e => e.packageType === "Free");
    if (selectedPlan === "Free" && hasUsedFreeTrial) {
      toast({
        variant: "destructive",
        title: "Free Trial Already Used",
        description: "You have already used your one-time free trial. Please select the Premium Package.",
      });
      return;
    }

    if (selectedPlan === "Premium" && !hasActivePremium) {
      setCreationStage("payment");
    } else {
      setCreationStage("details");
    }
  };

  const handlePayment = async () => {
    if (!db || !user) return;
    setIsProcessingPayment(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 2);
      await updateDoc(doc(db, "users", user.uid), {
        subscription: {
          type: "Premium",
          expiryDate: expiry.toISOString(),
          paidAt: new Date().toISOString()
        }
      });
      setCreationStage("details");
      toast({ title: "Payment Verified", description: "You now have 2 months of unlimited Premium access!" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleFinalizeEvent = async () => {
    if (!db || !user || !eventName) return;
    setIsFinalizing(true);
    try {
      const plan = PLANS.find(p => p.type === selectedPlan)!;
      const shortId = generateShortId();
      const newEvent = {
        shortId,
        nameEn: eventName,
        nameSw: eventName,
        startDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        venue: "Venue TBD",
        guestLimit: plan.limit,
        packageType: plan.type,
        categories: [], 
        isActive: true, 
        isPaid: true,
        eventAdminId: user.uid,
        stats: {},
        invitedTotals: {},
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "events"), newEvent);
      setactiveEventId(docRef.id);
      setIsModalOpen(false);
      toast({ title: "Event Created", description: `${eventName} registry is now live!` });
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!db || !activeEventId || !editEventName) return;
    setIsUpdatingEvent(true);
    try {
      await updateDoc(doc(db, "events", activeEventId), {
        nameEn: editEventName,
        nameSw: editEventName,
        posterUrl: editPosterUrl
      });
      setIsEditDialogOpen(false);
      toast({ title: "Event Updated", description: "Changes saved successfully." });
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!db || !activeEventId) return;
    try {
      await deleteDoc(doc(db, "events", activeEventId));
      setactiveEventId(null);
      toast({ title: "Event Deleted", description: "The registry has been removed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message });
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setIsResendingEmail(true);
    try {
      await sendEmailVerification(user);
      toast({ title: "Email Sent", description: "Verification link resent successfully." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Send Failed", description: e.message });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const openEditDialog = (e: any) => {
    setEditEventName(e.nameEn);
    setEditPosterUrl(e.posterUrl || "");
    setIsEditDialogOpen(true);
  };

  const handleCsvSimulation = async (eventId: string, mode: "new" | "finished" = "new") => {
    if (!db || !activeEvent) return;
    const currentCount = Object.values(activeEvent.invitedTotals || {}).reduce((a: number, b: any) => a + (b || 0), 0) as number;
    const limit = activeEvent.guestLimit || 200;
    if (currentCount >= limit && activeEvent.packageType === "Free") {
      toast({ variant: "destructive", title: t('limitReached'), description: t('upgradePlan') });
      return;
    }
    setIsUploading(true);
    const mockData = [
      { ticketId: "ML0IQ", name: "Hon. Kassim Majaliwa", category: "VVIP", phone: "255712345678" },
      { ticketId: "MA98M", name: "Mama Pima", category: "Family", phone: "255711223344" },
      { ticketId: "MW123", name: "Juma Nature", category: "VIP", phone: "255755009988" },
      { ticketId: "MA001", name: "Jenifa's Bestie", category: "Friends", phone: "255766112233" },
      { ticketId: "ML777", name: "Cloud FM Reporter", category: "Press", phone: "255744889900" },
      { ticketId: "ML101", name: "Baba Pima", category: "Family", phone: "255711334455" },
      { ticketId: "ML202", name: "Auntie Jane", category: "Family", phone: "255711445566" },
      { ticketId: "ML303", name: "Uncle Sam", category: "Family", phone: "255711556677" },
      { ticketId: "ML404", name: "Hon. Samia Suluhu", category: "VVIP", phone: "255700112233" },
      { ticketId: "ML505", name: "Diamond Platnumz", category: "VIP", phone: "255711000111" },
    ];
    try {
      const categories = Array.from(new Set(mockData.map(item => item.category)));
      const categoryScans: Record<string, any> = {};
      mockData.forEach(item => {
        if (!categoryScans[item.category]) {
          categoryScans[item.category] = { gate: 0, drinks: 0, food: 0, total: 0 };
        }
        categoryScans[item.category].total++;
      });
      const batch = writeBatch(db);
      mockData.forEach((item) => {
        const isScanned = mode === "finished" ? Math.random() > 0.2 : false;
        const scanDrinks = mode === "finished" ? isScanned && Math.random() > 0.3 : false;
        const scanFood = mode === "finished" ? isScanned && Math.random() > 0.4 : false;
        const guestRef = doc(collection(db, "events", eventId, "guestEvents"));
        batch.set(guestRef, {
          guestName: item.name,
          ticketId: item.ticketId,
          category: item.category,
          phoneNumber: item.phone,
          eventId: eventId,
          scannedGate: isScanned,
          scannedDrinks: scanDrinks,
          scannedFood: scanFood,
          qrCodeData: JSON.stringify({ eventId, ticketId: item.ticketId }),
          createdAt: new Date().toISOString()
        });
      });
      const statsUpdate: any = { categories: arrayUnion(...categories) };
      const newInvitedTotals = { ...(activeEvent.invitedTotals || {}) };
      categories.forEach(cat => {
        newInvitedTotals[cat] = (newInvitedTotals[cat] || 0) + (categoryScans[cat]?.total || 0);
        const existingStats = activeEvent.stats?.[cat] || { gate: 0, drinks: 0, food: 0 };
        statsUpdate[`stats.${cat}.gate`] = (existingStats.gate || 0) + (categoryScans[cat]?.gate || 0);
        statsUpdate[`stats.${cat}.drinks`] = (existingStats.drinks || 0) + (categoryScans[cat]?.drinks || 0);
        statsUpdate[`stats.${cat}.food`] = (existingStats.food || 0) + (categoryScans[cat]?.food || 0);
      });
      statsUpdate.invitedTotals = newInvitedTotals;
      batch.update(doc(db, "events", eventId), statsUpdate);
      await batch.commit();
      toast({ title: "Simulation Complete", description: "Guest data populated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Simulation Error", description: e.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!db || !activeEventId) return;
    setIsGeneratingReport(true);
    try {
      const q = collection(db, "events", activeEventId, "guestEvents");
      const snapshot = await getDocs(q);
      const guests = snapshot.docs.map(doc => doc.data());
      setReportGuests(guests);
      setTimeout(() => {
        window.print();
        setIsGeneratingReport(false);
      }, 500);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Report Failed", description: e.message });
      setIsGeneratingReport(false);
    }
  };

  const handleAddStaff = () => {
    if (!db || !selectedEventForStaff || !staffUsername || !staffPassword) return;
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
    toast({ title: "Staff Assigned", description: `${staffUsername} added.` });
  };

  if (isUserLoading || eventsLoading || profileLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;
  if (!user) return null;

  if (userProfile?.userRole === "EventAdmin" && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center p-4 py-20">
          <Card className="w-full max-w-lg border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] bg-card overflow-hidden">
             <div className="bg-primary p-8 text-center">
                <h2 className="text-accent font-headline text-3xl font-bold tracking-[0.2em]">MWALIKO APP</h2>
             </div>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                <Mail className="h-10 w-10 text-accent animate-shake" />
              </div>
              <CardTitle className="text-3xl font-headline font-bold text-primary">Activation Required</CardTitle>
              <CardDescription className="text-lg mt-2">
                Welcome to Mwaliko App, <strong>{userProfile?.firstName}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-10 text-center space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                We have sent an official activation link to your inbox at <strong>{user.email}</strong>. 
                Please verify your email to begin managing your premium registries.
              </p>
              <div className="p-6 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20 space-y-4">
                <div className="flex items-center gap-4 text-left">
                  <ShieldCheck className="h-8 w-8 text-accent shrink-0" />
                  <p className="text-sm italic opacity-70">
                    "At 360 Digital, your security and event integrity are our highest priority. This verification ensures your administrative access remains exclusive."
                  </p>
                </div>
                <div className="pt-4 border-t border-muted text-left">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Chacha Steven</p>
                   <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Founder, 360 Digital</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 p-8 flex flex-col gap-4">
              <Button onClick={() => window.location.reload()} className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-lg">
                I've Verified My Email
              </Button>
              <Button variant="ghost" onClick={handleResendVerification} disabled={isResendingEmail} className="text-xs text-muted-foreground hover:text-accent">
                {isResendingEmail ? "Resending..." : "Didn't receive? Resend Verification Link"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const currentGuestCount = activeEvent ? Object.values(activeEvent.invitedTotals || {}).reduce((a: number, b: any) => a + (b || 0), 0) as number : 0;
  const guestLimit = activeEvent?.guestLimit || 200;

  return (
    <div className="min-h-screen bg-background print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="container mx-auto px-4 py-8 print:p-0">
        <div className="print:hidden">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-headline text-3xl font-bold text-primary">{t('dashboard')}</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-muted-foreground text-sm">{userProfile?.firstName} {userProfile?.lastName}</p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold border border-green-200">
                  <ShieldCheck className="h-3 w-3" /> VERIFIED ACCOUNT
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (open) resetWizard(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl">
                    <Plus className="mr-2 h-4 w-4" /> {t('createEvent')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  {creationStage === "plans" && (
                    <div className="space-y-6 py-4">
                      <DialogHeader>
                        <DialogTitle>Step 1: Select Your Registry Plan</DialogTitle>
                        <DialogDescription>Choose a package to unlock your event registry features.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PLANS.map((plan) => {
                          const isFreeUsed = events?.some(e => e.packageType === "Free");
                          const isDisabled = plan.type === "Free" && (isFreeUsed || hasActivePremium);
                          return (
                            <button
                              key={plan.type}
                              disabled={isDisabled}
                              onClick={() => setSelectedPlan(plan.type)}
                              className={cn(
                                "p-6 rounded-2xl border-2 text-left transition-all relative group",
                                selectedPlan === plan.type ? "border-accent bg-accent/5 ring-2 ring-accent/20" : "border-muted hover:border-accent/50",
                                isDisabled && "opacity-50 cursor-not-allowed bg-muted grayscale"
                              )}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm border border-muted group-hover:border-accent/30">
                                  {plan.type === "Free" ? <Sparkles className="h-6 w-6 text-accent" /> : <ShieldCheck className="h-6 w-6 text-accent" />}
                                </div>
                                {selectedPlan === plan.type && <Check className="h-5 w-5 text-accent" />}
                              </div>
                              <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                              <p className="text-xs text-muted-foreground mb-4">{plan.duration} Coverage</p>
                              <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-[11px] font-medium">
                                  <Check className="h-3 w-3 text-green-500" /> {plan.limit === 999999 ? "Unlimited" : plan.limit} Guest Cards
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-medium">
                                  <Check className="h-3 w-3 text-green-500" /> Digital Invitation Designer
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-medium">
                                  <Check className="h-3 w-3 text-green-500" /> 3-Point Security Scan
                                </div>
                              </div>
                              <div className="text-2xl font-black text-primary">{plan.price}</div>
                              {isDisabled && (
                                <span className="absolute top-2 right-2 bg-destructive text-white text-[9px] font-bold px-2 py-0.5 rounded-full">NOT ELIGIBLE</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <Button onClick={handlePlanSelection} className="w-full h-12">
                        Continue to {selectedPlan === "Premium" ? "Payment" : "Details"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {creationStage === "payment" && (
                    <div className="space-y-6 py-4 text-center">
                      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                         <CreditCard className="h-10 w-10 text-green-600" />
                      </div>
                      <DialogHeader>
                        <DialogTitle>Verify Payment Access</DialogTitle>
                        <DialogDescription>
                          Complete activation for your <strong>Premium Package</strong> (350,000 TZS).
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-muted/50 p-6 rounded-2xl border text-left space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b">
                           <span className="text-sm font-medium">Total Due</span>
                           <span className="text-xl font-bold text-accent">350,000 TZS</span>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs opacity-60">Payment Reference</Label>
                           <div className="p-3 bg-white rounded-lg border font-mono text-xs text-center tracking-widest">MW-{Math.random().toString(36).substring(7).toUpperCase()}</div>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic text-center">Once verified, you will have unlimited registry access for 2 months.</p>
                      </div>
                      <div className="flex gap-3">
                         <Button variant="outline" className="flex-1" onClick={() => setCreationStage("plans")}>Go Back</Button>
                         <Button className="flex-[2] h-12 bg-primary" onClick={handlePayment} disabled={isProcessingPayment}>
                            {isProcessingPayment ? <Loader2 className="animate-spin" /> : "Verify & Activate Premium"}
                         </Button>
                      </div>
                    </div>
                  )}
                  {creationStage === "details" && (
                    <div className="space-y-6 py-4">
                      <DialogHeader>
                        <DialogTitle>Step 2: Event Identity</DialogTitle>
                        <DialogDescription>Enter the official name for your new registry.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="ename">Event Registry Name</Label>
                          <Input 
                            id="ename" 
                            value={eventName} 
                            onChange={(e) => setEventName(e.target.value)} 
                            placeholder="e.g. The Royal Wedding of Pima & Jenifa"
                            className="h-12 text-lg"
                          />
                        </div>
                        <div className="p-4 bg-accent/5 rounded-xl border border-accent/20 flex gap-4 items-start">
                           <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <p className="text-xs leading-relaxed text-muted-foreground">This name will appear on all digital invitations and security scan reports. You can translate this into Swahili later in settings.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => hasActivePremium ? setIsModalOpen(false) : setCreationStage("plans")}>Cancel</Button>
                        <Button onClick={handleFinalizeEvent} disabled={isFinalizing || !eventName} className="flex-[2] h-12 bg-accent text-accent-foreground">
                          {isFinalizing ? <Loader2 className="animate-spin" /> : "Finalize Registry Creation"}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatStat icon={<Calendar className="h-5 w-5" />} title={t('events')} value={events?.length.toString() || "0"} label="Total Created" />
            <StatStat icon={<Sparkles className="h-5 w-5" />} title="Digital Invites" value={currentGuestCount.toString()} label="Invitations Ready" />
            <StatStat icon={<Users className="h-5 w-5" />} title="Total Capacity" value={events?.reduce((acc, e) => acc + (e.guestLimit || 0), 0).toString() || "0"} label="Registered Scale" />
            {hasActivePremium ? (
              <StatStat 
                icon={<ShieldCheck className="h-5 w-5" />} 
                title="Premium Access" 
                value="ACTIVE" 
                label={`Expires: ${new Date(userProfile?.subscription?.expiryDate).toLocaleDateString()}`} 
              />
            ) : (
              <StatStat icon={<Info className="h-5 w-5" />} title="Account Plan" value="FREE TRIAL" label="One-time offer" />
            )}
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
                      activeEventId === e.id ? "bg-primary text-primary-foreground shadow-lg border-primary" : "bg-background text-foreground border-input hover:bg-accent/10"
                    )}
                    onClick={() => setactiveEventId(e.id)}
                  >
                    <span className="text-sm font-bold whitespace-nowrap">{e.shortId} &bull; {e.nameEn}</span>
                    <span className="text-[9px] uppercase font-bold opacity-60 ml-2">({e.packageType})</span>
                    {activeEventId === e.id && (
                      <div className="flex items-center gap-1 border-l border-white/20 pl-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white/20 text-white p-0" onClick={(ev) => { ev.stopPropagation(); openEditDialog(e); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-red-500/50 text-white p-0" onClick={(ev) => ev.stopPropagation()}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(ev) => ev.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete the event "{e.nameEn}" and all its guest data.</AlertDialogDescription>
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
        </div>

        {activeEvent && (
          <div className="print:block">
            <div className="print:hidden">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                 <Card className="lg:col-span-3 border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                       <CardTitle className="text-lg font-bold">Registry Capacity: {activeEvent.packageType === "Free" ? "Free Trial" : "Premium"} Plan</CardTitle>
                       <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-[10px] font-bold uppercase tracking-widest">{activeEvent.packageType}</span>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-3xl font-bold">{currentGuestCount} / {activeEvent.packageType === "Premium" ? "∞" : guestLimit}</p>
                             <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Guests Registered</p>
                          </div>
                          <p className="text-sm font-bold text-accent">{activeEvent.packageType === "Premium" ? "Unlimited" : `${Math.round((currentGuestCount / guestLimit) * 100)}%`}</p>
                       </div>
                       <Progress value={activeEvent.packageType === "Premium" ? 0 : (currentGuestCount / guestLimit) * 100} className="h-3" />
                    </CardContent>
                 </Card>
                 <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-sm uppercase tracking-widest opacity-60">Poster Image</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-4">
                       <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 mb-4 bg-white/5 flex items-center justify-center">
                          {activeEvent.posterUrl ? <img src={activeEvent.posterUrl} className="object-cover w-full h-full" alt="Poster" /> : <ImageIcon className="h-8 w-8 opacity-20" />}
                       </div>
                       <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 hover:bg-white/20" onClick={() => openEditDialog(activeEvent)}>Update Bango</Button>
                    </CardContent>
                 </Card>
              </div>

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
                        <div className="grid grid-cols-2 gap-4">
                           <Button variant="outline" onClick={() => handleCsvSimulation(activeEvent.id, "new")} disabled={isUploading}>{isUploading ? <Loader2 className="animate-spin" /> : "Simulate New Registry"}</Button>
                           <Button className="bg-accent text-accent-foreground" onClick={() => handleCsvSimulation(activeEvent.id, "finished")} disabled={isUploading}>{isUploading ? <Loader2 className="animate-spin" /> : "Simulate Post-Event"}</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Link href={`/events/${activeEvent.id}/scan`}><Button className="bg-primary text-primary-foreground"><QrCode className="mr-2 h-4 w-4" /> Go to Scanner</Button></Link>
                    <Link href={`/events/${activeEvent.id}/invite`}><Button variant="outline">{t('generateInvite')}</Button></Link>
                  </div>
                </div>
                
                <TabsContent value="analytics" className="space-y-8">
                  <div className="flex items-center justify-between">
                     <h2 className="font-headline text-2xl font-bold">Checkpoint Breakdown: {activeEvent.nameEn}</h2>
                     <Button variant="secondary" onClick={handleDownloadReport} disabled={isGeneratingReport}>
                        {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                        {t('downloadReport')}
                     </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CategoryScanCard icon={<DoorOpen className="h-5 w-5 text-accent" />} title={t('checkpointGate')} event={activeEvent} checkpoint="gate" t={t} />
                    <CategoryScanCard icon={<GlassWater className="h-5 w-5 text-accent" />} title={t('checkpointDrinks')} event={activeEvent} checkpoint="drinks" t={t} />
                    <CategoryScanCard icon={<Utensils className="h-5 w-5 text-accent" />} title={t('checkpointFood')} event={activeEvent} checkpoint="food" t={t} />
                  </div>
                </TabsContent>

                <TabsContent value="staff">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><UserPlus className="h-5 w-5 text-accent" />Assign Staff</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>{t('selectEvent')}</Label>
                          <Select value={selectedEventForStaff} onValueChange={setSelectedEventForStaff}>
                            <SelectTrigger><SelectValue placeholder="Pick Event" /></SelectTrigger>
                            <SelectContent>
                              {events?.map((e) => <SelectItem key={e.id} value={e.id}>{e.shortId} &bull; {e.nameEn}</SelectItem>)}
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
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GATE">{t('checkpointGate')}</SelectItem>
                              <SelectItem value="DRINKS">{t('checkpointDrinks')}</SelectItem>
                              <SelectItem value="FOOD">{t('checkpointFood')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full bg-accent text-accent-foreground" onClick={handleAddStaff}>Save Staff Member</Button>
                      </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                      <CardHeader><CardTitle className="text-lg">Assigned Team for {activeEvent.nameEn}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {staffList?.map((staff) => (
                            <div key={staff.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                              <div className="flex items-center gap-4">
                                <Shield className="h-5 w-5 text-accent" />
                                <div><p className="font-bold">{staff.username}</p><p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">{staff.assignedCheckpoint}</p></div>
                              </div>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db, "events", activeEventId!, "staffAssignments", staff.id))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="hidden print:block font-sans p-8">
              <div className="flex justify-between items-start mb-12 border-b-2 border-primary pb-8">
                <div>
                   <h1 className="text-4xl font-headline font-bold text-primary mb-2">{activeEvent.nameEn}</h1>
                   <p className="text-muted-foreground uppercase tracking-widest font-bold">Registry Status Report &bull; {activeEvent.shortId}</p>
                   <p className="text-sm mt-2">{new Date().toLocaleString()}</p>
                </div>
                <div className="text-right"><div className="text-2xl font-bold text-accent">Mwaliko App.</div><p className="text-xs opacity-50">Premium Event Management</p></div>
              </div>
              <div className="grid grid-cols-3 gap-8 mb-12">
                <PrintStatCard title={t('checkpointGate')} event={activeEvent} checkpoint="gate" t={t} />
                <PrintStatCard title={t('checkpointDrinks')} event={activeEvent} checkpoint="drinks" t={t} />
                <PrintStatCard title={t('checkpointFood')} event={activeEvent} checkpoint="food" t={t} />
              </div>
              <div>
                <h2 className="text-xl font-bold border-l-4 border-accent pl-4 mb-6 uppercase tracking-tight">Detailed Guest List</h2>
                <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-primary text-white">
                       <th className="p-3 text-xs uppercase">Guest Name</th>
                       <th className="p-3 text-xs uppercase">Category</th>
                       <th className="p-3 text-xs uppercase">Ticket ID</th>
                       <th className="p-3 text-xs uppercase text-center">Attended</th>
                     </tr>
                   </thead>
                   <tbody>
                     {reportGuests.map((guest, idx) => (
                       <tr key={idx} className="border-b">
                         <td className="p-3 text-sm font-medium">{guest.guestName}</td>
                         <td className="p-3 text-xs uppercase text-muted-foreground">{guest.category}</td>
                         <td className="p-3 text-xs font-mono">{guest.ticketId}</td>
                         <td className="p-3 text-center">
                            {guest.scannedGate ? <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-xs"><CheckCircle className="h-3 w-3" /> {t('attended')}</div> : <div className="flex items-center justify-center gap-1 text-red-500 font-bold text-xs"><XCircle className="h-3 w-3" /> {t('absent')}</div>}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Event Registry</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>{t('eventName')}</Label><Input value={editEventName} onChange={(e) => setEditEventName(e.target.value)} /></div>
              <div className="grid gap-2"><Label>{t('eventPoster')} (URL)</Label><Input value={editPosterUrl} onChange={(e) => setEditPosterUrl(e.target.value)} placeholder="https://..." /></div>
            </div>
            <DialogFooter><Button onClick={handleUpdateEvent} disabled={isUpdatingEvent}>{isUpdatingEvent ? <Loader2 className="animate-spin" /> : t('save')}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function CategoryScanCard({ icon, title, event, checkpoint, t }: { icon: React.ReactNode, title: string, event: any, checkpoint: string, t: any }) {
  const categories = event.categories || [];
  const totalInvited = Object.values(event.invitedTotals || {}).reduce((a: number, b: any) => a + (b || 0), 0) as number;
  const totalScanned = categories.reduce((acc: number, cat: string) => acc + (event.stats?.[cat]?.[checkpoint] || 0), 0);
  const percentage = totalInvited > 0 ? (totalScanned / totalInvited) * 100 : 0;
  return (
    <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4"><div className="p-2 bg-accent/10 rounded-lg">{icon}</div><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm mb-1"><span className="font-bold">{totalScanned} / {totalInvited} {t('scanned')}</span><span className="text-accent font-bold">{Math.round(percentage)}%</span></div>
        <Progress value={percentage} className="h-2" />
        <div className="grid grid-cols-1 gap-2 pt-2">{categories.map((cat: string) => <div key={cat} className="bg-muted/30 p-2 rounded-lg flex justify-between items-center text-xs"><span className="uppercase font-bold text-muted-foreground">{cat}</span><span className="font-bold">{event.stats?.[cat]?.[checkpoint] || 0} / {event.invitedTotals?.[cat] || 0}</span></div>)}</div>
      </CardContent>
    </Card>
  );
}

function PrintStatCard({ title, event, checkpoint, t }: { title: string, event: any, checkpoint: string, t: any }) {
  const categories = event.categories || [];
  const totalInvited = Object.values(event.invitedTotals || {}).reduce((a: number, b: any) => a + (b || 0), 0) as number;
  const totalScanned = categories.reduce((acc: number, cat: string) => acc + (event.stats?.[cat]?.[checkpoint] || 0), 0);
  const percentage = totalInvited > 0 ? (totalScanned / totalInvited) * 100 : 0;
  return (
    <div className="p-6 bg-muted/10 border-2 border-primary/10 rounded-xl">
       <h3 className="text-sm font-bold uppercase tracking-widest text-primary/50 mb-4">{title}</h3>
       <div className="flex items-baseline gap-2"><span className="text-4xl font-bold text-primary">{totalScanned}</span><span className="text-xl text-muted-foreground">/ {totalInvited}</span></div>
       <div className="mt-2 text-xs font-bold text-accent uppercase">{Math.round(percentage)}% {t('attended')}</div>
    </div>
  );
}

function StatStat({ icon, title, value, label }: { icon: React.ReactNode, title: string, value: string, label: string }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><div className="text-accent">{icon}</div></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div><p className="text-xs text-muted-foreground mt-1">{label}</p></CardContent>
    </Card>
  );
}
