import { describe, it, expect } from "vitest";
import { validateInvoice } from "./validate";
import type { ExtractedInvoice } from "@/types/invoice";

const cleanInvoice: ExtractedInvoice = {
  supplier: "Müller GmbH",
  invoiceNumber: "23891",
  invoiceDate: "2026-08-12",
  vatId: "DE123456789",
  poNumber: "PO-4471",
  netAmount: 4800,
  vatAmount: 912,
  grossAmount: 5712,
  currency: "EUR",
  confidence: {
    supplier: 98,
    invoiceNumber: 99,
    invoiceDate: 97,
    vatId: 95,
    poNumber: 90,
    netAmount: 98,
    vatAmount: 98,
    grossAmount: 98,
    currency: 99,
  },
  source: "ai-extraction",
};

describe("validateInvoice", () => {
  it("accepts a fully clean invoice", () => {
    expect(validateInvoice(cleanInvoice).decision).toBe("accept");
  });

  it("rejects a missing VAT ID", () => {
    const result = validateInvoice({ ...cleanInvoice, vatId: null });
    expect(result.decision).toBe("reject");
  });

  it("rejects a math mismatch", () => {
    const result = validateInvoice({ ...cleanInvoice, grossAmount: 5900 });
    expect(result.decision).toBe("reject");
  });

  it("flags a missing PO number as review, not reject", () => {
    const result = validateInvoice({ ...cleanInvoice, poNumber: null });
    expect(result.decision).toBe("review");
  });

  it("flags low-confidence fields as review even when the format is fine", () => {
    const result = validateInvoice({
      ...cleanInvoice,
      confidence: { ...cleanInvoice.confidence, vatId: 40 },
    });
    expect(result.decision).toBe("review");
  });

  it("flags a malformed VAT ID as review with format-only wording", () => {
    const result = validateInvoice({ ...cleanInvoice, vatId: "DE12345" });
    expect(result.decision).toBe("review");
    expect(result.fields.vatId.reason).toContain("format check only");
  });
});
