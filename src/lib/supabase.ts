import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Book, BookPage } from "./types";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rnrvhdhyoqnnljygslgf.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const STORAGE_BUCKET = "ebook-assets";

let clientInstance: SupabaseClient | null = null;

/** Check if Supabase credentials are configured in environment variables. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim().length > 10);
}

/** Get or initialize the Supabase client. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }
  return clientInstance;
}

interface CloudBookRow {
  id: string;
  title: string;
  page_count: number;
  ocr_language: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CloudPageRow {
  id: string;
  book_id: string;
  order_index: number;
  detected_number: number | null;
  source_filename: string;
  image_url: string;
  ocr_text: string;
  ocr_language: string;
  translations: Record<string, string>;
  created_at: string;
}

/** List all books from Supabase Cloud library. */
export async function listCloudBooks(): Promise<Book[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching books from Supabase:", error);
    return [];
  }

  return (data as CloudBookRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    coverUrl: row.cover_url || undefined,
    pageCount: row.page_count,
    ocrLanguage: row.ocr_language,
    isCloud: true,
  }));
}

/** Get a single book and its pages from Supabase Cloud. */
export async function getCloudBook(
  id: string
): Promise<{ book: Book; pages: BookPage[] } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: bookData, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  if (bookError || !bookData) {
    return null;
  }

  const { data: pagesData, error: pagesError } = await supabase
    .from("pages")
    .select("*")
    .eq("book_id", id)
    .order("order_index", { ascending: true });

  if (pagesError || !pagesData) {
    return null;
  }

  const bookRow = bookData as CloudBookRow;
  const book: Book = {
    id: bookRow.id,
    title: bookRow.title,
    createdAt: new Date(bookRow.created_at).getTime(),
    updatedAt: new Date(bookRow.updated_at).getTime(),
    coverUrl: bookRow.cover_url || undefined,
    pageCount: bookRow.page_count,
    ocrLanguage: bookRow.ocr_language,
    isCloud: true,
  };

  const pages: BookPage[] = (pagesData as CloudPageRow[]).map((p) => ({
    id: p.id,
    bookId: p.book_id,
    order: p.order_index,
    detectedNumber: p.detected_number,
    sourceFilename: p.source_filename,
    sourceKind: "image",
    imageUrl: p.image_url,
    width: 800,
    height: 1100,
    ocrText: p.ocr_text || "",
    ocrLanguage: p.ocr_language || "en",
    translations: p.translations || {},
  }));

  return { book, pages };
}

export interface CloudUploadProgress {
  stage: "cover" | "pages" | "database";
  current: number;
  total: number;
  fileName?: string;
}

/** Save a complete book and all page assets into Supabase Storage & Database. */
export async function saveCloudBook(
  book: Book,
  pages: BookPage[],
  onProgress?: (progress: CloudUploadProgress) => void
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      "Supabase credentials not configured. Add NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables."
    );
  }

  let coverUrl: string | undefined = book.coverUrl;

  // 1. Upload Cover Image to Storage
  if (book.coverImage && !coverUrl) {
    onProgress?.({ stage: "cover", current: 0, total: 1, fileName: "cover.jpg" });
    const coverPath = `covers/${book.id}.jpg`;
    const { error: coverErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(coverPath, book.coverImage, {
        contentType: book.coverImage.type || "image/jpeg",
        upsert: true,
      });

    if (coverErr) {
      console.warn("Could not upload cover image:", coverErr.message);
    } else {
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(coverPath);
      coverUrl = publicUrlData.publicUrl;
    }
  }

  // 2. Upload Page Images
  const pageRows: CloudPageRow[] = [];
  const totalPages = pages.length;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    let imageUrl = page.imageUrl;

    onProgress?.({
      stage: "pages",
      current: i + 1,
      total: totalPages,
      fileName: page.sourceFilename,
    });

    if (!imageUrl && page.image) {
      const pagePath = `pages/${book.id}/${page.id}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(pagePath, page.image, {
          contentType: page.image.type || "image/jpeg",
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(
          `Failed to upload page ${i + 1} (${page.sourceFilename}): ${uploadErr.message}`
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(pagePath);
      imageUrl = publicUrlData.publicUrl;
    }

    if (!imageUrl) {
      throw new Error(`Page ${i + 1} has no image data or URL.`);
    }

    pageRows.push({
      id: page.id,
      book_id: book.id,
      order_index: page.order,
      detected_number: page.detectedNumber,
      source_filename: page.sourceFilename,
      image_url: imageUrl,
      ocr_text: page.ocrText || "",
      ocr_language: page.ocrLanguage || book.ocrLanguage,
      translations: page.translations || {},
      created_at: new Date(book.createdAt).toISOString(),
    });
  }

  // 3. Upsert Book Row
  onProgress?.({ stage: "database", current: 1, total: 2 });
  const { error: bookUpsertErr } = await supabase.from("books").upsert({
    id: book.id,
    title: book.title,
    page_count: pages.length,
    ocr_language: book.ocrLanguage,
    cover_url: coverUrl || pageRows[0]?.image_url || null,
    updated_at: new Date().toISOString(),
  });

  if (bookUpsertErr) {
    throw new Error(`Failed to save book to database: ${bookUpsertErr.message}`);
  }

  // 4. Upsert Pages Rows
  onProgress?.({ stage: "database", current: 2, total: 2 });
  const { error: pagesUpsertErr } = await supabase.from("pages").upsert(pageRows);
  if (pagesUpsertErr) {
    throw new Error(`Failed to save book pages to database: ${pagesUpsertErr.message}`);
  }
}

/** Delete a book and its pages from Supabase Cloud. */
export async function deleteCloudBook(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  // 1. Delete rows from database (cascades to pages if configured with cascade)
  await supabase.from("pages").delete().eq("book_id", id);
  await supabase.from("books").delete().eq("id", id);

  // 2. Best-effort storage cleanup
  try {
    const { data: pageFiles } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`pages/${id}`);
    if (pageFiles && pageFiles.length > 0) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(pageFiles.map((f) => `pages/${id}/${f.name}`));
    }
    await supabase.storage.from(STORAGE_BUCKET).remove([`covers/${id}.jpg`]);
  } catch (err) {
    console.warn("Storage cleanup failed:", err);
  }
}

/** Update translation for a specific page in Supabase. */
export async function setCloudPageTranslation(
  pageId: string,
  lang: string,
  text: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: pageData } = await supabase
    .from("pages")
    .select("translations")
    .eq("id", pageId)
    .single();

  const existing = (pageData?.translations as Record<string, string>) || {};
  const updated = { ...existing, [lang]: text };

  await supabase.from("pages").update({ translations: updated }).eq("id", pageId);
}
