/**
 * Cloud backend implementation for Ebook using Firebase (Firestore & Storage).
 * Maintained with compatibility exports for existing UI components.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { db, storage, isFirebaseConfigured } from "./firebase";
import type { Book, BookPage } from "./types";

export { isFirebaseConfigured, isFirebaseConfigured as isSupabaseConfigured };

export function getSupabase() {
  return isFirebaseConfigured() ? { firestore: db, storage } : null;
}

export interface CloudUploadProgress {
  stage: "cover" | "pages" | "database";
  current: number;
  total: number;
  fileName?: string;
}

interface CloudBookDoc {
  id: string;
  title: string;
  page_count: number;
  ocr_language: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CloudPageDoc {
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

/** List all books from Cloud library. */
export async function listCloudBooks(): Promise<Book[]> {
  if (!isFirebaseConfigured()) return [];

  try {
    const q = query(collection(db, "books"), orderBy("updated_at", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data() as CloudBookDoc;
      return {
        id: data.id || d.id,
        title: data.title,
        createdAt: new Date(data.created_at || Date.now()).getTime(),
        updatedAt: new Date(data.updated_at || Date.now()).getTime(),
        coverUrl: data.cover_url || undefined,
        pageCount: data.page_count,
        ocrLanguage: data.ocr_language,
        isCloud: true,
      };
    });
  } catch (err) {
    console.error("Error fetching books from Firestore:", err);
    return [];
  }
}

/** Get a single book and its pages from Cloud. */
export async function getCloudBook(
  id: string
): Promise<{ book: Book; pages: BookPage[] } | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const bookRef = doc(db, "books", id);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) return null;

    const bookData = bookSnap.data() as CloudBookDoc;
    const book: Book = {
      id: bookData.id || bookSnap.id,
      title: bookData.title,
      createdAt: new Date(bookData.created_at || Date.now()).getTime(),
      updatedAt: new Date(bookData.updated_at || Date.now()).getTime(),
      coverUrl: bookData.cover_url || undefined,
      pageCount: bookData.page_count,
      ocrLanguage: bookData.ocr_language,
      isCloud: true,
    };

    const pagesQ = query(
      collection(db, "pages"),
      where("book_id", "==", id)
    );
    const pagesSnap = await getDocs(pagesQ);

    const pages: BookPage[] = pagesSnap.docs
      .map((d) => {
        const p = d.data() as CloudPageDoc;
        return {
          id: p.id || d.id,
          bookId: p.book_id,
          order: p.order_index,
          detectedNumber: p.detected_number,
          sourceFilename: p.source_filename,
          sourceKind: "image" as const,
          imageUrl: p.image_url,
          width: 800,
          height: 1100,
          ocrText: p.ocr_text || "",
          ocrLanguage: p.ocr_language || "en",
          translations: p.translations || {},
        };
      })
      .sort((a, b) => a.order - b.order);

    return { book, pages };
  } catch (err) {
    console.error("Error loading cloud book:", err);
    return null;
  }
}

/** Save a complete book and all page assets into Firebase Storage & Firestore. */
export async function saveCloudBook(
  book: Book,
  pages: BookPage[],
  onProgress?: (progress: CloudUploadProgress) => void
): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase credentials not configured.");
  }

  let coverUrl: string | undefined = book.coverUrl;

  // 1. Upload Cover Image to Firebase Storage
  if (book.coverImage && !coverUrl) {
    onProgress?.({ stage: "cover", current: 0, total: 1, fileName: "cover.jpg" });
    const coverStorageRef = ref(storage, `covers/${book.id}.jpg`);
    await uploadBytes(coverStorageRef, book.coverImage, {
      contentType: book.coverImage.type || "image/jpeg",
    });
    coverUrl = await getDownloadURL(coverStorageRef);
  }

  // 2. Upload Page Images
  const pageRows: CloudPageDoc[] = [];
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
      const pageStorageRef = ref(storage, `pages/${book.id}/${page.id}.jpg`);
      await uploadBytes(pageStorageRef, page.image, {
        contentType: page.image.type || "image/jpeg",
      });
      imageUrl = await getDownloadURL(pageStorageRef);
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
      created_at: new Date(book.createdAt || Date.now()).toISOString(),
    });
  }

  // 3. Upsert Book Doc in Firestore
  onProgress?.({ stage: "database", current: 1, total: 2 });
  const bookRef = doc(db, "books", book.id);
  await setDoc(
    bookRef,
    {
      id: book.id,
      title: book.title,
      page_count: pages.length,
      ocr_language: book.ocrLanguage,
      cover_url: coverUrl || pageRows[0]?.image_url || null,
      created_at: new Date(book.createdAt || Date.now()).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );

  // 4. Upsert Pages in Firestore in Batches
  onProgress?.({ stage: "database", current: 2, total: 2 });
  const BATCH_SIZE = 450;
  for (let i = 0; i < pageRows.length; i += BATCH_SIZE) {
    const chunk = pageRows.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const pageRow of chunk) {
      const pageRef = doc(db, "pages", pageRow.id);
      batch.set(pageRef, pageRow, { merge: true });
    }
    await batch.commit();
  }
}

/** Delete a book and its pages from Firebase. */
export async function deleteCloudBook(id: string): Promise<void> {
  if (!isFirebaseConfigured()) return;

  // 1. Delete page docs from Firestore
  const pagesQ = query(collection(db, "pages"), where("book_id", "==", id));
  const pagesSnap = await getDocs(pagesQ);
  if (!pagesSnap.empty) {
    const batch = writeBatch(db);
    pagesSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // 2. Delete book doc from Firestore
  await deleteDoc(doc(db, "books", id));

  // 3. Cleanup storage files
  try {
    const coverRef = ref(storage, `covers/${id}.jpg`);
    await deleteObject(coverRef).catch(() => {});

    const pagesFolderRef = ref(storage, `pages/${id}`);
    const filesList = await listAll(pagesFolderRef).catch(() => null);
    if (filesList) {
      await Promise.all(filesList.items.map((item) => deleteObject(item).catch(() => {})));
    }
  } catch (err) {
    console.warn("Storage cleanup failed:", err);
  }
}

/** Update translation for a specific page in Firestore. */
export async function setCloudPageTranslation(
  pageId: string,
  lang: string,
  text: string
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const pageRef = doc(db, "pages", pageId);
  await updateDoc(pageRef, {
    [`translations.${lang}`]: text,
  });
}

/** Helper for unified search across all cloud books and pages. */
export async function getAllCloudData(): Promise<{ books: Book[]; pages: BookPage[] }> {
  if (!isFirebaseConfigured()) return { books: [], pages: [] };

  try {
    const [booksSnap, pagesSnap] = await Promise.all([
      getDocs(collection(db, "books")),
      getDocs(collection(db, "pages")),
    ]);

    const books: Book[] = booksSnap.docs.map((d) => {
      const data = d.data() as CloudBookDoc;
      return {
        id: data.id || d.id,
        title: data.title,
        createdAt: new Date(data.created_at || Date.now()).getTime(),
        updatedAt: new Date(data.updated_at || Date.now()).getTime(),
        coverUrl: data.cover_url || undefined,
        pageCount: data.page_count,
        ocrLanguage: data.ocr_language,
        isCloud: true,
      };
    });

    const pages: BookPage[] = pagesSnap.docs.map((d) => {
      const p = d.data() as CloudPageDoc;
      return {
        id: p.id || d.id,
        bookId: p.book_id,
        order: p.order_index,
        detectedNumber: p.detected_number,
        sourceFilename: p.source_filename,
        sourceKind: "image" as const,
        imageUrl: p.image_url,
        width: 800,
        height: 1100,
        ocrText: p.ocr_text || "",
        ocrLanguage: p.ocr_language || "en",
        translations: p.translations || {},
      };
    });

    return { books, pages };
  } catch (err) {
    console.error("Error loading cloud data for search:", err);
    return { books: [], pages: [] };
  }
}
