"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { SportsMatch } from "@/services/sports";
import SportsMatchCard from "./SportsMatchCard";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

interface SportsTrayProps {
  title: string;
  icon?: React.ReactNode;
  matches: SportsMatch[];
}

export const SportsTray: React.FC<SportsTrayProps> = ({ title, icon, matches }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScroll, matches.length]);

  const handleScroll = (direction: -1 | 1) => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75 * direction;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!matches || matches.length === 0) return null;

  return (
    <section className="space-y-3.5 group select-none">
      {/* Tray Title Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-semibold text-white/40 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
              {matches.length}
            </span>
          </h3>
        </div>

        {/* Small desktop scroll arrows */}
        <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            disabled={!canScrollLeft}
            onClick={() => handleScroll(-1)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white transition-colors"
            aria-label="Scroll left"
          >
            <IoChevronBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!canScrollRight}
            onClick={() => handleScroll(1)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white transition-colors"
            aria-label="Scroll right"
          >
            <IoChevronForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="relative">
        {/* Left scroll overlay button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll(-1)}
            className="hidden sm:flex absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-black/90 via-black/50 to-transparent items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Scroll left"
          >
            <span className="p-2 rounded-full bg-black/70 border border-white/20 text-white shadow-xl">
              <IoChevronBack className="w-4 h-4" />
            </span>
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {matches.map((match) => (
            <div
              key={match.id}
              className="snap-start shrink-0 w-[270px] sm:w-[310px] md:w-[340px]"
            >
              <SportsMatchCard match={match} />
            </div>
          ))}
        </div>

        {/* Right scroll overlay button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll(1)}
            className="hidden sm:flex absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-black/90 via-black/50 to-transparent items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Scroll right"
          >
            <span className="p-2 rounded-full bg-black/70 border border-white/20 text-white shadow-xl">
              <IoChevronForward className="w-4 h-4" />
            </span>
          </button>
        )}
      </div>
    </section>
  );
};

export default SportsTray;
