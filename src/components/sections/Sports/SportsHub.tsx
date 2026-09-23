"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SportsMatch } from "@/services/sports";
import { isCurrentProfileKid } from "@/services/profileStorage";
import SportsHeroCarousel from "./SportsHeroCarousel";
import SportsTray from "./SportsTray";
import SportsMatchCard from "./SportsMatchCard";
import {
  IoSearchOutline,
  IoClose,
  IoFlame,
  IoRadio,
  IoRefresh,
  IoGridOutline,
  IoListOutline,
} from "react-icons/io5";

const SPORT_CATEGORIES = [
  { id: "all", label: "All Sports", icon: "🏆" },
  { id: "live", label: "Live Now", icon: "🔴" },
  { id: "popular", label: "Popular", icon: "🔥" },
  { id: "football", label: "Football", icon: "⚽" },
  { id: "basketball", label: "Basketball", icon: "🏀" },
  { id: "fight", label: "Combat / UFC", icon: "🥊" },
  { id: "motorsport", label: "Motorsport / F1", icon: "🏎️" },
  { id: "cricket", label: "Cricket", icon: "🏏" },
  { id: "baseball", label: "Baseball", icon: "⚾" },
  { id: "american-football", label: "NFL", icon: "🏈" },
  { id: "tennis", label: "Tennis", icon: "🎾" },
  { id: "hockey", label: "Hockey", icon: "🏒" },
  { id: "rugby", label: "Rugby", icon: "🏉" },
];

const CATEGORY_TRAY_ORDER: { key: string; label: string; icon: string; matchers: string[]; exclusions?: string[] }[] = [
  {
    key: "football",
    label: "Football / Soccer",
    icon: "⚽",
    matchers: ["football", "soccer"],
    exclusions: ["american"],
  },
  {
    key: "basketball",
    label: "Basketball / NBA",
    icon: "🏀",
    matchers: ["basketball", "nba"],
  },
  {
    key: "fight",
    label: "Fight & Combat (UFC, Boxing, MMA)",
    icon: "🥊",
    matchers: ["combat", "fight", "mma", "ufc", "boxing", "wwe"],
  },
  {
    key: "motorsport",
    label: "Motor Sports & Racing (F1)",
    icon: "🏎️",
    matchers: ["motor", "motorsport", "f1", "racing", "nascar", "motogp"],
  },
  {
    key: "cricket",
    label: "Cricket",
    icon: "🏏",
    matchers: ["cricket"],
  },
  {
    key: "american-football",
    label: "American Football / NFL",
    icon: "🏈",
    matchers: ["american-football", "american football", "nfl"],
  },
  {
    key: "baseball",
    label: "Baseball / MLB",
    icon: "⚾",
    matchers: ["baseball", "mlb"],
  },
  {
    key: "tennis",
    label: "Tennis",
    icon: "🎾",
    matchers: ["tennis"],
  },
  {
    key: "hockey",
    label: "Ice Hockey / NHL",
    icon: "🏒",
    matchers: ["hockey", "nhl"],
  },
  {
    key: "rugby",
    label: "Rugby",
    icon: "🏉",
    matchers: ["rugby"],
  },
];

export const SportsHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"trays" | "grid">("trays");
  const [isKidProfile, setIsKidProfile] = useState<boolean>(false);

  useEffect(() => {
    setIsKidProfile(isCurrentProfileKid());
    const handleProfileChange = () => {
      setIsKidProfile(isCurrentProfileKid());
    };
    window.addEventListener("buchill_profile_changed", handleProfileChange);
    window.addEventListener("buchill_profiles_updated", handleProfileChange);
    return () => {
      window.removeEventListener("buchill_profile_changed", handleProfileChange);
      window.removeEventListener("buchill_profiles_updated", handleProfileChange);
    };
  }, []);

  const sportCategories = useMemo(() => {
    if (!isKidProfile) return SPORT_CATEGORIES;
    return [
      { id: "all", label: "Family Sports", icon: "🧸" },
      { id: "live", label: "Live Now", icon: "🔴" },
      { id: "popular", label: "Popular", icon: "🔥" },
      { id: "football", label: "Football", icon: "⚽" },
      { id: "basketball", label: "Basketball", icon: "🏀" },
      { id: "tennis", label: "Tennis", icon: "🎾" },
      { id: "motorsport", label: "Motorsport / F1", icon: "🏎️" },
      { id: "baseball", label: "Baseball", icon: "⚾" },
      { id: "hockey", label: "Hockey", icon: "🏒" },
    ];
  }, [isKidProfile]);

  // 1. Fetch full matches schedule (unified across all sports)
  const {
    data: allMatches,
    isLoading: isAllLoading,
    refetch: refetchAll,
    isFetching: isAllFetching,
  } = useQuery<SportsMatch[]>({
    queryKey: ["sports-matches", "all"],
    queryFn: async () => {
      const res = await fetch("/api/sports/matches?type=all");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 3,
    refetchInterval: 1000 * 60 * 3,
  });

  // 2. Fetch popular curated matches
  const {
    data: popularMatches,
    isLoading: isPopularLoading,
    refetch: refetchPopular,
    isFetching: isPopularFetching,
  } = useQuery<SportsMatch[]>({
    queryKey: ["sports-popular"],
    queryFn: async () => {
      const res = await fetch("/api/sports/matches?type=popular");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 3,
  });

  const isLoading = isAllLoading && isPopularLoading;
  const isFetching = isAllFetching || isPopularFetching;

  const handleRefresh = () => {
    refetchAll();
    refetchPopular();
  };

  // Combine and sort matches: Live now comes first, then by date (combat sports filtered for kids)
  const sortedMatches = useMemo(() => {
    let list = [...(allMatches || [])];
    if (isKidProfile) {
      const combatWords = ["ufc", "mma", "fight", "boxing", "wwe", "combat"];
      list = list.filter((m) => {
        const cat = (m.category || "").toLowerCase();
        const title = (m.title || "").toLowerCase();
        return !combatWords.some((w) => cat.includes(w) || title.includes(w));
      });
    }
    return list.sort((a, b) => {
      const aIsLive =
        a.category !== "upcoming" && new Date(a.date).getTime() < Date.now() + 1000 * 60 * 60 * 3;
      const bIsLive =
        b.category !== "upcoming" && new Date(b.date).getTime() < Date.now() + 1000 * 60 * 60 * 3;
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      return a.date - b.date;
    });
  }, [allMatches, isKidProfile]);

  // Featured Hero Matches: pick 5 diverse sport matches (like Bingr)
  const heroMatches = useMemo(() => {
    const featured: SportsMatch[] = [];
    const usedIds = new Set<string>();

    // Try finding one match from each major sport category
    for (const tray of CATEGORY_TRAY_ORDER) {
      const match = sortedMatches.find((m) => {
        if (usedIds.has(m.id)) return false;
        const cat = (m.category || "").toLowerCase();
        const matchesCat = tray.matchers.some((k) => cat.includes(k));
        const excluded = tray.exclusions?.some((e) => cat.includes(e));
        return matchesCat && !excluded;
      });

      if (match) {
        usedIds.add(match.id);
        featured.push(match);
        if (featured.length >= 5) break;
      }
    }

    // Fallback if not enough diverse sports
    if (featured.length < 5) {
      for (const m of sortedMatches) {
        if (!usedIds.has(m.id)) {
          usedIds.add(m.id);
          featured.push(m);
          if (featured.length >= 5) break;
        }
      }
    }

    return featured;
  }, [sortedMatches]);

  // Live Right Now matches
  const liveMatches = useMemo(() => {
    return sortedMatches.filter(
      (m) =>
        m.category !== "upcoming" && new Date(m.date).getTime() < Date.now() + 1000 * 60 * 60 * 3
    );
  }, [sortedMatches]);

  // Matches grouped by sport categories for trays
  const categoryTrays = useMemo(() => {
    return CATEGORY_TRAY_ORDER.filter((def) => !isKidProfile || def.key !== "fight").map((def) => {
      const matches = sortedMatches.filter((m) => {
        const cat = (m.category || "").toLowerCase();
        const matchesCat = def.matchers.some((k) => cat.includes(k));
        const excluded = def.exclusions?.some((e) => cat.includes(e));
        return matchesCat && !excluded;
      });
      return {
        ...def,
        matches,
      };
    }).filter((tray) => tray.matches.length > 0);
  }, [sortedMatches, isKidProfile]);

  // Filtered matches for Search or Grid Mode
  const filteredMatches = useMemo(() => {
    return sortedMatches.filter((match) => {
      // Category filter
      if (selectedCategory === "live") {
        const isLive =
          match.category !== "upcoming" &&
          new Date(match.date).getTime() < Date.now() + 1000 * 60 * 60 * 3;
        if (!isLive) return false;
      } else if (selectedCategory === "popular") {
        if (!match.popular) return false;
      } else if (selectedCategory !== "all") {
        const cat = (match.category || "").toLowerCase();
        if (!cat.includes(selectedCategory) && !selectedCategory.includes(cat)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (match.title || "").toLowerCase().includes(q);
        const homeMatch = (match.teams?.home?.name || "").toLowerCase().includes(q);
        const awayMatch = (match.teams?.away?.name || "").toLowerCase().includes(q);
        const catMatch = (match.category || "").toLowerCase().includes(q);
        if (!titleMatch && !homeMatch && !awayMatch && !catMatch) return false;
      }

      return true;
    });
  }, [sortedMatches, selectedCategory, searchQuery]);

  const isSearchOrCategoryActive = searchQuery.trim().length > 0 || selectedCategory !== "all";
  const showGrid = viewMode === "grid" || isSearchOrCategoryActive;

  return (
    <div className="w-full space-y-8 select-none">
      {/* ================= 1. CINEMATIC HERO CAROUSEL (Bingr Layout) ================= */}
      {!isSearchOrCategoryActive && heroMatches.length > 0 && (
        <div className="-mx-4 sm:-mx-8 md:-ml-24 lg:-ml-28 md:-mr-10 -mt-8">
          <SportsHeroCarousel matches={heroMatches} />
        </div>
      )}

      {/* ================= 2. CONTROLS BAR: SEARCH, CATEGORIES & VIEW SWITCHER ================= */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Live Sports Center</span>
              {liveMatches.length > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white uppercase tracking-wider animate-pulse shadow-md shadow-red-600/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  {liveMatches.length} Live
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            {/* Search Input */}
            <div className="flex items-center bg-[#121319] rounded-xl border border-white/10 focus-within:border-white/30 px-3 py-2 flex-1 md:w-72 shadow">
              <IoSearchOutline className="w-4 h-4 text-white/40 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams, fighters, matches..."
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-white placeholder-white/40 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-white/40 hover:text-white p-0.5 rounded-full"
                >
                  <IoClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#121319] p-1 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("trays")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "trays" && !isSearchOrCategoryActive
                    ? "bg-white text-black shadow"
                    : "text-white/50 hover:text-white"
                }`}
                title="Categorized Trays View"
              >
                <IoListOutline className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "grid" || isSearchOrCategoryActive
                    ? "bg-white text-black shadow"
                    : "text-white/50 hover:text-white"
                }`}
                title="Grid View"
              >
                <IoGridOutline className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2.5 rounded-xl bg-[#121319] border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-colors shrink-0"
              title="Refresh matches"
              aria-label="Refresh matches"
            >
              <IoRefresh className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Category Selector Pills Carousel */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1"
          style={{ scrollbarWidth: "none" }}
        >
          {sportCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-white text-black border-white shadow-md scale-105"
                    : "bg-[#121319] text-white/60 hover:text-white hover:bg-[#1a1c24] border-white/5"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {cat.id === "live" && liveMatches.length > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-red-600 text-white font-black">
                    {liveMatches.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 3. CONTENT AREA: TRAYS OR GRID ================= */}
      {isLoading ? (
        <div className="space-y-8 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="aspect-video w-full rounded-2xl bg-[#14151b] border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : showGrid ? (
        /* ================= GRID VIEW (Filtered by search or specific category) ================= */
        <div>
          <div className="flex items-center justify-between mb-4 text-xs font-semibold text-white/40 px-1">
            <span>
              Showing {filteredMatches.length} {filteredMatches.length === 1 ? "match" : "matches"}
            </span>
          </div>

          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-16">
              {filteredMatches.map((match) => (
                <SportsMatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-3">
              <p className="text-xl font-bold text-white/70">
                {searchQuery
                  ? `No matches found for "${searchQuery}"`
                  : "No matches found in this category"}
              </p>
              <p className="text-sm text-white/40">
                Check back closer to match start or try resetting your filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= BINGR TRAYS VIEW (Curated horizontal rows) ================= */
        <div className="space-y-10 pb-20">
          {/* Tray: Popular Live Right Now */}
          {liveMatches.length > 0 && (
            <SportsTray
              title="Live Right Now"
              icon={<span className="text-red-500 animate-pulse">🔴</span>}
              matches={liveMatches}
            />
          )}

          {/* Tray: Popular Sports */}
          {popularMatches && popularMatches.length > 0 && (
            <SportsTray
              title="Popular Sports Events"
              icon={<IoFlame className="text-amber-500" />}
              matches={popularMatches}
            />
          )}

          {/* Category-by-Category Trays (Football, Basketball, UFC, F1, Cricket, NFL, etc.) */}
          {categoryTrays.map((tray) => (
            <SportsTray
              key={tray.key}
              title={tray.label}
              icon={tray.icon}
              matches={tray.matches}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SportsHub;
