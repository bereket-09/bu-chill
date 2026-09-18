"use client";

import React from "react";
import Link from "next/link";
import SafeImage from "@/components/ui/other/SafeImage";
import { getImageUrl } from "@/utils/movies";
import { IoStar } from "react-icons/io5";

export interface BingrMediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv" | string;
  overview?: string;
}

interface BingrCardProps {
  item: BingrMediaItem;
  type?: "movie" | "tv";
  priority?: boolean;
}

export const BingrCard: React.FC<BingrCardProps> = ({ item, type, priority = false }) => {
  const mediaType = type || item.media_type || (item.first_air_date ? "tv" : "movie");
  const title = item.title || item.name || "Untitled";
  const date = item.release_date || item.first_air_date;
  const year = date ? new Date(date).getFullYear() : null;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const posterUrl = getImageUrl(item.poster_path || undefined, "poster");
  const href = `/${mediaType}/${item.id}`;

  return (
    <Link href={href} className="group flex flex-col w-full focus:outline-none select-none">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#16181f] ring-1 ring-white/10 transition-all duration-300 group-hover:scale-[1.03] group-hover:ring-white/30 group-hover:shadow-2xl group-hover:shadow-black/70">
        <SafeImage
          src={posterUrl}
          alt={title}
          fallbackTitle={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <span className="rounded bg-black/70 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 border border-white/10">
            HD
          </span>
        </div>

        {rating && parseFloat(rating) > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/70 backdrop-blur-md px-1.5 py-0.5 text-[11px] font-bold text-amber-400 border border-white/10">
            <IoStar className="w-3 h-3 fill-amber-400" />
            <span>{rating}</span>
          </div>
        )}

        {/* Gradient shadow overlay at bottom of poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Typography metadata below poster */}
      <div className="mt-2.5 flex flex-col">
        <h4 className="truncate text-[14px] font-semibold text-white/90 tracking-tight transition-colors group-hover:text-white">
          {title}
        </h4>
        <div className="flex items-center text-[12px] font-medium text-white/50 mt-0.5 gap-1.5">
          {year && <span>{year}</span>}
          {year && <span>•</span>}
          <span className="capitalize">{mediaType === "movie" ? "Movie" : "TV"}</span>
        </div>
      </div>
    </Link>
  );
};

export default BingrCard;
