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
    <div className="mt-4 overflow-hidden border border-ledger-line bg-white shadow-sm transition-shadow hover:shadow-md">
      <p className="border-b border-ledger-line px-4 py-2 font-sans text-xs uppercase tracking-wide text-ink/50">
        {t.file.preview}
      </p>

      {previewUrl && !isXml ? (
        <div className="p-2">
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
        <pre className="max-h-80 overflow-y-auto p-4 font-mono text-xs leading-relaxed text-ink">
          {xmlPreview}
        </pre>
      ) : null}
    </div>
  );
}
