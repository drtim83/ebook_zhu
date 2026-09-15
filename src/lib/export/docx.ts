import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { Book, BookPage } from "../types";
import { getLanguage } from "../languages";
import { ensureEmbeddable, resolveImageBlob } from "./image";

const MAX_IMAGE_WIDTH_PT = 460; // fits comfortably inside a standard page margin

export interface DocxExportOptions {
  /** Language code to include translations for, or "none" to skip. */
  translationLang: string | "none";
}

export async function exportToDocx(
  book: Book,
  pages: BookPage[],
  options: DocxExportOptions
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: book.title,
      heading: HeadingLevel.TITLE,
    }),
  ];

  for (const page of pages) {
    const imgInput = page.image || page.imageUrl;
    const { bytes, mime } = await ensureEmbeddable(imgInput);
    const blob = await resolveImageBlob(imgInput);
    const dimensions = await getImageDimensions(blob);
    const scale = Math.min(1, MAX_IMAGE_WIDTH_PT / dimensions.width);

    children.push(
      new Paragraph({
        text: `Page ${page.detectedNumber ?? pages.indexOf(page) + 1}`,
        heading: HeadingLevel.HEADING_2,
        pageBreakBefore: true,
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: mime === "image/jpeg" ? "jpg" : "png",
            data: bytes,
            transformation: {
              width: Math.round(dimensions.width * scale),
              height: Math.round(dimensions.height * scale),
            },
          }),
        ],
      })
    );

    if (page.ocrText.trim()) {
      children.push(
        new Paragraph({ text: "Recognized text", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ children: [new TextRun(page.ocrText)] })
      );
    }

    if (options.translationLang !== "none") {
      const translated = page.translations[options.translationLang];
      if (translated) {
        children.push(
          new Paragraph({
            text: `Translation (${getLanguage(options.translationLang).label})`,
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({ children: [new TextRun(translated)] })
        );
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions."));
    };
    img.src = url;
  });
}
