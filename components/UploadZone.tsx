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
    return "Only PDF, JPG, and PNG files are supported.";
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
            : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900/50 dark:hover:border-zinc-500"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {isDragActive
            ? "Drop your invoice here"
            : "Drag and drop an invoice here"}
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          or click to browse · PDF, JPG, PNG · max 10MB
        </p>
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
