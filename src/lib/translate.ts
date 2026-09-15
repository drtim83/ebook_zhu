export interface TranslateResult {
  translatedText: string;
}

export class TranslateError extends Error {}

export async function translateText(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source, target }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new TranslateError(data.error || `Translation failed (${res.status}).`);
  }

  return (data as TranslateResult).translatedText;
}
