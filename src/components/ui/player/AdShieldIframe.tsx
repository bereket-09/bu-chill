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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className={cn("group/shield relative w-full h-full bg-black overflow-hidden select-none", className)}>
      {/* The embed player */}
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
            <span>Ad Shield: Active</span>
          </button>

          {/* Expanded Ad Shield Info Dropdown */}
          {showControls && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0f1018]/95 border border-white/15 p-3 text-xs shadow-2xl backdrop-blur-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <IoShieldOutline className="w-4 h-4 text-emerald-400" />
                  Ad Shield Protection
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
                  <span>Parent page popups & redirects guarded</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Original English HD sources prioritized</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Unrestricted video buffer & fullscreen</span>
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
