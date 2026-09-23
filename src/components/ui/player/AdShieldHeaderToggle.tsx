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
    const next: AdShieldMode = mode === "strict" ? "balanced" : "strict";
    setAdShieldMode(next);
    setMode(next);
  };

  const isStrict = mode === "strict";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-white/10 bg-black/40 hover:bg-white/10 text-white/90 backdrop-blur-md transition-all active:scale-95 shadow-md select-none cursor-pointer",
        className
      )}
      title={
        isStrict
          ? "AdShield: Strict (0 Popups). Click to remove sandbox parameter for Bingr & anti-sandbox embeds."
          : "AdShield: Amber / No-Sandbox (No sandbox parameter applied). Click for Strict 0-popup mode."
      }
      aria-label={`AdShield mode: ${isStrict ? "Strict" : "No-Sandbox"}`}
    >
      {isStrict ? (
        <IoShieldCheckmark className="w-4 h-4 shrink-0 text-emerald-400" />
      ) : (
        <IoShieldOutline className="w-4 h-4 shrink-0 text-amber-400" />
      )}
    </button>
  );
};

export default AdShieldHeaderToggle;
