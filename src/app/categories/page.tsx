"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import SafeImage from "@/components/ui/other/SafeImage";
import { useQuery } from "@tanstack/react-query";
import {
  IoArrowBack,
  IoFilmOutline,
  IoTvOutline,
  IoSearchOutline,
  IoCloseCircle,
  IoGridOutline,
} from "react-icons/io5";
import {
  CategoryItem,
  FALLBACK_CATEGORIES,
  GENRE_MAP,
  STUDIO_MAP,
  LANGUAGE_MAP,
  fetchCategoriesData,
} from "@/services/categories";
import { CategoryTray } from "@/components/ui/tray/CategoryTray";
import BingrCard, { BingrMediaItem } from "@/components/ui/card/BingrCard";
import { tmdb } from "@/api/tmdb";
import { cn } from "@/utils/helpers";

type TabType = "all" | "genres" | "studios" | "languages" | "sports" | "browse";

function CategoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL State
  const selectedType = searchParams.get("type"); // "genre" | "studio" | "language"
  const selectedName = searchParams.get("name") || searchParams.get("genre");

  // Local state
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [sortBy, setSortBy] = useState<"popularity.desc" | "vote_average.desc" | "release_date.desc">(
    "popularity.desc"
  );

  // Fetch categories (Bingr live API or high-res curated fallback)
  const { data: categories = FALLBACK_CATEGORIES } = useQuery({
    queryKey: ["all-categories"],
    queryFn: fetchCategoriesData,
    initialData: FALLBACK_CATEGORIES,
    staleTime: 1000 * 60 * 60,
  });

  // Handle clicking a category item
  const handleItemSelect = (item: CategoryItem, categoryType: "genre" | "studio" | "language" | "sports" | "browse") => {
    if (item.href) {
      router.push(item.href);
      return;
    }

    const titleLower = item.title.toLowerCase();
    if (titleLower === "movies") {
      router.push("/movies");
      return;
    }
    if (titleLower === "tv" || titleLower === "tv shows") {
      router.push("/tv");
      return;
    }
    if (titleLower === "anime") {
      router.push("/anime");
      return;
    }
    if (titleLower === "sports") {
      router.push("/sports");
      return;
    }
    if (titleLower === "news" || titleLower === "live tv") {
      router.push("/live");
      return;
    }
    if (categoryType === "sports") {
      router.push("/sports");
      return;
    }

    // Otherwise open the media browser for this genre/studio/language
    router.push(`/categories?type=${categoryType}&name=${encodeURIComponent(item.title)}`);
  };

  // Identify current category detail context
  const currentSelection = useMemo(() => {
    if (!selectedName) return null;
    const name = decodeURIComponent(selectedName);
    const type = selectedType || "genre";

    // Find cover image
    let foundItem: CategoryItem | undefined;
    if (type === "studio") {
      foundItem = categories.STUDIOS.find((s) => s.title.toLowerCase() === name.toLowerCase());
    } else if (type === "language") {
      foundItem = categories.LANGUAGES.find((l) => l.title.toLowerCase() === name.toLowerCase());
    } else {
      foundItem = categories.GENRES.find((g) => g.title.toLowerCase() === name.toLowerCase());
    }

    return {
      name,
      type,
      image: foundItem?.image,
    };
  }, [selectedName, selectedType, categories]);

  // Query TMDB for media when a category is selected
  const { data: mediaItems = [], isLoading: isMediaLoading } = useQuery({
    queryKey: ["category-media", currentSelection?.type, currentSelection?.name, mediaType, sortBy],
    queryFn: async () => {
      if (!currentSelection) return [];
      const lowerName = currentSelection.name.toLowerCase();

      // Build discovery parameters
      const params: Record<string, any> = {
        sort_by: sortBy === "release_date.desc"
          ? (mediaType === "movie" ? "primary_release_date.desc" : "first_air_date.desc")
          : sortBy,
        "vote_count.gte": sortBy === "vote_average.desc" ? 150 : 20,
      };

      if (currentSelection.type === "studio") {
        const studioInfo = STUDIO_MAP[lowerName];
        if (studioInfo) {
          if (mediaType === "tv" && studioInfo.network) {
            params.with_networks = studioInfo.network;
          } else if (studioInfo.company) {
            params.with_companies = studioInfo.company;
          }
        }
      } else if (currentSelection.type === "language") {
        const langCode = LANGUAGE_MAP[lowerName];
        if (langCode) {
          params.with_original_language = langCode;
        }
      } else {
        // Genre
        const genreId = GENRE_MAP[lowerName]?.[mediaType] || GENRE_MAP[lowerName]?.movie;
        if (genreId) {
          params.with_genres = genreId;
        } else if (!isNaN(Number(currentSelection.name))) {
          params.with_genres = currentSelection.name;
        }
        if (lowerName === "anime") {
          params.with_genres = "16";
          params.with_original_language = "ja";
        }
      }

      if (mediaType === "movie") {
        const res = await tmdb.discover.movie(params as any);
        return (res.results || []) as unknown as BingrMediaItem[];
      } else {
        const res = await tmdb.discover.tvShow(params as any);
        return (res.results || []) as unknown as BingrMediaItem[];
      }
    },
    enabled: Boolean(currentSelection),
  });

  // Filter items in the Grid view when searching
  const filteredGridItems = useMemo(() => {
    let pool: { item: CategoryItem; type: "genre" | "studio" | "language" | "sports" | "browse" }[] = [];

    if (activeTab === "genres") {
      pool = categories.GENRES.map((item) => ({ item, type: "genre" }));
    } else if (activeTab === "studios") {
      pool = categories.STUDIOS.map((item) => ({ item, type: "studio" }));
    } else if (activeTab === "languages") {
      pool = categories.LANGUAGES.map((item) => ({ item, type: "language" }));
    } else if (activeTab === "sports") {
      pool = categories.SPORTS.map((item) => ({ item, type: "sports" }));
    } else if (activeTab === "browse") {
      pool = categories.BROWSE.map((item) => ({ item, type: "browse" }));
    } else {
      // "all" when searching
      pool = [
        ...categories.GENRES.map((item) => ({ item, type: "genre" as const })),
        ...categories.STUDIOS.map((item) => ({ item, type: "studio" as const })),
        ...categories.LANGUAGES.map((item) => ({ item, type: "language" as const })),
        ...categories.SPORTS.map((item) => ({ item, type: "sports" as const })),
      ];
    }

    if (!searchQuery.trim()) return pool;
    const q = searchQuery.toLowerCase().trim();
    return pool.filter((p) => p.item.title.toLowerCase().includes(q));
  }, [activeTab, categories, searchQuery]);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <div className="px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 pt-8 md:pt-12 pb-24 md:pb-16 min-h-screen w-full">
        {/* ================= CONDITION 1: DETAIL VIEW (When category selected) ================= */}
        {currentSelection ? (
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push("/categories")}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-semibold transition-all border border-white/10"
              >
                <IoArrowBack className="w-4 h-4" />
                <span>All Categories</span>
              </button>
            </div>

            {/* Category Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-black border border-white/10 p-6 sm:p-10 shadow-2xl">
              {currentSelection.image && (
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none overflow-hidden">
                  <Image
                    src={currentSelection.image}
                    alt={currentSelection.name}
                    fill
                    className="object-cover object-center"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent" />
                </div>
              )}

              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-widest text-primary mb-3">
                  {currentSelection.type}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                  {currentSelection.name}
                </h1>
                <p className="text-white/60 text-sm sm:text-base mt-2 leading-relaxed">
                  Discover top-rated and trending {mediaType === "movie" ? "movies" : "series"} in{" "}
                  <span className="text-white font-semibold">{currentSelection.name}</span>.
                </p>
              </div>
            </div>

            {/* Controls Bar: Movie/TV Tabs & Sorting */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              {/* Media Type Tabs */}
              <div className="flex items-center gap-2 bg-zinc-900/90 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setMediaType("movie")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all",
                    mediaType === "movie"
                      ? "bg-white text-black shadow-lg shadow-white/20"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <IoFilmOutline className="w-4 h-4" />
                  <span>Movies</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("tv")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all",
                    mediaType === "tv"
                      ? "bg-white text-black shadow-lg shadow-white/20"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <IoTvOutline className="w-4 h-4" />
                  <span>TV Series</span>
                </button>
              </div>

              {/* Sorting Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-zinc-900/90 border border-white/10 text-white text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="popularity.desc">Most Popular</option>
                  <option value="vote_average.desc">Top Rated</option>
                  <option value="release_date.desc">Release Date</option>
                </select>
              </div>
            </div>

            {/* Media Items Grid */}
            {isMediaLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-7 py-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] w-full rounded-xl bg-zinc-900/80 animate-pulse" />
                ))}
              </div>
            ) : mediaItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-7">
                {mediaItems.map((item) => (
                  <BingrCard key={item.id} item={item} type={mediaType} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/30 mb-4">
                  <IoFilmOutline className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No titles found</h3>
                <p className="text-sm text-white/50 max-w-sm">
                  We couldn&apos;t find any {mediaType === "movie" ? "movies" : "shows"} matching this category.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ================= CONDITION 2: MAIN CATEGORIES HUB ================= */
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-extrabold uppercase tracking-widest text-primary mb-3">
                  <IoGridOutline className="w-3.5 h-3.5" />
                  <span>Curated Library</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  Categories &amp; Genres
                </h1>
                <p className="text-white/50 text-sm sm:text-base mt-2 max-w-2xl">
                  Explore by streaming studios, global languages, live sports, and blockbuster genres.
                </p>
              </div>

              {/* Quick Search Input */}
              <div className="relative w-full md:w-72">
                <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full bg-[#16181f] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-white/40 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <IoCloseCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: "all", label: "All Hubs" },
                { id: "genres", label: `Genres (${categories.GENRES.length})` },
                { id: "studios", label: `Studios (${categories.STUDIOS.length})` },
                { id: "languages", label: `Languages (${categories.LANGUAGES.length})` },
                { id: "sports", label: `Sports (${categories.SPORTS.length})` },
                { id: "browse", label: "Browse" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border cursor-pointer",
                    activeTab === tab.id
                      ? "bg-white text-black border-white shadow-lg shadow-white/10"
                      : "bg-[#16181f] text-white/60 hover:text-white border-white/5 hover:border-white/15"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* VIEW MODE A: "All" with Trays (when not searching) */}
            {activeTab === "all" && !searchQuery ? (
              <div className="space-y-4 pt-2">
                {/* 1. Browse Hub */}
                <CategoryTray
                  title="Browse Entertainment"
                  items={categories.BROWSE}
                  onSelect={(item) => handleItemSelect(item, "browse")}
                  onViewAll={() => setActiveTab("browse")}
                />

                {/* 2. Streaming Studios */}
                <CategoryTray
                  title="Streaming Studios & Networks"
                  items={categories.STUDIOS}
                  onSelect={(item) => handleItemSelect(item, "studio")}
                  onViewAll={() => setActiveTab("studios")}
                />

                {/* 3. Popular Genres */}
                <CategoryTray
                  title="Popular Genres"
                  items={categories.GENRES}
                  onSelect={(item) => handleItemSelect(item, "genre")}
                  onViewAll={() => setActiveTab("genres")}
                />

                {/* 4. Popular Languages */}
                <CategoryTray
                  title="Global Languages"
                  items={categories.LANGUAGES}
                  onSelect={(item) => handleItemSelect(item, "language")}
                  onViewAll={() => setActiveTab("languages")}
                />

                {/* 5. Popular Sports */}
                <CategoryTray
                  title="Live Sports & Arenas"
                  items={categories.SPORTS}
                  onSelect={(item) => handleItemSelect(item, "sports")}
                  onViewAll={() => setActiveTab("sports")}
                />
              </div>
            ) : (
              /* VIEW MODE B: Full Grid (When a tab is picked or searching) */
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                    Showing {filteredGridItems.length} Categories
                  </span>
                  {activeTab !== "all" && (
                    <button
                      onClick={() => setActiveTab("all")}
                      className="text-xs text-white/50 hover:text-white transition-colors"
                    >
                      ← Back to All Hubs
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3.5 sm:gap-4 md:gap-5">
                  {filteredGridItems.map(({ item, type }) => (
                    <button
                      key={`${type}-${item.title}`}
                      onClick={() => handleItemSelect(item, type)}
                      className="group/gridCard relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#16181f] border border-white/5 hover:border-white/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-black/40 text-left cursor-pointer"
                    >
                      <SafeImage
                        src={item.image}
                        alt={item.title}
                        fallbackTitle={item.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover/gridCard:scale-105"
                        unoptimized
                      />

                      {/* Dark gradient & typography */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3.5">
                        <span className="text-white font-bold text-sm sm:text-base tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/gridCard:text-primary transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-0.5">
                          {type}
                        </span>
                      </div>

                      <div className="absolute inset-0 bg-white/0 group-hover/gridCard:bg-white/5 transition-colors duration-300 pointer-events-none" />
                    </button>
                  ))}
                </div>

                {filteredGridItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-white/50 text-sm">No categories found matching &quot;{searchQuery}&quot;</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CategoriesContent />
    </Suspense>
  );
}
