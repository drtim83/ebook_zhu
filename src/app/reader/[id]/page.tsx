"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteBook, getBook, getBookPages, setPageTranslation } from "@/lib/db";
import { getCloudBook, deleteCloudBook, setCloudPageTranslation } from "@/lib/supabase";
import { getLanguage } from "@/lib/languages";
import type { Book, BookPage } from "@/lib/types";
import PageFlipReader from "@/components/PageFlipReader";
import TranslatedPageView from "@/components/TranslatedPageView";
import TranslationPanel from "@/components/TranslationPanel";
import ReadAloudButton from "@/components/ReadAloudButton";
import ExportMenu from "@/components/ExportMenu";
import ReaderSearchModal from "@/components/ReaderSearchModal";
import AdminPasscodeModal from "@/components/AdminPasscodeModal";
import { isUserAdmin } from "@/lib/auth";

type ViewMode = "original" | "translation";

export default function ReaderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null);
  const imageUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadBookData() {
      let b: Book | undefined;
      let p: BookPage[] = [];

      // 1. Try fetching from Cloud first
      try {
        const cloudData = await getCloudBook(id);
        if (cloudData) {
          b = cloudData.book;
          p = cloudData.pages;
        }
      } catch (err) {
        console.warn("Could not fetch book from cloud:", err);
      }

      // 2. Fall back to local IndexedDB if not found in Cloud
      if (!b) {
        try {
          const localBook = await getBook(id);
          if (localBook) {
            b = localBook;
            p = await getBookPages(id);
          }
        } catch (err) {
          console.warn("Could not fetch book from local db:", err);
        }
      }

      if (cancelled) return;

      if (!b || p.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const urls = p.map((pg) => {
        if (pg.imageUrl) return pg.imageUrl;
        if (pg.image) return URL.createObjectURL(pg.image);
        return "";
      });

      setBook(b);
      setPages(p);
      setImageUrls(urls);
      imageUrlsRef.current = urls;
      setTargetLang(b.ocrLanguage === "en" ? "zh" : "en");
      setLoading(false);
    }

    loadBookData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((u) => {
        if (u.startsWith("blob:")) {
          URL.revokeObjectURL(u);
        }
      });
    };
  }, []);

  function jumpToPage(pageIndex: number) {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    setCurrentIndex(pageIndex);
    if (flipBookRef.current?.pageFlip?.()) {
      try {
        flipBookRef.current.pageFlip().flip(pageIndex);
      } catch {
        // pageFlip transition state
      }
    }
  }

  useEffect(() => {
    if (!loading && pages.length > 0) {
      const pageParam = searchParams.get("page");
      if (pageParam !== null) {
        const idx = parseInt(pageParam, 10);
        if (!isNaN(idx) && idx >= 0 && idx < pages.length) {
          jumpToPage(idx);
        }
      }
    }
  }, [loading, pages.length, searchParams]);

  async function handleTranslated(lang: string, text: string) {
    const current = pages[currentIndex];
    if (!current) return;

    if (book?.isCloud) {
      await setCloudPageTranslation(current.id, lang, text);
    } else {
      await setPageTranslation(current.id, lang, text);
    }

    setPages((prev) =>
      prev.map((p) =>
        p.id === current.id ? { ...p, translations: { ...p.translations, [lang]: text } } : p
      )
    );
  }

  function handleDelete() {
    if (!book) return;
    if (book.isCloud && !isUserAdmin()) {
      setShowDeleteModal(true);
      return;
    }
    executeDelete();
  }

  async function executeDelete() {
    if (!book) return;
    if (!confirm(`Delete "${book.title}"? This can't be undone.`)) return;

    if (book.isCloud) {
      await deleteCloudBook(book.id);
    } else {
      await deleteBook(book.id);
    }
    router.push("/");
  }

  function goPrev() {
    if (viewMode === "original") {
      flipBookRef.current?.pageFlip?.()?.flipPrev();
    } else {
      setCurrentIndex((i) => Math.max(0, i - 1));
    }
  }

  function goNext() {
    if (viewMode === "original") {
      flipBookRef.current?.pageFlip?.()?.flipNext();
    } else {
      setCurrentIndex((i) => Math.min(pages.length - 1, i + 1));
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-500">
        <p>Couldn&apos;t find that book.</p>
        <Link href="/" className="text-sm underline">
          Back to library
        </Link>
      </div>
    );
  }

  if (loading || !book || targetLang === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-500">Loading book…</div>
    );
  }

  const currentPage = pages[currentIndex];
  const sourceLang = getLanguage(book.ocrLanguage);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Link href="/" className="shrink-0 text-sm text-neutral-500 hover:underline">
            ← Library
          </Link>
          {book.isCloud && (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
              ☁️ Cloud
            </span>
          )}
        </div>
        <h1 className="truncate text-center font-medium">{book.title}</h1>
        <div className="flex shrink-0 items-center gap-3">
          <ReaderSearchModal pages={pages} onSelectPage={jumpToPage} />
          <div className="flex items-center gap-1.5 text-xs">
            {currentPage?.detectedNumber !== null && currentPage?.detectedNumber !== undefined ? (
              <span className="rounded bg-black/5 px-2 py-0.5 font-medium text-neutral-800 dark:bg-white/10 dark:text-neutral-200">
                Printed p. {currentPage.detectedNumber}
              </span>
            ) : (
              <span className="rounded bg-black/5 px-2 py-0.5 font-medium text-neutral-800 dark:bg-white/10 dark:text-neutral-200">
                Page {currentIndex + 1}
              </span>
            )}
            <span className="text-neutral-400">
              ({pages.length ? currentIndex + 1 : 0} of {pages.length})
            </span>
          </div>
          <ExportMenu book={book} pages={pages} />
          <button
            onClick={handleDelete}
            className="text-sm text-red-500 hover:underline"
            type="button"
          >
            Delete
          </button>
        </div>
      </header>

      <div className="flex items-center justify-center gap-1 border-b border-black/10 bg-black/[0.02] py-2 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex rounded-full border border-black/15 p-0.5 text-sm dark:border-white/20">
          <button
            type="button"
            onClick={() => setViewMode("original")}
            className={`rounded-full px-3 py-1 transition ${
              viewMode === "original"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            📖 Original
          </button>
          <button
            type="button"
            onClick={() => setViewMode("translation")}
            className={`rounded-full px-3 py-1 transition ${
              viewMode === "translation"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            🌐 Translation
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center gap-3 overflow-hidden p-4">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous page"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/15 text-lg hover:bg-black/5 sm:flex dark:border-white/20 dark:hover:bg-white/10"
        >
          ‹
        </button>

        <div className="h-full min-w-0 flex-1">
          {pages.length > 0 && viewMode === "original" && (
            <PageFlipReader
              pages={pages}
              imageUrls={imageUrls}
              flipBookRef={flipBookRef}
              onPageChange={setCurrentIndex}
            />
          )}
          {pages.length > 0 && viewMode === "translation" && currentPage && (
            <TranslatedPageView
              page={currentPage}
              targetLang={targetLang}
              pageNumber={currentPage.detectedNumber ?? currentIndex + 1}
            />
          )}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next page"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/15 text-lg hover:bg-black/5 sm:flex dark:border-white/20 dark:hover:bg-white/10"
        >
          ›
        </button>
      </div>

      {currentPage && (
        <>
          <div className="flex items-center justify-center gap-2 pb-2">
            <ReadAloudButton text={currentPage.ocrText} lang={sourceLang.code} label="Read original" />
          </div>
          <TranslationPanel
            page={currentPage}
            sourceLang={sourceLang.code}
            targetLang={targetLang}
            onTargetLangChange={setTargetLang}
            onTranslated={handleTranslated}
            hidePreview={viewMode === "translation"}
          />
        </>
      )}

      <AdminPasscodeModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={executeDelete}
        title="Admin Verification"
        description="Enter the admin passcode to delete books from the public cloud library."
      />
    </div>
  );
}
