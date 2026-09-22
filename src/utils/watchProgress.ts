import { getActiveProfileId } from "@/services/profileStorage";

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
  episode?: number,
  profileId?: string
): string => {
  const pid = profileId || getActiveProfileId();
  if (mediaType === "tv" && season !== undefined && episode !== undefined) {
    return `${PREFIX}${pid}_tv_${mediaId}_s${season}_e${episode}`;
  }
  return `${PREFIX}${pid}_${mediaType}_${mediaId}`;
};

/**
 * Retrieves the stored watch progress from localStorage scoped by profile
 */
export const getStoredProgress = (
  mediaType: "movie" | "tv",
  mediaId: string | number,
  season?: number,
  episode?: number,
  profileId?: string
): WatchProgressItem | null => {
  if (typeof window === "undefined") return null;

  try {
    const pid = profileId || getActiveProfileId();
    const key = getWatchProgressKey(mediaType, mediaId, season, episode, pid);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as WatchProgressItem;
      if (typeof parsed?.currentTime === "number" && !isNaN(parsed.currentTime) && parsed.currentTime > 0) {
        return parsed;
      }
    }

    // Only "main" profile checks the legacy un-prefixed key to preserve existing watch progress
    if (pid === "main") {
      const legacyKey =
        mediaType === "tv" && season !== undefined && episode !== undefined
          ? `${PREFIX}tv_${mediaId}_s${season}_e${episode}`
          : `${PREFIX}${mediaType}_${mediaId}`;
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw) as WatchProgressItem;
        if (typeof parsed?.currentTime === "number" && !isNaN(parsed.currentTime) && parsed.currentTime > 0) {
          return parsed;
        }
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
 * Saves current watch progress to localStorage scoped by profile
 */
export const saveStoredProgress = (item: {
  mediaType: "movie" | "tv";
  mediaId: string | number;
  title?: string;
  season?: number;
  episode?: number;
  currentTime: number;
  duration?: number;
  profileId?: string;
}): void => {
  if (typeof window === "undefined") return;
  if (!item.currentTime || isNaN(item.currentTime) || item.currentTime < 2) return;

  const now = Date.now();
  // Throttle updates to at most once every 1.5 seconds unless duration ends
  if (now - lastSaveTime < 1500) return;
  lastSaveTime = now;

  try {
    const pid = item.profileId || getActiveProfileId();
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

    const key = getWatchProgressKey(item.mediaType, item.mediaId, item.season, item.episode, pid);
    localStorage.setItem(key, JSON.stringify(data));

    // Save TV last watched episode pointer scoped to this profile
    if (item.mediaType === "tv" && item.season !== undefined && item.episode !== undefined) {
      localStorage.setItem(
        `cinextma_last_episode_${pid}_${item.mediaId}`,
        JSON.stringify({
          season: item.season,
          episode: item.episode,
          currentTime: data.currentTime,
          updatedAt: now,
        })
      );
    }
  } catch (err) {
    console.warn("Failed to save watch progress to localStorage:", err);
  }
};

/**
 * Clears saved watch progress (e.g. when completed or restarted) scoped by profile
 */
export const clearStoredProgress = (
  mediaType: "movie" | "tv",
  mediaId: string | number,
  season?: number,
  episode?: number,
  profileId?: string
): void => {
  if (typeof window === "undefined") return;
  try {
    const pid = profileId || getActiveProfileId();
    const key = getWatchProgressKey(mediaType, mediaId, season, episode, pid);
    localStorage.removeItem(key);
    if (mediaType === "tv" && season !== undefined && episode !== undefined) {
      localStorage.removeItem(`cinextma_last_episode_${pid}_${mediaId}`);
    }
    if (pid === "main") {
      const legacyKey =
        mediaType === "tv" && season !== undefined && episode !== undefined
          ? `${PREFIX}tv_${mediaId}_s${season}_e${episode}`
          : `${PREFIX}${mediaType}_${mediaId}`;
      localStorage.removeItem(legacyKey);
    }
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
