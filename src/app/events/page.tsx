"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Calendar, Loader2, Plus, MapPin, Users, ArrowRight, Search, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export default function EventsPage() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "events"),
      where("eventAdminId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: events, isLoading: eventsLoading } = useCollection(eventsQuery);

  if (isUserLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const filteredEvents = events?.filter(e => 
    e.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.shortId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="font-headline text-4xl font-bold text-primary mb-2">My Event Registries</h1>
            <p className="text-muted-foreground">Manage and track all your active Mwaliko App events.</p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> {t('createEvent')}
            </Button>
          </Link>
        </div>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10 h-12 bg-card border-none shadow-sm"
            placeholder="Search by event name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredEvents && filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="group border-none shadow-sm hover:shadow-xl transition-all overflow-hidden bg-card flex flex-col">
                <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
                  {event.posterUrl ? (
                    <img 
                      src={event.posterUrl} 
                      alt={event.nameEn} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <Logo size="lg" variant="gold" className="opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge variant={event.packageType === "Premium" ? "default" : "secondary"} className="bg-white/90 text-primary backdrop-blur font-bold px-3 py-1">
                      {event.packageType}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white font-mono font-bold tracking-widest">
                      ID: {event.shortId}
                    </div>
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-headline font-bold line-clamp-1 group-hover:text-accent transition-colors">
                    {event.nameEn}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3" />
                    {event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Date TBD'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Location</p>
                      <p className="text-xs font-semibold flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" /> {event.venue || 'Venue TBD'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Capacity</p>
                      <p className="text-xs font-semibold flex items-center gap-1">
                        <Users className="h-3 w-3 shrink-0" /> {event.guestLimit === 999999 ? 'Unlimited' : event.guestLimit} Guests
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="grid grid-cols-3 gap-2 border-t pt-4">
                  <Link href={`/dashboard?eventId=${event.id}`} className="w-full">
                    <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-tight hover:bg-primary/5">
                      Dash
                    </Button>
                  </Link>
                  <Link href={`/events/${event.id}/invite`} className="w-full">
                    <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-tight hover:bg-primary/5">
                      Invite
                    </Button>
                  </Link>
                  <Link href={`/events/${event.id}/scan`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase tracking-tight border-accent text-accent hover:bg-accent hover:text-white">
                      Scan
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card/50 rounded-3xl border border-dashed border-primary/20">
            <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-10 w-10 text-accent opacity-40" />
            </div>
            <h2 className="text-2xl font-headline font-bold mb-2">No Registries Found</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              You haven't created any event registries yet. Start your first one to begin guest management.
            </p>
            <Link href="/dashboard">
              <Button className="h-12 px-8 bg-primary text-primary-foreground font-bold group">
                Create My First Event <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </main>

      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">
            Powered by 360 Digital &bull; Premium Registry Services
          </p>
        </div>
      </footer>
    </div>
  );
}
