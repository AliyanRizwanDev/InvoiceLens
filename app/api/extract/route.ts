import { extractWithGemini } from "@/lib/extractWithGemini";
import { stripBase64Prefix } from "@/lib/gemini";
import { tryExtractFromEmbeddedXml } from "@/lib/zugferd";

const EXTRACTION_ERROR =
  "Could not read this document. Try a clearer scan or a different file.";

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: EXTRACTION_ERROR }, { status: 500 });
  }

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
        return Response.json(embedded);
      }
    }

    const extracted = await extractWithGemini(file, mimeType);
    return Response.json(extracted);
  } catch (error) {
    console.error("Extraction failed:", error);
    return Response.json({ error: EXTRACTION_ERROR }, { status: 500 });
  }
}
