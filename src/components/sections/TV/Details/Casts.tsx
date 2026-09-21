"use client";

import React, { useRef } from "react";
import { Cast } from "tmdb-ts";
import { getImageUrl } from "@/utils/movies";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

interface CastCardProps {
  casts: Cast[];
}

const TvShowCastsSection: React.FC<CastCardProps> = ({ casts }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!casts || casts.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section id="casts" className="my-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-xl font-bold tracking-wide text-white md:text-2xl">
            Top Cast
          </h2>
          <span className="text-xs font-medium text-white/40">
            {casts.length} Actors
          </span>
        </div>

        {/* Scroll navigation arrows for desktop */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
            aria-label="Scroll left"
          >
            <IoChevronBack className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
            aria-label="Scroll right"
          >
            <IoChevronForward className="text-sm" />
          </button>
        </div>
      </div>

      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {casts.slice(0, 30).map((cast, index) => {
            const avatar = getImageUrl(cast.profile_path, "avatar");

            return (
              <div
                key={`${cast.id}-${index}`}
                className="group flex w-[110px] sm:w-[130px] shrink-0 snap-start flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-center transition-all duration-200 hover:border-white/25 hover:bg-white/[0.06]"
              >
                <div className="relative mb-2.5 h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10 transition-all duration-200 group-hover:ring-primary/60">
                  {cast.profile_path ? (
                    <img
                      className="h-full w-full object-cover"
                      src={avatar}
                      alt={cast.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/10 text-lg font-bold text-white/40">
                      {cast.name?.[0]}
                    </div>
                  )}
                </div>

                <p className="line-clamp-1 w-full text-xs sm:text-sm font-semibold text-white transition-colors group-hover:text-primary">
                  {cast.name}
                </p>
                <p className="line-clamp-1 mt-0.5 w-full text-[11px] sm:text-xs text-white/50">
                  {cast.character || "Cast"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TvShowCastsSection;

