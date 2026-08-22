import { XMLParser } from "fast-xml-parser";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFStream,
  PDFString,
  decodePDFRawStream,
  type PDFObject,
  type PDFRawStream,
} from "pdf-lib";
import type { ExtractedInvoice } from "@/types/invoice";

const FIELD_KEYS = [
  "supplier",
  "invoiceNumber",
  "invoiceDate",
  "vatId",
  "poNumber",
  "netAmount",
  "vatAmount",
  "grossAmount",
  "currency",
] as const;

const XML_NAME_HINT =
  /zugferd|factur-x|facturx|xrechnung|order-x|invoice\.xml|\.xml$/i;

function scalar(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("#text" in record) return scalar(record["#text"]);
    if ("DateTimeString" in record) return scalar(record.DateTimeString);
  }
  return null;
}

function numberVal(value: unknown): number | null {
  const text = scalar(value);
  if (text == null) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInvoiceDate(value: unknown): string | null {
  const text = scalar(value);
  if (!text) return null;
  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return text;
}

function currencyFrom(value: unknown): string | null {
  if (value == null || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const code = record["@_currencyID"];
  return typeof code === "string" ? code : null;
}

function findFirst(obj: unknown, key: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findFirst(item, key);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  const record = obj as Record<string, unknown>;
  if (key in record) return record[key];

  for (const value of Object.values(record)) {
    const found = findFirst(value, key);
    if (found !== undefined) return found;
  }

  return undefined;
}

function pickXmlAttachmentName(names: string[]): string | null {
  const xmlNames = names.filter((name) => XML_NAME_HINT.test(name));
  if (xmlNames.length === 0) return null;

  const ranked = [...xmlNames].sort((a, b) => {
    const score = (name: string) => {
      if (/zugferd|factur-x|facturx|xrechnung/i.test(name)) return 0;
      if (/\.xml$/i.test(name)) return 1;
      return 2;
    };
    return score(a) - score(b);
  });

  return ranked[0] ?? null;
}

function decodeAttachmentName(value: PDFObject): string {
  if (value instanceof PDFString || value instanceof PDFHexString) {
    return value.decodeText();
  }
  throw new Error("Unexpected embedded file name type");
}

async function readPdfAttachments(
  pdfBytes: Uint8Array,
): Promise<{ name: string; data: Uint8Array }[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const catalog = pdfDoc.catalog;

  if (!catalog.has(PDFName.of("Names"))) return [];

  const names = catalog.lookup(PDFName.of("Names"), PDFDict);
  if (!names.has(PDFName.of("EmbeddedFiles"))) return [];

  const embeddedFiles = names.lookup(PDFName.of("EmbeddedFiles"), PDFDict);
  if (!embeddedFiles.has(PDFName.of("Names"))) return [];

  const efNames = embeddedFiles.lookup(PDFName.of("Names"), PDFArray);
  const attachments: { name: string; data: Uint8Array }[] = [];

  for (let i = 0; i < efNames.size(); i += 2) {
    const nameObject = efNames.lookup(i);
    if (!nameObject) continue;
    const fileName = decodeAttachmentName(nameObject);
    const fileSpec = efNames.lookup(i + 1, PDFDict);
    const stream = fileSpec
      .lookup(PDFName.of("EF"), PDFDict)
      .lookup(PDFName.of("F"), PDFStream);
    attachments.push({
      name: fileName,
      data: decodePDFRawStream(stream as unknown as PDFRawStream).decode(),
    });
  }

  return attachments;
}

export async function extractEmbeddedXmlFromPdf(
  pdfBytes: Uint8Array,
): Promise<string | null> {
  const attachments = await readPdfAttachments(pdfBytes);
  if (attachments.length === 0) return null;

  const attachmentName = pickXmlAttachmentName(
    attachments.map((attachment) => attachment.name),
  );
  if (!attachmentName) return null;

  const match = attachments.find((attachment) => attachment.name === attachmentName);
  if (!match) return null;

  return new TextDecoder("utf-8").decode(match.data);
}

// ponytail: best-effort CII tag mapping, not a full ZUGFeRD parser
export function parseEmbeddedXml(xml: string): ExtractedInvoice | null {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    attributeNamePrefix: "@_",
  });

  let parsed: unknown;
  try {
    parsed = parser.parse(xml);
  } catch {
    return null;
  }

  const seller = findFirst(parsed, "SellerTradeParty") as
    | Record<string, unknown>
    | undefined;
  const exchanged = findFirst(parsed, "ExchangedDocument") as
    | Record<string, unknown>
    | undefined;
  const totals = findFirst(
    parsed,
    "SpecifiedTradeSettlementHeaderMonetarySummation",
  ) as Record<string, unknown> | undefined;

  const netAmountNode = totals?.TaxBasisTotalAmount;
  const vatAmountNode = totals?.TaxTotalAmount;
  const grossAmountNode = totals?.GrandTotalAmount;

  const taxRegistration = seller?.SpecifiedTaxRegistration;
  const taxRegistrationId = Array.isArray(taxRegistration)
    ? taxRegistration[0]
    : taxRegistration;

  const buyerOrder = findFirst(parsed, "BuyerOrderReferencedDocument") as
    | Record<string, unknown>
    | undefined;

  const invoice: ExtractedInvoice = {
    supplier: scalar(seller?.Name),
    invoiceNumber: scalar(exchanged?.ID),
    invoiceDate: parseInvoiceDate(findFirst(exchanged, "DateTimeString")),
    vatId: scalar(
      typeof taxRegistrationId === "object"
        ? (taxRegistrationId as Record<string, unknown>).ID
        : taxRegistrationId,
    ),
    poNumber: scalar(buyerOrder?.IssuerAssignedID),
    netAmount: numberVal(netAmountNode),
    vatAmount: numberVal(vatAmountNode),
    grossAmount: numberVal(grossAmountNode),
    currency:
      currencyFrom(netAmountNode) ??
      currencyFrom(vatAmountNode) ??
      currencyFrom(grossAmountNode),
    confidence: Object.fromEntries(FIELD_KEYS.map((key) => [key, 100])),
    source: "embedded-xml",
  };

  const hasData = FIELD_KEYS.some((key) => {
    if (key === "currency") return invoice.currency != null;
    return invoice[key] != null;
  });

  return hasData ? invoice : null;
}

export async function tryExtractFromEmbeddedXml(
  pdfBytes: Uint8Array,
): Promise<ExtractedInvoice | null> {
  try {
    const xml = await extractEmbeddedXmlFromPdf(pdfBytes);
    if (!xml) return null;
    return parseEmbeddedXml(xml);
  } catch (error) {
    console.warn("Embedded XML extraction failed, falling back to AI:", error);
    return null;
  }
}
