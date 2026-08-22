"use client";

import { useLanguage } from "@/components/LanguageProvider";

type FilePreviewProps = {
  previewUrl: string | null;
  xmlPreview: string | null;
  isPdf: boolean;
  isImage: boolean;
  isXml: boolean;
};

export default function FilePreview({
  previewUrl,
  xmlPreview,
  isPdf,
  isImage,
  isXml,
}: FilePreviewProps) {
  const { t } = useLanguage();

  if (!previewUrl && !xmlPreview) return null;

  return (
    <div className="mt-4 overflow-hidden border border-ledger-line bg-surface shadow-sm transition-shadow hover:shadow-md">
      <p className="border-b border-ledger-line px-4 py-2 font-sans text-xs uppercase tracking-wide text-ink/50">
        {t.file.preview}
      </p>

      {previewUrl && !isXml ? (
        <div className="p-2">
          {isPdf ? (
            <iframe
              src={previewUrl}
              title={t.file.previewTitle}
              className="h-56 w-full sm:h-72 lg:h-80"
            />
          ) : null}
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL preview
            <img
              src={previewUrl}
              alt={t.file.previewTitle}
              className="max-h-56 w-full object-contain sm:max-h-72 lg:max-h-80"
            />
          ) : null}
        </div>
      ) : null}

      {xmlPreview && isXml ? (
        <pre className="max-h-56 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-ink sm:max-h-72 sm:p-4 lg:max-h-80">
          {xmlPreview}
        </pre>
      ) : null}
    </div>
  );
}
