"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LANGUAGES } from "@/lib/languages";
import { sortByNumber } from "@/lib/pageOrder";
import { processFiles, type ProcessProgress, type UnsavedPage } from "@/lib/process";
import { rotateImage } from "@/lib/imageProcessing";
import { runOCR, terminateOCR } from "@/lib/ocr";
import { geminiOCR, GeminiError } from "@/lib/gemini";
import { getSettings } from "@/lib/settings";
import { saveBook } from "@/lib/db";
import { saveCloudBook, isSupabaseConfigured, type CloudUploadProgress } from "@/lib/supabase";
import type { Book, BookPage } from "@/lib/types";
import { importDriveFolder, type DriveImportProgress } from "@/lib/googleDrive";
import { isUserAdmin } from "@/lib/auth";
import AdminPasscodeModal from "@/components/AdminPasscodeModal";

type Step = "select" | "processing" | "arrange";

function niceFileList(files: File[]) {
  return files.map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`);
}

export default function UploadWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [langCode, setLangCode] = useState("en");
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  const [pages, setPages] = useState<UnsavedPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dragCounter = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [autoCrop, setAutoCrop] = useState(true);
  const [autoResize, setAutoResize] = useState(true);
  const [flattenPages, setFlattenPages] = useState(true);

  const [ocrEngine, setOcrEngine] = useState<"tesseract" | "gemini" | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Google Drive import state
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [driveFolderUrl, setDriveFolderUrl] = useState("");
  const [driveImporting, setDriveImporting] = useState(false);
  const [driveProgress, setDriveProgress] = useState<DriveImportProgress | null>(null);

  // Cloud storage state
  const [storageTarget, setStorageTarget] = useState<"cloud" | "local">("cloud");
  const [hasCloud, setHasCloud] = useState(false);
  const [cloudProgress, setCloudProgress] = useState<CloudUploadProgress | null>(null);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const s = getSettings();
      setOcrEngine(s.ocrEngine);
      setHasApiKey(Boolean(s.geminiApiKey.trim()));
      const cloudAvailable = isSupabaseConfigured();
      setHasCloud(cloudAvailable);
      if (!cloudAvailable) {
        setStorageTarget("local");
      }
    });
    return () => {
      terminateOCR().catch(() => {});
    };
  }, []);

  const thumbUrls = useMemo(() => pages.map((p) => URL.createObjectURL(p.image)), [pages]);
  useEffect(() => {
    return () => thumbUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [thumbUrls]);

  function addFiles(list: FileList | File[]) {
    const accepted = Array.from(list).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type.startsWith("image/") ||
        f.name.toLowerCase().endsWith(".pdf")
    );
    setFiles((prev) => [...prev, ...accepted]);
    if (!title && accepted[0]) {
      setTitle(accepted[0].name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleDriveImport() {
    if (!driveFolderUrl.trim()) {
      setError("Please paste a Google Drive folder URL.");
      return;
    }

    setError(null);
    setDriveImporting(true);
    setDriveProgress(null);

    try {
      const driveFiles = await importDriveFolder(
        driveFolderUrl.trim(),
        setDriveProgress
      );
      addFiles(driveFiles);
      if (!title && driveFiles.length > 0) {
        setTitle("Google Drive Import");
      }
      setShowDriveInput(false);
      setDriveFolderUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import from Google Drive.");
    } finally {
      setDriveImporting(false);
      setDriveProgress(null);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleProcess() {
    if (files.length === 0) return;
    setError(null);
    const settings = getSettings();
    if (settings.ocrEngine === "gemini" && !settings.geminiApiKey.trim()) {
      setError("Please add your Gemini API key in Settings first before processing with Gemini OCR.");
      return;
    }

    setStep("processing");
    setProgress(null);
    try {
      const lang = LANGUAGES.find((l) => l.code === langCode) ?? LANGUAGES[0];
      const ocrFn =
        settings.ocrEngine === "gemini"
          ? async (image: Blob) => geminiOCR(image, settings, lang.label)
          : async (image: Blob, width: number, height: number) =>
              runOCR(image, lang.tesseractCode, width, height);
      const result = await processFiles(files, ocrFn, langCode, setProgress, {
        autoCrop,
        autoResize,
        flattenPages,
      });
      setPages(result);
      setStep("arrange");
    } catch (err) {
      setError(
        err instanceof GeminiError || err instanceof Error
          ? err.message
          : "Something went wrong while processing files."
      );
      setStep("select");
    }
  }

  function move(index: number, direction: -1 | 1) {
    setPages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((p, i) => ({ ...p, order: i }));
    });
  }

  async function handleRotatePage(index: number) {
    const page = pages[index];
    if (!page) return;
    try {
      const rotatedBlob = await rotateImage(page.image, 90);
      setPages((prev) =>
        prev.map((p, i) =>
          i === index
            ? {
                ...p,
                image: rotatedBlob,
                width: p.height,
                height: p.width,
              }
            : p
        )
      );
    } catch {
      // Rotation failed, keep original
    }
  }

  function updateDetectedNumber(index: number, value: string) {
    const n = value.trim() === "" ? null : parseInt(value, 10);
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, detectedNumber: Number.isFinite(n as number) ? n : null } : p))
    );
  }

  function resortByPageNumber() {
    setPages((prev) => sortByNumber(prev, (p) => p.detectedNumber).map((p, i) => ({ ...p, order: i })));
  }

  function handleSave() {
    if (storageTarget === "cloud" && !isUserAdmin()) {
      setShowPasscodeModal(true);
      return;
    }
    executeSave();
  }

  async function executeSave() {
    if (!title.trim() || pages.length === 0) return;
    setSaving(true);
    setError(null);
    setCloudProgress(null);
    try {
      const lang = LANGUAGES.find((l) => l.code === langCode) ?? LANGUAGES[0];
      const now = Date.now();
      const bookId = crypto.randomUUID();

      const bookPages: BookPage[] = pages.map((p, i) => ({
        ...p,
        id: crypto.randomUUID(),
        bookId,
        order: i,
        translations: {},
      }));

      const book: Book = {
        id: bookId,
        title: title.trim(),
        createdAt: now,
        updatedAt: now,
        pageCount: bookPages.length,
        ocrLanguage: lang.code,
        coverImage: bookPages[0]?.image,
        isCloud: storageTarget === "cloud",
      };

      if (storageTarget === "cloud") {
        await saveCloudBook(book, bookPages, (p) => setCloudProgress(p));
      } else {
        await saveBook(book, bookPages);
      }
      router.push(`/reader/${bookId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the book.");
      setSaving(false);
    }
  }

  if (step === "processing") {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800 dark:border-neutral-700 dark:border-t-white" />
        <p className="font-medium">Auto-cropping &amp; processing your pages…</p>
        {progress && (
          <p className="text-sm text-neutral-500">
            {progress.stage === "rasterizing" ? "Opening" : "Recognizing text in"}{" "}
            <span className="font-medium">{progress.fileName}</span>
            {progress.pageCount ? ` — page ${progress.pageIndex}/${progress.pageCount}` : ""}
            {` (file ${progress.fileIndex + 1}/${progress.fileCount})`}
          </p>
        )}
        <p className="text-xs text-neutral-400">Pages are cropped, normalized, and OCR&apos;d locally in your browser.</p>
      </div>
    );
  }

  if (step === "arrange") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold">Arrange &amp; Review Pages</h1>
          <p className="text-sm text-neutral-500">
            Pages have been auto-cropped and sorted by detected page numbers. You can rotate sideways scans, adjust page numbers, or reorder pages below.
          </p>
          {ocrEngine === "tesseract" && (
            <p className="mt-1 text-xs text-neutral-400">
              If numbers are unreliable on a busy layout, try{" "}
              <Link href="/settings" className="underline">
                switching OCR to Gemini
              </Link>{" "}
              — it reads headers/borders with high accuracy.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="button"
          onClick={resortByPageNumber}
          className="self-start rounded-full border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          ↕ Re-sort by Page #
        </button>

        <ul className="flex flex-col gap-2">
          {pages.map((page, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg border border-black/10 p-2 dark:border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrls[i]}
                alt={page.sourceFilename}
                className="h-16 w-12 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{page.sourceFilename}</p>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-neutral-500" title="Detected page number">
                      Page #
                    </label>
                    <input
                      type="number"
                      value={page.detectedNumber ?? ""}
                      onChange={(e) => updateDetectedNumber(i, e.target.value)}
                      placeholder="—"
                      className="w-16 rounded border border-black/15 bg-transparent px-1.5 py-0.5 text-xs dark:border-white/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRotatePage(i)}
                    className="rounded border border-black/15 px-2 py-0.5 text-xs hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                    title="Rotate page 90 degrees clockwise"
                  >
                    ↻ Rotate
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded border border-black/15 px-2 py-0.5 text-xs disabled:opacity-30 dark:border-white/20"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === pages.length - 1}
                  className="rounded border border-black/15 px-2 py-0.5 text-xs disabled:opacity-30 dark:border-white/20"
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-black/10 bg-[var(--background)] py-3 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-500">Destination:</span>
              <div className="flex rounded-lg border border-black/10 p-0.5 dark:border-white/15">
                <button
                  type="button"
                  onClick={() => setStorageTarget("cloud")}
                  disabled={!hasCloud}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                    storageTarget === "cloud"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  } ${!hasCloud ? "opacity-40 cursor-not-allowed" : ""}`}
                  title={!hasCloud ? "Add NEXT_PUBLIC_SUPABASE_ANON_KEY to enable cloud publishing" : "Publish to Supabase Cloud for all readers without login"}
                >
                  <span>☁️ Cloud Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStorageTarget("local")}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                    storageTarget === "local"
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                      : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  }`}
                  title="Save locally in this browser only"
                >
                  <span>💾 Local</span>
                </button>
              </div>
            </div>

            {saving && cloudProgress && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {cloudProgress.stage === "cover" && "Uploading cover…"}
                {cloudProgress.stage === "pages" && `Uploading page ${cloudProgress.current}/${cloudProgress.total}…`}
                {cloudProgress.stage === "database" && "Saving book index to Supabase…"}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="text-sm text-neutral-500 hover:underline"
            >
              ← Start over
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {saving
                ? storageTarget === "cloud"
                  ? "Publishing to Cloud…"
                  : "Saving…"
                : storageTarget === "cloud"
                ? `Publish to Cloud (${pages.length} pages)`
                : `Save locally (${pages.length} pages)`}
            </button>
          </div>
        </div>

        <AdminPasscodeModal
          isOpen={showPasscodeModal}
          onClose={() => setShowPasscodeModal(false)}
          onSuccess={executeSave}
          title="Admin Verification"
          description="Enter the admin passcode to publish books to the public cloud library."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">New ebook</h1>
        <p className="text-sm text-neutral-500">Upload scanned pages or a PDF — pages are automatically cropped, resized, and sorted.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My book"
          className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Document language (for OCR)</label>
        <select
          value={langCode}
          onChange={(e) => setLangCode(e.target.value)}
          className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="text-black">
              {l.label}
            </option>
          ))}
        </select>
        {ocrEngine && (
          <p className="text-xs text-neutral-400">
            OCR via {ocrEngine === "gemini" ? "Gemini" : "Tesseract (local, free)"}
            {ocrEngine === "gemini" && !hasApiKey && (
              <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-400">
                Key needed
              </span>
            )}
            {" · "}
            <Link href="/settings" className="underline">
              Settings
            </Link>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Auto Processing Options</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoCrop}
            onChange={(e) => setAutoCrop(e.target.checked)}
            className="h-4 w-4 rounded border-black/20 text-neutral-900 focus:ring-0 dark:border-white/20"
          />
          <span>Auto-crop dark borders &amp; desk margins</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoResize}
            onChange={(e) => setAutoResize(e.target.checked)}
            className="h-4 w-4 rounded border-black/20 text-neutral-900 focus:ring-0 dark:border-white/20"
          />
          <span>Auto-resize high-resolution scans for fast rendering (max 1600px)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={flattenPages}
            onChange={(e) => setFlattenPages(e.target.checked)}
            className="h-4 w-4 rounded border-black/20 text-neutral-900 focus:ring-0 dark:border-white/20"
          />
          <span>Flatten paper background (remove curve shadows &amp; lighten paper)</span>
        </label>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => {
          e.preventDefault();
          dragCounter.current++;
          setDragOver(true);
        }}
        onDragLeave={() => {
          dragCounter.current--;
          if (dragCounter.current <= 0) setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragCounter.current = 0;
          setDragOver(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition ${
          dragOver ? "border-neutral-800 bg-black/5 dark:border-white dark:bg-white/10" : "border-black/15 dark:border-white/20"
        }`}
      >
        <p className="text-sm text-neutral-500">Drag &amp; drop PDFs or images here</p>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-full border border-black/20 px-4 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
            Choose files
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </label>
          <span className="text-xs text-neutral-400">or</span>
          <button
            type="button"
            onClick={() => setShowDriveInput((s) => !s)}
            className="rounded-full border border-black/20 px-4 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            📁 Import from Google Drive
          </button>
        </div>
      </div>

      {showDriveInput && (
        <div className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 dark:border-white/10">
          <p className="text-xs text-neutral-500">
            Paste a shared Google Drive folder URL. The folder must be shared as &quot;Anyone with the link can view.&quot;
          </p>
          <input
            value={driveFolderUrl}
            onChange={(e) => setDriveFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/1ABC123..."
            className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
            disabled={driveImporting}
          />
          {driveProgress && (
            <p className="text-xs text-neutral-500">
              {driveProgress.stage === "listing"
                ? "Listing images in folder…"
                : `Downloading ${driveProgress.current}/${driveProgress.total}: ${driveProgress.fileName}`}
            </p>
          )}
          <button
            type="button"
            onClick={handleDriveImport}
            disabled={driveImporting || !driveFolderUrl.trim()}
            className="self-start rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {driveImporting ? "Importing…" : "Import images"}
          </button>
        </div>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-lg border border-black/10 p-2 text-sm dark:border-white/10">
          {niceFileList(files).map((label, i) => (
            <li key={i} className="flex items-center justify-between gap-2 px-1 py-0.5">
              <span className="truncate">{label}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 text-neutral-400 hover:text-red-500"
                aria-label={`Remove ${label}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleProcess}
        disabled={files.length === 0 || !title.trim()}
        className="self-start rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
      >
        Process {files.length > 0 ? `(${files.length} file${files.length > 1 ? "s" : ""})` : ""}
      </button>
    </div>
  );
}
