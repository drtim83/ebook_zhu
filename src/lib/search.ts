import { getAllPages, listBooks } from "./db";
import { getAllCloudData, isSupabaseConfigured } from "./supabase";
import type { Book, BookPage } from "./types";

export interface PageMatch {
  pageId: string;
  bookId: string;
  pageOrder: number;
  pageDisplayNumber: number;
  sourceFilename: string;
  matchField: "text" | "translation" | "filename";
  matchLanguage?: string;
  snippet: string;
}

export interface BookSearchResult {
  book: Book;
  matches: PageMatch[];
  titleMatched: boolean;
}

export function extractSnippet(text: string, query: string, maxLength = 120): string {
  if (!text || !query.trim()) return "";

  const trimmedQuery = query.trim();
  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();

  let matchIndex = lowerText.indexOf(lowerQuery);
  if (matchIndex === -1) {
    // If exact query string isn't found, search for first matching token
    const tokens = lowerQuery.split(/\s+/).filter((t) => t.length > 1);
    for (const token of tokens) {
      const idx = lowerText.indexOf(token);
      if (idx !== -1) {
        matchIndex = idx;
        break;
      }
    }
  }

  if (matchIndex === -1) return text.slice(0, maxLength) + (text.length > maxLength ? "…" : "");

  const start = Math.max(0, matchIndex - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);

  let snippet = text.slice(start, end).replace(/[\r\n]+/g, " ");
  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";

  return snippet;
}

export function searchBookPages(pages: BookPage[], query: string): PageMatch[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const results: PageMatch[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageDisplayNumber = page.detectedNumber ?? i + 1;

    // Check OCR Text
    if (page.ocrText && page.ocrText.toLowerCase().includes(trimmed)) {
      results.push({
        pageId: page.id,
        bookId: page.bookId,
        pageOrder: page.order,
        pageDisplayNumber,
        sourceFilename: page.sourceFilename,
        matchField: "text",
        snippet: extractSnippet(page.ocrText, query),
      });
      continue;
    }

    // Check Translations
    let matchedTranslation = false;
    if (page.translations) {
      for (const [lang, transText] of Object.entries(page.translations)) {
        if (transText && transText.toLowerCase().includes(trimmed)) {
          results.push({
            pageId: page.id,
            bookId: page.bookId,
            pageOrder: page.order,
            pageDisplayNumber,
            sourceFilename: page.sourceFilename,
            matchField: "translation",
            matchLanguage: lang,
            snippet: extractSnippet(transText, query),
          });
          matchedTranslation = true;
          break;
        }
      }
    }
    if (matchedTranslation) continue;

    // Check Source Filename
    if (page.sourceFilename && page.sourceFilename.toLowerCase().includes(trimmed)) {
      results.push({
        pageId: page.id,
        bookId: page.bookId,
        pageOrder: page.order,
        pageDisplayNumber,
        sourceFilename: page.sourceFilename,
        matchField: "filename",
        snippet: page.sourceFilename,
      });
    }
  }

  return results;
}

export async function searchAllBooks(query: string): Promise<BookSearchResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const [localBooks, localPages] = await Promise.all([
    listBooks().catch(() => []),
    getAllPages().catch(() => []),
  ]);

  const allBooks: Book[] = [...localBooks];
  const allPages: BookPage[] = [...localPages];

  if (isSupabaseConfigured()) {
    try {
      const { books: cloudBooks, pages: cloudPages } = await getAllCloudData();
      const localIds = new Set(localBooks.map((b) => b.id));
      for (const cb of cloudBooks) {
        if (!localIds.has(cb.id)) {
          allBooks.push(cb);
        }
      }
      const localPageIds = new Set(localPages.map((p) => p.id));
      for (const cp of cloudPages) {
        if (!localPageIds.has(cp.id)) {
          allPages.push(cp);
        }
      }
    } catch (err) {
      console.warn("Cloud search error:", err);
    }
  }

  const pagesByBookId = new Map<string, BookPage[]>();
  for (const page of allPages) {
    const list = pagesByBookId.get(page.bookId) || [];
    list.push(page);
    pagesByBookId.set(page.bookId, list);
  }

  const searchResults: BookSearchResult[] = [];

  for (const book of allBooks) {
    const titleMatched = book.title.toLowerCase().includes(trimmed);
    const bookPages = (pagesByBookId.get(book.id) || []).sort((a, b) => a.order - b.order);
    const matches = searchBookPages(bookPages, query);

    if (titleMatched || matches.length > 0) {
      searchResults.push({
        book,
        matches,
        titleMatched,
      });
    }
  }

  return searchResults;
}
