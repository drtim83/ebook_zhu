/**
 * Options for page image pre-processing.
 */
export interface ProcessImageOptions {
  autoCrop?: boolean;
  autoResize?: boolean;
  maxDimension?: number;
  removeSpineShadows?: boolean;
  whitenBackground?: boolean;
  sharpenText?: boolean;
}

/**
 * Process a scanned image by automatically cropping dark margins/backgrounds,
 * resizing high-res scans, removing curve/spine shadows, whitening paper tone,
 * and sharpening body text.
 */
export async function flattenImage(
  imageBlob: Blob,
  options: ProcessImageOptions = {}
): Promise<Blob> {
  const {
    autoCrop = true,
    autoResize = true,
    maxDimension = 1600,
    removeSpineShadows = true,
    whitenBackground = true,
    sharpenText = true,
  } = options;

  if (typeof createImageBitmap === "undefined") return imageBlob;

  try {
    const bitmap = await createImageBitmap(imageBlob);
    let origW = bitmap.width;
    let origH = bitmap.height;

    // 1. Initial Canvas setup
    let canvas = document.createElement("canvas");
    canvas.width = origW;
    canvas.height = origH;
    let ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      bitmap.close();
      return imageBlob;
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    // 2. Auto-Crop: Detect content bounding box to trim desk/scanner margins
    if (autoCrop) {
      const croppedCanvas = autoCropCanvas(canvas);
      if (croppedCanvas) {
        canvas = croppedCanvas;
        ctx = canvas.getContext("2d", { willReadFrequently: true });
      }
    }

    // 3. Auto-Resize: Scale oversized scans to maxDimension while maintaining aspect ratio
    if (autoResize && (canvas.width > maxDimension || canvas.height > maxDimension)) {
      canvas = resizeCanvas(canvas, maxDimension);
      ctx = canvas.getContext("2d", { willReadFrequently: true });
    }

    if (!ctx) return imageBlob;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // 4. Pixel-by-pixel processing (spine shadow, whitening, sharpening)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Spine / edge curve shadow compensation (left 12% and right 12% margins)
        if (removeSpineShadows) {
          const distFromEdge = Math.min(x, w - 1 - x) / (w * 0.12);
          if (distFromEdge < 1) {
            const shadowBoost = Math.round((1 - distFromEdge) * 40);
            r = Math.min(255, r + shadowBoost);
            g = Math.min(255, g + shadowBoost);
            b = Math.min(255, b + shadowBoost);
          }
        }

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Whitening paper texture/yellowing to clean ebook background
        if (whitenBackground && lum > 170) {
          const whiteRatio = Math.min(1, (lum - 170) / 65);
          r = Math.round(r + (255 - r) * whiteRatio);
          g = Math.round(g + (255 - g) * whiteRatio);
          b = Math.round(b + (255 - b) * whiteRatio);
        }

        // Sharpen dark text lines for crisp display
        if (sharpenText && lum < 125) {
          const darkenRatio = Math.min(1, (125 - lum) / 125);
          r = Math.max(0, Math.round(r * (1 - 0.2 * darkenRatio)));
          g = Math.max(0, Math.round(g * (1 - 0.2 * darkenRatio)));
          b = Math.max(0, Math.round(b * (1 - 0.2 * darkenRatio)));
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || imageBlob), "image/png");
    });
  } catch {
    return imageBlob;
  }
}

/**
 * Automatically detects page content bounding box and crops away dark background/desk borders safely.
 */
function autoCropCanvas(srcCanvas: HTMLCanvasElement): HTMLCanvasElement | null {
  try {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    if (w <= 0 || h <= 0) return null;

    const ctx = srcCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minY = h, maxY = 0, minX = w, maxX = 0;
    const sampleStep = Math.max(1, Math.floor(Math.min(w, h) / 300));

    for (let y = 0; y < h; y += sampleStep) {
      for (let x = 0; x < w; x += sampleStep) {
        const i = (y * w + x) * 4;
        const alpha = data[i + 3];
        if (alpha < 128) continue; // Skip transparent pixels

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Non-dark background content
        if (lum > 50) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }

    if (minX >= maxX || minY >= maxY) return null;

    const cropW = maxX - minX;
    const cropH = maxY - minY;

    if (cropW < w * 0.2 || cropH < h * 0.2) return null;

    // Add 1.5% safety padding around content
    const padX = Math.round(w * 0.015);
    const padY = Math.round(h * 0.015);

    const finalX = Math.max(0, minX - padX);
    const finalY = Math.max(0, minY - padY);
    const finalW = Math.min(w - finalX, cropW + padX * 2);
    const finalH = Math.min(h - finalY, cropH + padY * 2);

    if (finalW < 10 || finalH < 10) return null;
    if (finalW >= w * 0.96 && finalH >= h * 0.96) return null;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = finalW;
    croppedCanvas.height = finalH;
    const croppedCtx = croppedCanvas.getContext("2d");
    if (!croppedCtx) return null;

    croppedCtx.drawImage(srcCanvas, finalX, finalY, finalW, finalH, 0, 0, finalW, finalH);
    return croppedCanvas;
  } catch {
    return null;
  }
}

/**
 * Resizes canvas to a maximum dimension while maintaining strict aspect ratio.
 */
function resizeCanvas(srcCanvas: HTMLCanvasElement, maxDimension: number): HTMLCanvasElement {
  try {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const maxSide = Math.max(w, h);

    if (maxSide <= maxDimension) return srcCanvas;

    const scale = maxDimension / maxSide;
    const newW = Math.round(w * scale);
    const newH = Math.round(h * scale);

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = newW;
    resizedCanvas.height = newH;
    const resizedCtx = resizedCanvas.getContext("2d");
    if (!resizedCtx) return srcCanvas;

    resizedCtx.imageSmoothingEnabled = true;
    resizedCtx.imageSmoothingQuality = "high";
    resizedCtx.drawImage(srcCanvas, 0, 0, w, h, 0, 0, newW, newH);

    return resizedCanvas;
  } catch {
    return srcCanvas;
  }
}

/**
 * Rotates an image blob by 90, 180, or 270 degrees.
 */
export async function rotateImage(imageBlob: Blob, degrees: 90 | 180 | 270): Promise<Blob> {
  if (typeof createImageBitmap === "undefined") return imageBlob;

  try {
    const bitmap = await createImageBitmap(imageBlob);
    const w = bitmap.width;
    const h = bitmap.height;

    const canvas = document.createElement("canvas");
    if (degrees === 90 || degrees === 270) {
      canvas.width = h;
      canvas.height = w;
    } else {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return imageBlob;
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(bitmap, -w / 2, -h / 2);
    bitmap.close();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || imageBlob), "image/png");
    });
  } catch {
    return imageBlob;
  }
}

/**
 * Crop a corner region of an image, upscale it, and apply high-contrast binarization
 * so top-corner page numbers stand out clearly for Tesseract digits OCR.
 */
export async function cropAndPreprocessCorner(
  image: Blob,
  left: number,
  top: number,
  width: number,
  height: number,
  upscale = 3
): Promise<Blob> {
  const bitmap = await createImageBitmap(image, left, top, width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * upscale);
  canvas.height = Math.round(height * upscale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not get canvas context for corner crop.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(bitmap, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Grayscale & adaptive contrast binarization for OCR digit reading
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = lum > 160 ? 255 : lum < 115 ? 0 : Math.round((lum - 115) * 5.66);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not process corner."))),
      "image/png"
    );
  });
}
