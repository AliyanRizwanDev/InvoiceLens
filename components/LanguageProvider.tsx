"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { translations, type Locale, type TranslationKey } from "@/lib/i18n";
import { LOCALE_STORAGE_KEY, resolveLocale } from "@/lib/locale";
import { useTheme, type Theme } from "@/components/ThemeProvider";

const STORAGE_KEY = LOCALE_STORAGE_KEY;
const THEME_STORAGE_KEY = "rechnungslens-theme";

function readLocale(): Locale {
  return resolveLocale();
}

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function setStoredLocale(next: Locale) {
  localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

function clientPrefsMatch(theme: Theme, locale: Locale): boolean {
  if (typeof window === "undefined") return false;
  const storedTheme =
    localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  const storedLocale = localStorage.getItem(STORAGE_KEY);
  const resolvedLocale =
    storedLocale === "de" || storedLocale === "en"
      ? storedLocale
      : resolveLocale();
  return theme === storedTheme && locale === resolvedLocale;
}

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKey;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const { theme } = useTheme();
  const locale = useSyncExternalStore(
    subscribe,
    readLocale,
    () => initialLocale,
  );

  useLayoutEffect(() => {
    if (clientPrefsMatch(theme, locale)) {
      document.documentElement.dataset.uiReady = "true";
    } else {
      delete document.documentElement.dataset.uiReady;
    }
  }, [theme, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translations[locale].meta.pageTitle;
  }, [locale]);

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale: setStoredLocale, t: translations[locale] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
