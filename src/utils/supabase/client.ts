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

  const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  if (typeof document !== "undefined") {
    // If legacy hostname-scoped auth cookies exist, clone to the unified project cookie name
    const match = document.cookie.match(/(sb-[^=;\s]+-auth-token(?:[.\d]*))=([^;]+)/g);
    if (match) {
      match.forEach((entry) => {
        const [name, val] = entry.split("=");
        const trimmedName = name.trim();
        if (trimmedName && val && !trimmedName.startsWith(cookieName)) {
          const suffix = trimmedName.substring(trimmedName.indexOf("-auth-token"));
          const unifiedName = `sb-${projectRef}${suffix}`;
          document.cookie = `${unifiedName}=${val.trim()}; path=/; max-age=31536000; SameSite=Lax`;
        }
      });
    }
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        name: cookieName,
      },
    },
  );
}
