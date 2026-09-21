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

function getWatchlistKey(userId?: string, profileId?: string): string {
  const uid = userId || "guest";
  return `buchill_watchlist_${uid}_${profileId || "main"}`;
}

export function getProfileWatchlist(userId?: string, profileId?: string): ProfileWatchlistItem[] {
  if (typeof window === "undefined") return [];
  const uid = userId || "guest";
  const pid = profileId || getActiveProfileId(uid);
  try {
    const raw = localStorage.getItem(getWatchlistKey(uid, pid));
    if (raw) {
      return JSON.parse(raw);
    }
    if (uid !== "guest") {
      const guestRaw = localStorage.getItem(getWatchlistKey("guest", "main"));
      if (guestRaw) return JSON.parse(guestRaw);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveProfileWatchlist(
  userId: string | undefined,
  profileId: string | undefined,
  items: ProfileWatchlistItem[]
): void {
  if (typeof window === "undefined") return;
  const uid = userId || "guest";
  const pid = profileId || "main";
  try {
    localStorage.setItem(getWatchlistKey(uid, pid), JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent("buchill_watchlist_changed", { detail: { userId: uid, profileId: pid } })
    );
  } catch (e) {
    console.error("Failed to save profile watchlist:", e);
  }
}

export function addToProfileWatchlist(
  userId: string | undefined,
  profileId: string | undefined,
  item: Omit<ProfileWatchlistItem, "created_at"> & { created_at?: string }
): void {
  const uid = userId || "guest";
  const pid = profileId || "main";
  const current = getProfileWatchlist(uid, pid);
  const exists = current.some((x) => x.id === item.id && x.type === item.type);
  if (exists) return;

  const newItem: ProfileWatchlistItem = {
    ...item,
    created_at: item.created_at || new Date().toISOString(),
  };
  saveProfileWatchlist(uid, pid, [newItem, ...current]);
}

export function removeFromProfileWatchlist(
  userId: string | undefined,
  profileId: string | undefined,
  itemId: number,
  type: ContentType
): void {
  const uid = userId || "guest";
  const pid = profileId || "main";
  const current = getProfileWatchlist(uid, pid);
  const filtered = current.filter((x) => !(x.id === itemId && x.type === type));
  saveProfileWatchlist(uid, pid, filtered);
}

export function clearProfileWatchlist(
  userId: string | undefined,
  profileId: string | undefined,
  type: "movie" | "tv" | "all" = "all"
): void {
  const uid = userId || "guest";
  const pid = profileId || "main";
  if (type === "all") {
    saveProfileWatchlist(uid, pid, []);
  } else {
    const current = getProfileWatchlist(uid, pid);
    saveProfileWatchlist(
      uid,
      pid,
      current.filter((x) => x.type !== type)
    );
  }
}

export function checkInProfileWatchlist(
  userId: string | undefined,
  profileId: string | undefined,
  itemId: number,
  type: ContentType
): boolean {
  const uid = userId || "guest";
  const pid = profileId || "main";
  const current = getProfileWatchlist(uid, pid);
  return current.some((x) => x.id === itemId && x.type === type);
}

// -------------------------------------------------------------
// CONTINUE WATCHING & HISTORY
// -------------------------------------------------------------

function getHistoryKey(userId?: string, profileId?: string): string {
  const uid = userId || "guest";
  return `buchill_history_${uid}_${profileId || "main"}`;
}

export function getProfileHistory(userId?: string, profileId?: string): ProfileHistoryItem[] {
  if (typeof window === "undefined") return [];
  const uid = userId || "guest";
  const pid = profileId || getActiveProfileId(uid);
  try {
    const raw = localStorage.getItem(getHistoryKey(uid, pid));
    if (raw) {
      return JSON.parse(raw);
    }
    // Fallback: if authenticated user has no history yet, load guest history
    if (uid !== "guest") {
      const guestRaw = localStorage.getItem(getHistoryKey("guest", "main"));
      if (guestRaw) {
        return JSON.parse(guestRaw);
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function saveProfileHistory(
  userId: string | undefined,
  profileId: string | undefined,
  items: ProfileHistoryItem[]
): void {
  if (typeof window === "undefined") return;
  const uid = userId || "guest";
  const pid = profileId || "main";
  try {
    localStorage.setItem(getHistoryKey(uid, pid), JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent("buchill_history_changed", { detail: { userId: uid, profileId: pid } })
    );
  } catch (e) {
    console.error("Failed to save profile history:", e);
  }
}

export function saveProfileHistoryItem(
  userId: string | undefined,
  profileId: string | undefined,
  item: Partial<ProfileHistoryItem> & {
    media_id: number;
    type: ContentType;
    title: string;
  }
): void {
  const uid = userId || "guest";
  const pid = profileId || "main";
  const current = getProfileHistory(uid, pid);
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
    season: item.season !== undefined ? item.season : existingIdx >= 0 ? current[existingIdx].season : 0,
    episode: item.episode !== undefined ? item.episode : existingIdx >= 0 ? current[existingIdx].episode : 0,
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
  saveProfileHistory(uid, pid, updated.slice(0, 50));
}

export function removeFromProfileHistory(
  userId: string | undefined,
  profileId: string | undefined,
  mediaId: number,
  type: ContentType,
  season?: number,
  episode?: number
): void {
  const uid = userId || "guest";
  const pid = profileId || "main";
  const current = getProfileHistory(uid, pid);
  const filtered = current.filter((x) => {
    if (x.media_id !== mediaId || x.type !== type) return true;
    if (type === "tv" && season !== undefined && episode !== undefined) {
      return !(x.season === season && x.episode === episode);
    }
    return false;
  });
  saveProfileHistory(uid, pid, filtered);
}

export function clearProfileHistory(
  userId: string | undefined,
  profileId: string | undefined
): void {
  const uid = userId || "guest";
  const pid = profileId || "main";
  saveProfileHistory(uid, pid, []);
}

/**
 * Completely purges all local storage entries associated with a user ID.
 */
export function purgeAllUserData(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(userId)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent("buchill_profile_changed", { detail: { userId, profileId: "main" } }));
  } catch (e) {
    console.error("Failed to purge user local data:", e);
  }
}
