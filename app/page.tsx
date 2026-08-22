"use client";

import { useEffect, useState } from "react";
import UploadZone from "@/components/UploadZone";
import { toBase64 } from "@/lib/toBase64";
import type { ExtractedInvoice } from "@/types/invoice";

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
  const [extracted, setExtracted] = useState<ExtractedInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setXmlPreview(null);
      setBase64Data(null);
      return;
    }

    setExtracted(null);
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
    setExtracted(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64Data, mimeType: fileMimeType(file) }),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error ?? "Could not read this document. Try a clearer scan or a different file.");
        return;
      }

      setExtracted(result as ExtractedInvoice);
    } catch {
      setError("Could not read this document. Try a clearer scan or a different file.");
    } finally {
      setIsProcessing(false);
    }
  }

  const isPdf = file?.type === "application/pdf";
  const isImage = file?.type.startsWith("image/") ?? false;
  const isXml = file ? isXmlFile(file) : false;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-100 px-4 py-12 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          InvoiceLens
        </h1>
        <p className="mt-2 mb-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Upload an invoice to extract and validate its data
        </p>

        <UploadZone onFileAccepted={setFile} />

        {previewUrl && file && !isXml ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
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
          <pre className="mt-6 max-h-96 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            {xmlPreview}
          </pre>
        ) : null}

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleProcess}
            disabled={!file || !base64Data || isProcessing}
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isProcessing ? "Reading invoice..." : "Process Invoice"}
          </button>
          {isProcessing ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Reading invoice...
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="mt-6 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {extracted ? (
          <pre className="mt-6 max-h-96 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            {JSON.stringify(extracted, null, 2)}
          </pre>
        ) : null}
      </main>
    </div>
  );
}
