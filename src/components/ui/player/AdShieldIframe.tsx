"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/utils/helpers";
import { IoShieldCheckmark, IoShieldOutline, IoInformationCircleOutline } from "react-icons/io5";

interface AdShieldIframeProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src: string;
  title?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onLoad?: () => void;
  allowFullScreen?: boolean;
}

/**
 * Number of clicks the shield swallows before letting clicks reach the embed.
 * Popunder scripts inside embeds usually hook the first click(s) on the player.
 */
const SHIELD_CLICKS = 2;

/**
 * AdShieldIframe:
 * The embed is cross-origin and unsandboxed (providers refuse to play when sandboxed),
 * so nothing on our page can reach into it. Instead we put a transparent click shield
 * over the player. Clicks that land on the shield never reach the embed, so its ad
 * scripts get no user activation and the browser's popup blocker stops their popups.
 * If a popup still escapes (our tab gets hidden), the shield re-arms for one click.
 */
export const AdShieldIframe: React.FC<AdShieldIframeProps> = ({
  src,
  title = "Protected Stream",
  className,
  referrerPolicy = "no-referrer",
  allowFullScreen = true,
  onLoad,
  ...rest
}) => {
  const [showControls, setShowControls] = useState<boolean>(false);
  const [shieldClicksLeft, setShieldClicksLeft] = useState<number>(SHIELD_CLICKS);
  const [absorbedCount, setAbsorbedCount] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Re-arm the shield for every new source
  useEffect(() => {
    setShieldClicksLeft(SHIELD_CLICKS);
  }, [src]);

  // If a click inside the embed still opened a popup/new tab, our tab becomes hidden.
  // When the user comes back, re-arm the shield so the next ad-hooked click is absorbed too.
  useEffect(() => {
    let clickedIntoEmbed = false;

    const handleBlur = () => {
      // Window blur while the iframe is focused means the user clicked inside the embed
      clickedIntoEmbed = document.activeElement === iframeRef.current;
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && clickedIntoEmbed) {
        clickedIntoEmbed = false;
        setShieldClicksLeft((prev) => Math.max(prev, 1));
      }
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleShieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShieldClicksLeft((prev) => prev - 1);
    setAbsorbedCount((prev) => prev + 1);
  };

  const shieldActive = shieldClicksLeft > 0;

  return (
    <div className={cn("group/shield relative w-full h-full bg-black overflow-hidden select-none", className)}>
      {/* The embed - unsandboxed because providers block playback when sandboxed */}
      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy={referrerPolicy}
        allowFullScreen={allowFullScreen}
        className="w-full h-full border-0 bg-black"
        onLoad={onLoad}
        {...rest}
      />

      {/* Click shield - absorbs the first clicks that popunder scripts hook onto */}
      {shieldActive && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Tap to activate player"
          onClick={handleShieldClick}
          className="absolute inset-0 z-20 cursor-pointer"
        >
          {absorbedCount > 0 && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 border border-emerald-500/40 text-[11px] text-emerald-300 shadow-xl backdrop-blur-md animate-in fade-in duration-300">
              <IoInformationCircleOutline className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Ad click absorbed. Tap {shieldClicksLeft} more {shieldClicksLeft === 1 ? "time" : "times"} to
                use the player.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Ad Shield Status Floating Pill */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto transition-opacity duration-300 opacity-80 group-hover/shield:opacity-100">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowControls((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-lg transition-all cursor-pointer bg-emerald-950/80 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60"
            title="Ad Shield Protection Status"
          >
            <IoShieldCheckmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Click Shield: {shieldActive ? "Armed" : "Passed"}</span>
            {absorbedCount > 0 && (
              <span className="ml-0.5 px-1 rounded-full bg-emerald-500/20 text-[10px] font-black">
                {absorbedCount} absorbed
              </span>
            )}
          </button>

          {/* Expanded Ad Shield Info Dropdown */}
          {showControls && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0f1018]/95 border border-white/15 p-3 text-xs shadow-2xl backdrop-blur-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <IoShieldOutline className="w-4 h-4 text-emerald-400" />
                  Click Shield
                </span>
                <button
                  type="button"
                  onClick={() => setShowControls(false)}
                  className="text-white/40 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-2.5 space-y-2 text-[11px] text-white/70 leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>First clicks absorbed so embed popunders can&apos;t fire</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Re-arms automatically if a popup gets through</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">!</span>
                  <span>
                    This is a third-party server and may still show ads. Use a blocker like uBlock
                    Origin, or pick a Direct server for an ad-free stream.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdShieldIframe;
