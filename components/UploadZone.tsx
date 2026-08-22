"use client";

import { useDropzone, type FileRejection } from "react-dropzone";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadZoneProps = {
  onFileAccepted: (file: File) => void;
};

function rejectionMessage(rejections: readonly FileRejection[]): string | null {
  if (rejections.length === 0) return null;

  const error = rejections[0]?.errors[0];
  if (!error) return "File could not be accepted.";
  if (error.code === "file-too-large") return "File is too large (max 10MB).";
  if (error.code === "file-invalid-type") {
    return "Only PDF, JPG, PNG, and XML files are supported.";
  }
  return error.message;
}

export default function UploadZone({ onFileAccepted }: UploadZoneProps) {
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
        className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-review ${
          isDragActive
            ? "border-stamp-review bg-white/60"
            : "border-ledger-line bg-white/40 hover:border-ink/30"
        }`}
      >
        <input {...getInputProps()} />
        <p className="font-sans text-sm font-medium text-ink">
          {isDragActive
            ? "Drop your invoice here"
            : "Drag and drop an invoice here"}
        </p>
        <p className="mt-2 font-sans text-xs text-ink/50">
          or click to browse · PDF, JPG, PNG, XML · max 10MB
        </p>
      </div>

      {errorMessage ? (
        <p className="font-sans text-sm text-stamp-reject" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
