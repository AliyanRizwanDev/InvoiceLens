import { extractWithGemini } from "@/lib/extractWithGemini";
import { stripBase64Prefix } from "@/lib/gemini";
import { validateInvoice } from "@/lib/validate";
import { parseEmbeddedXml, tryExtractFromEmbeddedXml } from "@/lib/zugferd";
import type { ExtractedInvoice } from "@/types/invoice";

const EXTRACTION_ERROR =
  "Could not read this document. Try a clearer scan or a different file.";

function isXmlMime(mimeType: string): boolean {
  return mimeType === "application/xml" || mimeType === "text/xml";
}

function respondWithValidation(extracted: ExtractedInvoice) {
  return Response.json({
    ...extracted,
    validation: validateInvoice(extracted),
  });
}

export async function POST(request: Request) {
  let body: { file?: string; mimeType?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: EXTRACTION_ERROR }, { status: 400 });
  }

  const { file, mimeType } = body;
  if (!file || !mimeType) {
    return Response.json({ error: EXTRACTION_ERROR }, { status: 400 });
  }

  try {
    if (mimeType === "application/pdf") {
      const pdfBytes = Uint8Array.from(
        Buffer.from(stripBase64Prefix(file), "base64"),
      );
      const embedded = await tryExtractFromEmbeddedXml(pdfBytes);
      if (embedded) {
        return respondWithValidation(embedded);
      }
    }

    if (isXmlMime(mimeType)) {
      const xmlText = Buffer.from(stripBase64Prefix(file), "base64").toString(
        "utf-8",
      );
      const parsed = parseEmbeddedXml(xmlText);
      if (parsed) {
        return respondWithValidation(parsed);
      }
      return Response.json({ error: EXTRACTION_ERROR }, { status: 500 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: EXTRACTION_ERROR }, { status: 500 });
    }

    const extracted = await extractWithGemini(file, mimeType);
    return respondWithValidation(extracted);
  } catch (error) {
    console.error("Extraction failed:", error);
    return Response.json({ error: EXTRACTION_ERROR }, { status: 500 });
  }
}
