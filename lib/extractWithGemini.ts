import {
  ai,
  EXTRACTION_PROMPT,
  invoiceSchema,
  stripBase64Prefix,
} from "@/lib/gemini";
import type { ExtractedInvoice } from "@/types/invoice";

export async function extractWithGemini(
  file: string,
  mimeType: string,
): Promise<ExtractedInvoice> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
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
    throw new Error("Empty model response");
  }

  const extracted = JSON.parse(text) as Omit<ExtractedInvoice, "source">;
  return { ...extracted, source: "ai-extraction" };
}
