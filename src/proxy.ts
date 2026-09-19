import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  // update user's auth session
  return await updateSession(request);
}

export const config = {
  matcher: ["/auth", "/auth/:path*", "/profile", "/profile/:path*"],
};
