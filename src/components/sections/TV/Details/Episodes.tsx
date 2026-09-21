"use client";

import React, { memo, useEffect, useState } from "react";
import { tmdb } from "@/api/tmdb";
import { cn, formatDate, isEmpty } from "@/utils/helpers";
import { getImageUrl, movieDurationString } from "@/utils/movies";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Episode } from "tmdb-ts/dist/types/tv-episode";
import SafeImage from "@/components/ui/other/SafeImage";
import { FaPlay, FaCheck, FaStar } from "react-icons/fa6";
import { formatTimeDisplay, getStoredProgress, WatchProgressItem } from "@/utils/watchProgress";

interface TvShowEpisodesSelectionProps {
  id: number;
  seasonNumber: number;
  filters?: {
    searchQuery?: string;
    sortedByName?: boolean;
    layout?: "list" | "grid";
  };
}

interface EpisodeCardProps {
  id: number;
  episode: Episode;
  order?: number;
}

const TvShowEpisodesSelection: React.FC<TvShowEpisodesSelectionProps> = ({
  id,
  seasonNumber,
  filters: { searchQuery, sortedByName, layout = "list" } = {},
}) => {
  const { data, isPending } = useQuery({
    queryFn: () => tmdb.tvShows.season(id, seasonNumber),
    queryKey: ["tv-show-episodes", id, seasonNumber],
  });

  // Modern skeleton placeholders while season data is loading
  if (isPending) {
    if (layout === "grid") {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3">
              <div className="aspect-video w-full rounded-xl bg-white/5" />
              <div className="mt-3 h-4 w-1/3 rounded bg-white/10" />
              <div className="mt-2 h-5 w-2/3 rounded bg-white/10" />
              <div className="mt-2 h-3 w-full rounded bg-white/5" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3.5 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 sm:p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]"
          >
            <div className="aspect-video w-full sm:w-48 md:w-56 shrink-0 rounded-xl bg-white/5" />
            <div className="flex-1 space-y-2.5 w-full py-1">
              <div className="h-4 w-1/4 rounded bg-white/10" />
              <div className="h-5 w-1/2 rounded bg-white/10" />
              <div className="h-3 w-3/4 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const EPISODES = data.episodes
    .filter((episode) =>
      searchQuery ? episode.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
    )
    .sort((a, b) => (sortedByName ? a.name.localeCompare(b.name) : 0));

  if (isEmpty(EPISODES)) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center">
        <p className="text-sm font-semibold text-white/70">No episodes found matching your search.</p>
        <p className="mt-1 text-xs text-white/40">Try searching with different terms or clear the filter.</p>
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {EPISODES.map((episode) => (
          <EpisodeGridCard key={episode.id} episode={episode} id={id} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {EPISODES.map((episode, index) => (
        <EpisodeListCard key={episode.id} episode={episode} order={index + 1} id={id} />
      ))}
    </div>
  );
};

export const EpisodeListCard: React.FC<EpisodeCardProps> = ({ episode, id }) => {
  const [progress, setProgress] = useState<WatchProgressItem | null>(null);

  useEffect(() => {
    setProgress(getStoredProgress("tv", id, episode.season_number, episode.episode_number));
  }, [id, episode.season_number, episode.episode_number]);

  const imageUrl = getImageUrl(episode.still_path);
  const isNotReleased = !episode.air_date || new Date(episode.air_date) > new Date();
  const href = !isNotReleased
    ? `/tv/${id}/${episode.season_number}/${episode.episode_number}/player`
    : undefined;

  const durationSeconds = progress?.duration || (episode.runtime ? episode.runtime * 60 : 0);
  const percentWatched =
    durationSeconds > 0 && progress?.currentTime
      ? Math.min(100, Math.round((progress.currentTime / durationSeconds) * 100))
      : 0;
  const isCompleted = percentWatched >= 90;
  const isPartiallyWatched = !isCompleted && (progress?.currentTime || 0) > 10;

  return (
    <Link
      href={href || "#"}
      className={cn(
        "group relative flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-5 p-3 sm:p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-xl",
        {
          "pointer-events-none opacity-45": isNotReleased,
        }
      )}
    >
      {/* 16:9 Thumbnail with Glass Badges and Progress Bar */}
      <div className="relative w-full sm:w-48 md:w-56 aspect-video rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10 group-hover:border-white/30 transition-colors">
        <SafeImage
          alt={episode.name}
          src={imageUrl}
          fallbackTitle={episode.name}
          fill
          sizes="(max-width: 640px) 100vw, 240px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />

        {/* Ambient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Centered Glowing Play Button on Hover */}
        {!isNotReleased && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-black opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 group-hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              <FaPlay className="h-3.5 w-3.5 ml-0.5 text-black" />
            </div>
          </div>
        )}

        {/* Top-Right Duration or Coming Soon badge */}
        <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white/90 backdrop-blur-md border border-white/10 shadow-sm">
          {isNotReleased ? "Coming Soon" : movieDurationString(episode.runtime)}
        </div>

        {/* Top-Left Episode Number or Watched Badge */}
        {isCompleted ? (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
            <FaCheck className="text-[9px]" /> Watched
          </div>
        ) : (
          <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-black bg-black/80 text-white backdrop-blur-md border border-white/10">
            EP {episode.episode_number}
          </div>
        )}

        {/* Bottom Watch Progress Bar */}
        {isPartiallyWatched && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20 z-20 overflow-hidden">
            <div
              className="h-full bg-primary shadow-[0_0_10px_rgba(234,179,8,0.9)] transition-all duration-300"
              style={{ width: `${percentWatched}%` }}
            />
          </div>
        )}
      </div>

      {/* Information & Details */}
      <div className="flex flex-1 flex-col justify-center min-w-0 pr-1">
        {/* Metadata Row: Episode tag • Air Date • Rating • Progress resume */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
          <span className="font-black text-primary uppercase tracking-wider text-[11px] sm:text-xs">
            Episode {episode.episode_number}
          </span>

          {episode.air_date && (
            <>
              <span className="text-white/20">•</span>
              <span className="text-white/40">{formatDate(episode.air_date, "en-US")}</span>
            </>
          )}

          {episode.vote_average > 0 && (
            <>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <FaStar className="text-[10px]" />
                {episode.vote_average.toFixed(1)}
              </span>
            </>
          )}

          {isPartiallyWatched && progress && (
            <>
              <span className="text-white/20">•</span>
              <span className="text-emerald-400 font-semibold text-[11px]">
                Resume ({formatTimeDisplay(progress.currentTime)})
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-white transition-colors group-hover:text-primary line-clamp-1">
          {episode.name}
        </h3>

        {/* Synopsis */}
        {episode.overview ? (
          <p className="mt-1 line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm text-white/55 leading-relaxed">
            {episode.overview}
          </p>
        ) : (
          <p className="mt-1 text-xs text-white/30 italic">No synopsis available.</p>
        )}
      </div>

      {/* Desktop Quick Play Pill */}
      {!isNotReleased && (
        <div className="hidden lg:flex items-center shrink-0 pr-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/80 group-hover:border-white group-hover:bg-white group-hover:text-black transition-all duration-300 text-xs font-bold shadow-sm group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <FaPlay className="text-[10px] ml-0.5" />
            <span>{isPartiallyWatched ? "Resume" : "Play"}</span>
          </div>
        </div>
      )}
    </Link>
  );
};

const EpisodeGridCard: React.FC<EpisodeCardProps> = ({ episode, id }) => {
  const [progress, setProgress] = useState<WatchProgressItem | null>(null);

  useEffect(() => {
    setProgress(getStoredProgress("tv", id, episode.season_number, episode.episode_number));
  }, [id, episode.season_number, episode.episode_number]);

  const imageUrl = getImageUrl(episode.still_path);
  const isNotReleased = !episode.air_date || new Date(episode.air_date) > new Date();
  const href = !isNotReleased
    ? `/tv/${id}/${episode.season_number}/${episode.episode_number}/player`
    : undefined;

  const durationSeconds = progress?.duration || (episode.runtime ? episode.runtime * 60 : 0);
  const percentWatched =
    durationSeconds > 0 && progress?.currentTime
      ? Math.min(100, Math.round((progress.currentTime / durationSeconds) * 100))
      : 0;
  const isCompleted = percentWatched >= 90;
  const isPartiallyWatched = !isCompleted && (progress?.currentTime || 0) > 10;

  return (
    <Link
      href={href || "#"}
      className={cn(
        "group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 p-3 shadow-sm hover:shadow-xl",
        {
          "pointer-events-none opacity-45": isNotReleased,
        }
      )}
    >
      {/* 16:9 Thumbnail */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10 group-hover:border-white/30 transition-colors mb-3">
        <SafeImage
          alt={episode.name}
          src={imageUrl}
          fallbackTitle={episode.name}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />

        {/* Ambient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Centered Glowing Play Button on Hover */}
        {!isNotReleased && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 group-hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              <FaPlay className="h-3.5 w-3.5 ml-0.5 text-black" />
            </div>
          </div>
        )}

        {/* Top-Right Duration or Coming Soon badge */}
        <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white/90 backdrop-blur-md border border-white/10 shadow-sm">
          {isNotReleased ? "Coming Soon" : movieDurationString(episode.runtime)}
        </div>

        {/* Top-Left Episode Number or Watched Badge */}
        {isCompleted ? (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
            <FaCheck className="text-[9px]" /> Watched
          </div>
        ) : (
          <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-black bg-black/80 text-white backdrop-blur-md border border-white/10">
            EP {episode.episode_number}
          </div>
        )}

        {/* Bottom Watch Progress Bar */}
        {isPartiallyWatched && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20 z-20 overflow-hidden">
            <div
              className="h-full bg-primary shadow-[0_0_10px_rgba(234,179,8,0.9)] transition-all duration-300"
              style={{ width: `${percentWatched}%` }}
            />
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-1 flex-col px-0.5">
        <div className="flex items-center gap-2 mb-1 text-xs">
          <span className="font-black text-primary uppercase tracking-wider text-[11px]">
            EP {episode.episode_number}
          </span>
          {episode.air_date && (
            <>
              <span className="text-white/20">•</span>
              <span className="text-white/40">{formatDate(episode.air_date, "en-US")}</span>
            </>
          )}
          {episode.vote_average > 0 && (
            <>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <FaStar className="text-[10px]" />
                {episode.vote_average.toFixed(1)}
              </span>
            </>
          )}
        </div>

        <h3 className="line-clamp-1 text-sm sm:text-base font-bold text-white transition-colors group-hover:text-primary mb-1">
          {episode.name}
        </h3>

        {episode.overview && (
          <p className="line-clamp-2 text-xs text-white/50 leading-relaxed" title={episode.overview}>
            {episode.overview}
          </p>
        )}
      </div>
    </Link>
  );
};

export default memo(TvShowEpisodesSelection);

