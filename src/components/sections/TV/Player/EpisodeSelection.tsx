"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Episode, Season } from "tmdb-ts";
import { tmdb } from "@/api/tmdb";
import { useQuery } from "@tanstack/react-query";
import { formatDate, cn } from "@/utils/helpers";
import { getImageUrl, movieDurationString } from "@/utils/movies";
import { getStoredProgress } from "@/utils/watchProgress";
import SafeImage from "@/components/ui/other/SafeImage";
import { Select, SelectItem, Spinner, Input } from "@heroui/react";
import { IoClose, IoPlay, IoSearchOutline, IoRadio } from "react-icons/io5";
import { FaPlay } from "react-icons/fa6";

interface TvShowPlayerEpisodeSelectionProps {
  id: number;
  opened: boolean;
  onClose: () => void;
  episodes: Episode[];
  seriesName?: string;
  currentSeasonNumber?: number;
  currentEpisodeNumber?: number;
  seasons?: Season[];
  selectedSource?: number;
}

const TvShowPlayerEpisodeSelection: React.FC<TvShowPlayerEpisodeSelectionProps> = ({
  id,
  opened,
  onClose,
  episodes: initialEpisodes,
  seriesName = "Series Episodes",
  currentSeasonNumber = 1,
  currentEpisodeNumber,
  seasons = [],
  selectedSource = 0,
}) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(currentSeasonNumber);
  const [searchQuery, setSearchQuery] = useState("");

  // Clean valid seasons (filter out season 0 specials if desired, or keep them)
  const validSeasons = useMemo(() => {
    if (!seasons || seasons.length === 0) return [];
    return seasons.filter((s) => s.season_number > 0);
  }, [seasons]);

  // Query episodes if user switched season from the initial one
  const isCurrentSeason = selectedSeason === currentSeasonNumber;
  const { data: fetchedSeasonData, isLoading: isFetchingSeason } = useQuery({
    queryKey: ["tv-player-season-episodes", id, selectedSeason],
    queryFn: () => tmdb.tvShows.season(id, selectedSeason),
    enabled: opened && !isCurrentSeason,
    staleTime: 1000 * 60 * 15,
  });

  const activeEpisodes = isCurrentSeason
    ? initialEpisodes
    : fetchedSeasonData?.episodes || [];

  // Filter episodes by search
  const filteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) return activeEpisodes;
    const q = searchQuery.toLowerCase();
    return activeEpisodes.filter(
      (ep) =>
        ep.name.toLowerCase().includes(q) ||
        `e${ep.episode_number}`.includes(q) ||
        `episode ${ep.episode_number}`.includes(q)
    );
  }, [activeEpisodes, searchQuery]);

  if (!opened) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in select-none">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Drawer */}
      <div className="relative z-10 w-full sm:max-w-md md:max-w-lg lg:max-w-xl h-full bg-neutral-950/95 border-l border-white/10 shadow-2xl flex flex-col backdrop-blur-2xl text-white transform transition-transform duration-300 ease-out">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col gap-3 shrink-0 bg-neutral-900/40">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary truncate">
                {seriesName}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Episodes
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
              aria-label="Close Episodes Drawer"
            >
              <IoClose className="w-6 h-6" />
            </button>
          </div>

          {/* Season Switcher Dropdown & Quick Search */}
          <div className="flex items-center gap-2.5">
            {validSeasons.length > 1 ? (
              <div className="w-44 shrink-0">
                <Select
                  aria-label="Select Season"
                  selectedKeys={[String(selectedSeason)]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) setSelectedSeason(val);
                  }}
                  size="sm"
                  variant="bordered"
                  className="w-full text-xs"
                >
                  {validSeasons.map((s) => (
                    <SelectItem key={String(s.season_number)} textValue={s.name}>
                      {s.name} ({s.episode_count} eps)
                    </SelectItem>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 shrink-0">
                Season {selectedSeason}
              </div>
            )}

            <Input
              placeholder="Search episode..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              size="sm"
              variant="bordered"
              startContent={<IoSearchOutline className="text-white/40 w-4 h-4 shrink-0" />}
              isClearable
              onClear={() => setSearchQuery("")}
              className="flex-1 text-xs"
            />
          </div>
        </div>

        {/* Episodes Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 custom-scrollbar">
          {isFetchingSeason ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Spinner size="lg" color="primary" />
              <p className="text-xs text-white/50">Loading Season {selectedSeason} episodes...</p>
            </div>
          ) : filteredEpisodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <p className="text-sm font-semibold text-white/70">No episodes found</p>
              <p className="text-xs text-white/40 mt-1">Try adjusting your search query.</p>
            </div>
          ) : (
            filteredEpisodes.map((ep) => {
              const isCurrent =
                selectedSeason === currentSeasonNumber &&
                ep.episode_number === currentEpisodeNumber;

              const isNotReleased = !ep.air_date || new Date(ep.air_date) > new Date();
              const imageUrl = getImageUrl(ep.still_path);
              const progress = getStoredProgress("tv", id, ep.season_number, ep.episode_number);

              return (
                <Link
                  key={ep.id}
                  href={
                    isNotReleased
                      ? "#"
                      : `/tv/${id}/${ep.season_number}/${ep.episode_number}/player?src=${selectedSource}`
                  }
                  onClick={(e) => {
                    if (isNotReleased) {
                      e.preventDefault();
                      return;
                    }
                    onClose();
                  }}
                  className={cn(
                    "group relative flex gap-3.5 p-3 rounded-2xl border transition-all duration-200 overflow-hidden select-none",
                    isCurrent
                      ? "border-primary/60 bg-primary/10 shadow-[0_0_25px_rgba(229,9,20,0.2)] ring-1 ring-primary/40"
                      : "border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.06]",
                    isNotReleased && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {/* Left: 16:9 Thumbnail */}
                  <div className="relative w-32 sm:w-36 aspect-video rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                    <SafeImage
                      alt={ep.name}
                      src={imageUrl}
                      fallbackTitle={ep.name}
                      fill
                      sizes="150px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />

                    {/* Play Hover Overlay / Active Pulse */}
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center transition-opacity",
                        isCurrent
                          ? "bg-black/40 opacity-100"
                          : "bg-black/50 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {isCurrent ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                          <IoRadio className="w-3 h-3" />
                          <span>Playing</span>
                        </div>
                      ) : !isNotReleased ? (
                        <div className="size-8 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/40 text-white shadow-lg">
                          <FaPlay className="w-3 h-3 ml-0.5" />
                        </div>
                      ) : null}
                    </div>

                    {/* Runtime Pill */}
                    <div className="absolute top-1.5 right-1.5 z-20 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white/90 backdrop-blur-md border border-white/10">
                      {isNotReleased ? "Soon" : movieDurationString(ep.runtime)}
                    </div>

                    {/* Episode Badge Pill */}
                    <div className="absolute bottom-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded text-[10px] font-black bg-black/85 text-white backdrop-blur-md border border-white/10">
                      E{ep.episode_number}
                    </div>

                    {/* Watch Progress Bar */}
                    {progress && progress.percentage > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-20">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right: Episode Details */}
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          isCurrent ? "text-primary" : "text-white/60"
                        )}
                      >
                        Episode {ep.episode_number}
                      </span>
                      {ep.air_date && (
                        <>
                          <span className="text-white/20 text-xs">•</span>
                          <span className="text-xs text-white/40">
                            {formatDate(ep.air_date, "en-US")}
                          </span>
                        </>
                      )}
                    </div>

                    <h3
                      className={cn(
                        "text-sm font-bold truncate leading-tight transition-colors",
                        isCurrent
                          ? "text-primary font-black"
                          : "text-white group-hover:text-primary"
                      )}
                      title={ep.name}
                    >
                      {ep.name}
                    </h3>

                    {ep.overview && (
                      <p
                        className="mt-1 text-xs text-white/50 line-clamp-2 leading-relaxed"
                        title={ep.overview}
                      >
                        {ep.overview}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 text-center text-xs text-white/40 bg-neutral-900/30">
          Showing {filteredEpisodes.length} of {activeEpisodes.length} episodes
        </div>
      </div>
    </div>
  );
};

export default TvShowPlayerEpisodeSelection;
