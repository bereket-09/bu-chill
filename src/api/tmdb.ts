import { env } from "@/utils/env";
import { isEmpty } from "@/utils/helpers";
import { TMDB } from "tmdb-ts";

const token = env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;

if (isEmpty(token)) {
  throw new Error("TMDB_ACCESS_TOKEN is not defined");
}

// In the browser, completely prevent any direct external calls to api.themoviedb.org
// by rewriting all TMDB requests to our same-origin backend proxy (/api/tmdb/...).
// This bypasses ad-blockers (Brave Shields, uBlock Origin, Pi-hole, AdGuard) and ISP firewalls.
if (typeof window !== "undefined") {
  // 1. Direct tmdb-ts BASE_URL rewrite
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const constants = require("tmdb-ts/dist/common/constants");
    if (constants) {
      constants.BASE_URL_V3 = "/api/tmdb";
    }
  } catch (_) {}

  // 2. Intercept XMLHttpRequest (used by cross-fetch browser ponyfill)
  if (!(window as any).__TMDB_XHR_PROXY__) {
    (window as any).__TMDB_XHR_PROXY__ = true;
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      user?: string | null,
      password?: string | null
    ) {
      let urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("api.themoviedb.org/3/")) {
        urlStr = urlStr.replace(/^https?:\/\/api\.themoviedb\.org\/3\//, "/api/tmdb/");
      }
      return originalOpen.call(this, method, urlStr, async, user, password);
    };
  }

  // 3. Intercept window.fetch
  if (!(window as any).__TMDB_FETCH_PROXY__) {
    (window as any).__TMDB_FETCH_PROXY__ = true;
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

        if (url.includes("api.themoviedb.org/3/")) {
          const proxiedUrl = url.replace(/^https?:\/\/api\.themoviedb\.org\/3\//, "/api/tmdb/");
          if (typeof input === "string" || input instanceof URL) {
            return originalFetch.call(this, proxiedUrl, init);
          } else {
            return originalFetch.call(this, new Request(proxiedUrl, input as Request), init);
          }
        }
      } catch (_) {}
      return originalFetch.call(this, input, init);
    };
  }
}

export const tmdb = new TMDB(token);
