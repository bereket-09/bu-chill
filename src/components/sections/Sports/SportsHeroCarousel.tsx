"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import SafeImage from "@/components/ui/other/SafeImage";
import { SportsMatch } from "@/services/sports";
import {
  IoPlay,
  IoCalendarOutline,
  IoChevronBack,
  IoChevronForward,
  IoRadio,
} from "react-icons/io5";

export const getCategoryFallbackImage = (category?: string): string => {
  const t = category?.toLowerCase() || "";
  if (t.includes("football") && !t.includes("american")) {
    return "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop";
  }
  if (t.includes("cricket")) {
    return "https://images.unsplash.com/photo-1531415074968-03611b678135?q=80&w=1200&auto=format&fit=crop";
  }
  if (t.includes("basketball")) {
    return "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop";
  }
  if (t.includes("american-football") || t.includes("nfl")) {
    return "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=1200&auto=format&fit=crop";
  }
  if (t.includes("baseball")) {
    return "https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=1200&auto=format&fit=crop";
  }
  if (t.includes("motor") || t.includes("f1") || t.includes("racing")) {
    return "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200&auto=format&fit=crop";
  }
  if (t.includes("tennis")) {
    return "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop";
  }
  if (
    t.includes("fight") ||
    t.includes("ufc") ||
    t.includes("wwe") ||
    t.includes("boxing") ||
    t.includes("combat")
  ) {
    return "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1200&auto=format&fit=crop";
  }
  if (t.includes("rugby")) {
    return "https://images.unsplash.com/photo-1585822765356-3c0800c25a07?q=80&w=1200&auto=format&fit=crop";
  }
  return "https://image.tmdb.org/t/p/w1280/uO4hEw4gRar83XqVvC3s5UInWEd.jpg";
};

const isAbsoluteUrl = (url?: string) => /^https?:\/\//i.test(url || "");

export const getSportsBadgeUrl = (badge?: string): string => {
  if (!badge) return "";
  return isAbsoluteUrl(badge) ? badge : `https://streamed.pk/api/images/badge/${badge}.webp`;
};

export const getSportsPosterUrl = (match: SportsMatch): string => {
  if (match.poster) {
    return isAbsoluteUrl(match.poster) ? match.poster : `https://streamed.pk${match.poster}.webp`;
  }
  if (match.teams?.home?.badge && match.teams?.away?.badge) {
    const homeBadge = match.teams.home.badge;
    const awayBadge = match.teams.away.badge;
    if (isAbsoluteUrl(homeBadge) || isAbsoluteUrl(awayBadge)) {
      return getCategoryFallbackImage(match.category);
    }
    return `https://streamed.pk/api/images/poster/${homeBadge}/${awayBadge}.webp`;
  }
  return getCategoryFallbackImage(match.category);
};

interface SportsHeroCarouselProps {
  matches: SportsMatch[];
}

export const SportsHeroCarousel: React.FC<SportsHeroCarouselProps> = ({ matches }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const featured = matches.slice(0, 5);

  const handleSelect = useCallback((idx: number) => {
    setActiveIndex(idx);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: idx * scrollContainerRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  }, []);

  // Auto slide every 10 seconds
  useEffect(() => {
    if (featured.length <= 1) return;

    autoPlayTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featured.length);
    }, 10000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [featured.length]);

  if (!featured || featured.length === 0) return null;

  return (
    <section className="relative w-full h-[72vh] sm:h-[78vh] min-h-[500px] max-h-[820px] overflow-hidden group select-none bg-black">
      {/* Mobile Swipe Container / Desktop Transition Stack */}
      <div
        ref={scrollContainerRef}
        className="flex lg:block w-full h-full overflow-x-auto lg:overflow-hidden snap-x snap-mandatory lg:snap-none scroll-smooth scrollbar-hide"
      >
        {featured.map((match, idx) => {
          const isActive = idx === activeIndex;
          const isLive =
            match.category !== "upcoming" && new Date(match.date).getTime() < Date.now() + 1000 * 60 * 60 * 3;
          const posterUrl = getSportsPosterUrl(match);
          const homeBadge = getSportsBadgeUrl(match.teams?.home?.badge);
          const awayBadge = getSportsBadgeUrl(match.teams?.away?.badge);
          const streamCount = match.sources?.length || 1;

          return (
            <div
              key={match.id}
              className={`relative w-full h-full flex-shrink-0 snap-center lg:absolute lg:inset-0 lg:transition-opacity lg:duration-700 ${
                isActive ? "lg:opacity-100 lg:z-10" : "lg:opacity-0 lg:z-0 lg:pointer-events-none"
              }`}
            >
              {/* Background Backdrop Image */}
              <div className="absolute inset-0 bg-[#0f1014] overflow-hidden">
                <SafeImage
                  src={posterUrl}
                  alt={match.title}
                  fallbackTitle={match.title}
                  fill
                  priority={idx === 0}
                  className="w-full h-full object-cover object-center opacity-70"
                  unoptimized
                />
                {/* Cinema Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>

              {/* Main Match Info Content */}
              <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 pb-16 sm:pb-20 lg:pb-24 pointer-events-none">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 w-full pointer-events-auto max-w-4xl">
                  <div className="flex-1 flex flex-col items-start text-left">
                    {/* Top Badges: LIVE + Category + Active Streams */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                      {isLive ? (
                        <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wider uppercase animate-pulse shadow-lg shadow-red-600/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          LIVE NOW
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md text-white/90 text-xs font-bold px-2.5 py-1 rounded-md">
                          <IoCalendarOutline className="w-3.5 h-3.5" />
                          UPCOMING
                        </span>
                      )}

                      <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white/80 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {match.category}
                      </span>

                      {/* Active Streams Available Counter */}
                      <span className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                        <IoRadio className="w-3.5 h-3.5 animate-pulse" />
                        <span>{streamCount} Active {streamCount === 1 ? "Stream" : "Streams"}</span>
                      </span>
                    </div>

                    {/* Teams Head-to-Head Showcase */}
                    {match.teams?.home?.name && match.teams?.away?.name ? (
                      <div className="mb-4 flex items-center justify-start gap-4 bg-black/50 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-2xl max-w-xl">
                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-2">
                          {homeBadge ? (
                            <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                              <SafeImage
                                src={homeBadge}
                                alt={match.teams.home.name}
                                fill
                                className="object-contain drop-shadow-md"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-sm">
                              {match.teams.home.name.slice(0, 3)}
                            </div>
                          )}
                          <span className="text-xs sm:text-sm font-bold text-white text-center w-24 sm:w-28 truncate">
                            {match.teams.home.name}
                          </span>
                        </div>

                        {/* VS Tag */}
                        <div className="flex flex-col items-center px-2">
                          <span className="text-lg sm:text-2xl font-black text-white/40 italic">
                            VS
                          </span>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-2">
                          {awayBadge ? (
                            <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                              <SafeImage
                                src={awayBadge}
                                alt={match.teams.away.name}
                                fill
                                className="object-contain drop-shadow-md"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-sm">
                              {match.teams.away.name.slice(0, 3)}
                            </div>
                          )}
                          <span className="text-xs sm:text-sm font-bold text-white text-center w-24 sm:w-28 truncate">
                            {match.teams.away.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-xl mb-3">
                        {match.title}
                      </h2>
                    )}

                    {/* Date / Time */}
                    <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-white/70 mb-5">
                      <span className="flex items-center gap-1.5">
                        <IoCalendarOutline className="w-4 h-4 text-white/50" />
                        {new Date(match.date).toLocaleString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Action Button: Watch Live */}
                    <Link
                      href={`/sports/watch?id=${encodeURIComponent(match.id)}`}
                      className="inline-flex items-center justify-center gap-2.5 px-7 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-white text-black font-extrabold text-sm sm:text-base hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-black/80 hover:shadow-white/20"
                    >
                      <IoPlay className="w-5 h-5 fill-black translate-x-[1px]" />
                      <span>Watch Live</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Thumbnail Slider Controls (Bottom Right like Bingr) */}
      <div className="hidden lg:flex absolute right-8 bottom-12 items-center gap-2 px-2 z-30">
        <button
          type="button"
          onClick={() => handleSelect((activeIndex - 1 + featured.length) % featured.length)}
          className="w-8 h-12 flex items-center justify-center rounded-lg bg-black/40 hover:bg-black/80 backdrop-blur-md text-white/60 hover:text-white border border-white/10 transition"
          aria-label="Previous match"
        >
          <IoChevronBack className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {featured.map((match, idx) => {
            const isSelected = activeIndex === idx;
            const thumbUrl = getSportsPosterUrl(match);
            return (
              <button
                key={match.id}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 outline-none w-[90px] h-[52px] ${
                  isSelected
                    ? "ring-2 ring-white scale-110 shadow-lg z-10 opacity-100"
                    : "opacity-40 hover:opacity-80"
                }`}
              >
                <SafeImage
                  src={thumbUrl}
                  alt={match.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleSelect((activeIndex + 1) % featured.length)}
          className="w-8 h-12 flex items-center justify-center rounded-lg bg-black/40 hover:bg-black/80 backdrop-blur-md text-white/60 hover:text-white border border-white/10 transition"
          aria-label="Next match"
        >
          <IoChevronForward className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default SportsHeroCarousel;
