"use client";

import type { ComponentType, Ref } from "react";
import HTMLFlipBookImport from "react-pageflip";
import type { BookPage } from "@/lib/types";

// react-pageflip's .d.ts marks every layout prop as required, even though
// the runtime component supplies defaults for all of them. Widening the
// type here avoids fighting the upstream definitions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HTMLFlipBook = HTMLFlipBookImport as unknown as ComponentType<any>;

interface PageFlipReaderProps {
  pages: BookPage[];
  imageUrls: string[];
  onPageChange?: (index: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flipBookRef?: Ref<any>;
}

export default function PageFlipReader({
  pages,
  imageUrls,
  onPageChange,
  flipBookRef,
}: PageFlipReaderProps) {
  return (
    <HTMLFlipBook
      ref={flipBookRef}
      width={480}
      height={680}
      minWidth={280}
      maxWidth={960}
      minHeight={400}
      maxHeight={1280}
      size="stretch"
      showCover
      drawShadow
      flippingTime={650}
      usePortrait
      startZIndex={10}
      autoSize
      maxShadowOpacity={0.5}
      mobileScrollSupport
      clickEventForward
      useMouseEvents
      swipeDistance={20}
      showPageCorners
      disableFlipByClick={false}
      startPage={0}
      className="mx-auto [filter:drop-shadow(0_18px_40px_rgba(0,0,0,0.35))]"
      style={{}}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onFlip={(e: any) => onPageChange?.(e.data)}
    >
      {pages.map((page, i) => (
        <div
          key={page.id}
          className="relative flex items-center justify-center overflow-hidden bg-[#f6f0e2]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrls[i]}
            alt={page.sourceFilename}
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
          {/* Softens scan artifacts (torn/uneven edges from the original photo) and
              gives the page a bit of depth, like light falling across a real leaf of paper. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: "inset 0 0 3.5vw rgba(70,55,30,0.16), inset 0 0 0.6vw rgba(70,55,30,0.12)",
            }}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[3%] bg-gradient-to-r from-black/15 to-transparent" />
          <span className="absolute bottom-2 right-3 rounded bg-white/80 px-2 py-0.5 text-xs text-neutral-500 shadow-sm">
            {page.detectedNumber ?? i + 1}
          </span>
        </div>
      ))}
    </HTMLFlipBook>
  );
}
