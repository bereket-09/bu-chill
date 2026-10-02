import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "../env";

const PROTECTED_PATHS = env.PROTECTED_PATHS?.split(",") ?? [];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        name: cookieName,
      },
      cookies: {
        getAll() {
          const all = request.cookies.getAll();
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // if user is not logged in and the current pathname is protected, redirect to login page
  if (!user && PROTECTED_PATHS.some((url) => pathname.startsWith(url))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";

    const redirectRes = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });

    return redirectRes;
  }

  // if user is logged in and the current pathname is auth, redirect to home page
  if (user && pathname === "/auth") {
    const url = request.nextUrl.clone();
    url.pathname = "/";

    const redirectRes = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });

    return redirectRes;
  }

  return supabaseResponse;
}
