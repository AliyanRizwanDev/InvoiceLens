"use client";

import DecisionStamp from "@/components/DecisionStamp";
import FieldRow from "@/components/FieldRow";
import { useLanguage } from "@/components/LanguageProvider";
import { btnStamp } from "@/lib/ui";
import type { ExtractedInvoiceWithValidation } from "@/types/invoice";

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

function buildCompactRecord(result: ExtractedInvoiceWithValidation) {
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
  };
}

function buildDownloadRecord(result: ExtractedInvoiceWithValidation) {
  return {
    ...buildCompactRecord(result),
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
  const { t } = useLanguage();
  const isEmbeddedXml = result.source === "embedded-xml";
  const compactRecord = buildCompactRecord(result);
  const downloadRecord = buildDownloadRecord(result);
  const caseRef = result.invoiceNumber ?? t.results.pending;

  return (
    <div className="motion-safe:animate-fade-in space-y-14">
      <section aria-labelledby="extraction-heading">
        <h2
          id="extraction-heading"
          className="font-display text-xl text-ink sm:text-2xl"
        >
          {t.results.case}: {caseRef}
        </h2>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div>
            {previewUrl && !isXml ? (
              <div className="rotate-[1deg] border border-ledger-line bg-white p-2 shadow-md transition-shadow hover:shadow-lg">
                {isPdf ? (
                  <iframe
                    src={previewUrl}
                    title={t.file.previewTitle}
                    className="h-80 w-full"
                  />
                ) : null}
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- blob URL preview
                  <img
                    src={previewUrl}
                    alt={t.file.previewTitle}
                    className="max-h-80 w-full object-contain"
                  />
                ) : null}
              </div>
            ) : null}

            {xmlPreview && isXml ? (
              <div className="rotate-[1deg] border border-ledger-line bg-white p-2 shadow-md transition-shadow hover:shadow-lg">
                <pre className="max-h-80 overflow-y-auto p-3 font-mono text-xs text-ink">
                  {xmlPreview}
                </pre>
              </div>
            ) : null}
          </div>

          <div>
            {isEmbeddedXml ? (
              <p className="mb-4 font-sans text-sm text-ink/70">
                {t.results.embeddedXmlNote}
              </p>
            ) : null}

            <div>
              {FIELD_KEYS.map((key) => (
                <FieldRow
                  key={key}
                  label={t.fields[key]}
                  value={formatFieldValue(key, result[key], result.currency)}
                  confidence={result.confidence[key] ?? null}
                  showConfidence={!isEmbeddedXml}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="decision-heading" className="text-center">
        <h2 id="decision-heading" className="sr-only">
          {t.results.validationDecision}
        </h2>

        <div className="py-8">
          <DecisionStamp decision={result.validation.decision} />
        </div>

        <div className="mx-auto max-w-xl text-left">
          {FIELD_KEYS.map((key) => {
            const field = result.validation.fields[key];
            if (!field) return null;
            return (
              <FieldRow
                key={key}
                label={t.fields[key]}
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

      <section aria-labelledby="output-heading">
        <h2
          id="output-heading"
          className="font-display text-lg text-ink sm:text-xl"
        >
          {t.results.structuredRecord}
        </h2>

        <p className="mt-2 font-sans text-sm text-ink/60">
          {t.results.structuredDisclaimer}
        </p>

        <div className="mt-4 max-h-56 overflow-y-auto overflow-x-auto border border-ledger-line bg-white/60 shadow-inner">
          <pre className="p-4 font-mono text-xs leading-relaxed text-ink">
            {JSON.stringify(compactRecord, null, 2)}
          </pre>
        </div>

        <button
          type="button"
          onClick={() =>
            downloadJson(
              downloadRecord,
              `invoice-${caseRef.replace(/\s+/g, "-")}.json`,
            )
          }
          className={`mt-4 ${btnStamp}`}
        >
          {t.actions.download.toUpperCase()}
        </button>
      </section>
    </div>
  );
}
