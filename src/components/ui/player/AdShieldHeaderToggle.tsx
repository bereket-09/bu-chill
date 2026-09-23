"use client";

import React, { useState, useEffect } from "react";
import { IoShieldCheckmark, IoShieldOutline } from "react-icons/io5";
import { getAdShieldMode, setAdShieldMode, AdShieldMode } from "@/utils/adShield";
import { cn } from "@/utils/helpers";

interface AdShieldHeaderToggleProps {
  className?: string;
}

export const AdShieldHeaderToggle: React.FC<AdShieldHeaderToggleProps> = ({ className }) => {
  const [mode, setMode] = useState<AdShieldMode>("strict");

  useEffect(() => {
    setMode(getAdShieldMode());
    const handleSync = (e: any) => {
      if (e.detail) setMode(e.detail);
    };
    window.addEventListener("buchill_adshield_changed", handleSync);
    return () => window.removeEventListener("buchill_adshield_changed", handleSync);
  }, []);

  const toggle = () => {
    let next: AdShieldMode = "strict";
    if (mode === "strict") next = "balanced";
    else if (mode === "balanced") next = "direct";
    else next = "strict";
    setAdShieldMode(next);
    setMode(next);
  };

  const getBadgeConfig = () => {
    switch (mode) {
      case "strict":
        return {
          label: "Strict",
          textColor: "text-emerald-400",
          tooltip: "AdShield: Strict (0 Popups, 0 Redirects). Click to switch to Balanced.",
          icon: <IoShieldCheckmark className="w-3.5 h-3.5 shrink-0 text-emerald-400" />,
        };
      case "balanced":
        return {
          label: "Balanced",
          textColor: "text-amber-400",
          tooltip: "AdShield: Balanced (Popups allowed for stubborn players). Click for Direct mode.",
          icon: <IoShieldOutline className="w-3.5 h-3.5 shrink-0 text-amber-400" />,
        };
      case "direct":
      default:
        return {
          label: "Direct",
          textColor: "text-sky-400",
          tooltip: "AdShield: Direct (Sandbox disabled for anti-sandbox embeds like Videasy). Click for Strict.",
          icon: <IoShieldOutline className="w-3.5 h-3.5 shrink-0 text-sky-400" />,
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-black/40 hover:bg-white/10 text-white/90 backdrop-blur-md transition-all active:scale-95 shadow-md select-none cursor-pointer",
        className
      )}
      title={badge.tooltip}
      aria-label={`AdShield mode: ${badge.label}`}
    >
      {badge.icon}
      <span className={cn("hidden sm:inline font-semibold text-[11px]", badge.textColor)}>
        {badge.label}
      </span>
    </button>
  );
};

export default AdShieldHeaderToggle;
