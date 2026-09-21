"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppendToResponse } from "tmdb-ts/dist/types/options";
import { TvShowDetails } from "tmdb-ts/dist/types/tv-shows";
import { cn } from "@/utils/helpers";
import { getImageUrl, mutateTvShowTitle } from "@/utils/movies";
import { SavedMovieDetails } from "@/types/movie";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { FaPlay, FaPause, FaListUl } from "react-icons/fa6";
import BookmarkButton from "@/components/ui/button/BookmarkButton";
import ShareButton from "@/components/ui/button/ShareButton";
import Trailer from "@/components/ui/overlay/Trailer";
import { ArrowLeft } from "@/utils/icons";
import { WatchProgressItem, formatTimeDisplay } from "@/utils/watchProgress";
import { siteConfig } from "@/config/site";

interface TvDetailHeroProps {
  tv: AppendToResponse<TvShowDetails, ("images" | "videos")[], "tvShow">;
  onViewEpisodesClick?: () => void;
}

export const TvDetailHero: React.FC<TvDetailHeroProps> = ({ tv, onViewEpisodesClick }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [savedProgress, setSavedProgress] = useState<WatchProgressItem | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Compute first available season & episode
  const availableSeasons = tv.seasons?.filter((s) => s.season_number > 0) || [];
  const firstSeasonNumber = availableSeasons.length > 0 ? availableSeasons[0].season_number : 1;
  const firstEpisodeNumber = 1;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let latestProgress: WatchProgressItem | null = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`cinextma_watch_tv_${tv.id}_`)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || "") as WatchProgressItem;
            if (item && item.currentTime > 10) {
              if (!latestProgress || (item.updatedAt || 0) > (latestProgress.updatedAt || 0)) {
                latestProgress = item;
              }
            }
          } catch {
            // ignore
          }
        }
      }
      setSavedProgress(latestProgress);
    } catch {
      // ignore
    }
  }, [tv.id]);

  const currentPlaySeason = savedProgress?.season ?? firstSeasonNumber;
  const currentPlayEpisode = savedProgress?.episode ?? firstEpisodeNumber;
  const title = mutateTvShowTitle(tv);

  useEffect(() => {
    if (typeof document !== "undefined" && title) {
      document.title = `${title} · ${siteConfig.name}`;
    }
  }, [title]);

  const firstYear = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : null;
  const lastYear = tv.last_air_date ? new Date(tv.last_air_date).getFullYear() : null;
  const releaseYears = firstYear
    ? `${firstYear}${lastYear && lastYear !== firstYear ? ` - ${lastYear}` : ""}`
    : null;

  const rating = tv.vote_average ? tv.vote_average.toFixed(1) : null;
  const voteCountFormatted = tv.vote_count
    ? tv.vote_count >= 1000
      ? `${(tv.vote_count / 1000).toFixed(1)}k`
      : `${tv.vote_count}`
    : null;

  // TMDB logo finder
  const logo = tv.images?.logos?.find(
    (l) => l.iso_639_1 === "en" || !l.iso_639_1
  )?.file_path;

  // Trailer finder
  const trailerKey = tv.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  )?.key;

  const backdropUrl = tv.backdrop_path
    ? `https://image.tmdb.org/t/p/original${tv.backdrop_path}`
    : getImageUrl(tv.poster_path, "backdrop", true);

  const bookmarkData: SavedMovieDetails = {
    type: "tv",
    adult: "adult" in tv ? (tv.adult as boolean) : false,
    backdrop_path: tv.backdrop_path,
    id: tv.id,
    poster_path: tv.poster_path,
    release_date: tv.first_air_date,
    title,
    vote_average: tv.vote_average,
    saved_date: new Date().toISOString(),
  };

  const toggleAudio = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      const command = isMuted ? "unMute" : "mute";
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: command, args: [] }),
        "*"
      );
      setIsMuted(!isMuted);
    }
  };

  const togglePlayback = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      const command = isPlaying ? "pauseVideo" : "playVideo";
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: command, args: [] }),
        "*"
      );
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative h-[75vh] min-h-[540px] w-full overflow-hidden bg-black text-white lg:h-[85vh]">
      {/* Top Floating Back Button */}
      <div className="absolute top-4 left-4 z-40 md:top-7 md:left-24 lg:left-28">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/80 active:scale-95 shadow-lg"
          aria-label="Back to Home"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>

      {/* High-Resolution Static Backdrop with Ambient Motion */}
      {backdropUrl && (
        <Image
          src={backdropUrl}
          alt={title}
          fill
          priority
          unoptimized
          sizes="100vw"
          className={cn(
            "object-cover object-center transition-opacity duration-1000 ease-in-out",
            isVideoLoaded && isPlaying ? "opacity-0" : "opacity-100 scale-105"
          )}
        />
      )}

      {/* Autoplaying Ambient Background Video */}
      {trailerKey && (
        <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`}
            allow="autoplay; encrypted-media"
            onLoad={() => setIsVideoLoaded(true)}
            className={cn(
              "absolute top-1/2 left-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 object-cover transition-opacity duration-1000",
              isVideoLoaded && isPlaying ? "opacity-100" : "opacity-0"
            )}
            title={`${title} Ambient Trailer`}
          />
        </div>
      )}

      {/* Vignette Gradients for Legibility & Seamless Content Transition */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent w-full md:w-3/4" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent" />

      {/* Video & Audio Controls - Top Right on Mobile, Bottom Right on Desktop */}
      {trailerKey && isVideoLoaded && (
        <div className="pointer-events-auto absolute right-4 top-4 z-30 flex items-center gap-2 md:top-auto md:right-12 md:bottom-20 md:gap-3">
          <button
            type="button"
            onClick={toggleAudio}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95 shadow-lg"
            aria-label={isMuted ? "Unmute trailer" : "Mute trailer"}
          >
            {isMuted ? (
              <IoVolumeMute className="text-lg sm:text-xl" />
            ) : (
              <IoVolumeHigh className="text-lg sm:text-xl text-primary" />
            )}
          </button>

          <button
            type="button"
            onClick={togglePlayback}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95 shadow-lg"
            aria-label={isPlaying ? "Pause trailer" : "Play trailer"}
          >
            {isPlaying ? (
              <FaPause className="text-xs sm:text-sm" />
            ) : (
              <FaPlay className="text-xs sm:text-sm translate-x-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Bottom TV Show Showcase Overlay */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end px-4 pb-8 sm:px-8 sm:pb-12 md:pl-24 lg:pl-28 md:pb-20">
        <div className="pointer-events-auto max-w-2xl animate-in slide-in-from-bottom-6 duration-700">
          {/* TV Show Logo or Stylized Title */}
          <div className="mb-3 sm:mb-4 transition-transform duration-500">
            {logo ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${logo}`}
                alt={title}
                className="max-h-[50px] sm:max-h-[85px] md:max-h-[130px] w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-6xl">
                {title}
              </h1>
            )}
          </div>

          {/* Metadata Row: Badge • Rating • Year • Seasons • Episodes */}
          <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm md:text-base font-medium text-white/90">
            <span className="rounded bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] sm:text-xs font-black text-primary uppercase tracking-wider shadow-sm">
              TV Series
            </span>

            {rating && (
              <span className="flex items-center font-bold text-white">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="#f59e0b"
                  className="mr-1 inline-block"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {rating}
                {voteCountFormatted && (
                  <span className="text-xs text-white/50 ml-1 font-normal">({voteCountFormatted})</span>
                )}
                <span className="ml-2 text-white/40">•</span>
              </span>
            )}

            {releaseYears && (
              <span className="flex items-center">
                {releaseYears}
                <span className="ml-2 text-white/40">•</span>
              </span>
            )}

            {tv.number_of_seasons > 0 && (
              <span className="flex items-center text-white/90">
                {tv.number_of_seasons} {tv.number_of_seasons === 1 ? "Season" : "Seasons"}
                {tv.number_of_episodes > 0 && (
                  <>
                    <span className="ml-2 text-white/40">•</span>
                    <span className="ml-2">{tv.number_of_episodes} Episodes</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Plot Overview */}
          {tv.overview && (
            <p className="mb-4 sm:mb-5 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 max-w-xl text-xs sm:text-sm md:text-base leading-relaxed text-white/80 font-normal drop-shadow">
              {tv.overview}
            </p>
          )}

          {/* Genres with Pipe Dividers */}
          {tv.genres && tv.genres.length > 0 && (
            <div className="mb-4 sm:mb-6 flex flex-wrap items-center text-xs sm:text-sm font-semibold text-white/90">
              {tv.genres.map((genre, idx) => (
                <span key={genre.id} className="flex items-center">
                  {idx > 0 && <span className="mx-2 text-white/30 font-normal">|</span>}
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            {/* Primary Watch / Resume Pill Button */}
            <Link
              href={`/tv/${tv.id}/${currentPlaySeason}/${currentPlayEpisode}/player`}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-200 hover:scale-105 hover:bg-white/90 active:scale-95"
            >
              <FaPlay className="ml-0.5 text-xs sm:text-sm text-black" />
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-black">
                  {savedProgress && savedProgress.currentTime > 10
                    ? `Resume S${currentPlaySeason} E${currentPlayEpisode}`
                    : `Watch S${firstSeasonNumber} E${firstEpisodeNumber}`}
                </span>
                {savedProgress && savedProgress.currentTime > 10 && (
                  <span className="text-[10px] font-semibold text-emerald-700">
                    ({formatTimeDisplay(savedProgress.currentTime)})
                  </span>
                )}
              </div>
            </Link>

            {/* View Episodes Scroll Button */}
            {onViewEpisodesClick && (
              <button
                type="button"
                onClick={onViewEpisodesClick}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 active:scale-95 shadow-lg"
              >
                <FaListUl className="text-primary text-xs sm:text-sm" />
                <span>Episodes</span>
              </button>
            )}

            {/* Watch Trailer Modal Trigger */}
            <Trailer videos={tv.videos?.results || []} />

            {/* Bookmark / Watchlist */}
            <BookmarkButton data={bookmarkData} />

            {/* Share */}
            <ShareButton id={tv.id} title={title} type="tv" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TvDetailHero;
