import { ContentType } from "@/types";

export interface ProfileWatchlistItem {
  id: number;
  type: ContentType;
  adult: boolean;
  backdrop_path: string;
  poster_path: string | null;
  release_date: string;
  title: string;
  vote_average: number;
  created_at: string;
}

export interface ProfileHistoryItem {
  id: string | number;
  media_id: number;
  type: ContentType;
  season?: number;
  episode?: number;
  duration: number;
  last_position: number;
  completed: boolean;
  adult?: boolean;
  backdrop_path?: string;
  poster_path?: string;
  release_date?: string;
  title: string;
  vote_average?: number;
  updated_at: string;
}

/**
 * Gets the current active profile ID for a user. Defaults to "main".
 */
export function getActiveProfileId(userId: string): string {
  if (typeof window === "undefined" || !userId) return "main";
  try {
    return localStorage.getItem(`buchill_active_profile_${userId}`) || "main";
  } catch {
    return "main";
  }
}

/**
 * Sets the active profile ID and emits a change event for instant cross-component updates.
 */
export function setActiveProfileId(userId: string, profileId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(`buchill_active_profile_${userId}`, profileId);
    window.dispatchEvent(
      new CustomEvent("buchill_profile_changed", { detail: { userId, profileId } })
    );
  } catch (e) {
    console.error("Failed to set active profile:", e);
  }
}

// -------------------------------------------------------------
// WATCHLIST
// -------------------------------------------------------------

function getWatchlistKey(userId: string, profileId: string): string {
  return `buchill_watchlist_${userId}_${profileId || "main"}`;
}

export function getProfileWatchlist(userId: string, profileId?: string): ProfileWatchlistItem[] {
  if (typeof window === "undefined" || !userId) return [];
  const pid = profileId || getActiveProfileId(userId);
  try {
    const raw = localStorage.getItem(getWatchlistKey(userId, pid));
    if (raw) {
      return JSON.parse(raw);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveProfileWatchlist(
  userId: string,
  profileId: string,
  items: ProfileWatchlistItem[]
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(getWatchlistKey(userId, profileId), JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent("buchill_watchlist_changed", { detail: { userId, profileId } })
    );
  } catch (e) {
    console.error("Failed to save profile watchlist:", e);
  }
}

export function addToProfileWatchlist(
  userId: string,
  profileId: string,
  item: Omit<ProfileWatchlistItem, "created_at"> & { created_at?: string }
): void {
  const current = getProfileWatchlist(userId, profileId);
  const exists = current.some((x) => x.id === item.id && x.type === item.type);
  if (exists) return;

  const newItem: ProfileWatchlistItem = {
    ...item,
    created_at: item.created_at || new Date().toISOString(),
  };
  saveProfileWatchlist(userId, profileId, [newItem, ...current]);
}

export function removeFromProfileWatchlist(
  userId: string,
  profileId: string,
  itemId: number,
  type: ContentType
): void {
  const current = getProfileWatchlist(userId, profileId);
  const filtered = current.filter((x) => !(x.id === itemId && x.type === type));
  saveProfileWatchlist(userId, profileId, filtered);
}

export function clearProfileWatchlist(
  userId: string,
  profileId: string,
  type: "movie" | "tv" | "all" = "all"
): void {
  if (type === "all") {
    saveProfileWatchlist(userId, profileId, []);
  } else {
    const current = getProfileWatchlist(userId, profileId);
    saveProfileWatchlist(
      userId,
      profileId,
      current.filter((x) => x.type !== type)
    );
  }
}

export function checkInProfileWatchlist(
  userId: string,
  profileId: string,
  itemId: number,
  type: ContentType
): boolean {
  const current = getProfileWatchlist(userId, profileId);
  return current.some((x) => x.id === itemId && x.type === type);
}

// -------------------------------------------------------------
// CONTINUE WATCHING & HISTORY
// -------------------------------------------------------------

function getHistoryKey(userId: string, profileId: string): string {
  return `buchill_history_${userId}_${profileId || "main"}`;
}

export function getProfileHistory(userId: string, profileId?: string): ProfileHistoryItem[] {
  if (typeof window === "undefined" || !userId) return [];
  const pid = profileId || getActiveProfileId(userId);
  try {
    const raw = localStorage.getItem(getHistoryKey(userId, pid));
    if (raw) {
      return JSON.parse(raw);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveProfileHistory(
  userId: string,
  profileId: string,
  items: ProfileHistoryItem[]
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(getHistoryKey(userId, profileId), JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent("buchill_history_changed", { detail: { userId, profileId } })
    );
  } catch (e) {
    console.error("Failed to save profile history:", e);
  }
}

export function saveProfileHistoryItem(
  userId: string,
  profileId: string,
  item: Partial<ProfileHistoryItem> & {
    media_id: number;
    type: ContentType;
    title: string;
  }
): void {
  const current = getProfileHistory(userId, profileId);
  const now = new Date().toISOString();

  // Find match by media_id, type, season, episode
  const existingIdx = current.findIndex(
    (x) =>
      x.media_id === item.media_id &&
      x.type === item.type &&
      (item.type !== "tv" || (x.season === item.season && x.episode === item.episode))
  );

  const mergedItem: ProfileHistoryItem = {
    id: existingIdx >= 0 ? current[existingIdx].id : `${item.media_id}_${Date.now()}`,
    media_id: item.media_id,
    type: item.type,
    season: item.season || 0,
    episode: item.episode || 0,
    duration: item.duration ?? (existingIdx >= 0 ? current[existingIdx].duration : 0),
    last_position: item.last_position ?? (existingIdx >= 0 ? current[existingIdx].last_position : 0),
    completed: item.completed ?? (existingIdx >= 0 ? current[existingIdx].completed : false),
    adult: item.adult ?? (existingIdx >= 0 ? current[existingIdx].adult : false),
    backdrop_path: item.backdrop_path ?? (existingIdx >= 0 ? current[existingIdx].backdrop_path : ""),
    poster_path: item.poster_path ?? (existingIdx >= 0 ? current[existingIdx].poster_path : ""),
    release_date: item.release_date ?? (existingIdx >= 0 ? current[existingIdx].release_date : ""),
    title: item.title,
    vote_average: item.vote_average ?? (existingIdx >= 0 ? current[existingIdx].vote_average : 0),
    updated_at: now,
  };

  const updated = [...current];
  if (existingIdx >= 0) {
    updated.splice(existingIdx, 1);
  }
  updated.unshift(mergedItem);

  // Keep max 50 items per profile
  saveProfileHistory(userId, profileId, updated.slice(0, 50));
}

export function removeFromProfileHistory(
  userId: string,
  profileId: string,
  mediaId: number,
  type: ContentType,
  season?: number,
  episode?: number
): void {
  const current = getProfileHistory(userId, profileId);
  const filtered = current.filter((x) => {
    if (x.media_id !== mediaId || x.type !== type) return true;
    if (type === "tv" && season !== undefined && episode !== undefined) {
      return !(x.season === season && x.episode === episode);
    }
    return false;
  });
  saveProfileHistory(userId, profileId, filtered);
}

export function clearProfileHistory(userId: string, profileId: string): void {
  saveProfileHistory(userId, profileId, []);
}
