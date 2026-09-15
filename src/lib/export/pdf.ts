import { PDFDocument } from "pdf-lib";
import type { BookPage } from "../types";
import { ensureEmbeddable } from "./image";

const MAX_PAGE_WIDTH_PT = 612; // US Letter width, a reasonable default page size
const MAX_PAGE_HEIGHT_PT = 1000;

/**
 * Reproduce the book as a PDF of its page images, one image per PDF page.
 * Image-only by design: it works correctly for every OCR/translation
 * language without needing to embed script-specific fonts.
 */
export async function exportToPdf(pages: BookPage[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const page of pages) {
    const { bytes, mime } = await ensureEmbeddable(page.image || page.imageUrl);
    const image = mime === "image/jpeg" ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);

    const aspect = image.width / image.height;
    let pageWidth = Math.min(MAX_PAGE_WIDTH_PT, image.width);
    let pageHeight = pageWidth / aspect;
    if (pageHeight > MAX_PAGE_HEIGHT_PT) {
      pageHeight = MAX_PAGE_HEIGHT_PT;
      pageWidth = pageHeight * aspect;
    }

    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
    pdfPage.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}
