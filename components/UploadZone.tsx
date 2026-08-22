"use client";

import { useDropzone, type FileRejection } from "react-dropzone";
import { useLanguage } from "@/components/LanguageProvider";
import { dropzoneActive, dropzoneBase, dropzoneIdle } from "@/lib/ui";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadZoneProps = {
  onFileAccepted: (file: File) => void;
};

export default function UploadZone({ onFileAccepted }: UploadZoneProps) {
  const { t } = useLanguage();

  function rejectionMessage(rejections: readonly FileRejection[]): string | null {
    if (rejections.length === 0) return null;

    const error = rejections[0]?.errors[0];
    if (!error) return t.upload.rejectGeneric;
    if (error.code === "file-too-large") return t.upload.rejectSize;
    if (error.code === "file-invalid-type") return t.upload.rejectType;
    return error.message;
  }

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      accept: {
        "application/pdf": [".pdf"],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "application/xml": [".xml"],
        "text/xml": [".xml"],
      },
      maxSize: MAX_FILE_SIZE,
      onDropAccepted: (files) => {
        const file = files[0];
        if (file) onFileAccepted(file);
      },
    });

  const errorMessage = rejectionMessage(fileRejections);

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`${dropzoneBase} ${isDragActive ? dropzoneActive : dropzoneIdle}`}
      >
        <input {...getInputProps()} />
        <p className="font-sans text-sm font-medium text-ink">
          {isDragActive ? t.upload.dragActive : t.upload.dragIdle}
        </p>
        <p className="mt-2 max-w-md font-sans text-xs text-ink/50">
          {t.upload.formats}
        </p>
        <p className="mt-1 font-sans text-xs text-ink/40">{t.upload.maxSize}</p>
      </div>

      <p className="font-sans text-xs leading-relaxed text-ink/55">
        {t.upload.xmlNote}
      </p>

      {errorMessage ? (
        <p className="font-sans text-sm text-stamp-reject" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
