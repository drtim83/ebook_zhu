"use client";

import { getLanguage } from "@/lib/languages";
import type { BookPage } from "@/lib/types";

interface TranslatedPageViewProps {
  page: BookPage;
  targetLang: string;
  pageNumber: number;
}

/** A single reading page showing a page's cached translation, styled to match the book's paper look. */
export default function TranslatedPageView({ page, targetLang, pageNumber }: TranslatedPageViewProps) {
  const text = page.translations[targetLang];
  const langLabel = getLanguage(targetLang).label;

  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col overflow-hidden rounded-sm bg-[#f6f0e2] [filter:drop-shadow(0_18px_40px_rgba(0,0,0,0.35))]">
      <div className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
        {text ? (
          <p className="whitespace-pre-wrap text-[17px] leading-relaxed text-neutral-800">{text}</p>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-neutral-500">
            <p className="text-3xl">🌐</p>
            <p className="text-sm">This page hasn&apos;t been translated to {langLabel} yet.</p>
            <p className="text-xs text-neutral-400">Use Translate below to fetch it.</p>
          </div>
        )}
      </div>
      <div className="border-t border-black/10 px-4 py-2 text-center text-xs text-neutral-400">
        {pageNumber} · {langLabel} translation
      </div>
    </div>
  );
}
