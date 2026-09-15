import { rasterizePdf } from "./pdf";
import { detectPageNumber, sortPages } from "./pageOrder";
import { flattenImage, type ProcessImageOptions } from "./imageProcessing";
import type { BookPage, SourceKind } from "./types";

export interface OcrFnResult {
  text: string;
  /** Page number read from the page's margins or headers, if found. */
  pageNumber: number | null;
}

/** Runs OCR on a single page image and returns the extracted text. */
export type OcrFn = (image: Blob, width: number, height: number) => Promise<OcrFnResult>;

export interface ProcessProgress {
  stage: "rasterizing" | "ocr" | "flattening";
  fileName: string;
  fileIndex: number;
  fileCount: number;
  pageIndex?: number;
  pageCount?: number;
}

export type UnsavedPage = Omit<BookPage, "id" | "bookId" | "translations" | "image"> & {
  image: Blob;
};

interface Intermediate {
  sourceIndex: number;
  indexInSource: number;
  sourceFilename: string;
  sourceKind: SourceKind;
  image: Blob;
  width: number;
  height: number;
  ocrText: string;
  detectedNumber: number | null;
}

export interface ProcessFilesOptions extends ProcessImageOptions {
  flattenPages?: boolean;
}

const THROTTLE_MS = 250;
function throttleDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
}

/**
 * Turn a batch of uploaded PDFs/images into ordered, OCR'd page records.
 * Every page is automatically cropped to remove dark/desk borders, resized
 * for crisp low-latency display, and flattened to light paper tones before OCR.
 * Pages are ordered primarily by their detected printed page numbers.
 */
export async function processFiles(
  files: File[],
  runOCR: OcrFn,
  langCode: string,
  onProgress?: (p: ProcessProgress) => void,
  options: ProcessFilesOptions = {}
): Promise<UnsavedPage[]> {
  const {
    autoCrop = true,
    autoResize = true,
    flattenPages = true,
    removeSpineShadows = true,
    whitenBackground = true,
    sharpenText = true,
  } = options;

  const intermediates: Intermediate[] = [];

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      const rasterized = await rasterizePdf(file, (done, total) => {
        onProgress?.({
          stage: "rasterizing",
          fileName: file.name,
          fileIndex,
          fileCount: files.length,
          pageIndex: done,
          pageCount: total,
        });
      });

      for (const rp of rasterized) {
        onProgress?.({
          stage: "ocr",
          fileName: file.name,
          fileIndex,
          fileCount: files.length,
          pageIndex: rp.index + 1,
          pageCount: rasterized.length,
        });

        const pageImage = await flattenImage(rp.image, {
          autoCrop,
          autoResize,
          removeSpineShadows: flattenPages ? removeSpineShadows : false,
          whitenBackground: flattenPages ? whitenBackground : false,
          sharpenText: flattenPages ? sharpenText : false,
        });

        const { width, height } = await readBlobDimensions(pageImage);

        let ocrText = "";
        let pageNumber: number | null = null;
        try {
          const res = await runOCR(pageImage, width, height);
          ocrText = res.text;
          pageNumber = res.pageNumber;
        } catch {
          // Fallback on transient OCR failure: keep image intact
          ocrText = "";
          pageNumber = null;
        }

        const label = `${file.name} — page ${rp.index + 1}`;
        intermediates.push({
          sourceIndex: fileIndex,
          indexInSource: rp.index,
          sourceFilename: label,
          sourceKind: "pdf",
          image: pageImage,
          width,
          height,
          ocrText,
          detectedNumber: pageNumber ?? detectPageNumber(ocrText, ""),
        });

        await throttleDelay();
      }
    } else {
      onProgress?.({ stage: "ocr", fileName: file.name, fileIndex, fileCount: files.length });

      const pageImage = await flattenImage(file, {
        autoCrop,
        autoResize,
        removeSpineShadows: flattenPages ? removeSpineShadows : false,
        whitenBackground: flattenPages ? whitenBackground : false,
        sharpenText: flattenPages ? sharpenText : false,
      });

      const { width, height } = await readBlobDimensions(pageImage);

      let ocrText = "";
      let pageNumber: number | null = null;
      try {
        const res = await runOCR(pageImage, width, height);
        ocrText = res.text;
        pageNumber = res.pageNumber;
      } catch {
        ocrText = "";
        pageNumber = null;
      }

      intermediates.push({
        sourceIndex: fileIndex,
        indexInSource: 0,
        sourceFilename: file.name,
        sourceKind: "image",
        image: pageImage,
        width,
        height,
        ocrText,
        detectedNumber: pageNumber ?? detectPageNumber(ocrText, file.name),
      });

      await throttleDelay();
    }
  }

  // Decide whether to re-sort by detected page number.
  // For a single PDF, the pages are already in the correct sequential order
  // in the PDF itself — re-sorting by (unreliably) detected page numbers
  // only scrambles them. We only sort by detected number when dealing with
  // multiple separate image files where the upload order may be arbitrary.
  const allFromSinglePdf =
    intermediates.length > 0 &&
    intermediates.every(
      (p) => p.sourceKind === "pdf" && p.sourceIndex === intermediates[0].sourceIndex
    );

  const ordered = allFromSinglePdf
    ? // Keep original PDF page order
      [...intermediates].sort((a, b) => a.indexInSource - b.indexInSource)
    : // Multiple files / images → sort by detected printed page number
      sortPages(intermediates);

  return ordered.map((p, i) => ({
    order: i,
    detectedNumber: p.detectedNumber,
    sourceFilename: p.sourceFilename,
    sourceKind: p.sourceKind,
    image: p.image,
    width: p.width,
    height: p.height,
    ocrText: p.ocrText,
    ocrLanguage: langCode,
  }));
}

function readBlobDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read page image dimensions."));
    };
    img.src = url;
  });
}
