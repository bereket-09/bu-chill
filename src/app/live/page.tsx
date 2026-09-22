"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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

  // Load favorites & custom channels on mount
  useEffect(() => {
    setFavorites(getStoredFavorites());
    setCustomChannels(getStoredCustomChannels());
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

  // Combined channels list (User's Custom Channels + Current Playlist Channels)
  const allChannels = useMemo(() => {
    const combined = [...customChannels, ...playlistChannels];
    const seen = new Set<string>();
    return combined.filter((ch) => {
      if (seen.has(ch.id)) return false;
      seen.add(ch.id);
      return true;
    });
  }, [customChannels, playlistChannels]);

  // Available countries
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    allChannels.forEach((c) => {
      if (c.country) set.add(c.country);
    });
    return Array.from(set).sort();
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

  // Channel switching handlers
  const handleSelectChannel = useCallback(
    (channel: Channel) => {
      setChannelIdParam(channel.id);
      if (window.innerWidth < 768) {
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

  const handleImportM3U = useCallback(
    (imported: Channel[]) => {
      saveStoredCustomChannels(imported);
      setCustomChannels(imported);
      if (imported.length > 0) {
        setChannelIdParam(imported[0].id);
      }
    },
    [setChannelIdParam]
  );

  const handleClearCustom = useCallback(() => {
    clearStoredCustomChannels();
    setCustomChannels([]);
    setChannelIdParam("bbc-news");
  }, [setChannelIdParam]);

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
      if (selectedCountry !== "all" && ch.country !== selectedCountry) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ch.name.toLowerCase().includes(q);
        const matchesCategory = channelCategory.toLowerCase().includes(q);
        const matchesCountry = ch.country?.toLowerCase().includes(q);
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
          <div className="space-y-3">
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
                <IoGlobeOutline className="w-3.5 h-3.5 text-white/40" />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[100px] sm:max-w-none truncate"
                  aria-label="Filter by Country"
                >
                  <option value="all" className="bg-[#121319] text-white">
                    All Regions
                  </option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c} className="bg-[#121319] text-white">
                      {c}
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
        </div>

        {/* ================= CHANNELS DISPLAY ================= */}
        {filteredChannels.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <div className="flex justify-center">
              <IoRadioOutline className="w-12 h-12 text-white/20" />
            </div>
            <p className="text-xl font-bold text-white/70">
              {searchQuery
                ? `No channels found for "${searchQuery}"`
                : "No channels found in this selection"}
            </p>
            <p className="text-sm text-white/40">
              Try adjusting your category, country filter, or search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedCountry("all");
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
            >
              Reset Filters
            </button>
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
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      View All {catName} &rarr;
                    </button>
                  </div>

                  {/* Channel Cards (Grid vs List) */}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
                      {channels.map((ch, idx) => (
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
                      {channels.map((ch, idx) => (
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
                </section>
              );
            })}
          </div>
        ) : (
          /* ================= UNIFIED (FLAT) VIEW ================= */
          <div className="space-y-3 pb-36 md:pb-12">
            <div className="text-xs font-semibold text-white/40 px-1">
              Showing {filteredChannels.length} {filteredChannels.length === 1 ? "channel" : "channels"}
            </div>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
                {filteredChannels.map((ch, idx) => (
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
                {filteredChannels.map((ch, idx) => (
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
      </div>
    </div>
  );
}
