"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { formatFileSize } from "@/lib/formatFileSize";

type FileUploadStatusProps = {
  file: File;
  ready: boolean;
  onClear: () => void;
};

function fileKindLabel(
  file: File,
  labels: {
    kindPdf: string;
    kindImage: string;
    kindXml: string;
    kindOther: string;
  },
): string {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return labels.kindPdf;
  }
  if (file.type.startsWith("image/") || /\.(jpe?g|png)$/.test(name)) {
    return labels.kindImage;
  }
  if (
    file.type === "application/xml" ||
    file.type === "text/xml" ||
    name.endsWith(".xml")
  ) {
    return labels.kindXml;
  }
  return labels.kindOther;
}

export default function FileUploadStatus({
  file,
  ready,
  onClear,
}: FileUploadStatusProps) {
  const { t } = useLanguage();

  return (
    <div
      className="mt-6 border border-ledger-line bg-white/70 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span
            className={`shrink-0 font-sans text-xs font-semibold uppercase tracking-wide ${
              ready ? "text-stamp-accept" : "text-stamp-review"
            }`}
          >
            {ready ? t.file.ready : t.file.loading}
          </span>
          <div className="min-w-0 font-sans text-sm text-ink">
            <span className="block truncate font-mono font-medium sm:inline">
              {file.name}
            </span>
            <span className="text-ink/50">
              {file.name ? " · " : ""}
              {formatFileSize(file.size)} · {fileKindLabel(file, t.file)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="self-start shrink-0 cursor-pointer font-sans text-xs text-ink/60 underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-review sm:self-center"
        >
          {t.file.remove}
        </button>
      </div>
    </div>
  );
}
