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
    const next = mode === "strict" ? "balanced" : "strict";
    setAdShieldMode(next);
    setMode(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 rounded-lg text-xs sm:text-sm font-semibold border backdrop-blur-md transition-all active:scale-95 shadow-lg select-none cursor-pointer",
        mode === "strict"
          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25",
        className
      )}
      title={
        mode === "strict"
          ? "AdShield: Strict (0 Popups). Click to relax if player fails to load"
          : "AdShield: Balanced (Popups Allowed). Click to enable Strict 0-popup mode"
      }
    >
      {mode === "strict" ? (
        <IoShieldCheckmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-400" />
      ) : (
        <IoShieldOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-300" />
      )}
      <span>{mode === "strict" ? "Shield: Strict" : "Shield: Balanced"}</span>
    </button>
  );
};

export default AdShieldHeaderToggle;
