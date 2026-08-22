"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { translations, type Locale, type TranslationKey } from "@/lib/i18n";
import { LOCALE_STORAGE_KEY, resolveLocale } from "@/lib/locale";

const STORAGE_KEY = LOCALE_STORAGE_KEY;

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
  const locale = useSyncExternalStore(
    subscribe,
    readLocale,
    () => initialLocale,
  );

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
