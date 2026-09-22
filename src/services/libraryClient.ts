import { createClient } from "@/utils/supabase/client";
import { ContentType } from "@/types";
import { SavedMovieDetails } from "@/types/movie";
import {
  getActiveProfileId,
  checkInProfileWatchlist,
  getProfileWatchlistItem,
  addToProfileWatchlist,
  removeFromProfileWatchlist,
  WatchlistStatus,
} from "./profileStorage";

/**
 * Gets the current watchlist status ("watchlist" | "planned" | "completed" | null)
 */
export async function getWatchlistStatusClient(
  id: number,
  type: ContentType
): Promise<WatchlistStatus | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const uid = user?.id || "guest";
    const activeProfileId = getActiveProfileId(uid);
    const item = getProfileWatchlistItem(user?.id, activeProfileId, id, type);
    if (item) return item.status || "watchlist";

    // If main profile, fallback to checking Supabase
    if (user && activeProfileId === "main") {
      const { data } = await supabase
        .from("watchlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", id)
        .eq("type", type)
        .maybeSingle();

      if (data) {
        return "watchlist";
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if media item is in the active profile's watchlist
 */
export async function checkInWatchlistClient(id: number, type: ContentType): Promise<boolean> {
  const status = await getWatchlistStatusClient(id, type);
  return status !== null;
}

/**
 * Adds or updates an item to the active profile's watchlist with status
 */
export async function addToWatchlistClient(
  item: SavedMovieDetails,
  status: WatchlistStatus = "watchlist"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const uid = user?.id || "guest";
    const activeProfileId = getActiveProfileId(uid);

    // Save to active profile's isolated storage
    addToProfileWatchlist(user?.id, activeProfileId, {
      id: item.id,
      type: item.type,
      adult: item.adult,
      backdrop_path: item.backdrop_path,
      poster_path: item.poster_path || null,
      release_date: item.release_date,
      title: item.title,
      vote_average: item.vote_average,
      status,
    });

    // If main profile and user is logged in, also sync to Supabase
    if (user && activeProfileId === "main") {
      await supabase.from("watchlist").upsert({
        user_id: user.id,
        id: item.id,
        type: item.type,
        adult: item.adult,
        backdrop_path: item.backdrop_path,
        poster_path: item.poster_path || null,
        release_date: item.release_date,
        title: item.title,
        vote_average: item.vote_average,
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update watchlist" };
  }
}

/**
 * Removes an item from the active profile's watchlist
 */
export async function removeFromWatchlistClient(
  id: number,
  type: ContentType
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const uid = user?.id || "guest";
    const activeProfileId = getActiveProfileId(uid);

    // Remove from profile storage
    removeFromProfileWatchlist(user?.id, activeProfileId, id, type);

    // If main profile and user is logged in, also remove from Supabase
    if (user && activeProfileId === "main") {
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("id", id)
        .eq("type", type);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to remove from watchlist" };
  }
}
