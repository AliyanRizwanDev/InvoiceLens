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

export type FieldStatus = "pass" | "warning" | "fail";

export interface FieldResult {
  value: string | number | null;
  confidence: number | null;
  status: FieldStatus;
  reason: string;
}

export interface ValidationResult {
  decision: "accept" | "review" | "reject";
  fields: Record<string, FieldResult>;
}

export interface ExtractedInvoiceWithValidation extends ExtractedInvoice {
  validation: ValidationResult;
}
