export interface ExtractedInvoice {
  supplier: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  vatId: string | null;
  poNumber: string | null;
  netAmount: number | null;
  vatAmount: number | null;
  grossAmount: number | null;
  currency: string | null;
  confidence: Record<string, number>; // per-field confidence, 0–100
  source: "embedded-xml" | "ai-extraction";
}
