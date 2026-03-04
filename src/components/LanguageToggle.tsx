"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
      className="flex items-center gap-2 border-accent hover:bg-accent/10"
    >
      <Languages className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold uppercase tracking-wider">
        {language === 'en' ? 'SW' : 'EN'}
      </span>
    </Button>
  );
}