import type { AppSettings } from "./settings";

export class GeminiError extends Error {}

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

function endpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithModel(
  model: string,
  apiKey: string,
  parts: GeminiPart[]
): Promise<string> {
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(endpoint(model, apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      });

      if (res.ok) {
        const data = await res.json();
        const text: string =
          data?.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text ?? "")
            .join("") ?? "";

        if (text.trim()) {
          return text.trim();
        }
        throw new GeminiError("Gemini returned an empty response for this page.");
      }

      const detail = await res.text().catch(() => "");
      const isTransient = res.status === 503 || res.status === 429 || res.status === 500;

      if (isTransient && attempt < maxRetries) {
        const delay = Math.min(10000, 1500 * Math.pow(2, attempt) + Math.random() * 500);
        await sleep(delay);
        continue;
      }

      throw new GeminiError(
        `Gemini request failed (${res.status}). ${detail.slice(0, 300) || "Service temporarily unavailable."}`
      );
    } catch (err) {
      if (attempt < maxRetries && !(err instanceof GeminiError && err.message.includes("API key"))) {
        const delay = Math.min(10000, 1500 * Math.pow(2, attempt) + Math.random() * 500);
        await sleep(delay);
        continue;
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new GeminiError("Gemini request timed out after multiple retries.");
}

async function callGemini(settings: AppSettings, parts: GeminiPart[]): Promise<string> {
  const apiKey = settings.geminiApiKey.trim();
  if (!apiKey) {
    throw new GeminiError("Please add your Gemini API key in Settings first.");
  }

  const primaryModel = settings.geminiModel.trim() || "gemini-2.5-flash";
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      return await callGeminiWithModel(model, apiKey, parts);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message.includes("API_KEY_INVALID") || lastError.message.includes("API key not valid")) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new GeminiError("Gemini request failed.");
}

export interface GeminiOcrResult {
  text: string;
  /** Printed page number spotted anywhere in headers/footers/margins/boxes. */
  pageNumber: number | null;
}

const PAGE_NUMBER_LINE = /^PAGE_NUMBER:\s*(none|cover|\d{1,5})/i;

/** OCR a page image with Gemini vision understanding. */
export async function geminiOCR(
  image: Blob,
  settings: AppSettings,
  languageHint?: string
): Promise<GeminiOcrResult> {
  const base64 = await blobToBase64(image);
  const languagePart = languageHint ? ` The body text is in ${languageHint}.` : "";
  const prompt =
    `You are looking at a scanned book page.${languagePart}\n\n` +
    `TASK 1 — Find the PRINTED PAGE NUMBER.\n` +
    `Look very carefully at the TOP of the page for a horizontal header bar or ruled line that is divided into cells/segments by vertical lines. ` +
    `The page number is a small Arabic numeral (like 2, 15, 88) printed inside one of those cells — ` +
    `typically the rightmost cell for right-hand pages or the leftmost cell for left-hand pages. ` +
    `Also check the very top-left corner, top-right corner, bottom-left corner, and bottom-right corner of the page for a standalone number.\n` +
    `If this is a cover page, title page, or table of contents with NO printed page number anywhere, output: "PAGE_NUMBER: cover"\n` +
    `If you find a printed page number, output exactly: "PAGE_NUMBER: <number>" (e.g. "PAGE_NUMBER: 2")\n` +
    `If there is no printed page number and it is NOT a cover/title page, output: "PAGE_NUMBER: none"\n\n` +
    `TASK 2 — Transcribe the text.\n` +
    `Starting on the next line after PAGE_NUMBER, transcribe ALL text on the page faithfully, preserving columns and line breaks.\n` +
    `Do not include commentary or markdown formatting.`;

  const raw = await callGemini(settings, [
    { text: prompt },
    { inline_data: { mime_type: image.type || "image/png", data: base64 } },
  ]);

  return parseGeminiOcrResponse(raw);
}

function parseGeminiOcrResponse(raw: string): GeminiOcrResult {
  const lines = raw.split("\n");

  // Search first few lines for PAGE_NUMBER directive
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const m = lines[i].trim().match(PAGE_NUMBER_LINE);
    if (m) {
      const val = m[1].toLowerCase();
      let pageNumber: number | null = null;
      if (val !== "none" && val !== "cover") {
        pageNumber = parseInt(m[1], 10);
      }
      // For "cover", pageNumber stays null — sorting will handle it via source order
      const body = [...lines.slice(0, i), ...lines.slice(i + 1)].join("\n").trim();
      return { text: body, pageNumber };
    }
  }

  return { text: raw.trim(), pageNumber: null };
}

/** Translate text with Gemini instead of LibreTranslate. */
export async function geminiTranslate(
  text: string,
  sourceLabel: string,
  targetLabel: string,
  settings: AppSettings
): Promise<string> {
  const prompt = `Translate the following text from ${sourceLabel} to ${targetLabel}. Return only the translation with no notes, commentary, or markdown formatting.\n\n${text}`;
  return callGemini(settings, [{ text: prompt }]);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Could not read image for Gemini OCR."));
    reader.readAsDataURL(blob);
  });
}
