import {
  getAi,
  EXTRACTION_PROMPT,
  invoiceSchema,
  stripBase64Prefix,
} from "@/lib/gemini";
import type { ExtractedInvoice } from "@/types/invoice";

/** Try in order. Each model has its own free-tier quota bucket. */
const EXTRACTION_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.0-flash-lite",
] as const;

export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "Unknown error");
}

function isRetryableModelError(error: unknown): boolean {
  const message = errorMessage(error);
  return /429|404|NOT_FOUND|RESOURCE_EXHAUSTED|quota|rate limit|no longer available/i.test(
    message,
  );
}

function mapGeminiError(error: unknown): ExtractionError {
  const message = errorMessage(error);

  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(message)) {
    return new ExtractionError(
      "Gemini rate limit reached on all available models. Wait a minute and try again, or upload a ZUGFeRD/XRechnung file (no AI needed). Check usage at ai.google.dev.",
      429,
    );
  }

  return new ExtractionError(
    "Could not read this document. Try a clearer scan or a different file.",
  );
}

async function extractWithModel(
  model: string,
  file: string,
  mimeType: string,
): Promise<ExtractedInvoice> {
  const response = await getAi().models.generateContent({
    model,
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
}

// ponytail: sequential model fallback, not parallel; keeps quota spikes predictable
export async function extractWithGemini(
  file: string,
  mimeType: string,
): Promise<ExtractedInvoice> {
  let lastError: unknown;

  for (const model of EXTRACTION_MODELS) {
    try {
      const result = await extractWithModel(model, file, mimeType);
      if (model !== EXTRACTION_MODELS[0]) {
        console.warn(`Gemini fallback succeeded with ${model}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      if (error instanceof ExtractionError) throw error;
      if (!isRetryableModelError(error)) throw mapGeminiError(error);
      console.warn(`Gemini model ${model} unavailable, trying next:`, errorMessage(error));
    }
  }

  throw mapGeminiError(lastError);
}
