"use client";

import { useEffect } from "react";

// Whitelist of trusted domains that the user is genuinely allowed to visit in external tabs
const TRUSTED_DOMAINS = [
  "github.com",
  "twitter.com",
  "x.com",
  "themoviedb.org",
  "tmdb.org",
  "ublockorigin.com",
  "adguard.com",
  "imdb.com",
  "vercel.app",
];

function isLegitimateUrl(rawUrl: string): boolean {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim();

  // Allow internal navigation, anchors, protocols
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed === "about:blank"
  ) {
    return true;
  }

  try {
    const parsed = new URL(trimmed, typeof window !== "undefined" ? window.location.origin : undefined);

    // Allow same-origin
    if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
      return true;
    }

    // Check trusted domains whitelist
    const hostname = parsed.hostname.toLowerCase();
    return TRUSTED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * AdShieldGlobalGuard:
 * Intercepts and completely neutralizes rogue ad popups, window.open calls,
 * target="_blank" click-hijacks, and hidden popunder triggers across ALL pages,
 * channels, and video players without embed scripts knowing.
 */
export default function AdShieldGlobalGuard() {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_GLOBAL_ADSHIELD === "true";

  useEffect(() => {
    if (!isEnabled || typeof window === "undefined") return;

    // 0. Anti-Adblock Deceiver / Cloaking (sites think ads run without issue)
    try {
      (window as any).canRunAds = true;
      (window as any).isAdBlocked = false;
      (window as any).google_ad_client = {};
      (window as any).google_ad_status = 1;
      (window as any).adBlockerDetected = false;
      (window as any).uBlockOrigin = false;

      // Create decoy bait element so height-based ad detectors pass
      let bait = document.getElementById("ad-detector-decoy");
      if (!bait) {
        bait = document.createElement("div");
        bait.id = "ad-detector-decoy";
        bait.className = "adsbox ad-placement pub_300x250 text-ad";
        bait.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;";
        document.body.appendChild(bait);
      }
    } catch {}

    // 1. Monkey-patch window.open globally
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string) {
      const urlStr = url ? String(url) : "";

      // If opening an external or ad URL, or target is _blank
      if (!isLegitimateUrl(urlStr)) {
        console.warn("[AdShield Global] Blocked unauthorized window.open popup to:", urlStr);
        return null; // Neutralized!
      }

      return originalOpen.call(window, url, target, features);
    };

    // 2. Monkey-patch HTMLAnchorElement.prototype.click (catches programmatic ad clicks)
    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      const target = this.getAttribute("target");
      const href = this.getAttribute("href") || this.href || "";

      if (target === "_blank" && !isLegitimateUrl(href)) {
        console.warn("[AdShield Global] Blocked programmatic anchor _blank click to:", href);
        return; // Suppress!
      }

      return originalAnchorClick.call(this);
    };

    // 3. Monkey-patch HTMLFormElement.prototype.submit (catches hidden popup forms)
    const originalFormSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      const target = this.getAttribute("target");
      const action = this.getAttribute("action") || this.action || "";

      if (target === "_blank" && !isLegitimateUrl(action)) {
        console.warn("[AdShield Global] Blocked programmatic form popup to:", action);
        return; // Suppress!
      }

      return originalFormSubmit.call(this);
    };

    // 4. Capture-phase click listener to intercept rogue target="_blank" link clicks
    const handleCaptureClick = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (!targetEl) return;

      const anchor = targetEl.closest("a");
      if (anchor) {
        const target = anchor.getAttribute("target");
        const href = anchor.getAttribute("href") || anchor.href || "";

        if (target === "_blank" && !isLegitimateUrl(href)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.warn("[AdShield Global] Intercepted rogue user-clicked _blank ad link:", href);
          return;
        }
      }

      // Detect and neutralize rogue full-viewport invisible popunder overlays
      if (targetEl !== document.body && targetEl !== document.documentElement) {
        const style = window.getComputedStyle(targetEl);
        if (
          style.position === "fixed" &&
          parseInt(style.zIndex, 10) > 99999 &&
          (parseFloat(style.opacity) === 0 || style.backgroundColor === "rgba(0, 0, 0, 0)") &&
          !targetEl.hasAttribute("data-legitimate-modal")
        ) {
          const rect = targetEl.getBoundingClientRect();
          if (rect.width >= window.innerWidth * 0.8 && rect.height >= window.innerHeight * 0.8) {
            console.warn("[AdShield Global] Removed invisible clickjack overlay div from DOM");
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            targetEl.remove();
          }
        }
      }
    };

    // 5. Anti-Popunder Focus Shield:
    // If an interaction steals window focus unexpectedly, immediately reclaim focus
    let lastUserClickTime = 0;
    const handleUserInteraction = () => {
      lastUserClickTime = Date.now();
    };

    const handleWindowBlur = () => {
      // If the window blurred within 1200ms of a user click inside the platform, it's a popunder attempt!
      if (Date.now() - lastUserClickTime < 1200) {
        setTimeout(() => {
          window.focus();
        }, 30);
      }
    };

    // 6. Anti-Tab-Hijack Guard: Prevent unauthorized top window redirects by rogue embeds
    let isInternalNavigation = false;
    const handleInternalNavigationClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (href.startsWith("/") || href.startsWith("#") || isLegitimateUrl(href)) {
          isInternalNavigation = true;
          setTimeout(() => {
            isInternalNavigation = false;
          }, 3500);
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isInternalNavigation) {
        // If an embed tries to redirect the top window away from movie/show players
        if (
          typeof window !== "undefined" &&
          (window.location.pathname.includes("/player") || window.location.pathname.includes("/watch"))
        ) {
          e.preventDefault();
          e.returnValue = "";
          return "";
        }
      }
    };

    window.addEventListener("click", handleCaptureClick, { capture: true });
    window.addEventListener("click", handleInternalNavigationClick, { capture: false });
    window.addEventListener("mousedown", handleUserInteraction, { capture: true });
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      HTMLAnchorElement.prototype.click = originalAnchorClick;
      HTMLFormElement.prototype.submit = originalFormSubmit;
      window.removeEventListener("click", handleCaptureClick, { capture: true });
      window.removeEventListener("click", handleInternalNavigationClick, { capture: false });
      window.removeEventListener("mousedown", handleUserInteraction, { capture: true });
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
}
