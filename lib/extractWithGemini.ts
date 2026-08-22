import {
  getAi,
  EXTRACTION_PROMPT,
  invoiceSchema,
  stripBase64Prefix,
} from "@/lib/gemini";
import type { ExtractedInvoice } from "@/types/invoice";

/** Stable model id — avoid gemini-flash-latest (resolves to a separate quota bucket). */
const EXTRACTION_MODEL = "gemini-3.6-flash";

export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

function mapGeminiError(error: unknown): ExtractionError {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");

  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(message)) {
    return new ExtractionError(
      "Gemini rate limit reached. Wait a minute and try again, or upload a ZUGFeRD/XRechnung file (no AI needed). Check usage at ai.google.dev.",
      429,
    );
  }

  return new ExtractionError(
    "Could not read this document. Try a clearer scan or a different file.",
  );
}

export async function extractWithGemini(
  file: string,
  mimeType: string,
): Promise<ExtractedInvoice> {
  try {
    const response = await getAi().models.generateContent({
      model: EXTRACTION_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inlineData: {
                mimeType,
                data: stripBase64Prefix(file),
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new ExtractionError(
        "Could not read this document. Try a clearer scan or a different file.",
      );
    }

    const extracted = JSON.parse(text) as Omit<ExtractedInvoice, "source">;
    return { ...extracted, source: "ai-extraction" };
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw mapGeminiError(error);
  }
}
