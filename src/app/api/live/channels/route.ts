import { NextRequest, NextResponse } from "next/server";
import {
  CURATED_CHANNELS,
  POPULAR_M3U_PLAYLISTS,
  Channel,
  normalizeCategory,
} from "@/services/iptv";

export const dynamic = "force-dynamic";


function parseM3UContent(text: string, defaultGroup?: string): Channel[] {
  const lines = text.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentInfo: Partial<Channel> | null = null;
  const seenUrls = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:")) {
      currentInfo = {};
      const lastComma = line.lastIndexOf(",");
      if (lastComma !== -1) {
        currentInfo.name = line.substring(lastComma + 1).trim();
      }

      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      if (!currentInfo.name && tvgNameMatch && tvgNameMatch[1]) {
        currentInfo.name = tvgNameMatch[1].trim();
      }

      const idMatch = line.match(/tvg-id="([^"]*)"/i);
      if (idMatch && idMatch[1]) {
        currentInfo.id = idMatch[1].trim();
      }

      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      if (logoMatch && logoMatch[1]) {
        currentInfo.logo = logoMatch[1].trim();
      }

      const groupMatch = line.match(/group-title="([^"]*)"/i);
      if (groupMatch && groupMatch[1]) {
        currentInfo.group = normalizeCategory(groupMatch[1].trim());
      } else if (defaultGroup) {
        currentInfo.group = defaultGroup;
      }

      const countryMatch = line.match(/tvg-country="([^"]*)"/i);
      if (countryMatch && countryMatch[1]) {
        currentInfo.country = countryMatch[1].trim();
      }

      const langMatch = line.match(/tvg-language="([^"]*)"/i);
      if (langMatch && langMatch[1]) {
        currentInfo.language = langMatch[1].trim();
      }
    } else if (line.startsWith("#EXTGRP:") && currentInfo) {
      currentInfo.group = normalizeCategory(line.replace("#EXTGRP:", "").trim());
    } else if (line && !line.startsWith("#") && currentInfo) {
      const streamUrl = line;
      const isDirectStream =
        streamUrl.startsWith("http://") || streamUrl.startsWith("https://");
      const isYouTubeWeb =
        streamUrl.includes("youtube.com/watch") ||
        streamUrl.includes("youtube.com/@") ||
        streamUrl.includes("youtu.be/");

      if (isDirectStream && !isYouTubeWeb && !seenUrls.has(streamUrl)) {
        seenUrls.add(streamUrl);
        const name = currentInfo.name || "Live Channel";
        const id =
          currentInfo.id ||
          name.toLowerCase().replace(/[^a-z0-9]/g, "-") +
            "-" +
            Math.random().toString(36).substring(2, 6);

        channels.push({
          id,
          name,
          logo: currentInfo.logo,
          group: currentInfo.group || defaultGroup || "Entertainment",
          country: currentInfo.country || "Global",
          language: currentInfo.language || "English",
          url: streamUrl,
        });
      }
      currentInfo = null;
    }
  }

  return channels;
}

// In-memory cache for fast response
const cache = new Map<string, { timestamp: number; channels: Channel[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get("playlist") || "iptv-eng";
    const customUrl = searchParams.get("url");

    let targetUrl: string;
    let defaultCategory: string | undefined;

    if (customUrl) {
      targetUrl = customUrl;
    } else {
      const foundPreset = POPULAR_M3U_PLAYLISTS.find((p) => p.id === playlistId);
      if (foundPreset) {
        targetUrl = foundPreset.url;
        if (foundPreset.category !== "General") {
          defaultCategory = foundPreset.category;
        }
      } else {
        // Default to English Channels
        targetUrl = "https://iptv-org.github.io/iptv/languages/eng.m3u";
      }
    }

    // Check memory cache
    const cached = cache.get(targetUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        {
          success: true,
          count: cached.channels.length,
          channels: cached.channels,
          cached: true,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
          },
        }
      );
    }

    // Fetch M3U playlist from source
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
        Accept: "*/*",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      // Return CURATED_CHANNELS as fallback if remote fails
      return NextResponse.json({
        success: true,
        count: CURATED_CHANNELS.length,
        channels: CURATED_CHANNELS,
        fallback: true,
      });
    }

    const text = await res.text();
    const parsedChannels = parseM3UContent(text, defaultCategory);

    // Merge high-priority curated channels at the top if they aren't already present
    const finalChannels: Channel[] = [...CURATED_CHANNELS];
    const existingUrls = new Set(CURATED_CHANNELS.map((c) => c.url));

    for (const ch of parsedChannels) {
      if (!existingUrls.has(ch.url)) {
        finalChannels.push(ch);
        existingUrls.add(ch.url);
      }
    }

    // Update in-memory cache
    cache.set(targetUrl, {
      timestamp: Date.now(),
      channels: finalChannels,
    });

    return NextResponse.json(
      {
        success: true,
        count: finalChannels.length,
        channels: finalChannels,
        cached: false,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
        },
      }
    );
  } catch (err: unknown) {
    console.error("Failed to load channels:", err);
    return NextResponse.json({
      success: true,
      count: CURATED_CHANNELS.length,
      channels: CURATED_CHANNELS,
      fallback: true,
    });
  }
}
