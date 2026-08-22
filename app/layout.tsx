import type { Metadata } from "next";
import { headers } from "next/headers";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { localeFromAcceptLanguage } from "@/lib/locale";
import "./globals.css";

const prefsInitScript = `(function(){try{var t=localStorage.getItem("rechnungslens-theme");if(t==="dark")document.documentElement.classList.add("dark");var l=localStorage.getItem("rechnungslens-locale");if(l!=="de"&&l!=="en"){l="en";var langs=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||"en"];for(var i=0;i<langs.length;i++){if(String(langs[i]).toLowerCase().indexOf("de")===0){l="de";break}}}document.documentElement.lang=l}catch(e){}})();`;

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "RechnungsLens · Incoming invoice review",
  description:
    "Review assistant for incoming German invoices. Extract, validate, and route to Release, Review, or Reject.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initialLocale = localeFromAcceptLanguage(
    (await headers()).get("accept-language"),
  );

  return (
    <html
      lang={initialLocale}
      suppressHydrationWarning
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <ThemeProvider>
          <LanguageProvider initialLocale={initialLocale}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
