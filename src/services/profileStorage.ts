import { ContentType } from "@/types";
import { DEFAULT_AVATAR_ID } from "@/constants/avatars";

export type WatchlistStatus = "watchlist" | "planned" | "completed";

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
  status?: WatchlistStatus;
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

export interface UserProfileItem {
  id: string;
  name: string;
  avatar: string;
  isMain?: boolean;
  isKid?: boolean;
}

/**
 * Gets the current active profile ID for a user. Defaults to "main".
 */
export function getActiveProfileId(userId?: string): string {
  if (typeof window === "undefined") return "main";
  try {
    const uid = userId || "guest";
    return (
      localStorage.getItem(`buchill_active_profile_${uid}`) ||
      localStorage.getItem("buchill_current_active_profile") ||
      "main"
    );
  } catch {
    return "main";
  }
}

/**
 * Sets the active profile ID and emits a change event for instant cross-component updates.
 */
export function setActiveProfileId(userId: string | undefined, profileId: string): void {
  if (typeof window === "undefined") return;
  const uid = userId || "guest";
  try {
    localStorage.setItem(`buchill_active_profile_${uid}`, profileId);
    localStorage.setItem("buchill_current_active_profile", profileId);
    window.dispatchEvent(
      new CustomEvent("buchill_profile_changed", { detail: { userId: uid, profileId } })
    );
  } catch (e) {
    console.error("Failed to set active profile:", e);
  }
}

/**
 * Gets all profiles for a user account (up to 5 profiles).
 * Guarantees that at least one main profile exists.
 */
export function getUserProfiles(userId?: string, defaultName?: string): UserProfileItem[] {
  if (typeof window === "undefined") return [];
  const uid = userId || "guest";
  try {
    const raw = localStorage.getItem(`buchill_profiles_${uid}`);
    let loaded: UserProfileItem[] = [];
    if (raw) {
      try {
        loaded = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse profiles", e);
      }
    }

    if (!Array.isArray(loaded) || loaded.length === 0) {
      const storedMainAvatar = localStorage.getItem(`buchill_avatar_${uid}`) || DEFAULT_AVATAR_ID;
      loaded = [
        {
          id: "main",
          name: defaultName || "Main Profile",
          avatar: storedMainAvatar,
          isMain: true,
        },
      ];
      localStorage.setItem(`buchill_profiles_${uid}`, JSON.stringify(loaded));
      return loaded;
    }

    // Clean up legacy auto-generated dummy profiles for logged-in accounts
    if (userId) {
      const cleaned = loaded.filter((p) => {
        if (p.id === "kids" && p.name === "Kids & Anime") return false;
        if (p.id === "chill" && p.name === "Guest Chill") return false;
        return true;
      });
      if (cleaned.length !== loaded.length) {
        loaded = cleaned;
        localStorage.setItem(`buchill_profiles_${uid}`, JSON.stringify(loaded));
      }
    }

    // Ensure main profile exists and is flagged isMain
    const mainIdx = loaded.findIndex((p) => p.isMain || p.id === "main");
    if (mainIdx >= 0) {
      loaded[mainIdx].isMain = true;
      if (defaultName && (loaded[mainIdx].name === "User" || loaded[mainIdx].name === "Main Profile")) {
        loaded[mainIdx].name = defaultName;
        localStorage.setItem(`buchill_profiles_${uid}`, JSON.stringify(loaded));
      }
    } else {
      loaded.unshift({
        id: "main",
        name: defaultName || "Main Profile",
        avatar: DEFAULT_AVATAR_ID,
        isMain: true,
      });
      localStorage.setItem(`buchill_profiles_${uid}`, JSON.stringify(loaded));
    }

    return loaded;
  } catch (e) {
    console.error("Failed to read user profiles", e);
    return [{ id: "main", name: defaultName || "Main Profile", avatar: DEFAULT_AVATAR_ID, isMain: true }];
  }
}

/**
 * Saves profiles array to storage and notifies subscribers.
 */
export function saveUserProfiles(userId: string | undefined, profiles: UserProfileItem[]): void {
  if (typeof window === "undefined") return;
  const uid = userId || "guest";
  try {
    localStorage.setItem(`buchill_profiles_${uid}`, JSON.stringify(profiles));
    window.dispatchEvent(
      new CustomEvent("buchill_profiles_updated", { detail: { userId: uid, profiles } })
    );
  } catch (e) {
    console.error("Failed to save user profiles", e);
  }
}

/**
 * Returns the currently active profile object.
 */
export function getActiveProfile(userId?: string, defaultName?: string): UserProfileItem {
  const profiles = getUserProfiles(userId, defaultName);
  const activeId = getActiveProfileId(userId);
  const found = profiles.find((p) => p.id === activeId);
  return (
    found ||
    profiles[0] || { id: "main", name: defaultName || "Main Profile", avatar: DEFAULT_AVATAR_ID, isMain: true }
  );
}

/**
 * Checks whether the currently active profile is flagged as a Kids profile.
 */
export function isCurrentProfileKid(userId?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const profile = getActiveProfile(userId);
    return Boolean(profile?.isKid);
  } catch {
    return false;
  }
}

/**
 * Switches the active profile and fires sync events.
 */
export function switchActiveProfile(userId: string | undefined, profileId: string): void {
  setActiveProfileId(userId, profileId);
  if (typeof window === "undefined") return;
  const uid = userId || "guest";
  const profiles = getUserProfiles(uid);
  const profile = profiles.find((p) => p.id === profileId);
  if (profile) {
    localStorage.setItem(`buchill_active_name_${uid}`, profile.name);
    localStorage.setItem(`buchill_active_avatar_${uid}`, profile.avatar);
  }
  window.dispatchEvent(
    new CustomEvent("buchill_profile_changed", { detail: { userId: uid, profileId, profile } })
  );
  window.dispatchEvent(
    new CustomEvent("buchill_profiles_updated", { detail: { userId: uid, profiles } })
  );
}

/**
 * Updates an existing profile or adds a new profile (up to 5 profiles max).
 */
export function updateUserProfile(userId: string | undefined, profile: UserProfileItem): void {
  if (typeof window === "undefined") return;
  const uid = userId || "guest";
  const profiles = getUserProfiles(uid);
  const idx = profiles.findIndex((p) => p.id === profile.id);

  let updated: UserProfileItem[];
  if (idx >= 0) {
    updated = [...profiles];
    updated[idx] = { ...updated[idx], ...profile };
  } else {
    if (profiles.length >= 5) {
      console.warn("Cannot add more than 5 profiles");
      return;
    }
    updated = [...profiles, profile];
  }

  saveUserProfiles(uid, updated);

  const activeId = getActiveProfileId(uid);
  if (activeId === profile.id) {
    localStorage.setItem(`buchill_active_name_${uid}`, profile.name);
    localStorage.setItem(`buchill_active_avatar_${uid}`, profile.avatar);
    window.dispatchEvent(
      new CustomEvent("buchill_profile_changed", { detail: { userId: uid, profileId: profile.id, profile } })
    );
  }
}

/**
 * Deletes a profile and completely purges all of its watch history and watchlist.
 * Primary account profile ("main") cannot be deleted.
 */
export function deleteUserProfile(userId: string | undefined, profileId: string): UserProfileItem[] {
  if (typeof window === "undefined") return [];
  const uid = userId || "guest";
  if (profileId === "main") {
    console.warn("Cannot delete primary account profile");
    return getUserProfiles(uid);
  }

  const current = getUserProfiles(uid);
  const updated = current.filter((p) => p.id !== profileId);
  saveUserProfiles(uid, updated);

  // Clean up all isolated data associated with this profile
  try {
    localStorage.removeItem(getHistoryKey(uid, profileId));
    localStorage.removeItem(getWatchlistKey(uid, profileId));

    // Purge watch progress and TV last episode keys for this profile
    const watchPrefix = `cinextma_watch_${profileId}_`;
    const tvPrefix = `cinextma_last_episode_${profileId}_`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(watchPrefix) || key.startsWith(tvPrefix))) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.error("Failed to clean up profile data for deleted profile", e);
  }

  // If the deleted profile was currently active, switch back to main
  const currentActive = getActiveProfileId(uid);
  if (currentActive === profileId) {
    switchActiveProfile(uid, "main");
  } else {
    window.dispatchEvent(
      new CustomEvent("buchill_profiles_updated", { detail: { userId: uid, profiles: updated } })
    );
  }

  return updated;
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
    // Only primary main profile falls back to guest session
    if (uid !== "guest" && pid === "main") {
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

export function getProfileWatchlistItem(
  userId: string | undefined,
  profileId: string | undefined,
  itemId: number,
  type: ContentType
): ProfileWatchlistItem | undefined {
  const uid = userId || "guest";
  const pid = profileId || "main";
  const current = getProfileWatchlist(uid, pid);
  return current.find((x) => x.id === itemId && x.type === type);
}

export function addToProfileWatchlist(
  userId: string | undefined,
  profileId: string | undefined,
  item: Omit<ProfileWatchlistItem, "created_at"> & { created_at?: string; status?: WatchlistStatus }
): void {
  const uid = userId || "guest";
  const pid = profileId || "main";
  const current = getProfileWatchlist(uid, pid);
  const existingIdx = current.findIndex((x) => x.id === item.id && x.type === item.type);
  const status = item.status || "watchlist";

  if (existingIdx >= 0) {
    const updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...item, status };
    saveProfileWatchlist(uid, pid, updated);
    return;
  }

  const newItem: ProfileWatchlistItem = {
    ...item,
    status,
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
    // Fallback: ONLY for primary main profile when migrating from guest session
    if (uid !== "guest" && pid === "main") {
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
    backdrop_path: item.backdrop_path || (existingIdx >= 0 ? current[existingIdx].backdrop_path : "") || "",
    poster_path: item.poster_path || (existingIdx >= 0 ? current[existingIdx].poster_path : "") || "",
    release_date: item.release_date || (existingIdx >= 0 ? current[existingIdx].release_date : "") || "",
    title: item.title || (existingIdx >= 0 ? current[existingIdx].title : "Media"),
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

export function setProfileHistoryItemCompleted(
  userId: string | undefined,
  profileId: string | undefined,
  mediaId: number,
  type: ContentType,
  completed: boolean,
  season?: number,
  episode?: number
): void {
  const uid = userId || "guest";
  const pid = profileId || "main";
  const current = getProfileHistory(uid, pid);
  const updated = current.map((item) => {
    if (item.media_id === mediaId && item.type === type) {
      if (type !== "tv" || (item.season === season && item.episode === episode)) {
        return { ...item, completed, updated_at: new Date().toISOString() };
      }
    }
    return item;
  });
  saveProfileHistory(uid, pid, updated);
}

export function updateProfileWatchlistStatus(
  userId: string | undefined,
  profileId: string | undefined,
  mediaId: number,
  type: ContentType,
  status: WatchlistStatus
): void {
  const uid = userId || "guest";
  const pid = profileId || "main";
  const current = getProfileWatchlist(uid, pid);
  const updated = current.map((item) => {
    if (item.id === mediaId && item.type === type) {
      return { ...item, status };
    }
    return item;
  });
  saveProfileWatchlist(uid, pid, updated);
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
