export interface EmbeddableImage {
  bytes: ArrayBuffer;
  mime: "image/png" | "image/jpeg";
}

/** Resolve a Blob from a Blob or URL string. */
export async function resolveImageBlob(input: Blob | string | undefined): Promise<Blob> {
  if (!input) {
    throw new Error("No image data or URL provided.");
  }
  if (typeof input === "string") {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Failed to load image from URL: ${input}`);
    return res.blob();
  }
  return input;
}

/**
 * Return image bytes in a format PDF/DOCX embedding can rely on (PNG or
 * JPEG). Anything else (e.g. WebP) is re-encoded to PNG via canvas.
 */
export async function ensureEmbeddable(
  input: Blob | string | undefined
): Promise<EmbeddableImage> {
  const blob = await resolveImageBlob(input);

  if (blob.type === "image/png" || blob.type === "image/jpeg") {
    return { bytes: await blob.arrayBuffer(), mime: blob.type };
  }

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context for image conversion.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const pngBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not convert image to PNG."))),
      "image/png"
    );
  });

  return { bytes: await pngBlob.arrayBuffer(), mime: "image/png" };
}
