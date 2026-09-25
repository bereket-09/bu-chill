"use client";

import React from "react";
import { Channel, normalizeCategory } from "@/services/iptv";
import { cn } from "@/utils/helpers";
import SafeImage from "@/components/ui/other/SafeImage";
import { IoStar, IoStarOutline, IoPlay } from "react-icons/io5";

interface LiveChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  variant?: "grid" | "list";
  index?: number;
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

const LiveChannelCardComponent: React.FC<LiveChannelCardProps> = ({
  channel,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
  variant = "grid",
  index,
}) => {
  const categoryName = normalizeCategory(channel.group || channel.category);
  const catStyle = CATEGORY_STYLES[categoryName] || {
    badge: "bg-white/10 text-white/80 border-white/10",
    icon: "📺",
  };

  // =========================================================================
  // GRID VARIANT (Visual TV Channel Tile)
  // =========================================================================
  if (variant === "grid") {
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
          "group relative flex flex-col rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left overflow-hidden",
          isActive
            ? "border-primary/80 bg-primary/10 shadow-xl shadow-primary/20 ring-1 ring-primary/40 scale-[1.02]"
            : "border-white/10 bg-[#121319] hover:border-white/25 hover:bg-[#181a24] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60"
        )}
      >
        {/* Top Banner / Logo Area */}
        <div className="relative w-full aspect-[16/10] bg-black/50 flex items-center justify-center p-3.5 sm:p-4 border-b border-white/5 overflow-hidden">
          {/* Ambient subtle glow when active */}
          {isActive && (
            <div className="absolute inset-0 bg-primary/15 blur-xl pointer-events-none" />
          )}

          {/* Channel Logo */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 transition-transform duration-300 group-hover:scale-110">
            {channel.logo ? (
              <SafeImage
                src={channel.logo}
                alt={channel.name}
                fallbackTitle={channel.name}
                fill
                sizes="(max-width: 640px) 56px, 80px"
                className="object-contain drop-shadow-md"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-white/5 border border-white/10 font-extrabold text-white/60 text-base sm:text-lg">
                {channel.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Top-Left Live or HD Badge */}
          {isActive ? (
            <span className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full bg-primary px-2 py-0.5 text-[9px] font-black uppercase text-black tracking-wider shadow-lg shadow-primary/40">
              <span className="flex gap-0.5 items-center">
                <span className="h-2 w-0.5 rounded-full bg-black animate-pulse" />
                <span className="h-3 w-0.5 rounded-full bg-black animate-pulse delay-75" />
                <span className="h-1.5 w-0.5 rounded-full bg-black animate-pulse delay-150" />
              </span>
              ON AIR
            </span>
          ) : (
            <span className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              LIVE
            </span>
          )}

          {/* Top-Right Favorite Star */}
          <button
            type="button"
            onClick={onToggleFavorite}
            className={cn(
              "absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-md transition-all hover:scale-110",
              isFavorite
                ? "bg-black/60 text-yellow-400 opacity-100 shadow-sm"
                : "bg-black/40 text-white/50 hover:text-white hover:bg-black/70 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            )}
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          >
            {isFavorite ? <IoStar className="text-sm" /> : <IoStarOutline className="text-sm" />}
          </button>

          {/* Hover Play Overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/40 transform scale-75 group-hover:scale-100 transition-transform">
              <IoPlay className="w-5 h-5 ml-0.5 text-black" />
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="p-3 sm:p-3.5 flex flex-col gap-2">
          <h4
            className={cn(
              "text-xs sm:text-sm font-bold truncate leading-snug",
              isActive ? "text-primary" : "text-white group-hover:text-primary transition-colors"
            )}
            title={channel.name}
          >
            {channel.name}
          </h4>

          <div className="flex items-center justify-between gap-1 text-[10px]">
            <span
              className={cn(
                "flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold border truncate max-w-[120px]",
                catStyle.badge
              )}
            >
              <span>{catStyle.icon}</span>
              <span className="truncate">{categoryName}</span>
            </span>

            {channel.country && (
              <span
                className="flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 font-semibold text-white/60 shrink-0"
                title={channel.country}
              >
                {channel.countryFlag && <span className="text-[11px] leading-none">{channel.countryFlag}</span>}
                <span className="max-w-[75px] truncate">{channel.country}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LIST VARIANT (Compact Channel Guide Row)
  // =========================================================================
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
        "group relative flex items-center justify-between gap-3 sm:gap-4 rounded-xl border px-3 sm:px-4 py-2.5 transition-all cursor-pointer select-none text-left",
        isActive
          ? "border-primary/80 bg-primary/10 shadow-md shadow-primary/20 ring-1 ring-primary/40"
          : "border-white/5 bg-[#121319]/80 hover:border-white/20 hover:bg-[#181a24]"
      )}
    >
      {/* Left: Index + Logo + Info */}
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        {typeof index === "number" && (
          <span className="text-[11px] font-mono font-bold text-white/30 w-6 sm:w-7 shrink-0 text-center">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}

        {/* Logo */}
        <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/60 p-1 shadow-inner">
          {channel.logo ? (
            <SafeImage
              src={channel.logo}
              alt={channel.name}
              fallbackTitle={channel.name}
              fill
              sizes="(max-width: 640px) 36px, 40px"
              className="object-contain p-0.5 transition-transform group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-bold text-white/60 text-[10px]">
              {channel.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Channel Name & Quick Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "text-xs sm:text-sm font-bold truncate leading-tight",
                isActive ? "text-primary" : "text-white group-hover:text-primary transition-colors"
              )}
            >
              {channel.name}
            </h4>
            {isActive && (
              <span className="flex items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase text-primary tracking-wider shrink-0">
                <span className="inline-flex gap-0.5">
                  <span className="h-1.5 sm:h-2 w-0.5 rounded-full bg-primary animate-pulse" />
                  <span className="h-2.5 sm:h-3 w-0.5 rounded-full bg-primary animate-pulse delay-75" />
                  <span className="h-1 sm:h-1.5 w-0.5 rounded-full bg-primary animate-pulse delay-150" />
                </span>
                ON AIR
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1 sm:hidden">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[9px] font-bold border",
                catStyle.badge
              )}
            >
              <span>{catStyle.icon}</span>
              <span>{categoryName}</span>
            </span>
            {channel.country && (
              <span className="flex items-center gap-0.5 rounded bg-white/5 border border-white/5 px-1 py-0.2 text-[9px] font-semibold text-white/60">
                {channel.countryFlag && <span>{channel.countryFlag}</span>}
                <span className="max-w-[65px] truncate">{channel.country}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Badges + Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Category Pill (Desktop) */}
        <span
          className={cn(
            "hidden sm:flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border",
            catStyle.badge
          )}
        >
          <span>{catStyle.icon}</span>
          <span>{categoryName}</span>
        </span>

        {/* Country Pill (Desktop) */}
        {channel.country && (
          <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
            {channel.countryFlag && <span className="text-xs leading-none">{channel.countryFlag}</span>}
            <span>{channel.country}</span>
          </span>
        )}

        {/* Live Indicator */}
        <span className="hidden sm:flex items-center gap-1 rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-bold text-white/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          LIVE
        </span>

        {/* Quick Play Trigger */}
        <div
          className={cn(
            "p-1.5 rounded-lg transition-all",
            isActive
              ? "bg-primary text-black"
              : "text-white/40 group-hover:text-white group-hover:bg-white/10"
          )}
        >
          <IoPlay className="w-3.5 h-3.5" />
        </div>

        {/* Favorite Star Button */}
        <button
          type="button"
          onClick={onToggleFavorite}
          className={cn(
            "p-1 sm:p-1.5 rounded-full transition-all hover:scale-110",
            isFavorite ? "text-yellow-400" : "text-white/30 hover:text-white/80"
          )}
          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
        >
          {isFavorite ? <IoStar className="text-base" /> : <IoStarOutline className="text-base" />}
        </button>
      </div>
    </div>
  );
};

export const LiveChannelCard = React.memo(LiveChannelCardComponent, (prev, next) => {
  return (
    prev.isActive === next.isActive &&
    prev.isFavorite === next.isFavorite &&
    prev.variant === next.variant &&
    prev.index === next.index &&
    prev.channel.id === next.channel.id &&
    prev.channel.name === next.channel.name &&
    prev.channel.logo === next.channel.logo
  );
});

export default LiveChannelCard;
