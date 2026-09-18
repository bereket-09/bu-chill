"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import SafeImage from "@/components/ui/other/SafeImage";
import { IoChevronForward, IoChevronBack } from "react-icons/io5";
import { CategoryItem } from "@/services/categories";
import { cn } from "@/utils/helpers";

interface CategoryTrayProps {
  title: string;
  items: CategoryItem[];
  className?: string;
  onSelect?: (item: CategoryItem) => void;
  onViewAll?: () => void;
}

export const CategoryTray: React.FC<CategoryTrayProps> = ({
  title,
  items,
  className,
  onSelect,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll, items.length]);

  const scrollByAmount = (direction: -1 | 1) => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75 * direction;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <div className={cn("w-full relative mb-8 sm:mb-10", className)}>
      {/* Header with Title and optional View All link */}
      <div className="flex items-center justify-between mb-3.5 px-4 md:px-0">
        <h2 className="text-[17px] sm:text-[20px] md:text-[22px] font-extrabold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/50 hover:text-white transition-colors group cursor-pointer"
          >
            <span>View All</span>
            <IoChevronForward className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        )}
      </div>

      {/* Tray container with left/right scroll controls */}
      <div className="relative group/tray">
        {/* Left Arrow */}
        <button
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll left"
          className={cn(
            "absolute left-0 top-0 bottom-0 z-30 w-12 sm:w-16 bg-gradient-to-r from-black/90 via-black/50 to-transparent flex items-center justify-start pl-2 transition-opacity duration-300",
            canScrollLeft ? "opacity-0 group-hover/tray:opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg shadow-black">
            <IoChevronBack className="w-5 h-5 -translate-x-0.5" />
          </div>
        </button>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-3 sm:gap-4 py-2 px-4 md:px-0 scrollbar-none scroll-smooth snap-x"
        >
          {items.map((item) => (
            <button
              key={item.title}
              onClick={() => onSelect?.(item)}
              className="flex-none snap-start group/card relative rounded-xl overflow-hidden bg-[#16181f] border border-white/5 hover:border-white/25 hover:shadow-xl hover:shadow-black/60 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] text-left cursor-pointer w-[160px] sm:w-[210px] md:w-[250px] lg:w-[280px] aspect-[16/9]"
            >
              <SafeImage
                src={item.image}
                alt={item.title}
                fallbackTitle={item.title}
                fill
                sizes="(max-width: 768px) 210px, 280px"
                className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                unoptimized
              />

              {/* Gradient Vignette & Text Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3.5 sm:p-4">
                <span className="text-white font-bold text-sm sm:text-base tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/card:text-primary transition-colors">
                  {item.title}
                </span>
              </div>

              {/* Hover Highlight Glow */}
              <div className="absolute inset-0 bg-white/0 group-hover/card:bg-white/5 transition-colors duration-300 pointer-events-none" />
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll right"
          className={cn(
            "absolute right-0 top-0 bottom-0 z-30 w-12 sm:w-16 bg-gradient-to-l from-black/90 via-black/50 to-transparent flex items-center justify-end pr-2 transition-opacity duration-300",
            canScrollRight ? "opacity-0 group-hover/tray:opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg shadow-black">
            <IoChevronForward className="w-5 h-5 translate-x-0.5" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default CategoryTray;
