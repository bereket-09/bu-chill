"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Channel,
  ChannelCategory,
  CHANNEL_CATEGORIES,
  CURATED_CHANNELS,
  POPULAR_M3U_PLAYLISTS,
  getStoredCustomChannels,
  getStoredFavorites,
  saveStoredCustomChannels,
  clearStoredCustomChannels,
  toggleStoredFavorite,
  normalizeCategory,
} from "@/services/iptv";
import { isCurrentProfileKid } from "@/services/profileStorage";
import LivePlayer from "@/components/sections/Live/LivePlayer";
import LiveChannelCard from "@/components/sections/Live/LiveChannelCard";
import CustomM3UModal from "@/components/sections/Live/CustomM3UModal";
import { cn } from "@/utils/helpers";
import { useQueryState } from "nuqs";
import { siteConfig } from "@/config/site";
import { useDocumentTitle } from "@mantine/hooks";
import {
  IoSearchOutline,
  IoClose,
  IoStar,
  IoAddCircleOutline,
  IoAdd,
  IoTrashOutline,
  IoRadioOutline,
  IoGridOutline,
  IoListOutline,
  IoLayersOutline,
  IoFilter,
  IoGlobeOutline,
  IoArrowUp,
} from "react-icons/io5";
import { MdTv, MdOutlineFeaturedPlayList } from "react-icons/md";

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  All: { icon: "📺", label: "All Channels" },
  Favorites: { icon: "⭐", label: "Favorites" },
  News: { icon: "📰", label: "News" },
  Sports: { icon: "⚽", label: "Sports" },
  Movies: { icon: "🎬", label: "Movies" },
  Entertainment: { icon: "🎭", label: "Entertainment" },
  Music: { icon: "🎵", label: "Music" },
  Documentary: { icon: "🌍", label: "Documentary" },
  Kids: { icon: "🧸", label: "Kids" },
};

export default function LiveTvPage() {
  const [channelIdParam, setChannelIdParam] = useQueryState("channel", {
    defaultValue: "sky-news-uk",
  });

  const [customChannels, setCustomChannels] = useState<Channel[]>([]);
  const [playlistChannels, setPlaylistChannels] = useState<Channel[]>(CURATED_CHANNELS);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("iptv-eng");
  const [isLoadingChannels, setIsLoadingChannels] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>("All");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isGrouped, setIsGrouped] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolledPastPlayer, setIsScrolledPastPlayer] = useState(false);
  const playerSectionRef = useRef<HTMLDivElement>(null);

  // Public Satellite Search state (scraped on-demand from iptvcat)
  const [publicResults, setPublicResults] = useState<Channel[]>([]);
  const [isSearchingPublic, setIsSearchingPublic] = useState(false);
  const [publicSearchError, setPublicSearchError] = useState("");
  const [hasSearchedPublic, setHasSearchedPublic] = useState(false);

  // Track if user has scrolled past the main video player using IntersectionObserver (0 scroll lag/flicker)
  useEffect(() => {
    const el = playerSectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolledPastPlayer(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [channelIdParam]);

  // Load favorites & custom channels on mount
  useEffect(() => {
    setFavorites(getStoredFavorites());
    setCustomChannels(getStoredCustomChannels());

    // Check if active profile is kid
    const isKid = isCurrentProfileKid();
    if (isKid) {
      setSelectedCategory("Kids");
    }

    const handleProfileChange = () => {
      const kid = isCurrentProfileKid();
      if (kid) {
        setSelectedCategory("Kids");
      }
    };
    window.addEventListener("buchill_profile_changed", handleProfileChange);
    window.addEventListener("buchill_profiles_updated", handleProfileChange);
    return () => {
      window.removeEventListener("buchill_profile_changed", handleProfileChange);
      window.removeEventListener("buchill_profiles_updated", handleProfileChange);
    };
  }, []);

  // Fetch playlist channels from API (cached server-side M3U feeds)
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingChannels(true);
    fetch(`/api/live/channels?playlist=${selectedPlaylistId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.channels && data.channels.length > 0) {
          setPlaylistChannels(data.channels);
        }
      })
      .catch((err) => {
        console.error("Failed to load playlist channels:", err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingChannels(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedPlaylistId]);

  // Combined channels list (User's Custom Channels + Public Discovered Feeds + Current Playlist Channels)
  const allChannels = useMemo(() => {
    const combined = [...customChannels, ...publicResults, ...playlistChannels];
    const seen = new Set<string>();
    return combined.filter((ch) => {
      if (seen.has(ch.id)) return false;
      seen.add(ch.id);
      return true;
    });
  }, [customChannels, publicResults, playlistChannels]);

  // Available countries with flags and counts
  const availableCountries = useMemo(() => {
    const map = new Map<string, { name: string; code?: string; flag: string; count: number }>();
    allChannels.forEach((c) => {
      const countryName = c.country || "Global";
      const flag = c.countryFlag || (countryName === "Global" ? "🌐" : "");
      const existing = map.get(countryName);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(countryName, {
          name: countryName,
          code: c.countryCode,
          flag,
          count: 1,
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (a.name === "Global") return 1;
      if (b.name === "Global") return -1;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [allChannels]);

  // Channel count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allChannels.forEach((c) => {
      const cat = normalizeCategory(c.group || c.category);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allChannels]);

  // Active playing channel
  const activeChannel = useMemo(() => {
    const found = allChannels.find((ch) => ch.id === channelIdParam);
    return found || allChannels[0] || CURATED_CHANNELS[0];
  }, [allChannels, channelIdParam]);

  useDocumentTitle(`${activeChannel?.name || "Live TV"} | ${siteConfig.name}`);

  // Channel switching handlers: Automatically scroll back to the player smoothly
  const handleSelectChannel = useCallback(
    (channel: Channel) => {
      setChannelIdParam(channel.id);
      if (playerSectionRef.current) {
        playerSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setChannelIdParam]
  );

  const handlePrevChannel = useCallback(() => {
    const currentIndex = allChannels.findIndex((c) => c.id === activeChannel.id);
    const prevIndex = (currentIndex - 1 + allChannels.length) % allChannels.length;
    handleSelectChannel(allChannels[prevIndex]);
  }, [allChannels, activeChannel.id, handleSelectChannel]);

  const handleNextChannel = useCallback(() => {
    const currentIndex = allChannels.findIndex((c) => c.id === activeChannel.id);
    const nextIndex = (currentIndex + 1) % allChannels.length;
    handleSelectChannel(allChannels[nextIndex]);
  }, [allChannels, activeChannel.id, handleSelectChannel]);

  const handleToggleFavorite = useCallback(
    (channelId: string) => {
      toggleStoredFavorite(channelId);
      setFavorites(getStoredFavorites());
    },
    []
  );

  const CHANNELS_PER_PAGE = 48;
  const [visibleCount, setVisibleCount] = useState<number>(CHANNELS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleImportM3U = useCallback(
    (imported: Channel[]) => {
      setIsModalOpen(false);
      // Asynchronously process custom channels so UI thread doesn't freeze or lock modal
      setTimeout(() => {
        saveStoredCustomChannels(imported);
        setCustomChannels(imported);
        if (imported.length > 0) {
          setChannelIdParam(imported[0].id);
        }
      }, 50);
    },
    [setChannelIdParam]
  );

  const handleClearCustom = useCallback(() => {
    clearStoredCustomChannels();
    setCustomChannels([]);
    setChannelIdParam("bbc-news");
  }, [setChannelIdParam]);

  const handleSearchPublic = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsSearchingPublic(true);
    setPublicSearchError("");
    setHasSearchedPublic(true);

    try {
      const res = await fetch(`/api/live/search-public?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error("Search service temporarily unavailable");
      const data = await res.json();
      if (data.success && Array.isArray(data.channels)) {
        setPublicResults(data.channels);
        if (data.channels.length === 0) {
          setPublicSearchError(`No public satellite feeds found for "${trimmed}". Try another title or spelling.`);
        }
      } else {
        setPublicResults([]);
        setPublicSearchError(data.message || "No channels found.");
      }
    } catch (err: unknown) {
      setPublicSearchError(err instanceof Error ? err.message : "Failed to search public feeds.");
      setPublicResults([]);
    } finally {
      setIsSearchingPublic(false);
    }
  }, []);

  const handleSavePublicChannel = useCallback(
    (channel: Channel) => {
      const updated = [channel, ...customChannels.filter((c) => c.id !== channel.id)];
      saveStoredCustomChannels(updated);
      setCustomChannels(updated);
    },
    [customChannels]
  );

  useEffect(() => {
    setPublicSearchError("");
    if (!searchQuery.trim()) {
      setPublicResults([]);
      setHasSearchedPublic(false);
    }
  }, [searchQuery]);

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    return allChannels.filter((ch) => {
      const channelCategory = normalizeCategory(ch.group || ch.category);

      // Category filter
      if (selectedCategory === "Favorites") {
        if (!favorites.includes(ch.id)) return false;
      } else if (selectedCategory !== "All") {
        const matchesCat =
          channelCategory === selectedCategory ||
          (ch.group && ch.group.toLowerCase().includes(selectedCategory.toLowerCase()));
        if (!matchesCat) return false;
      }

      // Country filter
      if (selectedCountry !== "all") {
        const matches =
          ch.country === selectedCountry ||
          ch.countryCode?.toLowerCase() === selectedCountry.toLowerCase();
        if (!matches) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ch.name.toLowerCase().includes(q);
        const matchesCategory = channelCategory.toLowerCase().includes(q);
        const matchesCountry =
          ch.country?.toLowerCase().includes(q) ||
          ch.countryCode?.toLowerCase() === q;
        if (!matchesName && !matchesCategory && !matchesCountry) return false;
      }

      return true;
    });
  }, [allChannels, selectedCategory, selectedCountry, favorites, searchQuery]);

  // Group channels by category
  const groupedChannels = useMemo(() => {
    const map = new Map<string, Channel[]>();
    filteredChannels.forEach((ch) => {
      const cat = normalizeCategory(ch.group || ch.category);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ch);
    });
    return map;
  }, [filteredChannels]);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setVisibleCount(CHANNELS_PER_PAGE);
  }, [selectedCategory, selectedCountry, searchQuery, selectedPlaylistId]);

  // Infinite scroll trigger for smooth lazy loading without blocking the DOM
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + CHANNELS_PER_PAGE, filteredChannels.length));
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredChannels.length]);

  // Paginated channels for high-performance rendering (caps DOM elements)
  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const isFiltering = selectedCategory !== "All" || selectedCountry !== "all" || searchQuery.trim().length > 0;

  return (
    <div className="w-full min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <div className="w-full px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 py-4 sm:py-6 pb-36 md:pb-12 space-y-6 sm:space-y-8 select-none">
        {/* ================= PAGE HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 sm:p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                <MdTv className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Live TV
              </h1>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-red-600 text-white uppercase tracking-wider shadow-md shadow-red-600/50">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                24/7 LIVE
              </span>
            </div>
            <p className="text-white/40 text-xs sm:text-sm mt-1 hidden sm:block">
              Stream 24/7 global news, sports, movies, documentaries, and custom IPTV m3u playlists.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-semibold text-xs sm:text-sm transition-all shadow active:scale-95"
              title="Import Working M3U Playlists or Custom Channels"
              aria-label="Import Working M3U Playlists"
            >
              <IoAddCircleOutline className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span>Import M3U / Channels</span>
            </button>

            {customChannels.length > 0 && (
              <button
                type="button"
                onClick={handleClearCustom}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-xs transition-colors"
                title="Reset custom imported channels"
              >
                <IoTrashOutline className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= HERO STREAM PLAYER ================= */}
        {activeChannel && (
          <div ref={playerSectionRef} className="space-y-3 scroll-mt-6">
            <LivePlayer
              channel={activeChannel}
              channels={allChannels}
              onSelectChannel={handleSelectChannel}
              onPrevChannel={handlePrevChannel}
              onNextChannel={handleNextChannel}
              isFavorite={favorites.includes(activeChannel.id)}
              onToggleFavorite={() => handleToggleFavorite(activeChannel.id)}
            />
          </div>
        )}

        {/* ================= CONTROLS: STREAMLINED SEARCH & FILTER TOOLBAR ================= */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Live Search Input */}
            <div className="flex items-center bg-[#121319] rounded-xl border border-white/10 focus-within:border-white/30 px-3.5 py-2 flex-1 min-w-[180px] shadow">
              <IoSearchOutline className="w-4 h-4 text-white/40 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels or country..."
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-white placeholder-white/40 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-white/40 hover:text-white p-0.5 rounded-full"
                  aria-label="Clear search"
                >
                  <IoClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Playlist Feed Selector */}
            <div className="flex items-center bg-[#121319] border border-white/10 rounded-xl px-2.5 sm:px-3 py-2 gap-1.5 text-xs shrink-0">
              <MdOutlineFeaturedPlayList className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[130px] sm:max-w-none truncate"
                aria-label="Select M3U Playlist Feed"
              >
                {POPULAR_M3U_PLAYLISTS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#121319] text-white">
                    {p.name} ({p.channelCountEstimate})
                  </option>
                ))}
              </select>
              {isLoadingChannels && (
                <span className="w-2 h-2 rounded-full bg-primary animate-ping shrink-0" />
              )}
            </div>

            {/* Country / Region Filter Dropdown */}
            {availableCountries.length > 0 && (
              <div className="flex items-center bg-[#121319] border border-white/10 rounded-xl px-2.5 sm:px-3 py-2 gap-1.5 text-xs shrink-0">
                <IoGlobeOutline className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[130px] sm:max-w-none truncate"
                  aria-label="Filter by Country"
                >
                  <option value="all" className="bg-[#121319] text-white">
                    🌐 All Regions ({allChannels.length.toLocaleString()})
                  </option>
                  {availableCountries.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#121319] text-white">
                      {c.flag ? `${c.flag} ` : ""}{c.name} ({c.count.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center bg-[#121319] p-0.5 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === "grid"
                    ? "bg-white text-black shadow"
                    : "text-white/50 hover:text-white"
                )}
                title="Grid View (Channel Tiles)"
                aria-label="Grid View"
              >
                <IoGridOutline className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === "list"
                    ? "bg-white text-black shadow"
                    : "text-white/50 hover:text-white"
                )}
                title="List View (Channel Guide)"
                aria-label="List View"
              >
                <IoListOutline className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* Optional Grouping Toggle (active when on 'All' channels and not searching) */}
            {!isFiltering && (
              <button
                type="button"
                onClick={() => setIsGrouped((prev) => !prev)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0",
                  isGrouped
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-[#121319] text-white/40 border-white/10 hover:text-white"
                )}
                title={isGrouped ? "Show flat layout" : "Group by Category"}
                aria-label="Toggle Category Grouping"
              >
                <IoLayersOutline className="w-4 h-4" />
                <span className="hidden md:inline">{isGrouped ? "Grouped" : "Flat"}</span>
              </button>
            )}
          </div>

          {/* Category Selector Pills Carousel */}
          <div
            className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 snap-x"
            style={{ scrollbarWidth: "none" }}
          >
            {CHANNEL_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const meta = CATEGORY_META[cat] || { icon: "📺", label: cat };
              const count =
                cat === "All"
                  ? allChannels.length
                  : cat === "Favorites"
                  ? favorites.length
                  : categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border select-none",
                    isActive
                      ? "bg-white text-black border-white shadow-md scale-[1.02]"
                      : "bg-[#121319] text-white/60 hover:text-white hover:bg-[#1a1c24] border-white/5"
                  )}
                >
                  <span className="text-sm">{meta.icon}</span>
                  <span>{cat}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-black",
                        isActive ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Quick Global Public Search Suggestion Bar */}
          {searchQuery.trim().length > 1 && (
            <div className="flex items-center justify-between gap-2 px-1 pt-1 text-xs flex-wrap">
              <span className="text-white/40">
                Found {filteredChannels.length} in current playlist
              </span>
              <button
                type="button"
                onClick={() => handleSearchPublic(searchQuery)}
                disabled={isSearchingPublic}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSearchingPublic ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <span>Scanning 20,000+ Satellites...</span>
                  </>
                ) : (
                  <>
                    <IoGlobeOutline className="w-3.5 h-3.5" />
                    <span>Search 20,000+ Public Streams for "{searchQuery}"</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ================= DISCOVERED PUBLIC SATELLITE CHANNELS SHELF ================= */}
        {publicResults.length > 0 && (
          <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-primary/[0.09] to-transparent border border-primary/25 space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/20 pb-3">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-primary/20 text-primary text-base">🛰️</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <span>Discovered Global Satellite Streams</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      {publicResults.length} found
                    </span>
                  </h3>
                  <p className="text-xs text-white/50">
                    Live public broadcast feeds found on iptvcat matching "{searchQuery}"
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPublicResults([]);
                  setHasSearchedPublic(false);
                }}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <IoClose className="w-4 h-4" />
                <span>Dismiss Results</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
              {publicResults.map((ch, idx) => (
                <div key={ch.id} className="relative group">
                  <LiveChannelCard
                    channel={ch}
                    variant="grid"
                    index={idx}
                    isActive={ch.id === activeChannel.id}
                    isFavorite={favorites.includes(ch.id)}
                    onSelect={() => handleSelectChannel(ch)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(ch.id);
                    }}
                  />
                  {/* Quick save button to store channel permanently */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSavePublicChannel(ch);
                    }}
                    className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-white/70 hover:text-primary hover:border-primary opacity-0 group-hover:opacity-100 transition-all text-xs cursor-pointer shadow-lg"
                    title="Save permanently to My Custom Channels"
                  >
                    <IoAdd className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= CHANNELS DISPLAY ================= */}
        {filteredChannels.length === 0 ? (
          <div className="py-20 text-center space-y-6 max-w-xl mx-auto px-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-3xl bg-white/[0.04] border border-white/10 text-white/40">
                <IoRadioOutline className="w-12 h-12" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xl font-extrabold text-white tracking-tight">
                {searchQuery
                  ? `No channels found in current playlist for "${searchQuery}"`
                  : "No channels found in this selection"}
              </p>
              <p className="text-xs text-white/50 leading-relaxed">
                {searchQuery
                  ? "This channel might not be in the current playlist. Search the global IPTV satellite directory to find and play public live streams."
                  : "Try adjusting your category or country filters."}
              </p>
            </div>

            {searchQuery.trim().length > 0 && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSearchPublic(searchQuery)}
                  disabled={isSearchingPublic}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 active:scale-95 text-black font-extrabold text-xs shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSearchingPublic ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                      <span>Scanning 20,000+ Global Satellites...</span>
                    </>
                  ) : (
                    <>
                      <IoGlobeOutline className="w-4 h-4 text-black" />
                      <span>Search Global Public Streams for "{searchQuery}"</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setSelectedCountry("all");
                    setPublicResults([]);
                    setHasSearchedPublic(false);
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {publicSearchError && (
              <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl py-2.5 px-4 max-w-md mx-auto">
                {publicSearchError}
              </p>
            )}
          </div>
        ) : isGrouped && !isFiltering ? (
          /* ================= GROUPED BY CATEGORY VIEW ================= */
          <div className="space-y-8 pb-36 md:pb-12">
            {Array.from(groupedChannels.entries()).map(([catName, channels]) => {
              const meta = CATEGORY_META[catName] || { icon: "📺", label: catName };
              return (
                <section key={catName} className="space-y-4">
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{meta.icon}</span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                        {catName} Channels
                      </h3>
                      <span className="text-xs font-bold text-white/50 px-2 py-0.5 rounded-full bg-white/10">
                        {channels.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory(catName as ChannelCategory)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>View All {catName} ({channels.length})</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  {/* Channel Cards (Grid vs List) - capped per shelf for 60fps performance */}
                  {(() => {
                    const shelfLimit = 14;
                    const shelfChannels = channels.slice(0, shelfLimit);
                    const hasMore = channels.length > shelfLimit;

                    return viewMode === "grid" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
                        {shelfChannels.map((ch, idx) => (
                          <LiveChannelCard
                            key={ch.id}
                            channel={ch}
                            variant="grid"
                            index={idx}
                            isActive={ch.id === activeChannel.id}
                            isFavorite={favorites.includes(ch.id)}
                            onSelect={() => handleSelectChannel(ch)}
                            onToggleFavorite={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(ch.id);
                            }}
                          />
                        ))}
                        {hasMore && (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(catName as ChannelCategory)}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] hover:bg-white/10 hover:border-primary/50 text-white/70 hover:text-white transition-all group aspect-[16/10] sm:aspect-auto"
                          >
                            <span className="text-xl mb-1 group-hover:scale-110 transition-transform">➡️</span>
                            <span className="text-xs font-bold text-center">+{channels.length - shelfLimit} More</span>
                            <span className="text-[10px] text-primary mt-0.5 font-semibold">View All</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {shelfChannels.map((ch, idx) => (
                          <LiveChannelCard
                            key={ch.id}
                            channel={ch}
                            variant="list"
                            index={idx}
                            isActive={ch.id === activeChannel.id}
                            isFavorite={favorites.includes(ch.id)}
                            onSelect={() => handleSelectChannel(ch)}
                            onToggleFavorite={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(ch.id);
                            }}
                          />
                        ))}
                        {hasMore && (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(catName as ChannelCategory)}
                            className="w-full py-2.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/10 text-center text-xs font-bold text-primary transition-all"
                          >
                            View All {channels.length} {catName} Channels &rarr;
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </section>
              );
            })}
          </div>
        ) : (
          /* ================= UNIFIED (FLAT) VIEW WITH INFINITE LAZY LOADING ================= */
          <div className="space-y-3 pb-36 md:pb-12">
            <div className="flex items-center justify-between text-xs font-semibold text-white/40 px-1">
              <span>
                Showing {displayedChannels.length} of {filteredChannels.length}{" "}
                {filteredChannels.length === 1 ? "channel" : "channels"}
              </span>
              {displayedChannels.length < filteredChannels.length && (
                <span className="text-primary font-normal">
                  Scroll down for more
                </span>
              )}
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
                {displayedChannels.map((ch, idx) => (
                  <LiveChannelCard
                    key={ch.id}
                    channel={ch}
                    variant="grid"
                    index={idx}
                    isActive={ch.id === activeChannel.id}
                    isFavorite={favorites.includes(ch.id)}
                    onSelect={() => handleSelectChannel(ch)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(ch.id);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {displayedChannels.map((ch, idx) => (
                  <LiveChannelCard
                    key={ch.id}
                    channel={ch}
                    variant="list"
                    index={idx}
                    isActive={ch.id === activeChannel.id}
                    isFavorite={favorites.includes(ch.id)}
                    onSelect={() => handleSelectChannel(ch)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(ch.id);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Infinite Scroll Sentinel & Load More Trigger */}
            {displayedChannels.length < filteredChannels.length && (
              <div ref={loadMoreRef} className="py-8 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(prev + CHANNELS_PER_PAGE, filteredChannels.length)
                    )
                  }
                  className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>
                    Load More Channels ({filteredChannels.length - displayedChannels.length} remaining)
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Custom M3U Playlist Import Modal */}
        <CustomM3UModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddChannels={handleImportM3U}
          onClearCustomChannels={handleClearCustom}
          customChannelCount={customChannels.length}
        />

        {/* Floating Quick Return to Player when scrolled down */}
        {isScrolledPastPlayer && activeChannel && (
          <button
            type="button"
            onClick={() => {
              if (playerSectionRef.current) {
                playerSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#121319]/95 backdrop-blur-md border border-primary/50 text-white shadow-2xl shadow-black/80 hover:border-primary hover:bg-[#181a24] hover:scale-105 active:scale-95 transition-all group cursor-pointer"
            title="Scroll back to Live Player"
            aria-label="Scroll back to Live Player"
          >
            <span className="flex items-center gap-1.5 text-primary text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              LIVE
            </span>
            <span className="text-xs font-bold text-white/90 max-w-[140px] sm:max-w-[200px] truncate">
              {activeChannel.name}
            </span>
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 group-hover:bg-primary group-hover:text-black transition-colors text-xs ml-0.5">
              <IoArrowUp className="w-3.5 h-3.5" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
