"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import SafeImage from "@/components/ui/other/SafeImage";
import { SportsMatch } from "@/services/sports";
import {
  getSportsPosterUrl,
  getSportsBadgeUrl,
  getCategoryFallbackImage,
} from "./SportsHeroCarousel";
import { IoPlay, IoTimeOutline, IoRadio, IoCalendarOutline, IoCheckmark } from "react-icons/io5";

interface SportsMatchCardProps {
  match: SportsMatch;
}

const CATEGORY_ICONS: Record<string, string> = {
  football: "⚽ Football",
  soccer: "⚽ Football",
  basketball: "🏀 Basketball",
  "american-football": "🏈 NFL / Football",
  combat: "🥊 Combat / MMA",
  fight: "🥊 Fight / UFC",
  mma: "🥊 UFC / MMA",
  boxing: "🥊 Boxing",
  motorsport: "🏎️ F1 / Racing",
  "motor-sports": "🏎️ F1 / Racing",
  f1: "🏎️ Formula 1",
  cricket: "🏏 Cricket",
  baseball: "⚾ Baseball",
  tennis: "🎾 Tennis",
  hockey: "🏒 Hockey",
  rugby: "🏉 Rugby",
};

export const SportsMatchCard: React.FC<SportsMatchCardProps> = ({ match }) => {
  const [copied, setCopied] = useState(false);

  const isLive =
    match.category !== "upcoming" &&
    new Date(match.date).getTime() < Date.now() + 1000 * 60 * 60 * 3;

  const countdownText = useMemo(() => {
    if (!match.date || isLive) return null;
    const diff = new Date(match.date).getTime() - Date.now();
    if (diff <= 0) return "Starting soon";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `In ${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  }, [match.date, isLive]);

  const matchTime = match.date
    ? new Date(match.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Live";

  const matchDate = match.date
    ? new Date(match.date).toLocaleDateString([], { month: "short", day: "numeric" })
    : "";

  const handleCopyReminder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const formatted = `⚽ Live Match Reminder: ${match.title} kicks off on ${matchDate} at ${matchTime} on Bu-Chill!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formatted);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryLabel =
    CATEGORY_ICONS[match.category?.toLowerCase()] || match.category || "Sports";

  const posterUrl = getSportsPosterUrl(match);
  const homeBadge = getSportsBadgeUrl(match.teams?.home?.badge);
  const awayBadge = getSportsBadgeUrl(match.teams?.away?.badge);
  const streamCount = match.sources?.length || 1;

  return (
    <Link
      href={`/sports/watch?id=${encodeURIComponent(match.id)}`}
      className="group relative flex flex-col w-full aspect-video rounded-2xl overflow-hidden bg-[#14151b] border border-white/10 hover:border-white/30 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/80 transition-all duration-300 select-none cursor-pointer"
    >
      {/* Background Poster / Stadium Artwork */}
      <SafeImage
        src={posterUrl}
        alt={match.title}
        fallbackTitle={match.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover opacity-60 group-hover:opacity-80 transition-all duration-500 group-hover:scale-105"
        unoptimized
      />

      {/* Dark Vignette Overlay for Crisp Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 pointer-events-none" />

      {/* Top Header: LIVE Badge + Category / League Pill */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white uppercase tracking-wider animate-pulse shadow-md shadow-red-600/50">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white/90 backdrop-blur-md border border-white/10">
                <IoTimeOutline className="w-3 h-3 text-white/50" />
                {matchDate} • {matchTime}
              </span>
              {countdownText && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-primary/20 text-primary border border-primary/30 backdrop-blur-md">
                  {countdownText}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isLive && (
            <button
              type="button"
              onClick={handleCopyReminder}
              title="Copy match reminder"
              className="p-1 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              {copied ? (
                <IoCheckmark className="w-3 h-3 text-primary" />
              ) : (
                <IoCalendarOutline className="w-3 h-3" />
              )}
            </button>
          )}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-white/90 border border-white/10 capitalize shadow">
            {categoryLabel}
          </span>
        </div>
      </div>

      {/* Center / Bottom: Teams & Logos Showcase */}
      <div className="relative mt-auto p-3 sm:p-3.5 flex flex-col z-10">
        {match.teams?.home?.name && match.teams?.away?.name ? (
          <div className="flex items-center justify-between gap-1.5 mb-2">
            {/* Home Team */}
            <div className="flex items-center gap-2 max-w-[44%] min-w-0">
              {homeBadge ? (
                <div className="relative w-6 h-6 shrink-0">
                  <SafeImage
                    src={homeBadge}
                    alt={match.teams.home.name}
                    fill
                    className="object-contain drop-shadow"
                    unoptimized
                  />
                </div>
              ) : null}
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                {match.teams.home.name}
              </span>
            </div>

            {/* VS Badge */}
            <span className="text-[10px] font-black text-white/40 italic px-1.5 shrink-0 rounded bg-white/5 py-0.5 border border-white/5">
              VS
            </span>

            {/* Away Team */}
            <div className="flex items-center gap-2 flex-row-reverse max-w-[44%] min-w-0 text-right">
              {awayBadge ? (
                <div className="relative w-6 h-6 shrink-0">
                  <SafeImage
                    src={awayBadge}
                    alt={match.teams.away.name}
                    fill
                    className="object-contain drop-shadow"
                    unoptimized
                  />
                </div>
              ) : null}
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                {match.teams.away.name}
              </span>
            </div>
          </div>
        ) : (
          <h4 className="text-xs sm:text-sm font-bold text-white truncate mb-2">
            {match.title}
          </h4>
        )}

        {/* Footer: Stream info (Active Streams) & Watch Link */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
          {/* Active Streams Indicator */}
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <IoRadio className="w-3 h-3 animate-pulse" />
            <span>{streamCount} {streamCount === 1 ? "Stream" : "Streams"}</span>
          </span>

          <span className="shrink-0 flex items-center gap-1 font-bold text-white group-hover:text-primary transition-colors">
            <IoPlay className="w-3 h-3 fill-current" />
            Watch
          </span>
        </div>
      </div>
    </Link>
  );
};

export default SportsMatchCard;
