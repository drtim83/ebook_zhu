import JSZip from "jszip";
import type { Book, BookPage } from "../types";
import { getLanguage } from "../languages";
import { ensureEmbeddable } from "./image";

export interface EpubExportOptions {
  /** Language code to include translations for, or "none" to skip. */
  translationLang: string | "none";
}

export async function exportToEpub(
  book: Book,
  pages: BookPage[],
  options: EpubExportOptions
): Promise<Blob> {
  const zip = new JSZip();
  const uuid = crypto.randomUUID();
  const modified = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  // The mimetype file must be first and stored (uncompressed), per the EPUB spec.
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.folder("META-INF")!.file("container.xml", CONTAINER_XML);

  const oebps = zip.folder("OEBPS")!;
  const images = oebps.folder("images")!;

  const manifestItems: string[] = [
    `<item id="nav" href="nav.xhtml" properties="nav" media-type="application/xhtml+xml"/>`,
  ];
  const spineItems: string[] = [];
  const navLinks: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = page.detectedNumber ?? i + 1;
    const { bytes, mime } = await ensureEmbeddable(page.image || page.imageUrl);
    const ext = mime === "image/jpeg" ? "jpg" : "png";
    const imageFile = `images/img-${i}.${ext}`;

    images.file(`img-${i}.${ext}`, bytes);

    const translated =
      options.translationLang !== "none" ? page.translations[options.translationLang] : undefined;

    const pageXhtml = PAGE_XHTML_TEMPLATE({
      title: `Page ${pageNum}`,
      imageFile,
      ocrText: page.ocrText,
      translationLabel: translated ? getLanguage(options.translationLang).label : null,
      translationText: translated ?? null,
    });

    oebps.file(`page-${i}.xhtml`, pageXhtml);

    manifestItems.push(
      `<item id="page${i}" href="page-${i}.xhtml" media-type="application/xhtml+xml"/>`,
      `<item id="img${i}" href="${imageFile}" media-type="${mime}"/>`
    );
    spineItems.push(`<itemref idref="page${i}"/>`);
    navLinks.push(`<li><a href="page-${i}.xhtml">Page ${escapeXml(String(pageNum))}</a></li>`);
  }

  oebps.file(
    "content.opf",
    CONTENT_OPF_TEMPLATE({
      uuid,
      title: book.title,
      language: book.ocrLanguage.split("-")[0] || "en",
      modified,
      manifestItems: manifestItems.join("\n    "),
      spineItems: spineItems.join("\n    "),
    })
  );

  oebps.file("nav.xhtml", NAV_XHTML_TEMPLATE({ title: book.title, links: navLinks.join("\n      ") }));

  return zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;

function CONTENT_OPF_TEMPLATE(p: {
  uuid: string;
  title: string;
  language: string;
  modified: string;
  manifestItems: string;
  spineItems: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${p.uuid}</dc:identifier>
    <dc:title>${escapeXml(p.title)}</dc:title>
    <dc:language>${escapeXml(p.language)}</dc:language>
    <meta property="dcterms:modified">${p.modified}</meta>
  </metadata>
  <manifest>
    ${p.manifestItems}
  </manifest>
  <spine>
    ${p.spineItems}
  </spine>
</package>
`;
}

function NAV_XHTML_TEMPLATE(p: { title: string; links: string }): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(p.title)}</title><meta charset="utf-8"/></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${escapeXml(p.title)}</h1>
    <ol>
      ${p.links}
    </ol>
  </nav>
</body>
</html>
`;
}

function PAGE_XHTML_TEMPLATE(p: {
  title: string;
  imageFile: string;
  ocrText: string;
  translationLabel: string | null;
  translationText: string | null;
}): string {
  const ocrBlock = p.ocrText.trim()
    ? `<p class="ocr">${escapeXml(p.ocrText).replace(/\n/g, "<br/>")}</p>`
    : "";
  const translationBlock =
    p.translationText && p.translationLabel
      ? `<h2>${escapeXml(p.translationLabel)}</h2><p class="translation">${escapeXml(p.translationText).replace(/\n/g, "<br/>")}</p>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(p.title)}</title><meta charset="utf-8"/></head>
<body>
  <div class="page">
    <img src="${p.imageFile}" alt="${escapeXml(p.title)}"/>
    ${ocrBlock}
    ${translationBlock}
  </div>
</body>
</html>
`;
}
