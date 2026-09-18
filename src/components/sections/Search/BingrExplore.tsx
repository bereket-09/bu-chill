"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage, useDebouncedValue } from "@mantine/hooks";
import { tmdb } from "@/api/tmdb";
import BingrCard, { BingrMediaItem } from "@/components/ui/card/BingrCard";
import { getImageUrl } from "@/utils/movies";
import Link from "next/link";
import Image from "next/image";
import {
  IoSearchOutline,
  IoClose,
  IoTimeOutline,
  IoPlay,
  IoStar,
  IoFlameOutline,
} from "react-icons/io5";

type SearchType = "all" | "movie" | "tv" | "anime";

export const BingrExplore: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchInput.trim(), 350);
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>({
    key: "Bu_chill_recent_searches",
    defaultValue: ["Avengers", "Breaking Bad", "Demon Slayer", "Inception"],
  });

  // Save to recent searches when query is submitted / typed
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== debouncedQuery.toLowerCase());
        return [debouncedQuery, ...filtered].slice(0, 10);
      });
    }
  }, [debouncedQuery, setRecentSearches]);

  const removeRecent = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((item) => item !== text));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
  };

  // Trending media when search query is empty
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ["explore-trending", searchType],
    queryFn: async () => {
      if (searchType === "anime") {
        const res = await tmdb.discover.tvShow({
          with_genres: "16",
          sort_by: "popularity.desc",
        });
        return res.results as unknown as BingrMediaItem[];
      }
      if (searchType === "movie") {
        const res = await tmdb.trending.trending("movie", "day");
        return res.results as unknown as BingrMediaItem[];
      }
      if (searchType === "tv") {
        const res = await tmdb.trending.trending("tv", "day");
        return res.results as unknown as BingrMediaItem[];
      }
      const res = await tmdb.trending.trending("all", "day");
      return res.results.filter(
        (item: any) => item.media_type === "movie" || item.media_type === "tv"
      ) as unknown as BingrMediaItem[];
    },
    staleTime: 1000 * 60 * 10,
    enabled: !debouncedQuery,
  });

  // Search results when search query is active
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["explore-search", debouncedQuery, searchType],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      if (searchType === "movie") {
        const res = await tmdb.search.movies({ query: debouncedQuery });
        return res.results as unknown as BingrMediaItem[];
      }
      if (searchType === "tv") {
        const res = await tmdb.search.tvShows({ query: debouncedQuery });
        return res.results as unknown as BingrMediaItem[];
      }
      if (searchType === "anime") {
        const res = await tmdb.search.tvShows({ query: debouncedQuery });
        return (res.results as unknown as BingrMediaItem[]).filter(
          (item: any) => item.genre_ids?.includes(16) || true
        );
      }
      const res = await tmdb.search.multi({ query: debouncedQuery });
      return res.results.filter(
        (item: any) =>
          (item.media_type === "movie" || item.media_type === "tv") &&
          (item.poster_path || item.backdrop_path)
      ) as unknown as BingrMediaItem[];
    },
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(debouncedQuery),
  });

  // Split Top Result and remaining results
  const topResult = useMemo(() => {
    if (!searchResults || searchResults.length === 0) return null;
    return searchResults[0];
  }, [searchResults]);

  const remainingResults = useMemo(() => {
    if (!searchResults || searchResults.length <= 1) return [];
    return searchResults.slice(1);
  }, [searchResults]);

  const trendingTitle = useMemo(() => {
    switch (searchType) {
      case "movie":
        return "Trending Movies Today";
      case "tv":
        return "Trending TV Series";
      case "anime":
        return "Popular Anime";
      default:
        return "Trending Today";
    }
  }, [searchType]);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <div className="px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 pt-12 pb-24 md:pb-16 min-h-screen w-full">
        {/* ================= SEARCH BAR CONTAINER (Exact Bingr) ================= */}
        <div className="max-w-3xl mb-8 relative">
          <div className="flex items-center bg-[#0f1014] rounded-xl border border-white/10 focus-within:border-white/30 focus-within:bg-[#16181f] transition-all px-4 py-3 shadow-2xl">
            <IoSearchOutline className="w-5 h-5 text-white/40 mr-3 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search movies, TV series, anime, people..."
              className="w-full bg-transparent text-[16px] font-medium text-white placeholder-white/40 focus:outline-none"
              autoFocus
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="ml-2 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
                aria-label="Clear Search"
              >
                <IoClose className="w-5 h-5" />
              </button>
            )}

            <div className="h-6 w-px bg-white/10 mx-3 shrink-0" />

            {/* Type Selector Dropdown */}
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              className="bg-transparent text-white/70 hover:text-white text-[13px] font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#0f1014] text-white">
                All Types
              </option>
              <option value="movie" className="bg-[#0f1014] text-white">
                Movies
              </option>
              <option value="tv" className="bg-[#0f1014] text-white">
                TV Series
              </option>
              <option value="anime" className="bg-[#0f1014] text-white">
                Anime
              </option>
            </select>
          </div>
        </div>

        {/* ================= RECENT SEARCHES (When query is empty) ================= */}
        {!debouncedQuery && recentSearches.length > 0 && (
          <div className="mb-10 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-3.5 max-w-3xl">
              <h3 className="text-[14px] font-bold text-white/60 tracking-wide uppercase">
                Recent Searches
              </h3>
              <button
                type="button"
                onClick={clearAllRecent}
                className="text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-w-3xl">
              {recentSearches.map((term) => (
                <div
                  key={term}
                  onClick={() => setSearchInput(term)}
                  className="flex items-center gap-2 bg-[#16181f]/80 hover:bg-white/10 border border-white/5 hover:border-white/20 px-3.5 py-1.5 rounded-full cursor-pointer transition-all group text-sm text-white/80"
                >
                  <IoTimeOutline className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                  <span className="font-medium">{term}</span>
                  <button
                    type="button"
                    onClick={(e) => removeRecent(term, e)}
                    className="ml-0.5 text-white/30 hover:text-white p-0.5 rounded-full"
                    aria-label={`Remove ${term}`}
                  >
                    <IoClose className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SEARCH RESULTS VIEW ================= */}
        {debouncedQuery ? (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white/90">
                Search Results for <span className="text-white">"{debouncedQuery}"</span>
              </h2>
              {searchResults && (
                <span className="text-sm font-medium text-white/50">
                  {searchResults.length} {searchResults.length === 1 ? "result" : "results"} found
                </span>
              )}
            </div>

            {/* TOP RESULT SPOTLIGHT (Exact Bingr Top Result) */}
            {topResult && (
              <div className="mb-10">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-white/50 mb-3">
                  Top Result
                </h3>
                <div className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 sm:p-5 rounded-2xl bg-[#0f1014] border border-white/10 hover:border-white/25 transition-all shadow-xl max-w-3xl">
                  {/* Spotlight Image (16:9 Backdrop or Poster) */}
                  <Link
                    href={`/${topResult.media_type || (topResult.first_air_date ? "tv" : "movie")}/${topResult.id}`}
                    className="relative w-full sm:w-64 aspect-video rounded-xl overflow-hidden bg-white/5 shrink-0"
                  >
                    {topResult.backdrop_path || topResult.poster_path ? (
                      <Image
                        src={getImageUrl(topResult.backdrop_path || topResult.poster_path || undefined, "backdrop")}
                        alt={topResult.title || topResult.name || "Top Result"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white/20">
                        {topResult.title || topResult.name}
                      </div>
                    )}
                  </Link>

                  {/* Spotlight Details */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white/90">
                        {topResult.media_type === "tv" || topResult.first_air_date ? "TV Series" : "Movie"}
                      </span>
                      {topResult.release_date || topResult.first_air_date ? (
                        <span className="text-xs text-white/50 font-medium">
                          {new Date(topResult.release_date || topResult.first_air_date || "").getFullYear()}
                        </span>
                      ) : null}
                      {topResult.vote_average && topResult.vote_average > 0 ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                          <IoStar className="w-3 h-3 fill-amber-400" />
                          <span>{topResult.vote_average.toFixed(1)}</span>
                        </div>
                      ) : null}
                    </div>

                    <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight line-clamp-1 mb-2">
                      {topResult.title || topResult.name}
                    </h4>

                    {topResult.overview && (
                      <p className="text-xs sm:text-sm text-white/60 line-clamp-2 mb-4">
                        {topResult.overview}
                      </p>
                    )}

                    <div>
                      <Link
                        href={`/${topResult.media_type || (topResult.first_air_date ? "tv" : "movie")}/${topResult.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-bold text-xs sm:text-sm hover:bg-white/90 active:scale-95 transition-transform"
                      >
                        <IoPlay className="w-4 h-4 fill-black" />
                        <span>Watch Now</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Remaining Results Grid */}
            {remainingResults.length > 0 && (
              <div>
                <h3 className="text-[14px] font-bold uppercase tracking-wider text-white/50 mb-4">
                  More Matches
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-7">
                  {remainingResults.map((item) => (
                    <BingrCard key={`${item.id}-${item.media_type}`} item={item} />
                  ))}
                </div>
              </div>
            )}

            {isSearchLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              </div>
            )}

            {!isSearchLoading && searchResults && searchResults.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-lg font-semibold text-white/70">
                  No matches found for "{debouncedQuery}".
                </p>
                <p className="text-sm text-white/40 mt-1">
                  Try checking your spelling or adjusting your category filter.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ================= TRENDING FEED (When search is empty) ================= */
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-2">
              <IoFlameOutline className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white/90">
                {trendingTitle}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-x-4 gap-y-7">
              {trendingData?.map((item, idx) => (
                <BingrCard key={`${item.id}-${item.media_type || idx}`} item={item} priority={idx < 6} />
              ))}
            </div>

            {isTrendingLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BingrExplore;
