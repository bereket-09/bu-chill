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
    const res = await fetch(`${SPORTS_API_BASE}/matches/all`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
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
      return (await res.json()) as SportsStream[];
    } catch {
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
}
