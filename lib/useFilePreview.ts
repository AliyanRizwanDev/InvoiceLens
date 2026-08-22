/* eslint-disable react-hooks/set-state-in-effect -- async blob/XML preview loads after file select */
import { useEffect, useState } from "react";
import { toBase64 } from "@/lib/toBase64";

export function fileMimeType(file: File): string {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xml")) return "application/xml";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (/\.jpe?g$/.test(lower)) return "image/jpeg";
  return file.type;
}

export function isXmlFile(file: File): boolean {
  const mime = fileMimeType(file);
  return (
    mime === "application/xml" ||
    mime === "text/xml" ||
    file.name.toLowerCase().endsWith(".xml")
  );
}

type FilePreviewState = {
  previewUrl: string | null;
  xmlPreview: string | null;
  base64Data: string | null;
};

const EMPTY: FilePreviewState = {
  previewUrl: null,
  xmlPreview: null,
  base64Data: null,
};

/** Loads blob preview + base64 for the selected file; revokes object URLs on change. */
export function useFilePreview(file: File | null): FilePreviewState {
  const [state, setState] = useState<FilePreviewState>(EMPTY);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    if (isXmlFile(file)) {
      setState({ previewUrl: null, xmlPreview: null, base64Data: null });

      void file.text().then((text) => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, xmlPreview: text }));
        }
      });
      void toBase64(file).then((data) => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, base64Data: data }));
        }
      });
    } else {
      objectUrl = URL.createObjectURL(file);
      setState({ previewUrl: objectUrl, xmlPreview: null, base64Data: null });

      void toBase64(file).then((data) => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, base64Data: data }));
        }
      });
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return file ? state : EMPTY;
}
