"use client";

import { useEffect, useState } from "react";
import ResultsView from "@/components/ResultsView";
import UploadZone from "@/components/UploadZone";
import { toBase64 } from "@/lib/toBase64";
import type { ExtractedInvoiceWithValidation } from "@/types/invoice";

function fileMimeType(file: File): string {
  if (file.type) return file.type;
  if (file.name.toLowerCase().endsWith(".xml")) return "application/xml";
  return file.type;
}

function isXmlFile(file: File): boolean {
  return isXmlMime(fileMimeType(file)) || file.name.toLowerCase().endsWith(".xml");
}

function isXmlMime(mimeType: string): boolean {
  return mimeType === "application/xml" || mimeType === "text/xml";
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [xmlPreview, setXmlPreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractedInvoiceWithValidation | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setXmlPreview(null);
      setBase64Data(null);
      return;
    }

    setResult(null);
    setError(null);
    setXmlPreview(null);

    if (isXmlFile(file)) {
      setPreviewUrl(null);
      let cancelled = false;
      void file.text().then((text) => {
        if (!cancelled) setXmlPreview(text);
      });
      void toBase64(file).then((data) => {
        if (!cancelled) setBase64Data(data);
      });
      return () => {
        cancelled = true;
      };
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    let cancelled = false;
    void toBase64(file).then((data) => {
      if (!cancelled) setBase64Data(data);
    });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  async function handleProcess() {
    if (!file || !base64Data) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64Data, mimeType: fileMimeType(file) }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setError(
          data.error ??
            "Could not read this document. Try a clearer scan or a different file.",
        );
        return;
      }

      setResult(data as ExtractedInvoiceWithValidation);
    } catch {
      setError(
        "Could not read this document. Try a clearer scan or a different file.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  const isPdf = file?.type === "application/pdf";
  const isImage = file?.type.startsWith("image/") ?? false;
  const isXml = file ? isXmlFile(file) : false;

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <main className="w-full max-w-5xl border border-ledger-line bg-paper p-6 sm:p-10">
        <h1 className="text-center font-display text-3xl text-ink sm:text-4xl">
          InvoiceLens
        </h1>
        <p className="mt-2 mb-8 text-center font-sans text-sm text-ink/70">
          Upload an invoice to extract and validate its data
        </p>

        <UploadZone onFileAccepted={setFile} />

        {isProcessing ? (
          <div className="mt-8 space-y-3" aria-busy="true" aria-live="polite">
            <p className="font-sans text-sm text-ink/70">Reading invoice...</p>
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-ledger-line py-3"
                >
                  <div className="h-4 w-24 bg-ledger-line/40 motion-safe:animate-pulse" />
                  <div className="h-4 w-32 bg-ledger-line/40 motion-safe:animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleProcess}
              disabled={!file || !base64Data}
              className="border-2 border-ink px-6 py-2.5 font-sans text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-review disabled:cursor-not-allowed disabled:opacity-50"
            >
              Process Invoice
            </button>
          </div>
        )}

        {error ? (
          <p className="mt-6 font-sans text-sm text-stamp-reject" role="alert">
            {error}
          </p>
        ) : null}

        {result ? (
          <ResultsView
            result={result}
            previewUrl={previewUrl}
            xmlPreview={xmlPreview}
            isPdf={isPdf}
            isImage={isImage}
            isXml={isXml}
          />
        ) : null}
      </main>
    </div>
  );
}
