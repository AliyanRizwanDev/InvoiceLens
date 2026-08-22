import type { Locale } from "@/lib/i18n";

export const LOCALE_STORAGE_KEY = "rechnungslens-locale";

/** German (`de`, `de-DE`, `de-AT`, …) → `de`; everything else → `en`. */
export function localeFromLanguages(languages: readonly string[]): Locale {
  for (const lang of languages) {
    if (lang.toLowerCase().startsWith("de")) return "de";
  }
  return "en";
}

export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "en";
  const languages = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim() ?? "")
    .filter(Boolean);
  return localeFromLanguages(languages);
}

export function resolveLocale(): Locale {
  if (typeof window === "undefined") return "en";

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "de" || stored === "en") return stored;

  const languages =
    navigator.languages?.length > 0
      ? navigator.languages
      : [navigator.language || "en"];
  return localeFromLanguages(languages);
}
