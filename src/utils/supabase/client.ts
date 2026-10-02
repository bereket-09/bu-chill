import { createBrowserClient } from "@supabase/ssr";
import { env } from "../env";
import { Database } from "./types";

export function createClient() {
  // In the browser, route Supabase calls through our same-origin backend proxy (/api/supabase)
  // so external requests to *.supabase.co are never exposed or blocked by client ad-blockers.
  const supabaseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/supabase`
      : env.NEXT_PUBLIC_SUPABASE_URL;

  return createBrowserClient<Database>(
    supabaseUrl,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
