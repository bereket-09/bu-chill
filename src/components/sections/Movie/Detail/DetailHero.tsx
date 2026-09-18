"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppendToResponse } from "tmdb-ts/dist/types/options";
import { MovieDetails } from "tmdb-ts/dist/types/movies";
import { cn } from "@/utils/helpers";
import { getImageUrl, movieDurationString, mutateMovieTitle } from "@/utils/movies";
import { getMoviePlayers } from "@/utils/players";
import { SavedMovieDetails } from "@/types/movie";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { FaPlay, FaPause, FaServer } from "react-icons/fa6";
import BookmarkButton from "@/components/ui/button/BookmarkButton";
import ShareButton from "@/components/ui/button/ShareButton";
import Trailer from "@/components/ui/overlay/Trailer";
import ServerSelectionModal from "@/components/ui/overlay/ServerSelectionModal";
import { ArrowLeft } from "@/utils/icons";

import { getStoredProgress, formatTimeDisplay, WatchProgressItem } from "@/utils/watchProgress";
import { siteConfig } from "@/config/site";

interface DetailHeroProps {
  movie: AppendToResponse<MovieDetails, ("images" | "videos")[], "movie">;
}

export const DetailHero: React.FC<DetailHeroProps> = ({ movie }) => {
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [savedProgress, setSavedProgress] = useState<WatchProgressItem | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setSavedProgress(getStoredProgress("movie", movie.id));
  }, [movie.id]);

  const players = getMoviePlayers(movie.id);
  const title = mutateMovieTitle(movie);

  useEffect(() => {
    if (typeof document !== "undefined" && title) {
      document.title = `${title} · ${siteConfig.name}`;
    }
  }, [title]);
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const runtime = movieDurationString(movie.runtime);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const certification = movie.adult ? "18+" : "PG-13";

  // TMDB logo finder
  const logo = movie.images?.logos?.find(
    (l) => l.iso_639_1 === "en" || !l.iso_639_1
  )?.file_path;

  // Trailer finder
  const trailerKey = movie.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  )?.key;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : getImageUrl(movie.poster_path, "backdrop", true);

  const bookmarkData: SavedMovieDetails = {
    type: "movie",
    adult: movie.adult,
    backdrop_path: movie.backdrop_path,
    id: movie.id,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    title,
    vote_average: movie.vote_average,
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
    <div className="relative h-[72vh] min-h-[520px] w-full overflow-hidden bg-black text-white lg:h-[85vh]">
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

      {/* Vignette Gradients for Text Legibility & Seamless Blending */}
      {/* Left to right dark vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent w-full md:w-3/4" />

      {/* Bottom to top gradient melting into content sections */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Top subtle shadow */}
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

      {/* Bottom-Left Movie Showcase Overlay */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end px-4 pb-12 sm:px-8 md:pl-24 lg:pl-28 md:pb-20">
        <div className="pointer-events-auto max-w-2xl animate-in slide-in-from-bottom-6 duration-700">
          {/* Movie Logo or Stylized Title */}
          <div className="mb-4 transition-transform duration-500">
            {logo ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${logo}`}
                alt={title}
                className="max-h-[60px] sm:max-h-[90px] md:max-h-[120px] w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
                {title}
              </h1>
            )}
          </div>

          {/* Metadata Row: Rating • Year • Certification • Runtime */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm sm:text-base font-medium text-white/90">
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
                <span className="ml-2 text-white/40">•</span>
              </span>
            )}

            {releaseYear && (
              <span className="flex items-center">
                {releaseYear}
                <span className="ml-2 text-white/40">•</span>
              </span>
            )}

            <span className="flex items-center">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-white/90">
                {certification}
              </span>
              <span className="ml-2 text-white/40">•</span>
            </span>

            {runtime && <span>{runtime}</span>}
          </div>

          {/* Plot Overview */}
          {movie.overview && (
            <p className="mb-5 line-clamp-3 max-w-xl text-sm leading-relaxed text-white/80 font-normal sm:text-base md:line-clamp-4 drop-shadow">
              {movie.overview}
            </p>
          )}

          {/* Genres with Pipe Dividers */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center text-xs sm:text-sm font-semibold text-white/90">
              {movie.genres.map((genre, idx) => (
                <span key={genre.id} className="flex items-center">
                  {idx > 0 && <span className="mx-2 text-white/30 font-normal">|</span>}
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Bingr.one Style Action Bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Big Circular Watch Now Button */}
            <Link
              href={`/movie/${movie.id}/player`}
              className="flex items-center gap-3 group/play focus:outline-none"
            >
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-[#f9f9f9] text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 group-hover/play:scale-105 group-hover/play:bg-white active:scale-95">
                <FaPlay className="ml-1 text-lg sm:text-xl text-black" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-base sm:text-[17px] font-bold text-white leading-tight group-hover/play:text-primary transition-colors">
                  {savedProgress && savedProgress.currentTime > 10 ? "Resume" : "Watch Now"}
                </span>
                <span className={cn("text-xs font-semibold tracking-wider uppercase", savedProgress && savedProgress.currentTime > 10 ? "text-emerald-400" : "text-white/50")}>
                  {savedProgress && savedProgress.currentTime > 10
                    ? `${formatTimeDisplay(savedProgress.currentTime)} watched`
                    : "Movie"}
                </span>
              </div>
            </Link>

            {/* Select Server Button (Bingr.one Modal Trigger) */}
            <button
              type="button"
              onClick={() => setIsServerModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 active:scale-95 shadow-lg"
            >
              <FaServer className="text-primary text-sm" />
              <span>Select Server</span>
            </button>

            {/* Watch Trailer Modal Trigger */}
            <Trailer videos={movie.videos.results} />

            {/* Bookmark / Watchlist */}
            <BookmarkButton data={bookmarkData} />

            {/* Share */}
            <ShareButton id={movie.id} title={title} />
          </div>
        </div>
      </div>

      {/* Bingr-style Server Selection Modal */}
      <ServerSelectionModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        movieId={movie.id}
        players={players}
        title={`Stream ${title}`}
      />
    </div>
  );
};

export default DetailHero;
