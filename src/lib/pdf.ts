// pdfjs-dist references browser-only globals (DOMMatrix, etc.) at module
// load time, which crashes if evaluated during Next.js's server render of
// this client component tree. Load it lazily, only once actually called
// from the browser.
type PdfjsLib = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfjsLib> | null = null;

async function loadPdfjs(): Promise<PdfjsLib> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return lib;
    });
  }
  return pdfjsPromise;
}

export interface RasterizedPage {
  /** 0-based page index within the PDF. */
  index: number;
  image: Blob;
  width: number;
  height: number;
}

/** Render every page of a PDF file to a PNG image, in order. */
export async function rasterizePdf(
  file: File,
  onProgress?: (done: number, total: number) => void,
  scale = 2
): Promise<RasterizedPage[]> {
  const pdfjsLib = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const pages: RasterizedPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) {
      throw new Error("Could not create canvas context for PDF rasterization.");
    }

    await page.render({ canvasContext, canvas, viewport }).promise;

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to rasterize PDF page"));
      }, "image/png");
    });

    pages.push({
      index: pageNumber - 1,
      image: blob,
      width: canvas.width,
      height: canvas.height,
    });

    onProgress?.(pageNumber, pdf.numPages);
    page.cleanup();
  }

  await loadingTask.destroy();
  return pages;
}
