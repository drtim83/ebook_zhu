# EbookMania

Upload scanned pages or PDFs and get back a readable, page-flipping ebook:
pages are OCR'd, sorted by detected page number, and can be translated and
read aloud.

## How it works

- **OCR**: [Tesseract.js](https://github.com/naptha/tesseract.js) runs fully
  in the browser by default (no server, no upload of your files anywhere).
  PDFs are rasterized page-by-page with `pdfjs-dist` before OCR. You can
  switch to **Gemini** for OCR in Settings — it tends to do better on messy
  scans/handwriting; this needs your own Gemini API key.
- **Page ordering**: each page's OCR text and filename are scanned for a
  standalone page number; pages sort by that number, falling back to upload
  order for anything without a legible number. You can fix the order by hand
  in the "Arrange pages" step before saving.
- **Storage**: books and pages (including page images) are stored locally in
  the browser via IndexedDB — nothing is uploaded to a server.
- **Translation**: by default, the reader calls a local `/api/translate`
  route, which proxies to a [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate)
  server (`http://localhost:5000`), so no page text leaves your machine
  unless you configure otherwise. You can switch to **Gemini** for
  translation in Settings — it's called directly from your browser using
  your own API key (never sent to any server of ours).
- **Read aloud**: uses the browser's built-in `speechSynthesis` API — no
  extra setup, quality depends on the voices your OS/browser ships with.
- **Export**: from the reader, export the book as:
  - **PDF** — the page images only, reproducing the scanned book exactly.
    Works for every language since it never needs to embed a font.
  - **Word (.docx)** — each page's image plus its recognized text, with an
    optional translation, built with the `docx` package.
  - **EPUB** — same content as the Word export, as a standard EPUB3 file
    readable in Apple Books, Calibre, etc., built by hand with `jszip`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (Next.js will pick a different port automatically if 3000 is already in use — check your terminal output for the actual URL).

### Translation server (optional but recommended)

Translation needs a LibreTranslate server. The easiest way is Docker:

```bash
docker run -ti -p 5000:5000 libretranslate/libretranslate
```

Then copy `.env.local.example` to `.env.local` (the default URL already
points at `http://localhost:5000/translate`, so this is only needed if you
want to point at a different instance).

Without a translation server running, everything else — upload, OCR, page
sorting, the page-flip reader, and read-aloud — still works; only the
"Translate" button will show an error.

### Using Gemini instead

Open **Settings** in the app to switch OCR and/or translation to Gemini and
paste in an API key from [Google AI Studio](https://aistudio.google.com/apikey).
The key is stored only in `localStorage` in your browser and calls go
straight from the browser to Google's API — this app's own server never
sees it.

## Notes

- OCR language packs and the Tesseract worker are fetched from a CDN on
  first use of each language; after that they're cached by the browser.
- Large PDFs/scans can take a while to process since OCR runs page-by-page
  on the client.
