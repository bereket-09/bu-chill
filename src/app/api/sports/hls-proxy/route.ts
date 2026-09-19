import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const upstreamRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Referer: "https://damitv.st/",
        Origin: "https://damitv.st",
      },
    });

    if (!upstreamRes.ok) {
      return new NextResponse(`Upstream returned ${upstreamRes.status}`, {
        status: upstreamRes.status,
      });
    }

    const contentType =
      upstreamRes.headers.get("content-type") || "application/vnd.apple.mpegurl";
    const body = await upstreamRes.arrayBuffer();

    const isSegment = url.includes(".ts") || url.includes(".m4s");
    const cacheControl = isSegment
      ? "public, max-age=86400, s-maxage=86400, immutable"
      : "public, max-age=2, s-maxage=3, stale-while-revalidate=5";

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": cacheControl,
      },
    });
  } catch (err: any) {
    return new NextResponse(err?.message || "Internal server error", { status: 500 });
  }
}
