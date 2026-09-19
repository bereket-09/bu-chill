import { createClient } from "@/utils/supabase/client";
import { ContentType } from "@/types";
import { SavedMovieDetails } from "@/types/movie";

/**
 * Checks if media item is in the current user's watchlist directly via Supabase PostgREST
 * Zero Vercel Serverless Function invocations.
 */
export async function checkInWatchlistClient(id: number, type: ContentType): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", id)
      .eq("type", type)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Adds an item to the current user's watchlist directly via Supabase PostgREST
 * Zero Vercel Serverless Function invocations.
 */
export async function addToWatchlistClient(
  item: SavedMovieDetails
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "You must be logged in to add to your watchlist" };

    const { error } = await supabase.from("watchlist").upsert({
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

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to add to watchlist" };
  }
}

/**
 * Removes an item from the current user's watchlist directly via Supabase PostgREST
 * Zero Vercel Serverless Function invocations.
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
    if (!user) return { success: false, error: "You must be logged in" };

    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id)
      .eq("type", type);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to remove from watchlist" };
  }
}
