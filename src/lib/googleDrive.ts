/**
 * Client-side helpers for importing images from a shared Google Drive folder.
 *
 * Flow:
 * 1. Parse the folder URL to extract the folder ID
 * 2. Call our /api/drive route to list images in the folder
 * 3. Download each image via our /api/drive/download proxy route
 * 4. Return File objects that plug straight into the existing processing pipeline
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

const FOLDER_URL_PATTERNS = [
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  /drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/,
];

/** Extract a Google Drive folder ID from a URL. */
export function parseDriveFolderUrl(url: string): string | null {
  const trimmed = url.trim();

  // Check if it's already just a folder ID (no slashes, valid chars)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  for (const pattern of FOLDER_URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** List all image files inside a shared Drive folder. */
export async function listDriveImages(folderId: string): Promise<DriveFile[]> {
  const res = await fetch("/api/drive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to list Drive folder (${res.status})`);
  }
  return (data.files ?? []) as DriveFile[];
}

/** Download a single Drive image through our proxy and return a browser File. */
export async function downloadDriveImage(file: DriveFile): Promise<File> {
  const params = new URLSearchParams({ fileId: file.id });
  const res = await fetch(`/api/drive/download?${params.toString()}`);

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Failed to download ${file.name}: ${detail.slice(0, 200)}`);
  }

  const blob = await res.blob();
  return new File([blob], file.name, { type: file.mimeType });
}

export interface DriveImportProgress {
  stage: "listing" | "downloading";
  current: number;
  total: number;
  fileName: string;
}

/**
 * Import all images from a shared Google Drive folder.
 * Returns an array of File objects ready for the processing pipeline.
 */
export async function importDriveFolder(
  folderUrl: string,
  onProgress?: (p: DriveImportProgress) => void
): Promise<File[]> {
  const folderId = parseDriveFolderUrl(folderUrl);
  if (!folderId) {
    throw new Error(
      "Could not parse a Google Drive folder ID from that URL. " +
        "Paste a link like: https://drive.google.com/drive/folders/1ABC123..."
    );
  }

  onProgress?.({ stage: "listing", current: 0, total: 0, fileName: "" });

  const driveFiles = await listDriveImages(folderId);
  if (driveFiles.length === 0) {
    throw new Error(
      "No image files found in that folder. Make sure the folder is shared as " +
        "\"Anyone with the link can view\" and contains JPG/PNG/TIFF/WebP images."
    );
  }

  // Sort by filename for consistent ordering
  driveFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const files: File[] = [];
  for (let i = 0; i < driveFiles.length; i++) {
    const df = driveFiles[i];
    onProgress?.({
      stage: "downloading",
      current: i + 1,
      total: driveFiles.length,
      fileName: df.name,
    });

    const file = await downloadDriveImage(df);
    files.push(file);
  }

  return files;
}
