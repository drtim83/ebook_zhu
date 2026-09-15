"use client";

import { useEffect, useRef, useState } from "react";
import type { BookPage } from "@/lib/types";
import { searchBookPages, type PageMatch } from "@/lib/search";

interface ReaderSearchModalProps {
  pages: BookPage[];
  onSelectPage: (pageIndex: number) => void;
}

export default function ReaderSearchModal({ pages, onSelectPage }: ReaderSearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PageMatch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setResults(searchBookPages(pages, query));
  }, [pages, query]);

  function highlightMatch(text: string, term: string) {
    if (!term.trim()) return text;
    const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="rounded bg-yellow-200 px-0.5 font-medium text-black dark:bg-yellow-500/40 dark:text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function handleSelectResult(pageOrder: number) {
    onSelectPage(pageOrder);
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-black/15 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        title="Search book text (Cmd+F)"
      >
        <span>🔍 Search</span>
        <kbd className="hidden rounded bg-black/10 px-1 py-0.5 text-[10px] sm:inline-block dark:bg-white/15">
          ⌘F
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 backdrop-blur-xs sm:p-6 sm:pt-20">
          <div className="flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/15 dark:bg-neutral-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="flex flex-1 items-center gap-2">
                <span className="text-neutral-400">🔍</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search inside this book…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ml-2 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {!query.trim() ? (
                <p className="py-8 text-center text-xs text-neutral-400">
                  Type a keyword or phrase to search OCR text and translations.
                </p>
              ) : results.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-400">
                  No matching text found for &quot;{query}&quot;.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-400">
                    Found {results.length} match{results.length === 1 ? "" : "es"}:
                  </p>
                  {results.map((res, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectResult(res.pageOrder)}
                      className="group flex w-full flex-col gap-1 rounded-xl border border-black/5 p-3 text-left transition hover:border-black/20 hover:bg-neutral-50 dark:border-white/5 dark:hover:border-white/20 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                          Page {res.pageDisplayNumber}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500 group-hover:bg-white dark:bg-neutral-800 dark:text-neutral-400">
                          {res.matchField === "text"
                            ? "Original OCR"
                            : res.matchField === "translation"
                            ? `Translation (${res.matchLanguage})`
                            : "Filename"}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-300">
                        {highlightMatch(res.snippet, query)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-black/10 bg-neutral-50 px-4 py-2 text-[11px] text-neutral-400 dark:border-white/10 dark:bg-neutral-900/50">
              <span>Press Esc to close</span>
              <span>Click a result to jump to page</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
