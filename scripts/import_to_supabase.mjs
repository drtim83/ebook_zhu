import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://rnrvhdhyoqnnljygslgf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucnZoZGh5b3FubmxqeWdzbGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzgxNDEsImV4cCI6MjEwNTAxNDE0MX0.PUVisbAeKBWlpSWFTGaY20-XhH2p3bxIsGaKHJaIQ3U";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET = "ebook-assets";

const ASSETS_DIR = path.resolve("android_app/app/src/main/assets");
const PAGES_DIR = path.join(ASSETS_DIR, "pages");
const BOOK_DATA_FILE = path.join(ASSETS_DIR, "data/book_data.js");

async function main() {
  console.log("🚀 Starting import to Supabase...");

  // 1. Read book_data.js
  const rawJs = fs.readFileSync(BOOK_DATA_FILE, "utf-8");
  const jsonStr = rawJs.replace(/^window\.BOOK_DATA\s*=\s*/, "").replace(/;?\s*$/, "");
  const bookData = JSON.parse(jsonStr);

  const bookId = "zhu-family-lineage";
  const title = bookData.title || "海南省文昌市 祝氏族谱";
  const totalPages = bookData.pages.length;

  console.log(`📖 Found book: "${title}" with ${totalPages} pages.`);

  // 2. Upload all 96 images to Supabase Storage
  console.log(`📦 Uploading ${totalPages} page images to bucket: ${BUCKET}...`);
  const uploadedPages = [];

  for (let i = 0; i < bookData.pages.length; i++) {
    const page = bookData.pages[i];
    const pageNum = page.pageNum;
    const filename = `page_${String(pageNum).padStart(3, "0")}.jpg`;
    const localFilePath = path.join(PAGES_DIR, filename);

    if (!fs.existsSync(localFilePath)) {
      console.warn(`⚠️ Warning: ${localFilePath} does not exist, skipping...`);
      continue;
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const storagePath = `pages/${filename}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.error(`❌ Failed to upload ${storagePath}:`, uploadErr.message);
    } else {
      process.stdout.write(`✅ Uploaded [${i + 1}/${totalPages}] ${storagePath}\r`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    uploadedPages.push({
      id: `zhu-page-${String(pageNum).padStart(3, "0")}`,
      book_id: bookId,
      order_index: i,
      detected_number: pageNum,
      source_filename: filename,
      image_url: urlData.publicUrl,
      ocr_text: page.chineseText || "",
      ocr_language: "zh",
      translations: {
        en: (bookData.englishSections && bookData.englishSections[Math.min(bookData.englishSections.length - 1, Math.floor((i / totalPages) * bookData.englishSections.length))]?.paragraphs?.slice(0, 3)?.join("\n\n")) || "",
      },
    });
  }
  console.log(`\n🎉 All ${uploadedPages.length} images uploaded to Supabase Storage!`);

  // 3. Upsert Book record
  const coverUrl = uploadedPages[1]?.image_url || uploadedPages[0]?.image_url;
  const { error: bookErr } = await supabase.from("books").upsert({
    id: bookId,
    title,
    page_count: uploadedPages.length,
    ocr_language: "zh",
    cover_url: coverUrl,
    updated_at: new Date().toISOString(),
  });

  if (bookErr) {
    console.error("❌ Failed to save book in Supabase DB:", bookErr.message);
  } else {
    console.log(`📚 Book record created in Supabase database.`);
  }

  // 4. Upsert Pages in batches of 20
  console.log("📝 Saving pages into Supabase database...");
  for (let i = 0; i < uploadedPages.length; i += 20) {
    const chunk = uploadedPages.slice(i, i + 20);
    const { error: pageErr } = await supabase.from("pages").upsert(chunk);
    if (pageErr) {
      console.error(`❌ Error inserting chunk ${i}:`, pageErr.message);
    }
  }
  console.log("✨ All pages successfully saved in Supabase database!");
  console.log(`Cover URL: ${coverUrl}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
