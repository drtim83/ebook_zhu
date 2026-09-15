import { createWorker, type Worker, PSM } from "tesseract.js";
import { cropAndPreprocessCorner } from "./imageProcessing";

export interface OcrOutput {
  text: string;
  /**
   * Page number read from a corner of the page. Detected with a dedicated
   * English + digits-only OCR pass (see below) rather than reused from the
   * document-language worker, and only ever used to order pages *between*
   * different uploaded files — see `sortPages` in lib/pageOrder.ts.
   */
  pageNumber: number | null;
}

let bodyWorkerPromise: Promise<Worker> | null = null;
let bodyWorkerLang = "";

async function getBodyWorker(lang: string): Promise<Worker> {
  if (bodyWorkerPromise && bodyWorkerLang === lang) {
    return bodyWorkerPromise;
  }
  if (bodyWorkerPromise) {
    const stale = await bodyWorkerPromise;
    await stale.terminate();
  }
  bodyWorkerLang = lang;
  bodyWorkerPromise = createWorker(lang);
  return bodyWorkerPromise;
}

// A page number is virtually always plain Arabic numerals, regardless of
// the document's own language — and a CJK-trained model in particular is
// unreliable at reading digits. Corner numbers get their own dedicated,
// cheap English+whitelist pass with binarization preprocessing.
let digitsWorkerPromise: Promise<Worker> | null = null;

async function getDigitsWorker(): Promise<Worker> {
  if (!digitsWorkerPromise) {
    digitsWorkerPromise = createWorker("eng").then(async (worker) => {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        tessedit_char_whitelist: "0123456789",
      });
      return worker;
    });
  }
  return digitsWorkerPromise;
}

/** Run OCR on an image and return the extracted text plus any corner page number. */
export async function runOCR(
  image: Blob,
  tesseractLang: string,
  width: number,
  height: number
): Promise<OcrOutput> {
  const bodyWorker = await getBodyWorker(tesseractLang);
  const [{ data }, pageNumber] = await Promise.all([
    bodyWorker.recognize(image, {}, { text: true }),
    findCornerPageNumber(image, width, height),
  ]);
  return { text: data.text.trim(), pageNumber };
}

const TOP_CORNER_WIDTH_FRACTION = 0.25;
const TOP_CORNER_HEIGHT_FRACTION = 0.16;
const BOTTOM_CORNER_WIDTH_FRACTION = 0.20;
const BOTTOM_CORNER_HEIGHT_FRACTION = 0.12;
const MIN_CONFIDENCE = 60;

/**
 * Crop each corner of the page (prioritizing top-left and top-right) and run a
 * dedicated binarized digits-only OCR pass to reliably extract top corner page numbers.
 */
async function findCornerPageNumber(
  image: Blob,
  width: number,
  height: number
): Promise<number | null> {
  if (width <= 0 || height <= 0 || typeof createImageBitmap === "undefined") return null;

  const topCw = Math.max(1, Math.round(width * TOP_CORNER_WIDTH_FRACTION));
  const topCh = Math.max(1, Math.round(height * TOP_CORNER_HEIGHT_FRACTION));
  const botCw = Math.max(1, Math.round(width * BOTTOM_CORNER_WIDTH_FRACTION));
  const botCh = Math.max(1, Math.round(height * BOTTOM_CORNER_HEIGHT_FRACTION));

  // Prioritize top-left and top-right corners first
  const corners = [
    { left: 0, top: 0, cw: topCw, ch: topCh, weight: 1.2 }, // top-left
    { left: width - topCw, top: 0, cw: topCw, ch: topCh, weight: 1.2 }, // top-right
    { left: 0, top: height - botCh, cw: botCw, ch: botCh, weight: 1.0 }, // bottom-left
    { left: width - botCw, top: height - botCh, cw: botCw, ch: botCh, weight: 1.0 }, // bottom-right
  ];

  let worker: Worker;
  try {
    worker = await getDigitsWorker();
  } catch {
    return null;
  }

  let best: { value: number; score: number } | null = null;

  for (const corner of corners) {
    let cropped: Blob;
    try {
      cropped = await cropAndPreprocessCorner(image, corner.left, corner.top, corner.cw, corner.ch);
    } catch {
      continue;
    }

    const { data } = await worker.recognize(cropped, {}, { text: true });
    const candidate = extractPageNumber(data.text);
    const score = (data.confidence || 0) * corner.weight;

    if (candidate !== null && data.confidence >= MIN_CONFIDENCE && (!best || score > best.score)) {
      best = { value: candidate, score };
    }
  }

  return best?.value ?? null;
}

function extractPageNumber(rawText: string): number | null {
  const compact = rawText.replace(/\s+/g, "");
  if (!compact) return null;
  const match = compact.match(/\d{1,4}/);
  if (!match) return null;
  const n = parseInt(match[0], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Free the OCR workers' resources (call when leaving the upload flow). */
export async function terminateOCR(): Promise<void> {
  if (bodyWorkerPromise) {
    const worker = await bodyWorkerPromise;
    await worker.terminate();
    bodyWorkerPromise = null;
    bodyWorkerLang = "";
  }
  if (digitsWorkerPromise) {
    const worker = await digitsWorkerPromise;
    await worker.terminate();
    digitsWorkerPromise = null;
  }
}
