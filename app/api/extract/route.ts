import {
  ai,
  EXTRACTION_PROMPT,
  invoiceSchema,
  stripBase64Prefix,
} from "@/lib/gemini";

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
      return Response.json({ error: EXTRACTION_ERROR }, { status: 500 });
    }

    const extracted = JSON.parse(text);
    return Response.json({ ...extracted, source: "ai-extraction" });
  } catch (error) {
    console.error("Extraction failed:", error);
    return Response.json({ error: EXTRACTION_ERROR }, { status: 500 });
  }
}
