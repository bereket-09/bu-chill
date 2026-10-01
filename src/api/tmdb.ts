import { env } from "@/utils/env";
import { isEmpty } from "@/utils/helpers";
import { TMDB } from "tmdb-ts";

const token = env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;

if (isEmpty(token)) {
  throw new Error("TMDB_ACCESS_TOKEN is not defined");
}

// In the browser, transparently proxy all TMDB API calls through our own backend (/api/tmdb/...)
// to bypass ad-blockers (uBlock, Brave Shields, AdGuard, Pi-hole) and regional network restrictions.
if (typeof window !== "undefined" && !(window as any).__TMDB_PROXY_INITIALIZED__) {
  (window as any).__TMDB_PROXY_INITIALIZED__ = true;
  const originalFetch = window.fetch;

  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      let url = "";
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input && typeof (input as Request).url === "string") {
        url = (input as Request).url;
      }

      if (url.startsWith("https://api.themoviedb.org/3/")) {
        const proxiedUrl = url.replace("https://api.themoviedb.org/3/", "/api/tmdb/");
        if (typeof input === "string" || input instanceof URL) {
          return originalFetch.call(this, proxiedUrl, init);
        } else {
          return originalFetch.call(this, new Request(proxiedUrl, input as Request), init);
        }
      }
    } catch {
      // Fallback cleanly to original fetch on any error
    }
    return originalFetch.call(this, input, init);
  };
}

export const tmdb = new TMDB(token);
