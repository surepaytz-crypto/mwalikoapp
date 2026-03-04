"use client";

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "@/components/ui/button";
import { User, Menu, LogOut } from "lucide-react";
import { useUser, useAuth, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";

export function Navbar() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const isStaff = userProfile?.userRole === "ScannerStaff";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-headline text-2xl font-bold tracking-tighter text-primary">
              Mwaliko App<span className="text-accent">.</span>
            </span>
          </Link>
          
          {user && !isStaff && (
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium border-l pl-8 border-border">
              <Link href="/dashboard" className="transition-colors hover:text-accent font-semibold">{t('dashboard')}</Link>
              <Link href="/events" className="transition-colors hover:text-accent font-semibold">{t('events')}</Link>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <LanguageToggle />
          {!isStaff && user && (
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="hidden md:flex items-center space-x-4">
            {!userLoading && user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                  <User className="h-4 w-4 text-accent" />
                  <span className="text-xs font-semibold">
                    {isStaff ? "Staff Account" : (userProfile?.firstName || user.email?.split('@')[0])}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
              </>
            ) : (
              !userLoading && (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="font-semibold text-primary">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {t('register')}
                    </Button>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
