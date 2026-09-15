"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchAllBooks, type BookSearchResult } from "@/lib/search";

export default function LibrarySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const res = await searchAllBooks(query);
      setResults(res);
      setSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

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

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-neutral-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all books by title, page text, or filename…"
          className="w-full rounded-full border border-black/15 bg-white py-2.5 pl-10 pr-10 text-sm shadow-xs outline-none focus:border-black dark:border-white/20 dark:bg-neutral-900 dark:focus:border-white"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3.5 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results Section */}
      {query.trim() !== "" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.01] p-4 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              {searching
                ? "Searching…"
                : `${results.length} book${results.length === 1 ? "" : "s"} found`}
            </span>
            {query && <span>Query: &quot;{query}&quot;</span>}
          </div>

          {!searching && results.length === 0 && (
            <p className="py-6 text-center text-sm text-neutral-400">
              No matching text or books found for &quot;{query}&quot;.
            </p>
          )}

          {results.map(({ book, matches, titleMatched }) => (
            <div
              key={book.id}
              className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/reader/${book.id}`}
                  className="font-semibold text-neutral-900 hover:underline dark:text-white"
                >
                  {highlightMatch(book.title, query)}
                </Link>
                <span className="text-xs text-neutral-400">
                  {matches.length} page match{matches.length === 1 ? "" : "es"}
                </span>
              </div>

              {titleMatched && matches.length === 0 && (
                <p className="text-xs text-neutral-500 italic">Matched book title</p>
              )}

              {matches.length > 0 && (
                <div className="mt-1 flex flex-col gap-2">
                  {matches.slice(0, 5).map((match, idx) => (
                    <Link
                      key={idx}
                      href={`/reader/${book.id}?page=${match.pageOrder}`}
                      className="group flex flex-col gap-0.5 rounded-lg border border-black/5 p-2.5 text-left transition hover:border-black/20 hover:bg-neutral-50 dark:border-white/5 dark:hover:border-white/20 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-600 dark:text-neutral-300">
                          Page {match.pageDisplayNumber}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {match.matchField === "text"
                            ? "OCR Text"
                            : match.matchField === "translation"
                            ? `Translation (${match.matchLanguage})`
                            : "Filename"}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-300">
                        {highlightMatch(match.snippet, query)}
                      </p>
                    </Link>
                  ))}
                  {matches.length > 5 && (
                    <Link
                      href={`/reader/${book.id}`}
                      className="text-center text-xs text-neutral-500 hover:underline"
                    >
                      + {matches.length - 5} more matches in this book…
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
