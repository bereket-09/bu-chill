export interface SportsTeam {
  name: string;
  badge: string;
}

export interface SportsStreamSource {
  source: string;
  id: string;
}

export interface SportsMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  poster: string;
  popular: boolean;
  teams: {
    home: SportsTeam;
    away: SportsTeam;
  };
  sources?: SportsStreamSource[];
}

export interface SportsStream {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
  isBackup?: boolean;
}

const SPORTS_API_BASE = "https://api.bingr.one/api/sports";

/**
 * 24/7 Verified High-Reliability Live Sports TV Channels
 * Used as guaranteed zero-blackout fallbacks whenever a match stream is pending or concluded.
 */
export const VERIFIED_LIVE_SPORTS_CHANNELS: SportsStream[] = [
  {
    id: "live-bein-sports-xtra",
    streamNo: 1,
    language: "English / International",
    hd: true,
    embedUrl: "/api/sports/hls-proxy?url=" + encodeURIComponent("https://bein-xtra-bein.amagi.tv/playlist.m3u8"),
    source: "beIN SPORTS XTRA (24/7 Live Football)",
    isBackup: true,
  },
  {
    id: "live-espn-ocho",
    streamNo: 2,
    language: "English",
    hd: true,
    embedUrl: "/api/sports/hls-proxy?url=" + encodeURIComponent("https://d3b6q2ou5kp8ke.cloudfront.net/ESPNTheOcho.m3u8"),
    source: "ESPN8: The Ocho (Live Sports)",
    isBackup: true,
  },
  {
    id: "live-redbull-tv",
    streamNo: 3,
    language: "English",
    hd: true,
    embedUrl: "/api/sports/hls-proxy?url=" + encodeURIComponent("https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8"),
    source: "Red Bull TV (Live Extreme & Motorsports)",
    isBackup: true,
  },
];

/**
 * Determines whether a match is actively live right now.
 * True if kickoff was within the last 3.5 hours up to 15 minutes in advance.
 */
export function isMatchLiveNow(match: SportsMatch): boolean {
  if (match.category === "upcoming") return false;
  const now = Date.now();
  const matchTime = new Date(match.date).getTime();
  return matchTime >= now - 3.5 * 3600 * 1000 && matchTime <= now + 15 * 60 * 1000;
}

/**
 * Parses arbitrary or manual match IDs (e.g. "manual-japan-vs-uruguay" or "uefa-and-mlt")
 * into a structured SportsMatch object with inferred teams and category.
 */
export function parseMatchSlug(id: string): SportsMatch {
  const clean = decodeURIComponent(id)
    .replace(/^manual[-_]/i, "")
    .replace(/\.html?$/i, "");

  const parts = clean.split(/[-_]?vs[-_]?/i);
  let homeName = "Team 1";
  let awayName = "Team 2";

  if (parts.length >= 2) {
    homeName = parts[0].replace(/[-_]/g, " ").trim();
    awayName = parts[1].replace(/[-_]/g, " ").trim();
  } else {
    homeName = clean.replace(/[-_]/g, " ").trim();
    awayName = "Sports Match";
  }

  const capitalize = (s: string) =>
    s
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const home = capitalize(homeName) || "Home Team";
  const away = capitalize(awayName) || "Away Team";

  return {
    id,
    title: `${home} vs ${away}`,
    category: "football",
    date: Date.now(),
    poster: "",
    popular: true,
    teams: {
      home: {
        name: home,
        badge: "",
      },
      away: {
        name: away,
        badge: "",
      },
    },
    sources: [{ source: "solaris", id }],
  };
}

export async function getPopularMatches(): Promise<SportsMatch[]> {
  try {
    const res = await fetch(`${SPORTS_API_BASE}/matches/popular`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch popular matches:", err);
    return [];
  }
}

export async function getAllTodayMatches(): Promise<SportsMatch[]> {
  try {
    const res = await fetch(`${SPORTS_API_BASE}/matches/all-today`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch today matches:", err);
    return [];
  }
}

export async function getAllMatches(): Promise<SportsMatch[]> {
  try {
    const [allRes, todayRes, popRes] = await Promise.all([
      fetch(`${SPORTS_API_BASE}/matches/all`, { next: { revalidate: 60 } }),
      fetch(`${SPORTS_API_BASE}/matches/all-today`, { next: { revalidate: 60 } }),
      fetch(`${SPORTS_API_BASE}/matches/popular`, { next: { revalidate: 60 } }),
    ]);

    const allData: SportsMatch[] = allRes.ok ? await allRes.json() : [];
    const todayData: SportsMatch[] = todayRes.ok ? await todayRes.json() : [];
    const popData: SportsMatch[] = popRes.ok ? await popRes.json() : [];

    const map = new Map<string, SportsMatch>();
    for (const m of [...popData, ...todayData, ...allData]) {
      if (!m || !m.id) continue;
      if (!map.has(m.id)) {
        map.set(m.id, m);
      } else {
        const existing = map.get(m.id)!;
        if (m.sources && m.sources.length > (existing.sources?.length || 0)) {
          map.set(m.id, { ...existing, ...m });
        }
      }
    }
    return Array.from(map.values());
  } catch (err) {
    console.error("Failed to fetch all matches:", err);
    return [];
  }
}

export async function getStreamsForMatch(sources: SportsStreamSource[]): Promise<SportsStream[]> {
  if (!sources || sources.length === 0) {
    return VERIFIED_LIVE_SPORTS_CHANNELS;
  }

  const promises = sources.map(async (s) => {
    try {
      const res = await fetch(
        `${SPORTS_API_BASE}/stream/${encodeURIComponent(s.source)}/${encodeURIComponent(s.id)}`
      );
      if (!res.ok) return [];
      const data = (await res.json()) as SportsStream[];
      return data;
    } catch {
      return [];
    }
  });

  const rawResults = (await Promise.all(promises)).flat();

  // Process and unwrap stream URLs
  const cleanStreams: SportsStream[] = [];

  for (const st of rawResults) {
    if (!st || !st.embedUrl) continue;
    let url = st.embedUrl;

    // If it's a streamrip proxy wrapper, try extracting the underlying url
    if (url.includes("sports.streamrip.fun")) {
      try {
        const parsed = new URL(url);
        const nested = parsed.searchParams.get("url");
        if (nested) {
          url = nested;
        } else {
          continue; // skip broken proxy without target
        }
      } catch {
        continue;
      }
    }

    cleanStreams.push({
      ...st,
      embedUrl: url,
    });
  }

  // Rewrite HLS streams requiring Referer spoofing / CORS proxying
  const processedStreams: SportsStream[] = cleanStreams.map((st) => {
    let finalUrl = st.embedUrl;
    if (st.embedUrl.includes("messi.damitv.st") || st.embedUrl.includes("damitv.st")) {
      finalUrl = `/api/sports/hls-proxy?url=${encodeURIComponent(st.embedUrl)}`;
    }
    return {
      ...st,
      embedUrl: finalUrl,
    };
  });

  // Separate direct HLS streams and web embed streams
  const hlsStreams = processedStreams.filter((s) => s.embedUrl.includes(".m3u8") || s.embedUrl.includes("/hls-proxy"));
  const embeds = processedStreams.filter((s) => !s.embedUrl.includes(".m3u8") && !s.embedUrl.includes("/hls-proxy"));

  // CRITICAL: Prioritize DIRECT HLS Streams FIRST for instant native playback without ads!
  const ordered: SportsStream[] = [...hlsStreams, ...embeds];

  // If no working streams or only 1 stream available, add verified 24/7 sports satellite channels
  if (ordered.length === 0) {
    ordered.push(...VERIFIED_LIVE_SPORTS_CHANNELS);
  } else if (ordered.length < 3) {
    // Add beIN sports or ESPN as extra server backups
    ordered.push(...VERIFIED_LIVE_SPORTS_CHANNELS.slice(0, 3 - ordered.length));
  }

  // Renumber and label stream servers clearly
  return ordered.map((stream, idx) => {
    const isHls = stream.embedUrl.includes(".m3u8") || stream.embedUrl.includes("/hls-proxy");
    let serverLabel = stream.source;
    if (!serverLabel) {
      serverLabel = isHls
        ? `Server ${idx + 1} (Direct CDN · HD)`
        : `Server ${idx + 1} (Embed Player · HD)`;
    }
    return {
      ...stream,
      streamNo: idx + 1,
      source: serverLabel,
    };
  });
}
