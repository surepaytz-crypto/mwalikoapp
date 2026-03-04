
"use client";

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "@/components/ui/button";
import { User, Menu, LogOut, Calendar, LayoutDashboard } from "lucide-react";
import { useUser, useAuth, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const handleLogout = async () => {
    await signOut(auth);
    setIsOpen(false);
    router.push("/");
  };

  const isStaff = userProfile?.userRole === "ScannerStaff";
  const isAuthenticated = !!user && !userLoading;

  const navLinks = [
    { href: "/dashboard", label: t('dashboard'), icon: LayoutDashboard },
    { href: "/events", label: t('events'), icon: Calendar },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-headline text-2xl font-bold tracking-tighter text-primary">
              Mwaliko App<span className="text-accent">.</span>
            </span>
          </Link>
          
          {isAuthenticated && !isStaff && (
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium border-l pl-8 border-border">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={cn(
                    "transition-colors hover:text-accent font-semibold",
                    pathname === link.href ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <LanguageToggle />
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-headline text-2xl font-bold">Mwaliko App</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-12">
                  {isAuthenticated && !isStaff && (
                    <div className="flex flex-col gap-4">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-4 text-lg font-semibold transition-colors p-2 rounded-lg",
                            pathname === link.href ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <link.icon className="h-5 w-5" />
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-6">
                    {!userLoading && user ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-bold truncate max-w-[180px]">
                              {isStaff ? "Staff Account" : (userProfile?.firstName || user.email?.split('@')[0])}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive" 
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          {t('logout')}
                        </Button>
                      </div>
                    ) : (
                      !userLoading && (
                        <div className="flex flex-col gap-3">
                          <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                            <Button variant="outline" className="w-full font-bold">
                              {t('login')}
                            </Button>
                          </Link>
                          <Link href="/register" onClick={() => setIsOpen(false)} className="w-full">
                            <Button className="w-full bg-primary text-primary-foreground font-bold">
                              {t('register')}
                            </Button>
                          </Link>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop User Profile / Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {!userLoading && user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                  <User className="h-4 w-4 text-accent" />
                  <span className="text-xs font-semibold">
                    {isStaff ? "Staff" : (userProfile?.firstName || user.email?.split('@')[0])}
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
