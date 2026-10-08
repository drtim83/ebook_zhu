import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, writeBatch } from "firebase/firestore";

const SUPABASE_URL = "https://rnrvhdhyoqnnljygslgf.supabase.co";
const SUPABASE_KEY = "sb_publishable_ofA8xWXAxQ0W0KwZiyjl1A_8tkVnXGm";

const firebaseConfig = {
  apiKey: "AIzaSyB-0QotD50ahlXgmCpBsqY1GFi4uJKQpw8",
  authDomain: "ebookzhu.firebaseapp.com",
  projectId: "ebookzhu",
  storageBucket: "ebookzhu.firebasestorage.app",
  messagingSenderId: "771939036989",
  appId: "1:771939036989:web:f664de749ded4d4cbb5f54"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PUBLIC_BOOKS_DIR = "/Users/drtimothytok/VibeCoding/Ebook/public/books";

async function downloadToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function run() {
  console.log("=== 1. Fetching Books from Supabase ===");
  const booksRes = await fetch(`${SUPABASE_URL}/rest/v1/books?select=*`, {
    headers: { apikey: SUPABASE_KEY }
  });
  if (!booksRes.ok) throw new Error(`Failed to fetch books: ${booksRes.statusText}`);
  const books = await booksRes.json();
  console.log(`Found ${books.length} book(s) in Supabase.`);

  console.log("=== 2. Fetching Pages from Supabase ===");
  const pagesRes = await fetch(`${SUPABASE_URL}/rest/v1/pages?select=*&order=order_index.asc`, {
    headers: { apikey: SUPABASE_KEY }
  });
  if (!pagesRes.ok) throw new Error(`Failed to fetch pages: ${pagesRes.statusText}`);
  const pages = await pagesRes.json();
  console.log(`Found ${pages.length} page(s) in Supabase.`);

  for (const book of books) {
    console.log(`\nProcessing Book: "${book.title}" (ID: ${book.id})`);
    const bookDir = path.join(PUBLIC_BOOKS_DIR, book.id);
    if (!fs.existsSync(bookDir)) {
      fs.mkdirSync(bookDir, { recursive: true });
    }

    let newCoverUrl = null;
    if (book.cover_url) {
      try {
        const coverFileName = "cover.jpg";
        const coverFilePath = path.join(bookDir, coverFileName);
        await downloadToFile(book.cover_url, coverFilePath);
        newCoverUrl = `/books/${book.id}/${coverFileName}`;
        console.log(`✓ Downloaded cover to ${newCoverUrl}`);
      } catch (err) {
        console.warn(`Cover download failed:`, err.message);
      }
    }

    const bookPages = pages.filter(p => p.book_id === book.id);
    console.log(`Downloading and migrating ${bookPages.length} pages...`);

    const updatedPages = [];
    for (let i = 0; i < bookPages.length; i++) {
      const page = bookPages[i];
      let localImageUrl = page.image_url;

      if (page.image_url && page.image_url.includes("supabase.co")) {
        const paddedIndex = String(page.order_index + 1).padStart(3, "0");
        const fileName = `page_${paddedIndex}.jpg`;
        const filePath = path.join(bookDir, fileName);

        if (!fs.existsSync(filePath)) {
          await downloadToFile(page.image_url, filePath);
        }
        localImageUrl = `/books/${book.id}/${fileName}`;
        process.stdout.write(`\r[${i + 1}/${bookPages.length}] Saved ${fileName} locally`);
      }

      updatedPages.push({
        id: page.id,
        book_id: book.id,
        order_index: page.order_index,
        detected_number: page.detected_number,
        source_filename: page.source_filename,
        image_url: localImageUrl,
        ocr_text: page.ocr_text || "",
        ocr_language: page.ocr_language || book.ocr_language,
        translations: page.translations || {},
        created_at: page.created_at || new Date().toISOString()
      });
    }
    console.log(`\n✓ All ${bookPages.length} images saved to public/books/${book.id}/!`);

    // Write pages to Firestore in batches
    console.log("Writing pages to Cloud Firestore...");
    const BATCH_SIZE = 450;
    for (let i = 0; i < updatedPages.length; i += BATCH_SIZE) {
      const chunk = updatedPages.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const p of chunk) {
        batch.set(doc(db, "pages", p.id), p, { merge: true });
      }
      await batch.commit();
    }
    console.log(`✓ All ${updatedPages.length} pages committed to Firestore!`);

    // Write book doc to Firestore
    const firestoreBookDoc = {
      id: book.id,
      title: book.title,
      page_count: bookPages.length,
      ocr_language: book.ocr_language,
      cover_url: newCoverUrl || updatedPages[0]?.image_url || null,
      created_at: book.created_at,
      updated_at: new Date().toISOString()
    };
    await setDoc(doc(db, "books", book.id), firestoreBookDoc, { merge: true });
    console.log(`✓ Book metadata committed to Firestore: ${book.title}`);
  }

  console.log("\n🎉 Migration finished with 100% success!");
}

run().catch((err) => {
  console.error("\n❌ Migration failed:", err);
  process.exit(1);
});
