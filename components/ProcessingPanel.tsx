"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function ProcessingPanel() {
  const { t } = useLanguage();

  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-live="polite"
      aria-label={t.actions.processing}
    >
      <p className="font-sans text-sm text-ink/70">{t.actions.processing}</p>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="h-80 border border-ledger-line bg-white/50 motion-safe:animate-pulse" />
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between border-b border-ledger-line py-3"
            >
              <div className="h-4 w-28 bg-ledger-line/50 motion-safe:animate-pulse" />
              <div className="h-4 w-36 bg-ledger-line/50 motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
