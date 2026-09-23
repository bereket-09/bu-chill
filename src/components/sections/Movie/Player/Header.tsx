"use client";

import React from "react";
import { cn } from "@/utils/helpers";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import EmbedServerDropdown from "@/components/ui/player/EmbedServerDropdown";
import { PlayersProps } from "@/types";

interface MoviePlayerHeaderProps {
  id: number;
  movieName: string;
  subtitle?: string;
  hidden?: boolean;
  servers: PlayersProps[];
  selectedSource: number;
  onSelectSource: (index: number) => void;
}

const MoviePlayerHeader: React.FC<MoviePlayerHeaderProps> = ({
  id,
  movieName,
  subtitle,
  hidden,
  servers,
  selectedSource,
  onSelectSource,
}) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-0 inset-x-0 z-40 flex w-full items-center justify-between px-4 sm:px-8 pt-5 sm:pt-6 pb-16 text-white transition-opacity duration-300",
        "bg-gradient-to-b from-black/85 via-black/30 to-transparent",
        { "opacity-0": hidden }
      )}
    >
      {/* Top-Left: Circular Back Button + Title & Subtitle */}
      <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 flex-1 min-w-0 mr-4">
        <Link
          href={`/movie/${id}`}
          className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-lg"
          aria-label="Back"
        >
          <IoArrowBack className="text-xl sm:text-2xl" />
        </Link>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-base sm:text-lg md:text-xl font-bold text-white leading-tight tracking-wide drop-shadow-md truncate">
            {movieName}
          </span>
          {subtitle && (
            <span className="text-xs sm:text-sm text-white/70 font-medium drop-shadow-md truncate mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Top-Right: Bingr Embed Server Tab Dropdown */}
      <div className="pointer-events-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <EmbedServerDropdown
          servers={servers}
          selectedSource={selectedSource}
          onSelectSource={onSelectSource}
        />
      </div>
    </div>
  );
};

export default MoviePlayerHeader;
