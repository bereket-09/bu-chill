export interface WatchProgressItem {
  mediaId: string | number;
  mediaType: "movie" | "tv";
  title?: string;
  season?: number;
  episode?: number;
  currentTime: number;
  duration: number;
  percentage: number;
  updatedAt: number;
}

const PREFIX = "cinextma_watch_";

export const getWatchProgressKey = (
  mediaType: "movie" | "tv",
  mediaId: string | number,
  season?: number,
  episode?: number
): string => {
  if (mediaType === "tv" && season !== undefined && episode !== undefined) {
    return `${PREFIX}tv_${mediaId}_s${season}_e${episode}`;
  }
  return `${PREFIX}${mediaType}_${mediaId}`;
};

/**
 * Retrieves the stored watch progress from localStorage
 */
export const getStoredProgress = (
  mediaType: "movie" | "tv",
  mediaId: string | number,
  season?: number,
  episode?: number
): WatchProgressItem | null => {
  if (typeof window === "undefined") return null;

  try {
    const key = getWatchProgressKey(mediaType, mediaId, season, episode);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as WatchProgressItem;
      if (typeof parsed?.currentTime === "number" && !isNaN(parsed.currentTime) && parsed.currentTime > 0) {
        return parsed;
      }
    }

    // Fallback check for Filmu progress key
    const filmuRaw = localStorage.getItem(`filmu_progress_${mediaId}`);
    if (filmuRaw) {
      const parsed = JSON.parse(filmuRaw);
      const time = parsed.currentTime || parsed.time;
      if (typeof time === "number" && time > 0) {
        return {
          mediaId,
          mediaType,
          season,
          episode,
          currentTime: time,
          duration: parsed.duration || 0,
          percentage: 0,
          updatedAt: Date.now(),
        };
      }
    }

    return null;
  } catch (err) {
    console.warn("Failed to read watch progress from localStorage:", err);
    return null;
  }
};

let lastSaveTime = 0;

/**
 * Saves current watch progress to localStorage
 */
export const saveStoredProgress = (item: {
  mediaType: "movie" | "tv";
  mediaId: string | number;
  title?: string;
  season?: number;
  episode?: number;
  currentTime: number;
  duration?: number;
}): void => {
  if (typeof window === "undefined") return;
  if (!item.currentTime || isNaN(item.currentTime) || item.currentTime < 2) return;

  const now = Date.now();
  // Throttle updates to at most once every 1.5 seconds unless duration ends
  if (now - lastSaveTime < 1500) return;
  lastSaveTime = now;

  try {
    const duration = item.duration && !isNaN(item.duration) ? item.duration : 0;
    const percentage = duration > 0 ? Math.min(100, Math.round((item.currentTime / duration) * 100)) : 0;

    const data: WatchProgressItem = {
      mediaType: item.mediaType,
      mediaId: item.mediaId,
      title: item.title,
      season: item.season,
      episode: item.episode,
      currentTime: Math.floor(item.currentTime),
      duration: Math.floor(duration),
      percentage,
      updatedAt: now,
    };

    const key = getWatchProgressKey(item.mediaType, item.mediaId, item.season, item.episode);
    localStorage.setItem(key, JSON.stringify(data));

    // Save TV last watched episode pointer
    if (item.mediaType === "tv" && item.season !== undefined && item.episode !== undefined) {
      localStorage.setItem(
        `cinextma_last_episode_${item.mediaId}`,
        JSON.stringify({
          season: item.season,
          episode: item.episode,
          currentTime: data.currentTime,
          updatedAt: now,
        })
      );
    }

    // Save Filmu / Bingr format compatibility
    localStorage.setItem(
      `filmu_progress_${item.mediaId}`,
      JSON.stringify({
        currentTime: data.currentTime,
        duration: data.duration,
        time: data.currentTime,
      })
    );
  } catch (err) {
    console.warn("Failed to save watch progress to localStorage:", err);
  }
};

/**
 * Clears saved watch progress (e.g. when completed or restarted)
 */
export const clearStoredProgress = (
  mediaType: "movie" | "tv",
  mediaId: string | number,
  season?: number,
  episode?: number
): void => {
  if (typeof window === "undefined") return;
  try {
    const key = getWatchProgressKey(mediaType, mediaId, season, episode);
    localStorage.removeItem(key);
    localStorage.removeItem(`filmu_progress_${mediaId}`);
  } catch {}
};

/**
 * Formats seconds into human-readable MM:SS or HH:MM:SS
 */
export const formatTimeDisplay = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
};
