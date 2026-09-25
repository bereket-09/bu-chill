export interface SportsTeam {
  name: string;
  badge: string;
}

export interface SportsStreamSource {
  source: string;
  id: string;
}

export interface SportsChannelStream {
  id?: string;
  channel_name: string;
  channel_code?: string;
  url?: string;
  image?: string;
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
  channels?: SportsChannelStream[];
  status?: string;
  tournament?: string;
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
const CDN_LIVETV_API = "https://api.cdnlivetv.is/api/v1/events/sports/?user=cdnlivetv&plan=free";

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
 * True if kickoff was within the last 3.5 hours up to 15 minutes in advance,
 * or if match status explicitly indicates live play.
 */
export function isMatchLiveNow(match: SportsMatch): boolean {
  if (match.category === "upcoming") return false;
  if (match.status) {
    const s = match.status.toLowerCase();
    if (
      s.includes("live") ||
      s.includes("1h") ||
      s.includes("2h") ||
      s.includes("ht") ||
      s.includes("in progress") ||
      s.includes("q1") ||
      s.includes("q2") ||
      s.includes("q3") ||
      s.includes("q4")
    ) {
      return true;
    }
    if (s.includes("ft") || s.includes("final") || s.includes("ended") || s.includes("postponed")) {
      return false;
    }
  }
  const now = Date.now();
  const matchTime = new Date(match.date).getTime();
  return matchTime >= now - 3.5 * 3600 * 1000 && matchTime <= now + 15 * 60 * 1000;
}

/**
 * Normalizes sport categories to match the Bu-Chill sports tabs.
 */
function mapSportCategory(sportName: string): string {
  const lower = sportName.toLowerCase();
  if (lower.includes("soccer") || (lower.includes("football") && !lower.includes("nfl") && !lower.includes("american"))) {
    return "football";
  }
  if (lower.includes("nba") || lower.includes("basketball") || lower.includes("ncaa")) {
    return "basketball";
  }
  if (lower.includes("nfl") || lower.includes("american")) {
    return "american-football";
  }
  if (
    lower.includes("ufc") ||
    lower.includes("mma") ||
    lower.includes("wwe") ||
    lower.includes("fight") ||
    lower.includes("combat") ||
    lower.includes("box")
  ) {
    return "fight";
  }
  if (lower.includes("motorsport") || lower.includes("f1") || lower.includes("racing") || lower.includes("nascar") || lower.includes("motogp")) {
    return "motorsport";
  }
  if (lower.includes("cricket")) {
    return "cricket";
  }
  if (lower.includes("baseball") || lower.includes("mlb")) {
    return "baseball";
  }
  if (lower.includes("tennis")) {
    return "tennis";
  }
  if (lower.includes("hockey") || lower.includes("nhl")) {
    return "hockey";
  }
  if (lower.includes("rugby")) {
    return "rugby";
  }
  return "all";
}

let cdnCache: { timestamp: number; matches: SportsMatch[] } | null = null;
const CDN_CACHE_TTL = 1000 * 60 * 2; // 2 minutes

/**
 * Fetches multi-sport events and live stream feeds from cdn-live-tv / streamsports99 provider.
 */
export async function fetchCdnLiveTvMatches(): Promise<SportsMatch[]> {
  if (cdnCache && Date.now() - cdnCache.timestamp < CDN_CACHE_TTL) {
    return cdnCache.matches;
  }

  try {
    const res = await fetch(CDN_LIVETV_API, {
      headers: {
        Accept: "application/json",
        Referer: "https://streamsports99.is/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const cdn = data["cdn-live-tv"];
    if (!cdn || typeof cdn !== "object") return [];

    const sports = Object.keys(cdn).filter((k) => Array.isArray(cdn[k]));
    const matches: SportsMatch[] = [];

    for (const sport of sports) {
      const category = mapSportCategory(sport);
      const events = cdn[sport] as any[];

      for (const ev of events) {
        if (!ev || !ev.gameID) continue;
        const hasChannels = Array.isArray(ev.channels) && ev.channels.length > 0;

        let matchDate = Date.now();
        if (ev.start) {
          const parsed = Date.parse(ev.start.replace(" ", "T") + "Z");
          if (!isNaN(parsed)) matchDate = parsed;
        }

        const homeName = ev.homeTeam || "Home Team";
        const awayName = ev.awayTeam || "Away Team";
        const title = ev.event || `${homeName} vs ${awayName}`;
        const isPopular =
          hasChannels ||
          ["Soccer", "NBA", "NFL", "MLB", "NHL", "UFC", "Motorsport"].includes(sport);

        matches.push({
          id: `cdn-${ev.gameID}`,
          title,
          category,
          date: matchDate,
          poster: ev.homeTeamIMG || ev.awayTeamIMG || "",
          popular: isPopular,
          status: ev.status || (hasChannels ? "LIVE" : "Upcoming"),
          tournament: ev.tournament || sport,
          teams: {
            home: {
              name: homeName,
              badge: ev.homeTeamIMG || "",
            },
            away: {
              name: awayName,
              badge: ev.awayTeamIMG || "",
            },
          },
          sources: [{ source: "cdnlivetv", id: ev.gameID }],
          channels: hasChannels
            ? ev.channels.map((c: any) => ({
                id: c.id,
                channel_name: c.channel_name,
                channel_code: c.channel_code,
                url:
                  c.url ||
                  `https://cdnlivetv.is/api/v1/channels/player/?name=${encodeURIComponent(
                    c.channel_name
                  )}&code=${c.channel_code}&user=cdnlivetv&plan=free`,
                image: c.image,
              }))
            : [],
        });
      }
    }

    cdnCache = {
      timestamp: Date.now(),
      matches,
    };

    return matches;
  } catch (err) {
    console.error("Failed to fetch CDN Live TV matches:", err);
    return [];
  }
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
  const all = await getAllMatches();
  return all
    .filter((m) => m.popular || (m.channels && m.channels.length > 0) || isMatchLiveNow(m))
    .slice(0, 36);
}

export async function getAllTodayMatches(): Promise<SportsMatch[]> {
  const all = await getAllMatches();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  return all.filter((m) => Math.abs(m.date - now) < oneDay || isMatchLiveNow(m));
}

export async function getAllMatches(): Promise<SportsMatch[]> {
  try {
    const [bingrPop, bingrToday, bingrAll, cdnMatches] = await Promise.all([
      fetch(`${SPORTS_API_BASE}/matches/popular`, { next: { revalidate: 60 } })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`${SPORTS_API_BASE}/matches/all-today`, { next: { revalidate: 60 } })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`${SPORTS_API_BASE}/matches/all`, { next: { revalidate: 60 } })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetchCdnLiveTvMatches().catch(() => []),
    ]);

    const map = new Map<string, SportsMatch>();

    // 1. Add cdn-live-tv matches first (they contain direct stadium broadcast feeds)
    for (const m of cdnMatches) {
      if (m && m.id) map.set(m.id, m);
    }

    // 2. Merge bingr matches
    for (const m of [...bingrPop, ...bingrToday, ...bingrAll]) {
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

    const all = Array.from(map.values());

    // Sort: Matches with active live channels first, then live by time, then scheduled
    return all.sort((a, b) => {
      const aHasChannels = (a.channels?.length || 0) > 0;
      const bHasChannels = (b.channels?.length || 0) > 0;
      if (aHasChannels && !bHasChannels) return -1;
      if (!aHasChannels && bHasChannels) return 1;

      const aLive = isMatchLiveNow(a);
      const bLive = isMatchLiveNow(b);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      return a.date - b.date;
    });
  } catch (err) {
    console.error("Failed to fetch all matches:", err);
    return [];
  }
}

export async function getStreamsForMatch(
  sources: SportsStreamSource[],
  channels?: SportsChannelStream[],
  matchId?: string
): Promise<SportsStream[]> {
  const channelStreams: SportsStream[] = [];

  // 1. If direct channels are present (from cdn-live-tv), convert them to stream servers
  if (Array.isArray(channels) && channels.length > 0) {
    channels.forEach((c, idx) => {
      const embedUrl =
        c.url ||
        `https://cdnlivetv.is/api/v1/channels/player/?name=${encodeURIComponent(
          c.channel_name
        )}&code=${c.channel_code || "us"}&user=cdnlivetv&plan=free`;

      channelStreams.push({
        id: `cdn-${c.id || idx}`,
        streamNo: idx + 1,
        language: c.channel_code ? c.channel_code.toUpperCase() : "HD",
        hd: true,
        embedUrl,
        source: `${c.channel_name} (Live Stadium Feed · HD)`,
      });
    });
  }

  // 2. Also fetch streams from solaris / bingr if sources exist
  const externalSources = (sources || []).filter((s) => s.source !== "cdnlivetv");
  const externalStreams: SportsStream[] = [];

  if (externalSources.length > 0) {
    const promises = externalSources.map(async (s) => {
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

    for (const st of rawResults) {
      if (!st || !st.embedUrl) continue;
      let url = st.embedUrl;

      if (url.includes("sports.streamrip.fun")) {
        try {
          const parsed = new URL(url);
          const nested = parsed.searchParams.get("url");
          if (nested) {
            url = nested;
          } else {
            continue;
          }
        } catch {
          continue;
        }
      }

      let finalUrl = url;
      if (url.includes("messi.damitv.st") || url.includes("damitv.st")) {
        finalUrl = `/api/sports/hls-proxy?url=${encodeURIComponent(url)}`;
      }

      externalStreams.push({
        ...st,
        embedUrl: finalUrl,
      });
    }
  }

  // Separate direct HLS streams and web embed streams
  const hlsStreams = externalStreams.filter(
    (s) => s.embedUrl.includes(".m3u8") || s.embedUrl.includes("/hls-proxy")
  );
  const embeds = externalStreams.filter(
    (s) => !s.embedUrl.includes(".m3u8") && !s.embedUrl.includes("/hls-proxy")
  );

  // Order: Direct HLS first, then stadium channel feeds, then web embeds
  const ordered: SportsStream[] = [...hlsStreams, ...channelStreams, ...embeds];

  // Guarantee fallback: always include verified 24/7 sports satellite channels
  if (ordered.length === 0) {
    ordered.push(...VERIFIED_LIVE_SPORTS_CHANNELS);
  } else if (ordered.length < 3) {
    ordered.push(...VERIFIED_LIVE_SPORTS_CHANNELS.slice(0, 3 - ordered.length));
  }

  // Renumber and label stream servers clearly
  return ordered.map((stream, idx) => {
    let serverLabel = stream.source;
    if (!serverLabel) {
      const isHls = stream.embedUrl.includes(".m3u8") || stream.embedUrl.includes("/hls-proxy");
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

