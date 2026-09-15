"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Book } from "@/lib/types";

export default function BookCard({ book }: { book: Book }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(book.coverUrl || null);

  useEffect(() => {
    if (book.coverUrl) {
      setCoverUrl(book.coverUrl);
      return;
    }
    if (!book.coverImage) return;
    const url = URL.createObjectURL(book.coverImage);
    queueMicrotask(() => setCoverUrl(url));
    return () => URL.revokeObjectURL(url);
  }, [book.coverImage, book.coverUrl]);

  return (
    <Link
      href={`/reader/${book.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white/60 transition hover:shadow-lg dark:border-white/10 dark:bg-white/5"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#fbf7ee]">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={book.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">📖</div>
        )}
        {book.isCloud && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
            <span>☁️</span>
            <span>Cloud</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-3">
        <p className="truncate text-sm font-medium">{book.title}</p>
        <p className="text-xs text-neutral-500">{book.pageCount} pages</p>
      </div>
    </Link>
  );
}
