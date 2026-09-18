"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import useFetchDiscoverMovies from "@/hooks/useFetchDiscoverMovies";
import useFetchDiscoverTvShows from "@/hooks/useFetchDiscoverTvShow";
import { DiscoverMoviesFetchQueryType, DiscoverTvShowsFetchQueryType } from "@/types/movie";
import BingrCard, { BingrMediaItem } from "@/components/ui/card/BingrCard";
import Fuse from "fuse.js";
import {
  IoSearchOutline,
  IoClose,
  IoFilmOutline,
  IoTvOutline,
  IoFlame,
  IoSparkles,
  IoStar,
  IoCalendar,
  IoCompass,
} from "react-icons/io5";

const QUERY_TABS = [
  { id: "todayTrending", label: "Today's Trending", icon: <IoFlame className="w-3.5 h-3.5 text-amber-500" /> },
  { id: "thisWeekTrending", label: "This Week", icon: <IoSparkles className="w-3.5 h-3.5 text-yellow-400" /> },
  { id: "popular", label: "Popular", icon: <IoStar className="w-3.5 h-3.5 text-cyan-400" /> },
  { id: "topRated", label: "Top Rated", icon: <IoStar className="w-3.5 h-3.5 text-emerald-400" /> },
  { id: "nowPlaying", label: "In Theatres / Airing", icon: <IoCalendar className="w-3.5 h-3.5 text-rose-400" /> },
  { id: "discover", label: "Browse All", icon: <IoCompass className="w-3.5 h-3.5 text-purple-400" /> },
];

const GENRE_PILLS = [
  { id: "28", name: "Action", tvId: "10759" },
  { id: "16", name: "Animation", tvId: "16" },
  { id: "35", name: "Comedy", tvId: "35" },
  { id: "18", name: "Drama", tvId: "18" },
  { id: "878", name: "Sci-Fi", tvId: "10765" },
  { id: "27", name: "Horror", tvId: "9648" },
  { id: "10749", name: "Romance", tvId: "18" },
  { id: "80", name: "Crime", tvId: "80" },
];

export const BingrDiscover: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state
  const rawType = searchParams.get("type") || "todayTrending";
  const rawContent = (searchParams.get("content") as "movie" | "tv") || "movie";
  const rawGenres = searchParams.get("genres") || "";

  const [fuzzySearch, setFuzzySearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Sync state helpers
  const updateUrl = (params: { type?: string; content?: string; genres?: string }) => {
    const next = new URLSearchParams(searchParams.toString());
    if (params.type !== undefined) {
      if (params.type) next.set("type", params.type);
      else next.delete("type");
    }
    if (params.content !== undefined) {
      if (params.content) next.set("content", params.content);
      else next.delete("content");
    }
    if (params.genres !== undefined) {
      if (params.genres) next.set("genres", params.genres);
      else next.delete("genres");
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const handleTypeChange = (newType: string) => {
    updateUrl({ type: newType });
  };

  const handleContentChange = (newContent: "movie" | "tv") => {
    updateUrl({ content: newContent });
  };

  const handleGenreToggle = (genreId: string) => {
    const currentList = rawGenres ? rawGenres.split(",").filter(Boolean) : [];
    let updatedList: string[];
    if (currentList.includes(genreId)) {
      updatedList = currentList.filter((g) => g !== genreId);
    } else {
      updatedList = [...currentList, genreId];
    }
    updateUrl({ genres: updatedList.join(",") });
  };

  // Movie Query
  const {
    data: movieData,
    fetchNextPage: fetchNextMovie,
    hasNextPage: hasNextMovie,
    isFetchingNextPage: isFetchingNextMovie,
    isLoading: isMovieLoading,
  } = useInfiniteQuery({
    queryKey: ["discover-movies", rawType, rawGenres],
    queryFn: ({ pageParam = 1 }) =>
      useFetchDiscoverMovies({
        page: pageParam,
        type: rawType as DiscoverMoviesFetchQueryType,
        genres: rawGenres,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: rawContent === "movie",
  });

  // TV Query
  const {
    data: tvData,
    fetchNextPage: fetchNextTv,
    hasNextPage: hasNextTv,
    isFetchingNextPage: isFetchingNextTv,
    isLoading: isTvLoading,
  } = useInfiniteQuery({
    queryKey: ["discover-tv", rawType, rawGenres],
    queryFn: ({ pageParam = 1 }) =>
      useFetchDiscoverTvShows({
        page: pageParam,
        type: (rawType === "nowPlaying" ? "onTheAir" : rawType) as DiscoverTvShowsFetchQueryType,
        genres: rawGenres,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: rawContent === "tv",
  });

  // Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (rawContent === "movie" && hasNextMovie && !isFetchingNextMovie) {
            fetchNextMovie();
          } else if (rawContent === "tv" && hasNextTv && !isFetchingNextTv) {
            fetchNextTv();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [rawContent, hasNextMovie, hasNextTv, isFetchingNextMovie, isFetchingNextTv, fetchNextMovie, fetchNextTv]);

  // Flattened items list
  const allItems: BingrMediaItem[] = useMemo(() => {
    if (rawContent === "movie") {
      return (movieData?.pages.flatMap((p) => p.results) || []) as unknown as BingrMediaItem[];
    }
    return (tvData?.pages.flatMap((p) => p.results) || []) as unknown as BingrMediaItem[];
  }, [rawContent, movieData, tvData]);

  // Fuse.js in-memory fuzzy search instance
  const fuse = useMemo(() => {
    return new Fuse(allItems, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "name", weight: 0.7 },
        { name: "original_title", weight: 0.4 },
        { name: "original_name", weight: 0.4 },
        { name: "overview", weight: 0.2 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [allItems]);

  // Fuzzy filtered result
  const displayItems = useMemo(() => {
    if (!fuzzySearch.trim()) return allItems;
    return fuse.search(fuzzySearch.trim()).map((result) => result.item);
  }, [fuzzySearch, fuse, allItems]);

  const activeTabName = useMemo(() => {
    const found = QUERY_TABS.find((t) => t.id === rawType);
    return found ? found.label : "Discover";
  }, [rawType]);

  const isLoading = rawContent === "movie" ? isMovieLoading : isTvLoading;
  const isFetchingMore = rawContent === "movie" ? isFetchingNextMovie : isFetchingNextTv;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-7 animate-in fade-in duration-500 select-none">
      {/* ================= HEADER & CONTENT TOGGLE ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>{activeTabName}</span>
            <span className="text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70">
              {rawContent === "movie" ? "Movies" : "TV Series"}
            </span>
          </h1>
          <p className="text-white/40 text-xs sm:text-sm mt-1">
            Real-time feed with instant fuzzy search filtering.
          </p>
        </div>

        {/* Content Type Selector (Movies vs TV Shows) */}
        <div className="flex items-center bg-[#16181f] p-1 rounded-xl border border-white/10 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleContentChange("movie")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              rawContent === "movie"
                ? "bg-white text-black shadow-lg shadow-black/50"
                : "text-white/50 hover:text-white"
            }`}
          >
            <IoFilmOutline className="w-4 h-4" />
            <span>Movies</span>
          </button>

          <button
            type="button"
            onClick={() => handleContentChange("tv")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              rawContent === "tv"
                ? "bg-white text-black shadow-lg shadow-black/50"
                : "text-white/50 hover:text-white"
            }`}
          >
            <IoTvOutline className="w-4 h-4" />
            <span>TV Series</span>
          </button>
        </div>
      </div>

      {/* ================= FUZZY SEARCH INPUT BAR ================= */}
      <div className="relative max-w-2xl">
        <div className="flex items-center bg-[#0f1014] rounded-xl border border-white/10 focus-within:border-white/30 focus-within:bg-[#16181f] transition-all px-4 py-3 shadow-xl">
          <IoSearchOutline className="w-5 h-5 text-white/40 mr-3 shrink-0" />
          <input
            type="text"
            value={fuzzySearch}
            onChange={(e) => setFuzzySearch(e.target.value)}
            placeholder={`Fuzzy search loaded ${rawContent === "movie" ? "movies" : "shows"} (e.g. title, overview)...`}
            className="w-full bg-transparent text-[15px] font-medium text-white placeholder-white/40 focus:outline-none"
          />

          {fuzzySearch && (
            <button
              type="button"
              onClick={() => setFuzzySearch("")}
              className="ml-2 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
              aria-label="Clear filter"
            >
              <IoClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {fuzzySearch && (
          <div className="mt-2 text-xs font-semibold text-white/50 pl-1">
            Matching {displayItems.length} of {allItems.length} loaded titles
          </div>
        )}
      </div>

      {/* ================= CATEGORY / QUERY TYPE PILLS ================= */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1" style={{ scrollbarWidth: "none" }}>
        {QUERY_TABS.map((tab) => {
          const isActive = rawType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTypeChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-white text-black border-white shadow-md scale-105"
                  : "bg-[#0f1014] text-white/60 hover:text-white hover:bg-[#16181f] border-white/5"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= GENRE QUICK-FILTER CHIPS ================= */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-white/40 mr-1">
          Genres:
        </span>
        {GENRE_PILLS.map((genre) => {
          const genreId = rawContent === "tv" ? genre.tvId : genre.id;
          const isSelected = rawGenres.split(",").includes(genreId);
          return (
            <button
              key={genre.name}
              type="button"
              onClick={() => handleGenreToggle(genreId)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                isSelected
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/5"
              }`}
            >
              {genre.name}
            </button>
          );
        })}
        {rawGenres && (
          <button
            type="button"
            onClick={() => updateUrl({ genres: "" })}
            className="text-xs text-rose-400 hover:underline font-semibold ml-2"
          >
            Clear Genres
          </button>
        )}
      </div>

      {/* ================= MEDIA GRID ================= */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-x-4 gap-y-7 pt-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="aspect-[2/3] w-full rounded-xl bg-[#16181f]" />
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-x-4 gap-y-7 pt-2">
          {displayItems.map((item, idx) => (
            <BingrCard
              key={`${item.id}-${idx}`}
              item={item}
              type={rawContent}
              priority={idx < 6}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center space-y-3">
          <p className="text-xl font-bold text-white/70">
            {fuzzySearch ? `No titles found matching "${fuzzySearch}"` : "No titles found"}
          </p>
          <p className="text-sm text-white/40">
            Try adjusting your search query or switching your category filters.
          </p>
          {fuzzySearch && (
            <button
              type="button"
              onClick={() => setFuzzySearch("")}
              className="mt-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
            >
              Clear Fuzzy Search
            </button>
          )}
        </div>
      )}

      {/* Bottom Loading Indicator for Infinite Scroll */}
      <div ref={loadMoreRef} className="py-12 flex justify-center w-full">
        {isFetchingMore && (
          <div className="flex items-center gap-3 text-sm font-semibold text-white/60">
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <span>Loading more titles...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BingrDiscover;
