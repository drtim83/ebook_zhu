"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listBooks } from "@/lib/db";
import { listCloudBooks, isSupabaseConfigured } from "@/lib/supabase";
import type { Book } from "@/lib/types";
import BookCard from "@/components/BookCard";
import LibrarySearch from "@/components/LibrarySearch";

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "cloud" | "local">("all");
  const [hasCloudConfig, setHasCloudConfig] = useState(false);

  useEffect(() => {
    setHasCloudConfig(isSupabaseConfigured());

    async function loadAll() {
      try {
        const [localBooks, cloudBooks] = await Promise.all([
          listBooks().catch(() => []),
          listCloudBooks().catch(() => []),
        ]);

        // Merge books, marking cloud ones
        const cloudBookMap = new Map<string, Book>();
        cloudBooks.forEach((b) => cloudBookMap.set(b.id, b));

        const merged: Book[] = [...cloudBooks];
        for (const local of localBooks) {
          if (!cloudBookMap.has(local.id)) {
            merged.push(local);
          }
        }

        merged.sort((a, b) => b.updatedAt - a.updatedAt);
        setBooks(merged);
      } catch (err) {
        console.error("Failed to load library:", err);
        setBooks([]);
      }
    }

    loadAll();
  }, []);

  const filteredBooks = (books || []).filter((b) => {
    if (activeFilter === "cloud") return b.isCloud;
    if (activeFilter === "local") return !b.isCloud;
    return true;
  });

  const cloudCount = (books || []).filter((b) => b.isCloud).length;
  const localCount = (books || []).filter((b) => !b.isCloud).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">EbookMania</p>
          <h1 className="text-2xl font-semibold">Your Library</h1>
          <p className="text-sm text-neutral-500">
            Scanned pages and PDFs turned into readable, page-flipping digital books.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-sm text-neutral-500 hover:underline">
            Settings
          </Link>
          <Link
            href="/upload"
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            + New book
          </Link>
        </div>
      </header>

      {!hasCloudConfig && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-500/20 bg-blue-50/50 p-4 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/20 dark:text-blue-200">
          <div>
            <p className="font-semibold">☁️ Cloud Library Setup</p>
            <p className="text-xs opacity-80">
              Supabase project created (<code>Ebook_Zhu</code>). Add your <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code> to enable public readers without login.
            </p>
          </div>
          <Link
            href="/settings"
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-blue-700"
          >
            Configure
          </Link>
        </div>
      )}

      {books && books.length > 0 && (
        <div className="flex flex-col gap-4">
          <LibrarySearch />

          {/* Filter Pills */}
          <div className="flex items-center gap-2 border-b border-black/5 pb-2 text-xs font-medium dark:border-white/5">
            <button
              onClick={() => setActiveFilter("all")}
              className={`rounded-full px-3 py-1 transition ${
                activeFilter === "all"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                  : "text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              All ({books.length})
            </button>
            <button
              onClick={() => setActiveFilter("cloud")}
              className={`flex items-center gap-1 rounded-full px-3 py-1 transition ${
                activeFilter === "cloud"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <span>☁️ Cloud Public</span>
              <span>({cloudCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter("local")}
              className={`flex items-center gap-1 rounded-full px-3 py-1 transition ${
                activeFilter === "local"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                  : "text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <span>💾 Local</span>
              <span>({localCount})</span>
            </button>
          </div>
        </div>
      )}

      {books === null && <p className="text-sm text-neutral-500">Loading library…</p>}

      {books !== null && books.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/15 py-20 text-center dark:border-white/15">
          <p className="text-4xl">📚</p>
          <p className="text-neutral-500">No books found.</p>
          <Link href="/upload" className="text-sm underline">
            Upload your first PDF or scanned pages
          </Link>
        </div>
      )}

      {books && books.length > 0 && filteredBooks.length === 0 && (
        <div className="py-12 text-center text-sm text-neutral-400">
          No books found under &quot;{activeFilter}&quot; filter.
        </div>
      )}

      {filteredBooks.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
