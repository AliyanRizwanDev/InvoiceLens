"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

const btnBase =
  "cursor-pointer rounded-sm px-2.5 py-1 font-sans text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-review";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  function option(code: Locale, label: string) {
    const active = locale === code;
    return (
      <button
        key={code}
        type="button"
        aria-pressed={active}
        aria-label={`${t.lang.switchTo}: ${label}`}
        onClick={() => setLocale(code)}
        className={`${btnBase} ${
          active
            ? "bg-ink text-paper"
            : "text-ink/60 hover:bg-ink/8 hover:text-ink"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      data-pref-toggle
      className="inline-flex items-center gap-0.5 rounded-sm border border-ledger-line bg-surface/80 p-0.5 shadow-sm backdrop-blur-sm"
      role="group"
      aria-label={t.lang.switchTo}
    >
      {option("en", "EN")}
      {option("de", "DE")}
    </div>
  );
}
