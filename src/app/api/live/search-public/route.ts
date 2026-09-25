import { NextRequest, NextResponse } from "next/server";
import { Channel, normalizeCategory } from "@/services/iptv";

export const dynamic = "force-dynamic";

interface ScrapedIptvCatChannel {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  isOnline: boolean;
  m3u8Url: string;
  directUrl?: string;
  logo?: string;
  group?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        count: 0,
        channels: [],
        message: "Search query must be at least 2 characters",
      });
    }

    const clean = query.trim();
    const variations: string[] = [
      clean.replace(/\s+/g, "_"),
      clean,
      ...clean.split(/\s+/).filter((w) => w.length > 2),
    ];

    let html = "";
    for (const v of variations) {
      try {
        const iptvCatUrl = `https://iptvcat.com/s/${encodeURIComponent(v)}`;
        const res = await fetch(iptvCatUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            Referer: "https://iptvcat.com/",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          next: { revalidate: 300 },
        });

        if (res.ok) {
          const text = await res.text();
          if (text.includes("belongs_to_")) {
            html = text;
            break;
          }
        }
      } catch {
        continue;
      }
    }

    if (!html) {
      return NextResponse.json({
        success: true,
        count: 0,
        channels: [],
        message: `No public broadcast feeds found for "${query}".`,
      });
    }

    const chunks = html.split(/belongs_to_/);
    const rawChannels: ScrapedIptvCatChannel[] = [];

    // Parse pairwise table rows (odd: info row, even: link row with copy button)
    for (let i = 1; i < chunks.length; i += 2) {
      const infoChunk = chunks[i];
      const linkChunk = chunks[i + 1] || "";

      const streamId = infoChunk.match(/^(\d+)/)?.[1] || "";
      const nameMatch = infoChunk.match(
        /class="channel_name"[\s\S]*?title="([^"]+)"\s*>[^<]*<\/span>/
      );
      const countryMatch = infoChunk.match(
        /class="flag"[\s\S]*?<img[^>]*title="([^"]*)"/
      );
      const flagSrcMatch = infoChunk.match(
        /class="flag"[\s\S]*?<img[^>]*src="([^"]*)"/
      );
      const isOnline =
        infoChunk.includes("state online") || infoChunk.includes("Online");
      const m3u8Match = linkChunk.match(/data-clipboard-text="([^"]+)"/);

      if (nameMatch && m3u8Match) {
        const flagSrc = flagSrcMatch?.[1] || "";
        rawChannels.push({
          id: `iptvcat-${streamId || i}`,
          name: nameMatch[1].trim(),
          country: countryMatch?.[1] || "Global",
          countryFlag: flagSrc
            ? flagSrc.startsWith("http")
              ? flagSrc
              : `https://iptvcat.com/${flagSrc.replace(/^\//, "")}`
            : "",
          isOnline,
          m3u8Url: m3u8Match[1].trim(),
          group: "Public Streams",
        });
      }
    }

    // Prioritize online streams
    const sorted = rawChannels.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return 0;
    });

    // Resolve inner direct streams in parallel for top 6 channels to maximize playback reliability
    const topOnline = sorted.slice(0, 8);
    await Promise.allSettled(
      topOnline.map(async (c) => {
        try {
          const m3uRes = await fetch(c.m3u8Url, {
            signal: AbortSignal.timeout(3500),
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            },
          });
          if (m3uRes.ok) {
            const text = await m3uRes.text();
            const direct = text
              .split(/\r?\n/)
              .map((l) => l.trim())
              .find((l) => l && !l.startsWith("#"));
            const logo = text.match(/tvg-logo="([^"]*)"/)?.[1];
            const group = text.match(/group-title="([^"]*)"/)?.[1];

            if (direct && (direct.startsWith("http://") || direct.startsWith("https://"))) {
              c.directUrl = direct;
            }
            if (logo && logo.startsWith("http")) {
              c.logo = logo;
            }
            if (group) {
              c.group = group;
            }
          }
        } catch {
          // Fallback gracefully to original m3u8Url
        }
      })
    );

    // Convert into Bu-Chill standard Channel objects
    const channels: Channel[] = sorted.slice(0, 30).map((c) => ({
      id: c.id,
      name: c.name,
      country: c.country,
      countryFlag: c.countryFlag,
      logo: c.logo || c.countryFlag || "",
      group: normalizeCategory(c.group || "Entertainment"),
      url: c.directUrl || c.m3u8Url,
      language: "International",
    }));

    return NextResponse.json({
      success: true,
      count: channels.length,
      channels,
      query,
    });
  } catch (err: unknown) {
    console.error("Failed to search public channels:", err);
    return NextResponse.json(
      {
        success: false,
        count: 0,
        channels: [],
        error: err instanceof Error ? err.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
