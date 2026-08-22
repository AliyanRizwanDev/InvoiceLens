import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { PDFDocument } from "pdf-lib";
import { stripBase64Prefix } from "../lib/gemini.ts";
import { parseEmbeddedXml, tryExtractFromEmbeddedXml } from "../lib/zugferd.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = __dirname;

const results = [];
function record(item, pass, note) {
  results.push({ item, pass, note });
}

// Part A: base64 prefix strip
const prefixed =
  "data:application/pdf;base64,JVBERi0xLjQK";
const stripped = stripBase64Prefix(prefixed);
record(
  "Base64 prefix stripped before Gemini",
  stripped === "JVBERi0xLjQK" && !stripped.startsWith("data:"),
  `got: ${stripped.slice(0, 20)}...`,
);

// Part B: XML parser
const xml = readFileSync(join(fixtures, "sample-zugferd.xml"), "utf8");
const parsed = parseEmbeddedXml(xml);
record(
  "ZUGFeRD XML parses to ExtractedInvoice shape",
  parsed?.source === "embedded-xml" &&
    parsed.supplier === "Acme GmbH" &&
    parsed.invoiceNumber === "INV-TEST-001" &&
    parsed.currency === "EUR" &&
    parsed.confidence.supplier === 100,
  parsed ? JSON.stringify(parsed) : "null",
);

// Part B: build PDF with embedded XML attachment
const pdfDoc = await PDFDocument.create();
pdfDoc.attach(Buffer.from(xml, "utf8"), "factur-x.xml", {
  mimeType: "text/xml",
  description: "ZUGFeRD invoice XML",
});
const pdfBytes = await pdfDoc.save();
writeFileSync(join(fixtures, "sample-zugferd.pdf"), pdfBytes);

const embedded = await tryExtractFromEmbeddedXml(new Uint8Array(pdfBytes));
record(
  "ZUGFeRD PDF detected via embedded attachment",
  embedded?.source === "embedded-xml" && embedded.invoiceNumber === "INV-TEST-001",
  embedded ? embedded.source : "null",
);

// Plain PDF without attachment should not match embedded path
const plainPdf = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n0\n%%EOF\n",
);
const plainEmbedded = await tryExtractFromEmbeddedXml(new Uint8Array(plainPdf));
record(
  "Plain PDF falls through (no embedded XML result)",
  plainEmbedded === null,
);

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function postExtract(body) {
  const res = await fetch(`${baseUrl}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

try {
  const zugferdB64 = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString("base64")}`;
  const zugferdRes = await postExtract({
    file: zugferdB64,
    mimeType: "application/pdf",
  });
  record(
    "API returns embedded-xml for ZUGFeRD PDF",
    zugferdRes.json.source === "embedded-xml" &&
      zugferdRes.json.confidence?.supplier === 100,
    JSON.stringify(zugferdRes.json).slice(0, 120),
  );

  const plainB64 = `data:application/pdf;base64,${plainPdf.toString("base64")}`;
  const plainRes = await postExtract({
    file: plainB64,
    mimeType: "application/pdf",
  });
  record(
    "Plain PDF API falls through to AI or friendly error (not embedded-xml)",
    plainRes.json.source !== "embedded-xml",
    plainRes.json.source ?? plainRes.json.error ?? `status ${plainRes.status}`,
  );
} catch (error) {
  record("Live API reachable", false, String(error));
}

console.log(JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass);
process.exit(failed.length ? 1 : 0);
