import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Validates whether a hostname points to a private/internal network to prevent SSRF.
 */
function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "::1" ||
    lower === "0.0.0.0" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  ) {
    return true;
  }

  // IPv4 private ranges
  const ipv4Match = lower.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const octet1 = parseInt(ipv4Match[1], 10);
    const octet2 = parseInt(ipv4Match[2], 10);

    if (octet1 === 10) return true;
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
    if (octet1 === 192 && octet2 === 168) return true;
    if (octet1 === 169 && octet2 === 254) return true;
    if (octet1 === 127) return true;
    if (octet1 === 0) return true;
  }

  return false;
}

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

/**
 * Resolves a potentially relative URL against a base URL string.
 */
function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

/**
 * Rewrites an M3U8 playlist so that nested child manifests, media chunks,
 * audio streams, and encryption keys are routed through this stream proxy.
 */
function rewriteManifest(manifestText: string, baseUrl: string, proxyOrigin: string): string {
  const lines = manifestText.split(/\r?\n/);
  const rewritten: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      rewritten.push(lines[i]);
      continue;
    }

    // Rewrite tags containing URI="..." e.g. #EXT-X-KEY, #EXT-X-MEDIA
    if (line.startsWith("#EXT-X-KEY:") || line.startsWith("#EXT-X-MEDIA:")) {
      const replaced = line.replace(/URI="([^"]+)"/g, (_, uriMatch) => {
        const absUrl = resolveUrl(baseUrl, uriMatch);
        const proxied = `${proxyOrigin}/api/live/stream-proxy?url=${encodeURIComponent(absUrl)}`;
        return `URI="${proxied}"`;
      });
      rewritten.push(replaced);
      continue;
    }

    // Comments / metadata tags (leave unchanged)
    if (line.startsWith("#")) {
      rewritten.push(line);
      continue;
    }

    // Segment or sub-manifest URL
    const absUrl = resolveUrl(baseUrl, line);
    const proxied = `${proxyOrigin}/api/live/stream-proxy?url=${encodeURIComponent(absUrl)}`;
    rewritten.push(proxied);
  }

  return rewritten.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing 'url' query parameter" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid target URL format" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only http and https protocols are supported" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (isPrivateHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Forbidden: Private network requests are disallowed" },
        { status: 403, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Forward range header if present for segment seek
    const rangeHeader = request.headers.get("range");
    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "*/*",
      Referer: `${parsedUrl.protocol}//${parsedUrl.host}/`,
      Origin: `${parsedUrl.protocol}//${parsedUrl.host}`,
    };

    if (rangeHeader) {
      upstreamHeaders["Range"] = rangeHeader;
    }

    const upstreamRes = await fetch(targetUrl, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(15000),
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.json(
        { error: `Upstream responded with HTTP ${upstreamRes.status}` },
        {
          status: upstreamRes.status >= 400 && upstreamRes.status < 500 ? upstreamRes.status : 502,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const contentType = upstreamRes.headers.get("content-type") || "";
    const isManifest =
      contentType.includes("mpegurl") ||
      contentType.includes("application/x-mpegURL") ||
      contentType.includes("vnd.apple.mpegurl") ||
      parsedUrl.pathname.endsWith(".m3u8") ||
      parsedUrl.pathname.endsWith(".m3u");

    if (isManifest) {
      const manifestText = await upstreamRes.text();
      // If it contains #EXTM3U, rewrite it
      if (manifestText.includes("#EXTM3U") || manifestText.includes("#EXTINF")) {
        const proxyOrigin = request.nextUrl.origin;
        const rewritten = rewriteManifest(manifestText, targetUrl, proxyOrigin);
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

    // Binary media segment (.ts, .m4s, .aac, .mp4, keys)
    const mediaBody = upstreamRes.body;
    const responseHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Range",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range",
      "Cache-Control": "public, max-age=60",
    };

    if (contentType) {
      responseHeaders["Content-Type"] = contentType;
    } else if (parsedUrl.pathname.endsWith(".ts")) {
      responseHeaders["Content-Type"] = "video/mp2t";
    }

    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) responseHeaders["Content-Length"] = contentLength;

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    return new NextResponse(mediaBody, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to proxy stream";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
