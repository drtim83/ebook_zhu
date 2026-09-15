import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  const downloadUrls = [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
      fileId
    )}&export=download`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
  ];

  try {
    for (const url of downloadUrls) {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const arrayBuffer = await res.arrayBuffer();

        return new NextResponse(arrayBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }

    return NextResponse.json(
      { error: "Could not download image from Google Drive." },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Download error" },
      { status: 500 }
    );
  }
}
