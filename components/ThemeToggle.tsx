"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { useTheme, type Theme } from "@/components/ThemeProvider";

const btnBase =
  "cursor-pointer rounded-sm px-2.5 py-1 font-sans text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-review";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  function option(value: Theme, label: string) {
    const active = theme === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        aria-label={`${t.theme.switchTo}: ${label}`}
        onClick={() => setTheme(value)}
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
      className="inline-flex items-center gap-0.5 rounded-sm border border-ledger-line bg-surface/80 p-0.5 shadow-sm backdrop-blur-sm"
      role="group"
      aria-label={t.theme.switchTo}
    >
      {option("light", t.theme.light)}
      {option("dark", t.theme.dark)}
    </div>
  );
}
