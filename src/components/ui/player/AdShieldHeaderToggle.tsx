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

  const isStrict = mode === "strict";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 rounded-lg text-xs font-semibold border backdrop-blur-md transition-all active:scale-95 shadow-md select-none cursor-pointer",
        isStrict
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
        className
      )}
      title={
        isStrict
          ? "AdShield: Strict (0 Popups active). Click to switch to Balanced mode."
          : "AdShield: Balanced (Popups allowed). Click to switch to Strict 0-popup mode."
      }
      aria-label={`AdShield mode: ${isStrict ? "Strict" : "Balanced"}`}
    >
      {isStrict ? (
        <IoShieldCheckmark className="w-4 h-4 shrink-0 text-emerald-400" />
      ) : (
        <IoShieldOutline className="w-4 h-4 shrink-0 text-amber-300" />
      )}
      <span className="hidden sm:inline font-medium">
        {isStrict ? "Strict" : "Balanced"}
      </span>
    </button>
  );
};

export default AdShieldHeaderToggle;
