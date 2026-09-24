import { NextRequest, NextResponse } from "next/server";
import { parseXmltv } from "@iptv/xmltv";
import zlib from "zlib";
import { ChannelEpg, ProgramItem } from "@/types/epg";

export const dynamic = "force-dynamic";

interface XmltvProgramme {
  channel: string;
  start: Date | string;
  stop: Date | string;
  title?: Array<{ _value: string }>;
  desc?: Array<{ _value: string }>;
  category?: Array<{ _value: string }>;
}

interface CachedEpgFeed {
  fetchedAt: number;
  byChannel: Map<string, XmltvProgramme[]>;
}

// In-memory cache for parsed XMLTV data, keyed by EPG URL (TTL 30 minutes)
const EPG_FEED_CACHE = new Map<string, CachedEpgFeed>();
const EPG_CACHE_TTL_MS = 30 * 60 * 1000;

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

/**
 * Fetches and parses an XMLTV feed, handling .gz decompression if needed.
 */
async function getOrFetchEpgFeed(epgUrl: string): Promise<Map<string, XmltvProgramme[]> | null> {
  const now = Date.now();
  const cached = EPG_FEED_CACHE.get(epgUrl);
  if (cached && now - cached.fetchedAt < EPG_CACHE_TTL_MS) {
    return cached.byChannel;
  }

  try {
    const parsed = new URL(epgUrl);
    if (isPrivateHost(parsed.hostname)) return null;

    const res = await fetch(epgUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/xml, application/xml, application/gzip, */*",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    let xmlText = "";

    // Check gzip magic bytes (0x1f, 0x8b) or .gz extension
    if (
      (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) ||
      epgUrl.endsWith(".gz")
    ) {
      xmlText = zlib.gunzipSync(buffer).toString("utf-8");
    } else {
      xmlText = buffer.toString("utf-8");
    }

    const parsedData = parseXmltv(xmlText);
    const byChannel = new Map<string, XmltvProgramme[]>();

    if (parsedData?.programmes && Array.isArray(parsedData.programmes)) {
      for (const prog of parsedData.programmes as XmltvProgramme[]) {
        if (!prog.channel) continue;
        const key = prog.channel.toLowerCase().trim();
        let list = byChannel.get(key);
        if (!list) {
          list = [];
          byChannel.set(key, list);
        }
        list.push(prog);
      }
    }

    EPG_FEED_CACHE.set(epgUrl, {
      fetchedAt: now,
      byChannel,
    });

    return byChannel;
  } catch (err) {
    console.error("Failed to fetch or parse EPG:", err);
    return null;
  }
}

/**
 * Generates an intuitive synthetic schedule when no external XMLTV feed is available.
 * Creates clean 30/60-minute blocks around the current time.
 */
function generateDynamicSchedule(
  channelName: string,
  category: string = "Entertainment"
): ChannelEpg {
  const now = new Date();
  const currentMinutes = now.getMinutes();
  const slotMinutes = 30;
  const currentSlotStart = new Date(now);
  currentSlotStart.setMinutes(Math.floor(currentMinutes / slotMinutes) * slotMinutes, 0, 0);

  const currentSlotEnd = new Date(currentSlotStart);
  currentSlotEnd.setMinutes(currentSlotStart.getMinutes() + slotMinutes);

  const elapsedMs = now.getTime() - currentSlotStart.getTime();
  const totalMs = currentSlotEnd.getTime() - currentSlotStart.getTime();
  const progress = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
  const remainingMinutes = Math.max(1, Math.round((currentSlotEnd.getTime() - now.getTime()) / 60000));

  const templates: Record<string, string[]> = {
    News: [
      "Live Global Coverage & Top Stories",
      "World News Desk",
      "Prime Market Report",
      "Breaking News & Analysis",
      "International Dispatch",
    ],
    Sports: [
      "Live Action & Highlights",
      "Championship Round Review",
      "Prime Time Match Showcase",
      "Game Day Countdown",
      "Speed & Endurance Magazine",
    ],
    Movies: [
      "Feature Presentation",
      "Cinema Showcase: Blockbusters",
      "Action Cinema Spotlight",
      "Late Night Screening",
      "Classic Cinema Vault",
    ],
    Documentary: [
      "Wonders of the Deep",
      "Frontiers of Space & Science",
      "Historical Chronicles",
      "Planet Earth Explorer",
      "Inventions That Changed The World",
    ],
    Music: [
      "Non-Stop Chart Hits 24/7",
      "Global Beats & Electronic Vibes",
      "Classic Rock Anthems",
      "Top 40 Countdown",
      "Night Lounge Mix",
    ],
    Kids: [
      "Morning Adventures Club",
      "Animated Tales & Cartoons",
      "Toon Time Spectacular",
      "Fun Factory After School",
      "Bedtime Stories Live",
    ],
  };

  const list = templates[category] || [
    "Broadcast Stream Live",
    "Prime Hours Entertainment",
    "Special Feature Broadcast",
    "Evening Showcase",
    "Overnight Digest",
  ];

  const hourIndex = now.getHours();
  const currentTitle = `${channelName}: ${list[hourIndex % list.length]}`;
  const nextTitle = `${channelName}: ${list[(hourIndex + 1) % list.length]}`;

  const currentProgram: ProgramItem = {
    title: currentTitle,
    description: `Live streaming programming on ${channelName}. Continuous high-definition broadcast.`,
    category,
    start: currentSlotStart.toISOString(),
    stop: currentSlotEnd.toISOString(),
    progress,
    durationMinutes: slotMinutes,
    timeRemainingMinutes: remainingMinutes,
  };

  const nextSlotEnd = new Date(currentSlotEnd);
  nextSlotEnd.setMinutes(currentSlotEnd.getMinutes() + slotMinutes);
  const nextProgram: ProgramItem = {
    title: nextTitle,
    description: `Coming up next on ${channelName}.`,
    category,
    start: currentSlotEnd.toISOString(),
    stop: nextSlotEnd.toISOString(),
    progress: 0,
    durationMinutes: slotMinutes,
    timeRemainingMinutes: slotMinutes,
  };

  // Generate 4 upcoming programs
  const upcoming: ProgramItem[] = [];
  let blockStart = new Date(currentSlotEnd);
  for (let i = 0; i < 6; i++) {
    const blockEnd = new Date(blockStart);
    blockEnd.setMinutes(blockStart.getMinutes() + slotMinutes);
    const title = `${channelName}: ${list[(hourIndex + 1 + i) % list.length]}`;
    upcoming.push({
      title,
      description: `Scheduled linear broadcast on ${channelName}.`,
      category,
      start: blockStart.toISOString(),
      stop: blockEnd.toISOString(),
      progress: 0,
      durationMinutes: slotMinutes,
      timeRemainingMinutes: slotMinutes,
    });
    blockStart = blockEnd;
  }

  return {
    channelId: channelName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    channelName,
    currentProgram,
    nextProgram,
    upcoming,
    source: "fallback",
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get("channelId") || "";
  const channelName = searchParams.get("channelName") || channelId || "Live Channel";
  const category = searchParams.get("category") || "Entertainment";
  const epgUrl = searchParams.get("epgUrl");

  const now = new Date();

  // If an external EPG URL was provided, attempt to match programmes
  if (epgUrl) {
    const feed = await getOrFetchEpgFeed(epgUrl);
    if (feed) {
      const normalizedTarget = channelId.toLowerCase().trim();
      let matchedProgs = feed.get(normalizedTarget);

      // Try fuzzy match if exact match wasn't found
      if (!matchedProgs) {
        for (const [key, progs] of feed.entries()) {
          if (
            key.includes(normalizedTarget) ||
            normalizedTarget.includes(key) ||
            (channelName && key.includes(channelName.toLowerCase().replace(/\s+/g, "")))
          ) {
            matchedProgs = progs;
            break;
          }
        }
      }

      if (matchedProgs && matchedProgs.length > 0) {
        // Filter and sort programmes
        const parsedItems: ProgramItem[] = matchedProgs
          .map((p) => {
            const start = new Date(p.start);
            const stop = new Date(p.stop);
            const durationMs = stop.getTime() - start.getTime();
            const elapsedMs = now.getTime() - start.getTime();
            const progress =
              durationMs > 0
                ? Math.min(100, Math.max(0, Math.round((elapsedMs / durationMs) * 100)))
                : 0;
            const remainingMinutes = Math.max(
              0,
              Math.round((stop.getTime() - now.getTime()) / 60000)
            );

            return {
              title: p.title?.[0]?._value || "Live Broadcast",
              description: p.desc?.[0]?._value || "",
              category: p.category?.[0]?._value || category,
              start: start.toISOString(),
              stop: stop.toISOString(),
              progress,
              durationMinutes: Math.round(durationMs / 60000),
              timeRemainingMinutes: remainingMinutes,
            };
          })
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        // Find current program (now is between start and stop)
        const currentProgram =
          parsedItems.find(
            (p) =>
              new Date(p.start).getTime() <= now.getTime() &&
              new Date(p.stop).getTime() > now.getTime()
          ) || null;

        // Find next and upcoming programs
        const upcoming = parsedItems.filter(
          (p) => new Date(p.start).getTime() >= (currentProgram ? new Date(currentProgram.stop).getTime() : now.getTime())
        );

        const nextProgram = upcoming[0] || null;

        const response: ChannelEpg = {
          channelId,
          channelName,
          currentProgram,
          nextProgram,
          upcoming: upcoming.slice(0, 10),
          source: "xmltv",
          updatedAt: new Date().toISOString(),
        };

        return NextResponse.json(response, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        });
      }
    }
  }

  // Fallback to high-quality dynamic programming schedule
  const fallbackGuide = generateDynamicSchedule(channelName, category);
  return NextResponse.json(fallbackGuide, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
