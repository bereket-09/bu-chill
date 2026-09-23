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
          color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
          tooltip: "AdShield: Strict (0 Popups, 0 Redirects). Click to switch to Balanced.",
          icon: <IoShieldCheckmark className="w-4 h-4 shrink-0 text-emerald-400" />,
        };
      case "balanced":
        return {
          label: "Balanced",
          color: "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
          tooltip: "AdShield: Balanced (Popups allowed for stubborn players). Click for Direct mode.",
          icon: <IoShieldOutline className="w-4 h-4 shrink-0 text-amber-300" />,
        };
      case "direct":
      default:
        return {
          label: "Direct",
          color: "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20",
          tooltip: "AdShield: Direct (Sandbox disabled for anti-sandbox embeds like Videasy). Click for Strict.",
          icon: <IoShieldOutline className="w-4 h-4 shrink-0 text-sky-400" />,
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 rounded-lg text-xs font-semibold border backdrop-blur-md transition-all active:scale-95 shadow-md select-none cursor-pointer",
        badge.color,
        className
      )}
      title={badge.tooltip}
      aria-label={`AdShield mode: ${badge.label}`}
    >
      {badge.icon}
      <span className="hidden sm:inline font-medium">
        {badge.label}
      </span>
    </button>
  );
};

export default AdShieldHeaderToggle;
