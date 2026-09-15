/** Trigger a browser download for an in-memory Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Turn a book title into a filesystem-safe base filename. */
export function safeFilename(title: string): string {
  return title.trim().replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120) || "book";
}
