"use client";

import React, { forwardRef, memo, useMemo, useState } from "react";
import { Season } from "tmdb-ts";
import { Grid, List, SortAlpha } from "@/utils/icons";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import dynamic from "next/dynamic";
import { cn } from "@/utils/helpers";
import { IoSearch, IoClose, IoChevronDown } from "react-icons/io5";

const TvShowEpisodesSelection = dynamic(() => import("./Episodes"));

interface Props {
  id: number;
  seasons: Season[];
}

const TvShowsSeasonsSelection = forwardRef<HTMLElement, Props>(({ id, seasons }, ref) => {
  const FILTERED_SEASONS = useMemo(() => {
    if (!seasons || seasons.length === 0) return [];
    const regular = seasons.filter((s) => s.season_number > 0);
    const specials = seasons.filter((s) => s.season_number === 0);
    return [...regular, ...specials];
  }, [seasons]);

  const [sortedByName, { toggle, close }] = useDisclosure(false);
  const [search, setSearch] = useState("");
  const [searchQuery] = useDebouncedValue(search, 300);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [seasonNumber, setSeasonNumber] = useState(() =>
    FILTERED_SEASONS[0]?.season_number.toString() || "1"
  );

  const selectedSeasonObj = useMemo(
    () =>
      FILTERED_SEASONS.find((s) => s.season_number.toString() === seasonNumber) ||
      FILTERED_SEASONS[0],
    [FILTERED_SEASONS, seasonNumber]
  );

  if (FILTERED_SEASONS.length === 0) return null;

  return (
    <section ref={ref} id="seasons-episodes" className="my-10 w-full scroll-mt-24">
      {/* Top Header & Interactive Toolbar */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              Episodes
            </h2>
            {selectedSeasonObj && (
              <span className="rounded-full bg-white/10 border border-white/15 px-3 py-0.5 text-xs font-bold text-white/90 backdrop-blur-sm">
                {selectedSeasonObj.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-white/50">
            {selectedSeasonObj?.episode_count
              ? `${selectedSeasonObj.episode_count} episodes available to stream`
              : "Browse and stream all available seasons and episodes"}
          </p>
        </div>

        {/* Toolbar: Search + Sort + Layout */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-60 md:w-64">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search episodes..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <IoClose className="text-sm" />
              </button>
            )}
          </div>

          {/* Sort Alphabetically Toggle */}
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border text-xs transition-all duration-200 active:scale-95 shrink-0",
              sortedByName
                ? "border-primary bg-primary text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                : "border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/20"
            )}
            title={sortedByName ? "Sorting alphabetically (A-Z)" : "Sort by episode title"}
            aria-label="Sort episodes"
          >
            <SortAlpha />
          </button>

          {/* Layout Toggle (List / Grid) */}
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setLayout("list")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all duration-200",
                layout === "list"
                  ? "bg-white text-black font-bold shadow-md scale-105"
                  : "text-white/60 hover:text-white"
              )}
              title="List layout"
              aria-label="List layout"
            >
              <List />
            </button>
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all duration-200",
                layout === "grid"
                  ? "bg-white text-black font-bold shadow-md scale-105"
                  : "text-white/60 hover:text-white"
              )}
              title="Grid layout"
              aria-label="Grid layout"
            >
              <Grid />
            </button>
          </div>
        </div>
      </div>

      {/* Season Chips Carousel */}
      <div className="mb-6 relative">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth snap-x">
          {FILTERED_SEASONS.map((s) => {
            const isSelected = s.season_number.toString() === seasonNumber;
            return (
              <button
                key={s.id || s.season_number}
                type="button"
                onClick={() => {
                  close();
                  setSearch("");
                  setSeasonNumber(s.season_number.toString());
                }}
                className={cn(
                  "group shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer select-none",
                  isSelected
                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.35)] scale-[1.02]"
                    : "bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 hover:border-white/20 active:scale-95"
                )}
              >
                <span>{s.name || `Season ${s.season_number}`}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-tight transition-colors",
                    isSelected
                      ? "bg-black/15 text-black"
                      : "bg-white/10 text-white/50 group-hover:text-white/80"
                  )}
                >
                  {s.episode_count} eps
                </span>
              </button>
            );
          })}

          {/* Quick Dropdown selector for series with many seasons */}
          {FILTERED_SEASONS.length > 5 && (
            <div className="relative shrink-0">
              <select
                aria-label="Jump to Season"
                value={seasonNumber}
                onChange={(e) => {
                  close();
                  setSearch("");
                  setSeasonNumber(e.target.value);
                }}
                className="appearance-none bg-white/[0.05] border border-white/15 text-white/90 text-xs font-semibold rounded-xl px-3 py-2.5 pr-8 hover:bg-white/10 transition-colors focus:outline-none focus:border-white/30 cursor-pointer"
              >
                {FILTERED_SEASONS.map((s) => (
                  <option
                    key={s.season_number}
                    value={s.season_number.toString()}
                    className="bg-neutral-900 text-white"
                  >
                    {s.name} ({s.episode_count} eps)
                  </option>
                ))}
              </select>
              <IoChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 text-xs" />
            </div>
          )}
        </div>
      </div>

      {/* Episodes Container (Natural page flow, no inner scroll trap) */}
      <div className="w-full">
        <TvShowEpisodesSelection
          id={id}
          seasonNumber={Number(seasonNumber)}
          filters={{ searchQuery, sortedByName, layout }}
        />
      </div>
    </section>
  );
});

TvShowsSeasonsSelection.displayName = "TvShowsSeasonsSelection";

export default memo(TvShowsSeasonsSelection);
