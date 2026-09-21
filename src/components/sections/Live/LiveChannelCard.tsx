"use client";

import React from "react";
import { Channel } from "@/services/iptv";
import { cn } from "@/utils/helpers";
import SafeImage from "@/components/ui/other/SafeImage";
import { IoStar, IoStarOutline } from "react-icons/io5";

interface LiveChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const CATEGORY_STYLES: Record<string, { badge: string; icon: string }> = {
  News: { badge: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: "📰" },
  Sports: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: "⚽" },
  Movies: { badge: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: "🎬" },
  Entertainment: { badge: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: "🎭" },
  Music: { badge: "bg-rose-500/15 text-rose-400 border-rose-500/30", icon: "🎵" },
  Documentary: { badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", icon: "🌍" },
  Kids: { badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: "🧸" },
};

export const LiveChannelCard: React.FC<LiveChannelCardProps> = ({
  channel,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const categoryName = channel.group || channel.category || "General";
  const catStyle = CATEGORY_STYLES[categoryName] || {
    badge: "bg-white/10 text-white/80 border-white/10",
    icon: "📺",
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative flex items-center gap-2.5 sm:gap-3.5 rounded-xl sm:rounded-2xl border p-2.5 sm:p-3.5 transition-all cursor-pointer select-none text-left",
        isActive
          ? "border-primary/80 bg-primary/10 shadow-xl shadow-primary/20 scale-[1.02]"
          : "border-white/10 bg-[#121319] hover:border-white/25 hover:bg-[#181a24] hover:scale-[1.01]"
      )}
    >
      {/* Channel Logo / Fallback */}
      <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border border-white/15 bg-black/60 p-1 shadow-inner">
        {channel.logo ? (
          <SafeImage
            src={channel.logo}
            alt={channel.name}
            fallbackTitle={channel.name}
            fill
            sizes="(max-width: 640px) 40px, 48px"
            className="object-contain p-0.5 sm:p-1 transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-bold text-white/60 text-[10px] sm:text-xs">
            {channel.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Channel Metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h4
            className={cn(
              "text-xs sm:text-sm font-bold truncate leading-snug",
              isActive ? "text-primary" : "text-white group-hover:text-white"
            )}
          >
            {channel.name}
          </h4>
          {isActive && (
            <span className="flex items-center gap-1 rounded bg-primary/20 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase text-primary tracking-wider shrink-0">
              <span className="inline-flex gap-0.5">
                <span className="h-1.5 sm:h-2 w-0.5 rounded-full bg-primary animate-pulse" />
                <span className="h-2.5 sm:h-3 w-0.5 rounded-full bg-primary animate-pulse delay-75" />
                <span className="h-1 sm:h-1.5 w-0.5 rounded-full bg-primary animate-pulse delay-150" />
              </span>
              ON AIR
            </span>
          )}
        </div>

        {/* Category & Country Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 flex-wrap">
          <span
            className={cn(
              "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold border",
              catStyle.badge
            )}
          >
            <span className="text-[9px] sm:text-[10px]">{catStyle.icon}</span>
            <span>{categoryName}</span>
          </span>

          {channel.country && (
            <span className="rounded-md bg-white/5 border border-white/5 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white/50">
              {channel.country}
            </span>
          )}
        </div>
      </div>

      {/* Favorite Star Button */}
      <button
        type="button"
        onClick={onToggleFavorite}
        className={cn(
          "shrink-0 p-1 sm:p-1.5 rounded-full transition-all hover:scale-110",
          isFavorite ? "text-yellow-400" : "text-white/30 hover:text-white/80"
        )}
        aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
      >
        {isFavorite ? <IoStar className="text-base sm:text-lg" /> : <IoStarOutline className="text-base sm:text-lg" />}
      </button>
    </div>
  );
};

export default LiveChannelCard;
