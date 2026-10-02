import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";
import { Database } from "./types";

export async function createClient(admin?: boolean) {
  const cookieStore = await cookies();

  const key = admin ? env.SUPABASE_SERVICE_ROLE_KEY : env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  // Create a server's supabase client with newly configured cookie,
  // which could be used to maintain user's session
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    cookieOptions: {
      name: cookieName,
    },
    cookies: {
      getAll() {
        const all = cookieStore.getAll();
        const hasProjectCookie = all.some((c) => c.name.startsWith(cookieName));
        if (!hasProjectCookie) {
          const altCookie = all.find((c) => c.name.includes("-auth-token"));
          if (altCookie) {
            const suffix = altCookie.name.substring(altCookie.name.indexOf("-auth-token"));
            return [
              ...all,
              { name: `sb-${projectRef}${suffix}`, value: altCookie.value },
            ];
          }
        }
        return all;
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          console.error("Failed to set cookies:", error);
        }
      },
    },
  });
}
