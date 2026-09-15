import { NextRequest, NextResponse } from "next/server";

// Defaults to a local LibreTranslate instance so page text never leaves the
// user's machine unless they deliberately point this at a hosted server.
// Run one locally with:  docker run -ti -p 5000:5000 libretranslate/libretranslate
const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL || "http://localhost:5000/translate";

interface TranslateRequestBody {
  text: string;
  source: string;
  target: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as TranslateRequestBody | null;

  if (!body || typeof body.text !== "string" || !body.source || !body.target) {
    return NextResponse.json(
      { error: "Request must include text, source and target." },
      { status: 400 }
    );
  }

  if (!body.text.trim()) {
    return NextResponse.json({ translatedText: "" });
  }

  try {
    const res = await fetch(LIBRETRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: body.text,
        source: normalizeLang(body.source),
        target: normalizeLang(body.target),
        format: "text",
        ...(process.env.LIBRETRANSLATE_API_KEY
          ? { api_key: process.env.LIBRETRANSLATE_API_KEY }
          : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Translation server responded with ${res.status}.`, detail },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { translatedText?: string };
    return NextResponse.json({ translatedText: data.translatedText ?? "" });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Could not reach the translation server. Is LibreTranslate running? See README.md for setup.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}

// LibreTranslate expects base language codes ("zh", not "zh-TW").
function normalizeLang(code: string): string {
  return code.split("-")[0];
}
