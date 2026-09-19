"use client";

import React from "react";
import { cn } from "@/utils/helpers";
import Link from "next/link";
import { IoArrowBack, IoGridOutline } from "react-icons/io5";
import { MdSkipNext } from "react-icons/md";
import EmbedServerDropdown from "@/components/ui/player/EmbedServerDropdown";
import { PlayersProps } from "@/types";
import { Episode } from "tmdb-ts";

interface TvShowPlayerHeaderProps {
  id: number;
  seriesName: string;
  episode: Episode;
  hidden?: boolean;
  servers: PlayersProps[];
  selectedSource: number;
  onSelectSource: (index: number) => void;
  nextEpisodeNumber?: number | null;
  onOpenEpisodes?: () => void;
}

const TvShowPlayerHeader: React.FC<TvShowPlayerHeaderProps> = ({
  id,
  seriesName,
  episode,
  hidden,
  servers,
  selectedSource,
  onSelectSource,
  nextEpisodeNumber,
  onOpenEpisodes,
}) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-0 inset-x-0 z-40 flex w-full items-center justify-between px-4 sm:px-8 pt-3 sm:pt-4 pb-14 text-white transition-opacity duration-300",
        "bg-gradient-to-b from-black/85 via-black/30 to-transparent",
        { "opacity-0": hidden }
      )}
    >
      {/* Top-Left: Circular Back Button + Title & Episode Subtitle */}
      <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 flex-1 min-w-0 mr-4">
        <Link
          href={`/tv/${id}`}
          className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-lg"
          aria-label="Back"
        >
          <IoArrowBack className="text-xl sm:text-2xl" />
        </Link>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-base sm:text-lg md:text-xl font-bold text-white leading-tight tracking-wide drop-shadow-md truncate">
            {seriesName}
          </span>
          <span className="text-xs sm:text-sm text-white/70 font-medium drop-shadow-md truncate mt-0.5">
            S{episode.season_number} E{episode.episode_number} • {episode.name}
          </span>
        </div>
      </div>

      {/* Top-Right: Episodes Drawer + Next Episode + Bingr Embed Server Tab Dropdown */}
      <div className="pointer-events-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {onOpenEpisodes && (
          <button
            type="button"
            onClick={onOpenEpisodes}
            className="flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all text-xs sm:text-sm font-semibold border border-white/10 bg-black/40 backdrop-blur-md active:scale-95 shadow-lg select-none"
            aria-label="Open Episodes Drawer"
          >
            <IoGridOutline className="w-4 h-4 shrink-0 text-white/80" />
            <span className="hidden sm:inline">Episodes</span>
          </button>
        )}

        {nextEpisodeNumber && (
          <Link
            href={`/tv/${id}/${episode.season_number}/${nextEpisodeNumber}/player?src=${selectedSource}`}
            className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all text-xs sm:text-sm font-semibold border border-white/10 bg-black/40 backdrop-blur-md active:scale-95 shadow-lg select-none"
            aria-label="Next Episode"
          >
            <MdSkipNext className="w-4 h-4 shrink-0 text-white/90" />
            <span className="hidden sm:inline">Next Episode</span>
          </Link>
        )}

        <EmbedServerDropdown
          servers={servers}
          selectedSource={selectedSource}
          onSelectSource={onSelectSource}
        />
      </div>
    </div>
  );
};

export default TvShowPlayerHeader;
