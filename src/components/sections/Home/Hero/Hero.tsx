"use client";

import React, { useEffect, useMemo, useState } from "react";
import { tmdb } from "@/api/tmdb";
import { Button, Chip, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FaPlay, FaStar, FaInfo } from "react-icons/fa6";
import { ChevronLeft, ChevronRight } from "@/utils/icons";
import HeroVideo from "./HeroVideo";
import { Movie } from "tmdb-ts/dist/types";

export const HomeHero: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch trending movies for the hero showcase
  const { data: trendingData, isPending } = useQuery({
    queryKey: ["trending-hero-movies"],
    queryFn: () => tmdb.trending.trending("movie", "day"),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const featuredMovies: Movie[] = useMemo(() => {
    return trendingData?.results?.slice(0, 5) || [];
  }, [trendingData]);

  const activeMovie = featuredMovies[activeIndex];

  // Fetch trailer for currently active slide
  const { data: videoData } = useQuery({
    queryKey: ["movie-trailer-hero", activeMovie?.id],
    queryFn: () => (activeMovie?.id ? tmdb.movies.videos(activeMovie.id) : null),
    enabled: Boolean(activeMovie?.id),
    staleTime: 1000 * 60 * 60,
  });

  const trailerKey = useMemo(() => {
    if (!videoData?.results?.length) return null;
    const official = videoData.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer"
    );
    const teaser = videoData.results.find(
      (v) => v.site === "YouTube" && v.type === "Teaser"
    );
    return official?.key || teaser?.key || videoData.results[0]?.key || null;
  }, [videoData]);

  // Auto-slide rotation every 10 seconds (paused when user is hovering)
  useEffect(() => {
    if (isHovered || featuredMovies.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isHovered, featuredMovies.length]);

  const nextSlide = () => {
    if (featuredMovies.length > 0) {
      setActiveIndex((prev) => (prev + 1) % featuredMovies.length);
    }
  };

  const prevSlide = () => {
    if (featuredMovies.length > 0) {
      setActiveIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
    }
  };

  if (isPending || !activeMovie) {
    return (
      <div className="relative h-[65vh] md:h-[80vh] w-full overflow-hidden bg-black">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  const releaseYear = activeMovie.release_date
    ? new Date(activeMovie.release_date).getFullYear()
    : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group/hero relative h-[70vh] min-h-[500px] md:h-[82vh] w-full overflow-hidden select-none"
    >
      {/* Background Video Layer */}
      <HeroVideo
        key={activeMovie.id}
        backdropPath={activeMovie.backdrop_path}
        title={activeMovie.title}
        trailerKey={trailerKey}
      />

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 pb-16 md:pb-24 max-w-4xl">
        {/* Badges Row */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Chip
            size="sm"
            color="warning"
            variant="solid"
            startContent={<FaStar className="ml-1 text-xs" />}
            className="font-bold text-black"
          >
            {activeMovie.vote_average ? activeMovie.vote_average.toFixed(1) : "N/A"}
          </Chip>

          {releaseYear && (
            <Chip size="sm" variant="flat" className="bg-white/20 text-white backdrop-blur-md">
              {releaseYear}
            </Chip>
          )}

          <Chip size="sm" variant="flat" className="border border-white/20 bg-black/40 text-white/90">
            4K Ultra HD
          </Chip>

          <Chip size="sm" variant="flat" className="bg-primary/20 text-primary font-bold">
            #1 Trending
          </Chip>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl line-clamp-2">
          {activeMovie.title}
        </h1>

        {/* Synopsis Overview */}
        <p className="mb-6 line-clamp-3 text-sm text-neutral-300 drop-shadow md:text-base max-w-2xl font-normal leading-relaxed">
          {activeMovie.overview}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            as={Link}
            href={`/movie/${activeMovie.id}/player`}
            color="primary"
            size="lg"
            radius="full"
            className="font-bold shadow-lg shadow-primary/30 transition-transform hover:scale-105"
            startContent={<FaPlay className="text-sm" />}
          >
            Play Now
          </Button>

          <Button
            as={Link}
            href={`/movie/${activeMovie.id}`}
            variant="flat"
            size="lg"
            radius="full"
            className="border border-white/20 bg-white/20 font-semibold text-white backdrop-blur-md transition-transform hover:bg-white/30 hover:scale-105"
            startContent={<FaInfo className="text-sm" />}
          >
            More Info
          </Button>
        </div>
      </div>

      {/* Bottom Slide Indicators (Dots / Bars) & Slide Controls */}
      <div className="absolute right-6 bottom-8 z-30 flex items-center gap-2.5 md:right-16">
        <button
          type="button"
          onClick={prevSlide}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-all active:scale-95 shadow-md cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="text-sm" />
        </button>

        <div className="flex items-center gap-1.5">
          {featuredMovies.map((movie, idx) => (
            <button
              key={movie.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                idx === activeIndex ? "w-8 bg-primary shadow-sm shadow-primary" : "w-3 bg-white/30 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={nextSlide}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-all active:scale-95 shadow-md cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default HomeHero;
