import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

function rewriteManifest(manifestText: string, baseUrl: string, proxyOrigin: string): string {
  const lines = manifestText.split(/\r?\n/);
  const rewritten: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      rewritten.push(lines[i]);
      continue;
    }

    if (line.startsWith("#EXT-X-KEY:") || line.startsWith("#EXT-X-MEDIA:")) {
      const replaced = line.replace(/URI="([^"]+)"/g, (_, uriMatch) => {
        const absUrl = resolveUrl(baseUrl, uriMatch);
        const proxied = `${proxyOrigin}/api/sports/hls-proxy?url=${encodeURIComponent(absUrl)}`;
        return `URI="${proxied}"`;
      });
      rewritten.push(replaced);
      continue;
    }

    if (line.startsWith("#")) {
      rewritten.push(line);
      continue;
    }

    // Segment or sub-manifest URL
    const absUrl = resolveUrl(baseUrl, line);
    const proxied = `${proxyOrigin}/api/sports/hls-proxy?url=${encodeURIComponent(absUrl)}`;
    rewritten.push(proxied);
  }

  return rewritten.join("\n");
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get("range");
    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept: "*/*",
      Referer: url.includes("damitv.st") ? "https://damitv.st/" : `${new URL(url).origin}/`,
      Origin: url.includes("damitv.st") ? "https://damitv.st" : new URL(url).origin,
    };

    if (rangeHeader) {
      upstreamHeaders["Range"] = rangeHeader;
    }

    const upstreamRes = await fetch(url, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(12000),
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new NextResponse(`Upstream returned ${upstreamRes.status}`, {
        status: upstreamRes.status >= 400 && upstreamRes.status < 500 ? upstreamRes.status : 502,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "";
    const isManifest =
      contentType.includes("mpegurl") ||
      contentType.includes("application/x-mpegURL") ||
      contentType.includes("vnd.apple.mpegurl") ||
      url.includes(".m3u8") ||
      url.includes("/playlist");

    if (isManifest) {
      const manifestText = await upstreamRes.text();
      if (manifestText.includes("#EXTM3U") || manifestText.includes("#EXTINF")) {
        const proxyOrigin = request.nextUrl.origin;
        const rewritten = rewriteManifest(manifestText, url, proxyOrigin);
        return new NextResponse(rewritten, {
          status: upstreamRes.status,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=2, stale-while-revalidate=5",
          },
        });
      }
    }

    // Binary segment (.ts / .m4s / etc.)
    const body = upstreamRes.body;
    const isSegment = url.includes(".ts") || url.includes(".m4s") || url.includes(".image");
    const cacheControl = isSegment
      ? "public, max-age=86400, s-maxage=86400, immutable"
      : "public, max-age=2, s-maxage=3, stale-while-revalidate=5";

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType || (url.includes(".ts") ? "video/mp2t" : "application/octet-stream"),
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": cacheControl,
    };

    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) responseHeaders["Content-Length"] = contentLength;

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    return new NextResponse(body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new NextResponse(err?.message || "Internal server error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}
