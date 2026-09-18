"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppendToResponse } from "tmdb-ts/dist/types/options";
import { TvShowDetails } from "tmdb-ts/dist/types/tv-shows";
import { cn } from "@/utils/helpers";
import { getImageUrl, mutateTvShowTitle } from "@/utils/movies";
import { getTvShowPlayers } from "@/utils/players";
import { SavedMovieDetails } from "@/types/movie";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { FaPlay, FaPause, FaServer, FaListUl } from "react-icons/fa6";
import BookmarkButton from "@/components/ui/button/BookmarkButton";
import ShareButton from "@/components/ui/button/ShareButton";
import Trailer from "@/components/ui/overlay/Trailer";
import ServerSelectionModal from "@/components/ui/overlay/ServerSelectionModal";
import { ArrowLeft } from "@/utils/icons";
import { WatchProgressItem, formatTimeDisplay } from "@/utils/watchProgress";
import { siteConfig } from "@/config/site";

interface TvDetailHeroProps {
  tv: AppendToResponse<TvShowDetails, ("images" | "videos")[], "tvShow">;
  onViewEpisodesClick?: () => void;
}

export const TvDetailHero: React.FC<TvDetailHeroProps> = ({ tv, onViewEpisodesClick }) => {
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
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
  const players = getTvShowPlayers(tv.id, currentPlaySeason, currentPlayEpisode);
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

      {/* Bottom-Right Video & Audio Controls */}
      {trailerKey && isVideoLoaded && (
        <div className="pointer-events-auto absolute right-6 bottom-12 z-30 flex items-center gap-3 md:right-12 md:bottom-20">
          <button
            type="button"
            onClick={toggleAudio}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95 shadow-lg"
            aria-label={isMuted ? "Unmute trailer" : "Mute trailer"}
          >
            {isMuted ? (
              <IoVolumeMute className="text-xl" />
            ) : (
              <IoVolumeHigh className="text-xl text-primary" />
            )}
          </button>

          <button
            type="button"
            onClick={togglePlayback}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95 shadow-lg"
            aria-label={isPlaying ? "Pause trailer" : "Play trailer"}
          >
            {isPlaying ? (
              <FaPause className="text-sm" />
            ) : (
              <FaPlay className="text-sm translate-x-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Bottom-Left TV Show Showcase Overlay */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end px-4 pb-12 sm:px-8 md:pl-24 lg:pl-28 md:pb-20">
        <div className="pointer-events-auto max-w-2xl animate-in slide-in-from-bottom-6 duration-700">
          {/* TV Show Logo or Stylized Title */}
          <div className="mb-4 transition-transform duration-500">
            {logo ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${logo}`}
                alt={title}
                className="max-h-[65px] sm:max-h-[95px] md:max-h-[130px] w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
                {title}
              </h1>
            )}
          </div>

          {/* Metadata Row: Badge • Rating • Year • Seasons • Episodes */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm sm:text-base font-medium text-white/90">
            <span className="rounded bg-primary/20 border border-primary/40 px-2 py-0.5 text-xs font-black text-primary uppercase tracking-wider shadow-sm">
              TV Series
            </span>

            {rating && (
              <span className="flex items-center font-bold text-white">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="#f59e0b"
                  className="mr-1.5 inline-block"
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
            <p className="mb-5 line-clamp-3 max-w-xl text-sm leading-relaxed text-white/80 font-normal sm:text-base md:line-clamp-4 drop-shadow">
              {tv.overview}
            </p>
          )}

          {/* Genres with Pipe Dividers */}
          {tv.genres && tv.genres.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center text-xs sm:text-sm font-semibold text-white/90">
              {tv.genres.map((genre, idx) => (
                <span key={genre.id} className="flex items-center">
                  {idx > 0 && <span className="mx-2 text-white/30 font-normal">|</span>}
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Primary Watch / Resume Button */}
            <Link
              href={`/tv/${tv.id}/${currentPlaySeason}/${currentPlayEpisode}/player`}
              className="flex items-center gap-3 group/play focus:outline-none"
            >
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-[#f9f9f9] text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 group-hover/play:scale-105 group-hover/play:bg-white active:scale-95">
                <FaPlay className="ml-1 text-lg sm:text-xl text-black" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-base sm:text-[17px] font-bold text-white leading-tight group-hover/play:text-primary transition-colors">
                  {savedProgress && savedProgress.currentTime > 10
                    ? `Resume S${currentPlaySeason} E${currentPlayEpisode}`
                    : `Watch S${firstSeasonNumber} E${firstEpisodeNumber}`}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold tracking-wider uppercase",
                    savedProgress && savedProgress.currentTime > 10
                      ? "text-emerald-400"
                      : "text-white/50"
                  )}
                >
                  {savedProgress && savedProgress.currentTime > 10
                    ? `${formatTimeDisplay(savedProgress.currentTime)} watched`
                    : "Episode 1"}
                </span>
              </div>
            </Link>

            {/* View Episodes Scroll Button */}
            {onViewEpisodesClick && (
              <button
                type="button"
                onClick={onViewEpisodesClick}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 active:scale-95 shadow-lg"
              >
                <FaListUl className="text-primary text-sm" />
                <span>Episodes</span>
              </button>
            )}

            {/* Select Server Button */}
            <button
              type="button"
              onClick={() => setIsServerModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 active:scale-95 shadow-lg"
            >
              <FaServer className="text-primary text-sm" />
              <span>Select Server</span>
            </button>

            {/* Watch Trailer Modal Trigger */}
            <Trailer videos={tv.videos?.results || []} />

            {/* Bookmark / Watchlist */}
            <BookmarkButton data={bookmarkData} />

            {/* Share */}
            <ShareButton id={tv.id} title={title} type="tv" />
          </div>
        </div>
      </div>

      {/* Bingr-style Server Selection Modal */}
      <ServerSelectionModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        tvId={tv.id}
        season={currentPlaySeason}
        episode={currentPlayEpisode}
        players={players}
        title={`Stream ${title} S${currentPlaySeason}E${currentPlayEpisode}`}
      />
    </div>
  );
};

export default TvDetailHero;
