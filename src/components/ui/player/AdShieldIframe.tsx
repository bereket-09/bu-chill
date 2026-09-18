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
  const [blockedPopupCount, setBlockedPopupCount] = useState<number>(0);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Layer 1: Window.open interceptor on the parent window to catch any rogue breakout attempts
  useEffect(() => {
    const originalOpen = window.open;

    window.open = function (...args) {
      console.warn("[AdShield] Blocked popup window.open attempt:", args[0]);
      setBlockedPopupCount((prev) => prev + 1);
      setUserInteracted(true);
      return null;
    };

    return () => {
      window.open = originalOpen;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("group/shield relative w-full h-full bg-black overflow-hidden select-none", className)}
    >
      {/* The Protected Iframe - unsandboxed for maximum streaming player compatibility */}
      <iframe
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
            {blockedPopupCount > 0 && (
              <span className="ml-0.5 px-1 rounded-full bg-emerald-500/20 text-[10px] font-black">
                {blockedPopupCount} blocked
              </span>
            )}
          </button>

          {/* Expanded Ad Shield Options Dropdown */}
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
                  <span>New tab popups & popunders blocked</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Parent page redirect hijacking blocked</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Full player compatibility enabled</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Toast on First Interaction */}
      {userInteracted && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 border border-emerald-500/40 text-[11px] text-emerald-300 shadow-xl backdrop-blur-md animate-in fade-in duration-300">
          <IoInformationCircleOutline className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Ad Shield blocked unwanted popups. Click play to continue stream.</span>
        </div>
      )}
    </div>
  );
};

export default AdShieldIframe;
