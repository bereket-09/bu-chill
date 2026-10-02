import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    if (!path || path.length === 0) {
      return NextResponse.json({ error: "Missing image path" }, { status: 400 });
    }

    const subPath = path.map((segment) => encodeURIComponent(segment)).join("/");
    const targetUrl = `${TMDB_IMAGE_BASE_URL}/${subPath}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("[TMDB Image Proxy Error]:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to load image" },
      { status: 502 }
    );
  }
}

export const HEAD = GET;
