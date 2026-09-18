"use client";

import React, { useRef } from "react";
import Link from "next/link";
import BingrCard, { BingrMediaItem } from "@/components/ui/card/BingrCard";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

interface BingrTrayProps {
  title: string;
  items: BingrMediaItem[];
  type?: "movie" | "tv";
  seeAllHref?: string;
  isLoading?: boolean;
}

export const BingrTray: React.FC<BingrTrayProps> = ({
  title,
  items,
  type,
  seeAllHref,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const distance = containerRef.current.clientWidth * 0.75;
    containerRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  if (!isLoading && (!items || items.length === 0)) return null;

  return (
    <section className="relative group/tray py-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[17px] sm:text-[20px] font-bold text-white tracking-tight">
          {title}
        </h3>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-[13px] font-semibold text-white/40 hover:text-white transition-colors"
          >
            See All
          </Link>
        )}
      </div>

      {/* Floating Prev / Next Navigation Arrows */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-black/80 hover:bg-black text-white/80 hover:text-white border border-white/10 shadow-xl opacity-0 group-hover/tray:opacity-100 transition-opacity"
      >
        <IoChevronBack className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-black/80 hover:bg-black text-white/80 hover:text-white border border-white/10 shadow-xl opacity-0 group-hover/tray:opacity-100 transition-opacity"
      >
        <IoChevronForward className="w-5 h-5" />
      </button>

      {/* Horizontal Scrolling Items */}
      <div
        ref={containerRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 pt-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="w-[140px] sm:w-[170px] md:w-[190px] shrink-0"
          >
            <BingrCard item={item} type={type} priority={idx < 5} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default BingrTray;
