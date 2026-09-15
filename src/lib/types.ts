export type SourceKind = "pdf" | "image";

export interface BookPage {
  /** Unique id for this page, stable across saves. */
  id: string;
  /** Id of the book this page belongs to. */
  bookId: string;
  /** Sort position within the book (lower = earlier). Editable via the arrange step. */
  order: number;
  /** Page number auto-detected from the filename or OCR text, if any. */
  detectedNumber: number | null;
  /** Original filename (or "<pdf name> — page N" for rasterized PDF pages). */
  sourceFilename: string;
  sourceKind: SourceKind;
  /** The page image, stored as-is in IndexedDB, or loaded as Blob on demand. */
  image?: Blob;
  /** Public CDN URL if stored in Supabase Cloud Storage. */
  imageUrl?: string;
  width: number;
  height: number;
  /** Raw OCR output. */
  ocrText: string;
  /** Language the OCR was run with, as one of LANGUAGES' codes (e.g. "en"). */
  ocrLanguage: string;
  /** Cached translations, keyed by target language code (e.g. "zh", "ms"). */
  translations: Record<string, string>;
}

export interface Book {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  /** Cover thumbnail, copied from the first page image. */
  coverImage?: Blob;
  /** Public CDN URL for cover image if stored in Cloud Storage. */
  coverUrl?: string;
  pageCount: number;
  /** Language the book was OCR'd with, as one of LANGUAGES' codes (e.g. "en"). */
  ocrLanguage: string;
  /** Whether the book is stored in Supabase Cloud. */
  isCloud?: boolean;
}

export interface BookWithPages extends Book {
  pages: BookPage[];
}
