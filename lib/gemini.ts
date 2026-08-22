import { GoogleGenAI, type Schema } from "@google/genai";

export function getAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

export const EXTRACTION_PROMPT = `
You are an invoice data extraction system. Extract the following fields from the provided invoice document. If a field is not present or not legible, return null for that field rather than guessing.

Fields to extract:
- supplier: the name of the company that issued the invoice
- invoiceNumber: the invoice's unique identifier or number
- invoiceDate: the invoice issue date, in YYYY-MM-DD format if possible
- vatId: the supplier's VAT identification number
- poNumber: the purchase order number, if referenced
- netAmount: the total before tax, as a plain number
- vatAmount: the tax amount, as a plain number
- grossAmount: the total including tax, as a plain number
- currency: the three-letter currency code (e.g. EUR)

For each field, also provide a confidence score from 0 to 100 reflecting how certain you are that the extracted value is correct and clearly legible in the source document. A low score should reflect genuine uncertainty (e.g. blurry text, ambiguous formatting) — do not default every field to a high score.
`;

export const invoiceSchema = {
  type: "object",
  properties: {
    supplier: { type: "string", nullable: true },
    invoiceNumber: { type: "string", nullable: true },
    invoiceDate: { type: "string", nullable: true },
    vatId: { type: "string", nullable: true },
    poNumber: { type: "string", nullable: true },
    netAmount: { type: "number", nullable: true },
    vatAmount: { type: "number", nullable: true },
    grossAmount: { type: "number", nullable: true },
    currency: { type: "string", nullable: true },
    confidence: {
      type: "object",
      properties: {
        supplier: { type: "number" },
        invoiceNumber: { type: "number" },
        invoiceDate: { type: "number" },
        vatId: { type: "number" },
        poNumber: { type: "number" },
        netAmount: { type: "number" },
        vatAmount: { type: "number" },
        grossAmount: { type: "number" },
        currency: { type: "number" },
      },
      required: [
        "supplier",
        "invoiceNumber",
        "invoiceDate",
        "vatId",
        "poNumber",
        "netAmount",
        "vatAmount",
        "grossAmount",
        "currency",
      ],
    },
  },
  required: [
    "supplier",
    "invoiceNumber",
    "invoiceDate",
    "vatId",
    "poNumber",
    "netAmount",
    "vatAmount",
    "grossAmount",
    "currency",
    "confidence",
  ],
} as unknown as Schema;

export function stripBase64Prefix(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? dataUrl;
}
