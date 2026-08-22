import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tryExtractFromEmbeddedXml } from "../lib/zugferd.ts";
import { validateInvoice } from "../lib/validate.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "fixtures", "test-invoices");
const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const live = process.argv.includes("--live");

const REQUIRED_FILES = [
  "clean.pdf",
  "math-error.pdf",
  "missing-vat-id.pdf",
  "malformed-vat-format.pdf",
  "zugferd-compliant.pdf",
  "messy-scan.jpg",
];

const CLEAN = {
  supplier: "Müller GmbH",
  invoiceNumber: "INV-23891",
  invoiceDate: "2026-08-12",
  vatId: "DE123456789",
  poNumber: "PO-4471",
  netAmount: 4800,
  vatAmount: 912,
  grossAmount: 5712,
  currency: "EUR",
};

const HIGH_CONFIDENCE = Object.fromEntries(
  [
    "supplier",
    "invoiceNumber",
    "invoiceDate",
    "vatId",
    "poNumber",
    "netAmount",
    "vatAmount",
    "grossAmount",
    "currency",
  ].map((key) => [key, 95]),
);

const LOW_CONFIDENCE = {
  ...HIGH_CONFIDENCE,
  supplier: 62,
  invoiceNumber: 58,
  vatId: 55,
  netAmount: 60,
  grossAmount: 59,
};

function asExtracted(overrides, confidence = HIGH_CONFIDENCE) {
  return {
    ...CLEAN,
    ...overrides,
    confidence,
    source: "ai-extraction",
  };
}

const OFFLINE_INTENT = {
  "clean.pdf": { extracted: asExtracted({}), decision: "accept" },
  "math-error.pdf": {
    extracted: asExtracted({ grossAmount: 5900 }),
    decision: "reject",
  },
  "missing-vat-id.pdf": {
    extracted: asExtracted({ vatId: null }),
    decision: "reject",
  },
  "malformed-vat-format.pdf": {
    extracted: asExtracted({ vatId: "DE12345" }),
    decision: "review",
    reasonIncludes: "format check only",
  },
  "messy-scan.jpg": {
    extracted: asExtracted({ poNumber: null }, LOW_CONFIDENCE),
    decision: "review",
  },
};

const LIVE_EXPECTED = {
  "clean.pdf": { decision: "accept", source: "ai-extraction" },
  "math-error.pdf": { decision: "reject", source: "ai-extraction" },
  "missing-vat-id.pdf": { decision: "reject", source: "ai-extraction" },
  "malformed-vat-format.pdf": {
    decision: "review",
    source: "ai-extraction",
    reasonIncludes: "format check only",
  },
  "zugferd-compliant.pdf": {
    decision: "accept",
    source: "embedded-xml",
  },
  "messy-scan.jpg": { decision: "review", source: "ai-extraction" },
};

const MIME = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const results = [];

function record(name, pass, note) {
  results.push({ name, pass, note });
}

async function postExtract(filename) {
  const ext = filename.slice(filename.lastIndexOf("."));
  const bytes = readFileSync(join(FIXTURES, filename));
  const mimeType = MIME[ext] ?? "application/octet-stream";
  const file = `data:${mimeType};base64,${bytes.toString("base64")}`;

  const res = await fetch(`${baseUrl}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file, mimeType }),
  });
  return { status: res.status, json: await res.json() };
}

for (const filename of REQUIRED_FILES) {
  try {
    readFileSync(join(FIXTURES, filename));
    record(`${filename} exists`, true, "ok");
  } catch {
    record(`${filename} exists`, false, "missing");
  }
}

const zugferdBytes = readFileSync(join(FIXTURES, "zugferd-compliant.pdf"));
const embedded = await tryExtractFromEmbeddedXml(new Uint8Array(zugferdBytes));
const zugferdValidation = embedded ? validateInvoice(embedded) : null;

record(
  "zugferd-compliant.pdf parses locally as embedded-xml",
  embedded?.source === "embedded-xml" &&
    embedded.invoiceNumber === "INV-23891" &&
    embedded.confidence.supplier === 100,
  embedded ? `${embedded.source} / ${embedded.invoiceNumber}` : "null",
);

record(
  "zugferd-compliant.pdf validates to accept locally",
  zugferdValidation?.decision === "accept",
  zugferdValidation?.decision ?? "null",
);

for (const [filename, intent] of Object.entries(OFFLINE_INTENT)) {
  const validation = validateInvoice(intent.extracted);
  const reasonOk =
    !intent.reasonIncludes ||
    validation.fields.vatId?.reason?.includes(intent.reasonIncludes);

  record(
    `${filename} (designed validation outcome)`,
    validation.decision === intent.decision && reasonOk,
    `decision=${validation.decision}`,
  );
}

if (live) {
  let apiReachable = true;

  for (const [filename, expected] of Object.entries(LIVE_EXPECTED)) {
    try {
      const { status, json } = await postExtract(filename);

      if (json.error) {
        record(`${filename} (live API)`, false, json.error);
        continue;
      }

      const decisionOk = json.validation?.decision === expected.decision;
      const sourceOk = !expected.source || json.source === expected.source;
      const reasonOk =
        !expected.reasonIncludes ||
        json.validation?.fields?.vatId?.reason?.includes(expected.reasonIncludes);

      record(
        `${filename} (live API)`,
        status === 200 && decisionOk && sourceOk && reasonOk,
        `decision=${json.validation?.decision} source=${json.source}`,
      );

      if (filename === "zugferd-compliant.pdf") {
        record(
          "zugferd-compliant.pdf uses embedded-xml path (no Gemini)",
          json.source === "embedded-xml",
          json.source,
        );
      }

      // ponytail: 2s pause avoids free-tier Gemini RPM bursts during batch verify
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      apiReachable = false;
      record(`${filename} (live API)`, false, String(error));
    }
  }

  if (!apiReachable) {
    console.error(
      "\nAPI not reachable. Start the dev server first: npm run dev\n",
    );
  }
}

console.log(JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass);
process.exit(failed.length ? 1 : 0);
