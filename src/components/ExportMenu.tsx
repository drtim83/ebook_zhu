"use client";

import { useMemo, useState } from "react";
import type { Book, BookPage } from "@/lib/types";
import { getLanguage } from "@/lib/languages";
import { exportToPdf } from "@/lib/export/pdf";
import { exportToDocx } from "@/lib/export/docx";
import { exportToEpub } from "@/lib/export/epub";
import { downloadBlob, safeFilename } from "@/lib/export/download";

interface ExportMenuProps {
  book: Book;
  pages: BookPage[];
}

type Format = "pdf" | "docx" | "epub";

export default function ExportMenu({ book, pages }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [translationLang, setTranslationLang] = useState<string>("none");
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableTranslations = useMemo(() => {
    const codes = new Set<string>();
    for (const page of pages) {
      Object.keys(page.translations).forEach((code) => codes.add(code));
    }
    return Array.from(codes);
  }, [pages]);

  async function handleExport(format: Format) {
    if (pages.length === 0) return;
    setBusy(format);
    setError(null);
    const base = safeFilename(book.title);
    try {
      if (format === "pdf") {
        const blob = await exportToPdf(pages);
        downloadBlob(blob, `${base}.pdf`);
      } else if (format === "docx") {
        const blob = await exportToDocx(book, pages, { translationLang });
        downloadBlob(blob, `${base}.docx`);
      } else {
        const blob = await exportToEpub(book, pages, { translationLang });
        downloadBlob(blob, `${base}.epub`);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        ⤓ Export
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-black/10 bg-[var(--background)] p-3 shadow-xl dark:border-white/10">
          {availableTranslations.length > 0 && (
            <div className="mb-3 flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">
                Include translation (Word &amp; EPUB only)
              </label>
              <select
                value={translationLang}
                onChange={(e) => setTranslationLang(e.target.value)}
                className="rounded border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
              >
                <option value="none" className="text-black">
                  None
                </option>
                {availableTranslations.map((code) => (
                  <option key={code} value={code} className="text-black">
                    {getLanguage(code).label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <ExportButton
              label="PDF (page images)"
              busy={busy === "pdf"}
              disabled={busy !== null}
              onClick={() => handleExport("pdf")}
            />
            <ExportButton
              label="Word (.docx)"
              busy={busy === "docx"}
              disabled={busy !== null}
              onClick={() => handleExport("docx")}
            />
            <ExportButton
              label="EPUB"
              busy={busy === "epub"}
              disabled={busy !== null}
              onClick={() => handleExport("epub")}
            />
          </div>

          {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}

function ExportButton({
  label,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-black/10 px-3 py-1.5 text-left text-sm transition hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
    >
      {busy ? "Generating…" : label}
    </button>
  );
}
