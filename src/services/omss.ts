import { SubtitleTrack } from "@/types";

export interface OMSSSource {
  url: string;
  quality?: string;
  type?: "hls" | "mp4" | string;
  provider?: string;
}

export interface OMSSStreamResponse {
  sources: OMSSSource[];
  subtitles?: SubtitleTrack[];
}

export class OMSSService {
  private static getBaseUrl(): string | null {
    if (typeof window !== "undefined") {
      return (
        process.env.NEXT_PUBLIC_OMSS_URL ||
        localStorage.getItem("cinextma_omss_url") ||
        null
      );
    }
    return process.env.NEXT_PUBLIC_OMSS_URL || null;
  }

  /**
   * Fetches direct stream links for a movie from an OMSS-compliant backend (e.g., cinepro-org/core).
   */
  public static async getMovieStreams(
    id: number | string,
    timeoutMs: number = 15000
  ): Promise<OMSSStreamResponse | null> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = `${baseUrl.replace(/\/$/, "")}/v1/movies/${id}?platform=web&audio=en&lang=en`;
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timer);

      if (!res.ok) return null;
      const data = await res.json();
      return this.normalizeResponse(data, baseUrl);
    } catch {
      return null;
    }
  }

  /**
   * Fetches direct stream links for a TV episode from an OMSS-compliant backend.
   */
  public static async getTvShowStreams(
    id: number | string,
    season: number,
    episode: number,
    timeoutMs: number = 15000
  ): Promise<OMSSStreamResponse | null> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = `${baseUrl.replace(/\/$/, "")}/v1/tv/${id}/seasons/${season}/episodes/${episode}?platform=web&audio=en&lang=en`;
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timer);

      if (!res.ok) return null;
      const data = await res.json();
      return this.normalizeResponse(data, baseUrl);
    } catch {
      return null;
    }
  }

  /**
   * Normalizes various OMSS provider response shapes into a standard format.
   */
  private static normalizeResponse(data: any, baseUrl?: string): OMSSStreamResponse | null {
    if (!data) return null;

    const sources: OMSSSource[] = [];
    const subtitles: SubtitleTrack[] = [];

    // Handle data.sources array or root array
    const rawSources = Array.isArray(data.sources)
      ? data.sources
      : Array.isArray(data)
      ? data
      : [];

    for (const item of rawSources) {
      if (item.url || item.file) {
        let streamUrl = item.url || item.file;
        if (baseUrl && streamUrl && streamUrl.includes("/v1/proxy")) {
          const proxySubpath = streamUrl.substring(streamUrl.indexOf("/v1/proxy"));
          streamUrl = `${baseUrl.replace(/\/$/, "")}${proxySubpath}`;
        }

        const providerName =
          typeof item.provider === "object" && item.provider !== null
            ? item.provider.name || item.provider.id || "CinePro Core"
            : typeof item.provider === "string"
            ? item.provider
            : "CinePro Core";

        sources.push({
          url: streamUrl,
          quality: item.quality || item.label || "Auto",
          type: item.type || (streamUrl.includes(".m3u8") ? "hls" : "mp4"),
          provider: providerName,
        });
      }
    }

    // Handle subtitles
    const rawSubs = Array.isArray(data.subtitles)
      ? data.subtitles
      : Array.isArray(data.tracks)
      ? data.tracks
      : [];

    for (const sub of rawSubs) {
      if (sub.url || sub.file) {
        let subUrl = sub.url || sub.file;
        if (baseUrl && subUrl && subUrl.includes("/v1/proxy")) {
          const proxySubpath = subUrl.substring(subUrl.indexOf("/v1/proxy"));
          subUrl = `${baseUrl.replace(/\/$/, "")}${proxySubpath}`;
        }

        subtitles.push({
          label: sub.label || sub.language || "Unknown",
          language: sub.language || sub.lang || "en",
          src: subUrl,
          default: Boolean(sub.default),
        });
      }
    }

    if (sources.length === 0) return null;

    return {
      sources,
      subtitles,
    };
  }
}
