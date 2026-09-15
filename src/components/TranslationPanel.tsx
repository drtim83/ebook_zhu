"use client";

import { useState } from "react";
import Link from "next/link";
import { LANGUAGES, getLanguage } from "@/lib/languages";
import { translateText, TranslateError } from "@/lib/translate";
import { geminiTranslate, GeminiError } from "@/lib/gemini";
import { getSettings } from "@/lib/settings";
import type { BookPage } from "@/lib/types";
import ReadAloudButton from "./ReadAloudButton";

interface TranslationPanelProps {
  page: BookPage;
  sourceLang: string;
  targetLang: string;
  onTargetLangChange: (lang: string) => void;
  onTranslated: (lang: string, text: string) => void;
  /** Hide the inline text preview — useful when a bigger reading view already shows it. */
  hidePreview?: boolean;
}

export default function TranslationPanel({
  page,
  sourceLang,
  targetLang,
  onTargetLangChange,
  onTranslated,
  hidePreview = false,
}: TranslationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const engine = getSettings().translationEngine;

  const cached = page.translations[targetLang];

  async function handleTranslate() {
    if (!page.ocrText.trim()) {
      setError("No text was recognized on this page.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const settings = getSettings();
      const text =
        settings.translationEngine === "gemini"
          ? await geminiTranslate(
              page.ocrText,
              getLanguage(sourceLang).label,
              getLanguage(targetLang).label,
              settings
            )
          : await translateText(page.ocrText, sourceLang, targetLang);
      onTranslated(targetLang, text);
    } catch (err) {
      setError(
        err instanceof TranslateError || err instanceof GeminiError
          ? err.message
          : "Translation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-black/10 bg-white/80 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-neutral-600 dark:text-neutral-300">Translate to</label>
        <select
          value={targetLang}
          onChange={(e) => {
            onTargetLangChange(e.target.value);
            setError(null);
          }}
          className="rounded border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="text-black">
              {l.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleTranslate}
          disabled={loading}
          className="rounded-full bg-neutral-900 px-3 py-1.5 text-sm text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {loading ? "Translating…" : cached ? "Re-translate" : "Translate"}
        </button>
        {cached && <ReadAloudButton text={cached} lang={targetLang} label="Read translation" />}
        <span className="ml-auto text-xs text-neutral-400">
          via {engine === "gemini" ? "Gemini" : "LibreTranslate"} ·{" "}
          <Link href="/settings" className="underline">
            change
          </Link>
        </span>
      </div>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!hidePreview && cached && !loading && (
        <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-[15px] leading-relaxed">{cached}</p>
      )}
    </div>
  );
}
