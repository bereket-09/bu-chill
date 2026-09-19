"use client";

import React, { useEffect, useRef, useState } from "react";
import { PlayersProps } from "@/types";
import { cn } from "@/utils/helpers";
import { IoServerOutline, IoChevronDown, IoCheckmark } from "react-icons/io5";
import { FiAlertTriangle } from "react-icons/fi";

interface EmbedServerDropdownProps {
  servers: PlayersProps[];
  selectedSource: number;
  onSelectSource: (index: number) => void;
  className?: string;
}

export const cleanServerTitle = (raw: string): string => {
  return raw
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/^(Ad-Free Native|Fallback Embed|Embed)\s*[-:]?\s*/i, "")
    .trim() || "Server";
};

const EmbedServerDropdown: React.FC<EmbedServerDropdownProps> = ({
  servers,
  selectedSource,
  onSelectSource,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentServer = servers[selectedSource] || servers[0];
  const currentTitle = cleanServerTitle(currentServer?.title || "Embed");

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn("relative pointer-events-auto", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Bingr Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all text-xs sm:text-sm font-semibold border border-white/10 bg-black/40 backdrop-blur-md active:scale-95 shadow-lg select-none"
        aria-label="Select Embed Server"
      >
        <IoServerOutline className="w-4 h-4 shrink-0 text-white/80" />
        <span className="hidden sm:inline">Embed</span>
        <span className="hidden md:inline opacity-50 font-normal truncate max-w-[120px]">
          {currentTitle}
        </span>
        <IoChevronDown
          className={cn("w-3.5 h-3.5 text-white/40 transition-transform duration-200", {
            "rotate-180": isOpen,
          })}
        />
      </button>

      {/* Floating Bingr Glassmorphic Dropdown */}
      <div
        className={cn(
          "absolute top-full right-0 pt-2 min-w-[15rem] max-w-[calc(100vw-1.5rem)] z-50 transition-all duration-200 origin-top-right",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="bg-[#0f1014]/95 backdrop-blur-2xl border border-white/10 text-white rounded-xl shadow-2xl py-2 text-sm flex flex-col w-max min-w-[16rem]">
          {/* Header */}
          <div className="text-white/40 text-[11px] font-bold px-4 mb-1.5 uppercase tracking-wider select-none">
            Embed Player
          </div>

          {/* Server Options List */}
          <div className="flex flex-col max-h-[280px] overflow-y-auto px-1.5 gap-0.5">
            {servers.map((server, idx) => {
              const isSelected = selectedSource === idx;
              const title = cleanServerTitle(server.title);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelectSource(idx);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-xs sm:text-sm",
                    isSelected
                      ? "bg-white/[0.12] text-white font-semibold"
                      : "text-white/80 hover:bg-white/[0.08] hover:text-white"
                  )}
                >
                  <span
                    className={cn("w-4 shrink-0 flex items-center justify-center text-white", {
                      "opacity-100": isSelected,
                      "opacity-0": !isSelected,
                    })}
                  >
                    <IoCheckmark className="w-4 h-4 text-emerald-400" />
                  </span>
                  <span className="flex-1 truncate">{title}</span>
                  {server.recommended && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      HD
                    </span>
                  )}
                  {server.fast && !server.recommended && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Fast
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bingr Ads Warning Footer */}
          <div className="mt-2 border-t border-white/10 px-4 pt-2.5 pb-1 flex items-start gap-2 text-white/40 text-[11px] leading-snug max-w-[270px] select-none">
            <FiAlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400/80" />
            <span>These servers may contain ads or popups. Use a blocker for the best experience.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedServerDropdown;
