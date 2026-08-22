"use client";

import DecisionStamp from "@/components/DecisionStamp";
import FieldRow from "@/components/FieldRow";
import type { ExtractedInvoiceWithValidation } from "@/types/invoice";

const FIELD_ORDER = [
  { key: "supplier", label: "Supplier" },
  { key: "invoiceNumber", label: "Invoice Number" },
  { key: "invoiceDate", label: "Invoice Date" },
  { key: "vatId", label: "VAT ID" },
  { key: "poNumber", label: "PO Number" },
  { key: "netAmount", label: "Net Amount" },
  { key: "vatAmount", label: "VAT Amount" },
  { key: "grossAmount", label: "Gross Amount" },
  { key: "currency", label: "Currency" },
] as const;

type ResultsViewProps = {
  result: ExtractedInvoiceWithValidation;
  previewUrl: string | null;
  xmlPreview: string | null;
  isPdf: boolean;
  isImage: boolean;
  isXml: boolean;
};

function formatFieldValue(
  key: string,
  value: string | number | null,
  currency: string | null,
): string {
  if (value === null || value === "") return "—";
  if (typeof value === "number") {
    const formatted = value.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (key.includes("Amount") && currency) return `${formatted} ${currency}`;
    return formatted;
  }
  return String(value);
}

function buildDownloadRecord(result: ExtractedInvoiceWithValidation) {
  return {
    supplier: result.supplier,
    invoiceNumber: result.invoiceNumber,
    invoiceDate: result.invoiceDate,
    vatId: result.vatId,
    poNumber: result.poNumber,
    netAmount: result.netAmount,
    vatAmount: result.vatAmount,
    grossAmount: result.grossAmount,
    currency: result.currency,
    source: result.source,
    decision: result.validation.decision,
    fields: result.validation.fields,
  };
}

function downloadJson(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsView({
  result,
  previewUrl,
  xmlPreview,
  isPdf,
  isImage,
  isXml,
}: ResultsViewProps) {
  const isEmbeddedXml = result.source === "embedded-xml";
  const record = buildDownloadRecord(result);
  const caseRef = result.invoiceNumber ?? "Pending";

  return (
    <div className="mt-10 space-y-16 border-t border-ledger-line pt-10">
      {/* Extraction view */}
      <section aria-labelledby="extraction-heading">
        <h2
          id="extraction-heading"
          className="font-display text-xl text-ink sm:text-2xl"
        >
          Case: {caseRef}
        </h2>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div>
            {previewUrl && !isXml ? (
              <div className="rotate-[1deg] border border-ledger-line bg-white p-2 shadow-md">
                {isPdf ? (
                  <iframe
                    src={previewUrl}
                    title="Invoice preview"
                    className="h-96 w-full"
                  />
                ) : null}
                {isImage ? (
                  <img
                    src={previewUrl}
                    alt="Invoice preview"
                    className="max-h-96 w-full object-contain"
                  />
                ) : null}
              </div>
            ) : null}

            {xmlPreview && isXml ? (
              <div className="rotate-[1deg] border border-ledger-line bg-white p-2 shadow-md">
                <pre className="max-h-96 overflow-auto p-3 font-mono text-xs text-ink">
                  {xmlPreview}
                </pre>
              </div>
            ) : null}
          </div>

          <div>
            {isEmbeddedXml ? (
              <p className="mb-4 font-sans text-sm text-ink/70">
                Structured data found — read directly, no AI extraction needed.
              </p>
            ) : null}

            <div>
              {FIELD_ORDER.map(({ key, label }) => (
                <FieldRow
                  key={key}
                  label={label}
                  value={formatFieldValue(key, result[key], result.currency)}
                  confidence={result.confidence[key] ?? null}
                  showConfidence={!isEmbeddedXml}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Decision view */}
      <section aria-labelledby="decision-heading" className="text-center">
        <h2 id="decision-heading" className="sr-only">
          Validation decision
        </h2>

        <div className="py-8">
          <DecisionStamp decision={result.validation.decision} />
        </div>

        <div className="mx-auto max-w-xl text-left">
          {FIELD_ORDER.map(({ key, label }) => {
            const field = result.validation.fields[key];
            if (!field) return null;
            return (
              <FieldRow
                key={key}
                label={label}
                value={formatFieldValue(key, field.value, result.currency)}
                confidence={field.confidence}
                showConfidence={false}
                status={field.status}
                reason={field.reason}
              />
            );
          })}
        </div>
      </section>

      {/* Structured output view */}
      <section aria-labelledby="output-heading">
        <h2
          id="output-heading"
          className="font-display text-lg text-ink sm:text-xl"
        >
          Structured Record
        </h2>

        <p className="mt-2 font-sans text-sm text-ink/60">
          Demo representation of the extracted data — not a certified compliant
          e-invoice.
        </p>

        <pre className="mt-4 overflow-x-auto border border-ledger-line bg-white/60 p-4 font-mono text-xs leading-relaxed text-ink">
          {JSON.stringify(record, null, 2)}
        </pre>

        <button
          type="button"
          onClick={() =>
            downloadJson(record, `invoice-${caseRef.replace(/\s+/g, "-")}.json`)
          }
          className="mt-4 border-2 border-ink px-6 py-2.5 font-display text-sm tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-review"
        >
          DOWNLOAD RECORD
        </button>
      </section>
    </div>
  );
}
