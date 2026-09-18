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
}

const SPORTS_API_BASE = "https://api.bingr.one/api/sports";

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
  if (!sources || sources.length === 0) return [];

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

  // Filter out known broken proxies (like 502 bad gateway streamrip proxies)
  const cleanStreams = rawResults.filter((st) => {
    if (!st || !st.embedUrl) return false;
    if (st.embedUrl.includes("sports.streamrip.fun")) return false;
    return true;
  });

  // Re-map and proxy direct HLS URLs that require referrer bypass
  const processedStreams: SportsStream[] = cleanStreams.map((st) => {
    let finalUrl = st.embedUrl;
    if (st.embedUrl.includes("messi.damitv.st")) {
      finalUrl = `/api/sports/hls-proxy?url=${encodeURIComponent(st.embedUrl)}`;
    }
    return {
      ...st,
      embedUrl: finalUrl,
    };
  });

  // Ensure universal embed fallback if available
  const primarySourceId = sources[0]?.id;
  const hasEmbed = processedStreams.some((st) => !st.embedUrl.includes(".m3u8"));
  if (primarySourceId && !hasEmbed) {
    processedStreams.unshift({
      id: `embed-${primarySourceId}`,
      streamNo: 1,
      language: "Universal",
      hd: true,
      embedUrl: `https://embedindia.st/embed/${primarySourceId}`,
      source: "Server 1 (Universal Embed Player · HD)",
    });
  }

  // Prioritize embeds first for guaranteed zero-CORS browser playback
  const embeds = processedStreams.filter((s) => !s.embedUrl.includes(".m3u8"));
  const hlsStreams = processedStreams.filter((s) => s.embedUrl.includes(".m3u8"));

  const ordered = [...embeds, ...hlsStreams];

  // Renumber and label stream servers clearly
  return ordered.map((stream, idx) => {
    const isHls = stream.embedUrl.includes(".m3u8");
    const serverLabel = isHls
      ? `Server ${idx + 1} (Direct HLS Satellite)`
      : `Server ${idx + 1} (Embed Player · HD)`;
    return {
      ...stream,
      streamNo: idx + 1,
      source: stream.source || serverLabel,
    };
  });
}
