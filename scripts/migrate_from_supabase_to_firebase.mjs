import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
const storage = getStorage(app);

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
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
    let newCoverUrl = null;

    if (book.cover_url) {
      try {
        console.log(`Downloading cover image from ${book.cover_url}...`);
        const coverBuf = await downloadBuffer(book.cover_url);
        const coverRef = ref(storage, `covers/${book.id}.jpg`);
        await uploadBytes(coverRef, coverBuf, { contentType: "image/jpeg" });
        newCoverUrl = await getDownloadURL(coverRef);
        console.log(`✓ Cover uploaded to Firebase Storage: ${newCoverUrl}`);
      } catch (err) {
        console.warn(`Cover download/upload failed:`, err.message);
      }
    }

    const bookPages = pages.filter(p => p.book_id === book.id);
    console.log(`Transferring ${bookPages.length} pages for book ${book.id}...`);

    for (let i = 0; i < bookPages.length; i++) {
      const page = bookPages[i];
      let newImageUrl = page.image_url;

      if (page.image_url && page.image_url.includes("supabase.co")) {
        try {
          const imgBuf = await downloadBuffer(page.image_url);
          const pageRef = ref(storage, `pages/${book.id}/${page.id}.jpg`);
          await uploadBytes(pageRef, imgBuf, { contentType: "image/jpeg" });
          newImageUrl = await getDownloadURL(pageRef);
          process.stdout.write(`\r[${i + 1}/${bookPages.length}] Migrated ${page.id} (${(imgBuf.length / 1024).toFixed(0)} KB)`);
        } catch (err) {
          console.warn(`\nFailed to transfer image for page ${page.id}:`, err.message);
        }
      }

      // Upsert page to Firestore
      const firestorePageDoc = {
        id: page.id,
        book_id: book.id,
        order_index: page.order_index,
        detected_number: page.detected_number,
        source_filename: page.source_filename,
        image_url: newImageUrl,
        ocr_text: page.ocr_text || "",
        ocr_language: page.ocr_language || book.ocr_language,
        translations: page.translations || {},
        created_at: page.created_at || new Date().toISOString()
      };
      await setDoc(doc(db, "pages", page.id), firestorePageDoc, { merge: true });
    }
    console.log(`\n✓ All ${bookPages.length} pages written to Firestore!`);

    // Upsert book doc
    const firestoreBookDoc = {
      id: book.id,
      title: book.title,
      page_count: bookPages.length,
      ocr_language: book.ocr_language,
      cover_url: newCoverUrl || (bookPages[0]?.image_url || null),
      created_at: book.created_at,
      updated_at: new Date().toISOString()
    };
    await setDoc(doc(db, "books", book.id), firestoreBookDoc, { merge: true });
    console.log(`✓ Book metadata written to Firestore: ${book.title}`);
  }

  console.log("\n🎉 Migration completed successfully!");
}

run().catch((err) => {
  console.error("\n❌ Migration failed:", err);
  process.exit(1);
});
