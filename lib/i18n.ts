export type Locale = "en" | "de";

export const translations = {
  en: {
    meta: {
      productName: "RechnungsLens",
      pageTitle: "RechnungsLens · Incoming invoice review",
      eyebrow: "Incoming invoices · Germany",
      tagline:
        "Review assistant for incoming invoices: extract fields, run mandatory checks, then route to Release, Review, or Reject, with a clear reason for every field.",
      formats: "PDF · Scan · ZUGFeRD (XML in PDF) · XRechnung (XML)",
    },
    upload: {
      dragActive: "Drop your invoice here",
      dragIdle: "Drag and drop an invoice here, or click to browse",
      formats: "PDF · JPG · PNG · structured e-invoice (XRechnung / ZUGFeRD XML)",
      maxSize: "max. 3 MB",
      xmlNote:
        "Note: any .xml file can be selected, but only XRechnung or ZUGFeRD invoice XML is processed. Other XML fails at processing time.",
      rejectGeneric: "File could not be accepted.",
      rejectSize: "File is too large (max. 3 MB).",
      rejectType:
        "Only PDF, JPG, PNG, or structured e-invoice XML (XRechnung / ZUGFeRD).",
    },
    file: {
      ready: "Ready",
      loading: "Loading…",
      remove: "Remove",
      preview: "Preview",
      previewTitle: "Invoice preview",
      kindPdf: "PDF",
      kindImage: "Scan (image)",
      kindXml: "E-invoice (XML)",
      kindOther: "Document",
    },
    actions: {
      process: "Review invoice",
      processing: "Reading invoice…",
      download: "Download record",
    },
    errors: {
      extract:
        "Could not read this document. Try a clearer scan or a different file.",
    },
    results: {
      case: "Case",
      pending: "Pending",
      embeddedXmlNote:
        "Structured data found. Read directly, no AI extraction needed.",
      structuredRecord: "Structured record",
      structuredDisclaimer:
        "Demo representation of the extracted data. Not a certified compliant e-invoice.",
      validationDecision: "Validation decision",
    },
    stamp: {
      accept: "ACCEPTED",
      review: "NEEDS REVIEW",
      reject: "REJECTED",
      aria: "Decision",
    },
    fields: {
      supplier: "Supplier",
      invoiceNumber: "Invoice number",
      invoiceDate: "Invoice date",
      vatId: "VAT ID",
      poNumber: "PO number",
      netAmount: "Net amount",
      vatAmount: "VAT amount",
      grossAmount: "Gross amount",
      currency: "Currency",
    },
    lang: {
      en: "English",
      de: "Deutsch",
      switchTo: "Switch language",
    },
    theme: {
      light: "Light",
      dark: "Dark",
      switchTo: "Switch theme",
    },
  },
  de: {
    meta: {
      productName: "RechnungsLens",
      pageTitle: "RechnungsLens · Eingangsrechnungen prüfen",
      eyebrow: "Eingangsrechnungen · Deutschland",
      tagline:
        "Prüfassistent für eingehende Rechnungen: Felder extrahieren, Pflichtregeln prüfen, dann Freigeben, Prüfen oder Ablehnen, mit nachvollziehbarer Begründung pro Feld.",
      formats: "PDF · Scan · ZUGFeRD (XML in PDF) · XRechnung (XML)",
    },
    upload: {
      dragActive: "Rechnung hier ablegen",
      dragIdle: "Rechnung hier ablegen oder auswählen",
      formats:
        "PDF · JPG · PNG · strukturierte E-Rechnung (XRechnung / ZUGFeRD-XML)",
      maxSize: "max. 3 MB",
      xmlNote:
        "Hinweis: Beliebige XML-Dateien lassen sich zwar hochladen, verarbeitet werden nur Rechnungen im XRechnung- oder ZUGFeRD-Format.",
      rejectGeneric: "Datei konnte nicht übernommen werden.",
      rejectSize: "Datei ist zu groß (max. 3 MB).",
      rejectType:
        "Nur PDF, JPG, PNG oder strukturierte E-Rechnungs-XML (XRechnung / ZUGFeRD).",
    },
    file: {
      ready: "Bereit",
      loading: "Wird geladen…",
      remove: "Entfernen",
      preview: "Vorschau",
      previewTitle: "Rechnungsvorschau",
      kindPdf: "PDF",
      kindImage: "Scan (Bild)",
      kindXml: "E-Rechnung (XML)",
      kindOther: "Dokument",
    },
    actions: {
      process: "Rechnung prüfen",
      processing: "Rechnung wird gelesen…",
      download: "Datensatz herunterladen",
    },
    errors: {
      extract:
        "Dokument konnte nicht gelesen werden. Bitte einen klareren Scan oder eine andere Datei versuchen.",
    },
    results: {
      case: "Vorgang",
      pending: "Ausstehend",
      embeddedXmlNote:
        "Strukturierte Daten gefunden. Direkt gelesen, keine KI-Extraktion nötig.",
      structuredRecord: "Strukturierter Datensatz",
      structuredDisclaimer:
        "Demo-Darstellung der extrahierten Daten. Keine zertifizierte E-Rechnung.",
      validationDecision: "Prüfergebnis",
    },
    stamp: {
      accept: "FREIGEGEBEN",
      review: "PRÜFUNG NÖTIG",
      reject: "ABGELEHNT",
      aria: "Entscheidung",
    },
    fields: {
      supplier: "Lieferant",
      invoiceNumber: "Rechnungsnummer",
      invoiceDate: "Rechnungsdatum",
      vatId: "USt-IdNr.",
      poNumber: "Bestellnummer",
      netAmount: "Nettobetrag",
      vatAmount: "MwSt.",
      grossAmount: "Gesamtbetrag",
      currency: "Währung",
    },
    lang: {
      en: "English",
      de: "Deutsch",
      switchTo: "Sprache wechseln",
    },
    theme: {
      light: "Hell",
      dark: "Dunkel",
      switchTo: "Design wechseln",
    },
  },
} as const satisfies Record<Locale, Record<string, unknown>>;

export type TranslationKey = (typeof translations)[Locale];
