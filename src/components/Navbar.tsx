"use client";

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "@/components/ui/button";
import { User, Menu } from "lucide-react";

export function Navbar() {
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-headline text-2xl font-bold tracking-tighter text-primary">
              Mwaliko<span className="text-accent">.</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="transition-colors hover:text-accent">{t('dashboard')}</Link>
            <Link href="/events" className="transition-colors hover:text-accent">{t('events')}</Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageToggle />
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="font-semibold text-primary">
              {t('login')}
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {t('register')}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}