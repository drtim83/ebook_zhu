/** A line that is (almost) nothing but a short number — a page number sitting on its own. */
const STANDALONE_NUMBER = /^[[(]?\s*(\d{1,4})\s*[\])]?[.\-–—]?$/;

/**
 * Try to read a page number off a scanned page: first from the OCR text
 * (page numbers usually sit alone on the first or last line), then from the
 * filename as a fallback (e.g. "023.jpg", "chapter1-page12.png").
 */
export function detectPageNumber(ocrText: string, filename: string): number | null {
  if (ocrText) {
    const lines = ocrText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const candidates = [...lines.slice(0, 3), ...lines.slice(-3)];
    for (const line of candidates) {
      const match = line.match(STANDALONE_NUMBER);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > 0 && n < 10000) return n;
      }
    }
  }

  if (filename) {
    return extractNumberFromFilename(filename);
  }

  return null;
}

function extractNumberFromFilename(filename: string): number | null {
  const base = filename.replace(/\.[^.]+$/, "");
  const matches = base.match(/\d{1,5}/g);
  if (!matches || matches.length === 0) return null;
  // Prefer the last run of digits (e.g. "scan_002" -> 2, "page-12-final" -> 12).
  const n = parseInt(matches[matches.length - 1], 10);
  return Number.isFinite(n) && n > 0 && n < 10000 ? n : null;
}

export interface PageSource {
  /** Upload order of the file this page came from (0-based). */
  sourceIndex: number;
  /** Position of this page within its source file (0-based; PDFs have >1). */
  indexInSource: number;
  detectedNumber: number | null;
}

/**
 * Order pages by detected printed page numbers.
 *
 * Strategy:
 * 1. Pages WITH a detected number are sorted by that number.
 * 2. Pages WITHOUT a detected number keep their original PDF source order
 *    and are placed at the position they naturally belong based on their
 *    PDF index relative to their numbered neighbors.
 *
 * For example, if the PDF has pages [cover(no#), p2, p3, p4, ...],
 * the cover stays first because it comes before page 2 in the source.
 */
export function sortPages<T extends PageSource>(pages: readonly T[]): T[] {
  if (pages.length === 0) return [];

  // First, sort by source order (the order they appear in the PDF)
  const bySource = [...pages].sort((a, b) => {
    if (a.sourceIndex !== b.sourceIndex) return a.sourceIndex - b.sourceIndex;
    return a.indexInSource - b.indexInSource;
  });

  // Separate numbered and unnumbered pages, preserving their source order
  const numbered: Array<{ page: T; srcPos: number }> = [];
  const unnumbered: Array<{ page: T; srcPos: number }> = [];

  for (let i = 0; i < bySource.length; i++) {
    const p = bySource[i];
    if (p.detectedNumber !== null && p.detectedNumber > 0) {
      numbered.push({ page: p, srcPos: i });
    } else {
      unnumbered.push({ page: p, srcPos: i });
    }
  }

  // Sort numbered pages by their printed page number
  numbered.sort((a, b) => a.page.detectedNumber! - b.page.detectedNumber!);

  // Now merge unnumbered pages back in.
  // For each unnumbered page, figure out where it belongs relative to its
  // neighboring numbered pages in the original source order.
  const result: T[] = [];

  // Build a merged list: place each unnumbered page relative to
  // its nearest numbered neighbors in the source ordering.
  // We use the source position to figure out "between which numbered pages"
  // an unnumbered page sits.

  // Create slots: for each pair of consecutive numbered pages (in source order),
  // collect unnumbered pages that fall between them.
  // Also collect unnumbered pages before the first numbered and after the last.

  // Get numbered pages in SOURCE order to determine boundaries
  const numberedBySource = [...numbered].sort((a, b) => a.srcPos - b.srcPos);

  if (numberedBySource.length === 0) {
    // No numbered pages at all — just return source order
    return bySource;
  }

  // For each unnumbered page, find which "gap" it belongs to in source order
  interface Gap {
    // The printed page number BEFORE this gap (null = start of book)
    beforeNum: number | null;
    // The printed page number AFTER this gap (null = end of book)
    afterNum: number | null;
    pages: T[];
  }

  // Gaps are defined by consecutive numbered pages in source order
  const gaps: Gap[] = [];

  // Gap before the first numbered page
  gaps.push({
    beforeNum: null,
    afterNum: numberedBySource[0].page.detectedNumber,
    pages: [],
  });

  // Gaps between consecutive numbered pages
  for (let i = 0; i < numberedBySource.length - 1; i++) {
    gaps.push({
      beforeNum: numberedBySource[i].page.detectedNumber,
      afterNum: numberedBySource[i + 1].page.detectedNumber,
      pages: [],
    });
  }

  // Gap after the last numbered page
  gaps.push({
    beforeNum: numberedBySource[numberedBySource.length - 1].page.detectedNumber,
    afterNum: null,
    pages: [],
  });

  // Assign each unnumbered page to its gap
  for (const u of unnumbered) {
    let gapIndex = 0;
    for (let i = 0; i < numberedBySource.length; i++) {
      if (u.srcPos > numberedBySource[i].srcPos) {
        gapIndex = i + 1;
      }
    }
    gaps[gapIndex].pages.push(u.page);
  }

  // Now build the final sorted list:
  // - Emit gap[0] pages (before first numbered page)
  // - For each numbered page (in printed-number order), emit it,
  //   then emit any gap pages that belong between it and the next numbered page

  // First, emit pages that come before ANY numbered page (cover, title, etc.)
  for (const p of gaps[0].pages) {
    result.push(p);
  }

  // Map from numbered page to its gap (pages between it and the next numbered page)
  // We need to map by printed-number order
  const numberedSorted = numbered; // already sorted by detectedNumber

  for (let i = 0; i < numberedSorted.length; i++) {
    result.push(numberedSorted[i].page);

    // Find which gap in source order corresponds to "after this numbered page"
    // by finding this page's position in the source-ordered numbered list
    const srcOrderIndex = numberedBySource.findIndex(
      (n) => n.srcPos === numberedSorted[i].srcPos
    );
    if (srcOrderIndex >= 0 && srcOrderIndex + 1 < gaps.length) {
      for (const p of gaps[srcOrderIndex + 1].pages) {
        result.push(p);
      }
    }
  }

  return result;
}

/**
 * Sort items by a number extracted from each one, interpolating a key for
 * items where the extractor returns `null` so they land between their
 * nearest numbered neighbors.
 */
export function sortByNumber<T>(items: readonly T[], getNumber: (item: T) => number | null): T[] {
  const keys = interpolateKeys(items.map(getNumber));
  return items
    .map((item, i) => ({ item, key: keys[i] }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

function sanitizeNumbers(numbers: ReadonlyArray<number | null>): Array<number | null> {
  return numbers.map((val) => (val !== null && val > 0 && val < 20000 ? val : null));
}

/**
 * Fill in sort keys for a sequence where some entries have a known number
 * and others are `null`, by linearly interpolating unknowns between their
 * nearest known neighbors (extrapolating at the ends).
 */
function interpolateKeys(numbers: ReadonlyArray<number | null>): number[] {
  const cleanNumbers = sanitizeNumbers(numbers);
  const known = cleanNumbers
    .map((value, index) => ({ index, value }))
    .filter((entry): entry is { index: number; value: number } => entry.value !== null);

  if (known.length === 0) {
    return numbers.map((_, i) => i + 1);
  }

  // If there's only 1 known number at index K, extrapolate from that anchor
  if (known.length === 1) {
    const anchor = known[0];
    return cleanNumbers.map((val, i) => (val !== null ? val : anchor.value + (i - anchor.index)));
  }

  const NUDGE = 0.01;
  return cleanNumbers.map((value, i) => {
    if (value !== null) return value;

    let prev: { index: number; value: number } | undefined;
    let next: { index: number; value: number } | undefined;
    for (const entry of known) {
      if (entry.index < i) prev = entry;
      if (entry.index > i && !next) next = entry;
    }

    if (prev && next) {
      const t = (i - prev.index) / (next.index - prev.index);
      return prev.value + (next.value - prev.value) * t;
    }
    if (prev) return prev.value + (i - prev.index) * NUDGE;
    if (next) return next.value - (next.index - i) * NUDGE;
    return i + 1;
  });
}
