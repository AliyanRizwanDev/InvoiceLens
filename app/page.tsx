"use client";

import { useState } from "react";
import FilePreview from "@/components/FilePreview";
import FileUploadStatus from "@/components/FileUploadStatus";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/components/LanguageProvider";
import ProcessingPanel from "@/components/ProcessingPanel";
import ResultsView from "@/components/ResultsView";
import UploadZone from "@/components/UploadZone";
import { waitForMinimum } from "@/lib/minDelay";
import {
  fileMimeType,
  isXmlFile,
  useFilePreview,
} from "@/lib/useFilePreview";
import { btnPrimary } from "@/lib/ui";
import type { ExtractedInvoiceWithValidation } from "@/types/invoice";

const MIN_PROCESSING_MS = 1200;

export default function Home() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const { previewUrl, xmlPreview, base64Data } = useFilePreview(file);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractedInvoiceWithValidation | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  function handleFileAccepted(next: File) {
    setFile(next);
    setResult(null);
    setError(null);
  }

  function clearFile() {
    setFile(null);
    setError(null);
    setResult(null);
    setIsProcessing(false);
  }

  async function handleProcess() {
    if (!file || !base64Data || isProcessing) return;

    const startedAt = Date.now();
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64Data,
          mimeType: fileMimeType(file),
        }),
      });
      const data = await response.json();

      await waitForMinimum(MIN_PROCESSING_MS, startedAt);

      if (!response.ok || data.error) {
        setError(data.error ?? t.errors.extract);
        return;
      }

      setResult(data as ExtractedInvoiceWithValidation);
    } catch {
      await waitForMinimum(MIN_PROCESSING_MS, startedAt);
      setError(t.errors.extract);
    } finally {
      setIsProcessing(false);
    }
  }

  const mime = file ? fileMimeType(file) : "";
  const isPdf = mime === "application/pdf";
  const isImage = mime.startsWith("image/");
  const isXml = file ? isXmlFile(file) : false;
  const fileReady = Boolean(file && base64Data);
  const showResultsSection = isProcessing || Boolean(result);

  return (
    <div className="flex flex-1 flex-col items-center px-3 py-6 sm:px-4 sm:py-10">
      <main className="w-full max-w-5xl border border-ledger-line bg-paper p-4 sm:p-8 lg:p-10">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-center sm:text-left">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink/45">
              {t.meta.eyebrow}
            </p>
            <h1 className="mt-2 font-display text-2xl text-ink sm:text-3xl lg:text-4xl">
              {t.meta.productName}
            </h1>
            <p className="mx-auto mt-3 max-w-xl font-sans text-sm leading-relaxed text-ink/70 sm:mx-0">
              {t.meta.tagline}
            </p>
            <p className="mt-2 font-sans text-xs text-ink/45">{t.meta.formats}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:justify-end">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <UploadZone onFileAccepted={handleFileAccepted} />

        {file ? (
          <>
            <FileUploadStatus
              file={file}
              ready={fileReady}
              onClear={clearFile}
            />
            <FilePreview
              previewUrl={previewUrl}
              xmlPreview={xmlPreview}
              isPdf={isPdf}
              isImage={isImage}
              isXml={isXml}
            />
          </>
        ) : null}

        <div className="mt-6 flex flex-col items-stretch sm:items-center">
          <button
            type="button"
            onClick={handleProcess}
            disabled={!fileReady || isProcessing}
            aria-busy={isProcessing}
            className={`${btnPrimary} w-full sm:w-auto sm:min-w-[11rem]`}
          >
            {isProcessing ? t.actions.processing : t.actions.process}
          </button>
        </div>

        {error ? (
          <p className="mt-6 font-sans text-sm text-stamp-reject" role="alert">
            {error}
          </p>
        ) : null}

        {showResultsSection ? (
          <div className="mt-8 border-t border-ledger-line pt-8 sm:mt-10 sm:pt-10">
            {isProcessing ? <ProcessingPanel /> : null}
            {result && !isProcessing ? (
              <ResultsView
                result={result}
                previewUrl={previewUrl}
                xmlPreview={xmlPreview}
                isPdf={isPdf}
                isImage={isImage}
                isXml={isXml}
              />
            ) : null}
          </div>
        ) : null}
      </main>

      <aside className="mt-8 w-full max-w-5xl border border-dashed border-ledger-line bg-surface/40 px-4 py-5 sm:px-6 sm:py-6">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink/45">
          {t.roadmap.label}
        </p>
        <h2 className="mt-2 font-display text-lg text-ink sm:text-xl">
          {t.roadmap.title}
        </h2>
        <p className="mt-2 max-w-3xl font-sans text-sm leading-relaxed text-ink/65">
          {t.roadmap.body}
        </p>
      </aside>
    </div>
  );
}
