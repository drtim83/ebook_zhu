import { NextRequest, NextResponse } from "next/server";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|tiff?|webp|bmp|gif|heic|heif)$/i;

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "tif":
    case "tiff":
      return "image/tiff";
    default:
      return "image/jpeg";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { folderId } = (await req.json()) as { folderId?: string };

    if (!folderId) {
      return NextResponse.json({ error: "Missing folderId" }, { status: 400 });
    }

    // Fetch public folder contents directly from Google Drive embedded folder view
    const viewUrl = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(
      folderId
    )}`;
    const res = await fetch(viewUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Could not access Drive folder (${res.status}). Make sure it is shared as "Anyone with the link can view".`,
        },
        { status: res.status }
      );
    }

    const html = await res.text();

    // Parse all entry IDs and file titles from the HTML
    const entryRegex =
      /<div class="flip-entry"[^>]*id="entry-([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;

    const files: Array<{ id: string; name: string; mimeType: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(html)) !== null) {
      const id = match[1];
      const name = match[2].trim();
      if (IMAGE_EXTENSIONS.test(name)) {
        files.push({
          id,
          name,
          mimeType: getMimeType(name),
        });
      }
    }

    if (files.length === 0) {
      // If regex pattern didn't match, check for alternative Drive layout
      const altRegex = /data-id="([^"]+)"[^>]*data-name="([^"]+)"/g;
      while ((match = altRegex.exec(html)) !== null) {
        const id = match[1];
        const name = match[2].trim();
        if (IMAGE_EXTENSIONS.test(name)) {
          files.push({
            id,
            name,
            mimeType: getMimeType(name),
          });
        }
      }
    }

    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch Drive folder" },
      { status: 500 }
    );
  }
}
