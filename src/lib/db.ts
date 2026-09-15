import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Book, BookPage } from "./types";

interface EbookDB extends DBSchema {
  books: {
    key: string;
    value: Book;
  };
  pages: {
    key: string;
    value: BookPage;
    indexes: { bookId: string };
  };
}

let dbPromise: Promise<IDBPDatabase<EbookDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EbookDB>("ebook-app", 1, {
      upgrade(db) {
        db.createObjectStore("books", { keyPath: "id" });
        const pageStore = db.createObjectStore("pages", { keyPath: "id" });
        pageStore.createIndex("bookId", "bookId");
      },
    });
  }
  return dbPromise;
}

export async function saveBook(book: Book, pages: BookPage[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["books", "pages"], "readwrite");
  await tx.objectStore("books").put(book);
  const pageStore = tx.objectStore("pages");
  await Promise.all(pages.map((page) => pageStore.put(page)));
  await tx.done;
}

export async function listBooks(): Promise<Book[]> {
  const db = await getDB();
  const books = await db.getAll("books");
  return books.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getBook(id: string): Promise<Book | undefined> {
  const db = await getDB();
  return db.get("books", id);
}

export async function getBookPages(bookId: string): Promise<BookPage[]> {
  const db = await getDB();
  const pages = await db.getAllFromIndex("pages", "bookId", bookId);
  return pages.sort((a, b) => a.order - b.order);
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["books", "pages"], "readwrite");
  const pageStore = tx.objectStore("pages");
  const index = pageStore.index("bookId");
  let cursor = await index.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.objectStore("books").delete(id);
  await tx.done;
}

export async function updatePage(page: BookPage): Promise<void> {
  const db = await getDB();
  await db.put("pages", page);
}

export async function setPageTranslation(
  pageId: string,
  lang: string,
  text: string
): Promise<void> {
  const db = await getDB();
  const page = await db.get("pages", pageId);
  if (!page) return;
  page.translations = { ...page.translations, [lang]: text };
  await db.put("pages", page);
}

export async function getAllPages(): Promise<BookPage[]> {
  const db = await getDB();
  return db.getAll("pages");
}

