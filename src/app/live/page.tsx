"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Channel,
  ChannelCategory,
  CHANNEL_CATEGORIES,
  CURATED_CHANNELS,
  getStoredCustomChannels,
  getStoredFavorites,
  saveStoredCustomChannels,
  clearStoredCustomChannels,
  toggleStoredFavorite,
} from "@/services/iptv";
import LivePlayer from "@/components/sections/Live/LivePlayer";
import LiveChannelCard from "@/components/sections/Live/LiveChannelCard";
import CustomM3UModal from "@/components/sections/Live/CustomM3UModal";
import { useQueryState } from "nuqs";
import { siteConfig } from "@/config/site";
import { useDocumentTitle } from "@mantine/hooks";
import {
  IoSearchOutline,
  IoClose,
  IoStar,
  IoAddCircleOutline,
  IoTrashOutline,
  IoRadioOutline,
  IoGridOutline,
  IoLayersOutline,
  IoFilter,
  IoGlobeOutline,
} from "react-icons/io5";
import { MdTv } from "react-icons/md";

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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>("All");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grouped" | "grid">("grouped");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load favorites & custom channels on mount
  useEffect(() => {
    setFavorites(getStoredFavorites());
    setCustomChannels(getStoredCustomChannels());
  }, []);

  // Combined channels list (Curated + User's Custom Channels)
  const allChannels = useMemo(() => {
    const combined = [...customChannels, ...CURATED_CHANNELS];
    const seen = new Set<string>();
    return combined.filter((ch) => {
      if (seen.has(ch.id)) return false;
      seen.add(ch.id);
      return true;
    });
  }, [customChannels]);

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
      const cat = c.group || c.category || "General";
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
      const channelCategory = ch.group || ch.category || "";

      // Category filter
      if (selectedCategory === "Favorites") {
        if (!favorites.includes(ch.id)) return false;
      } else if (selectedCategory !== "All" && channelCategory !== selectedCategory) {
        return false;
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
      const cat = ch.group || ch.category || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ch);
    });
    return map;
  }, [filteredChannels]);

  const isFiltering = selectedCategory !== "All" || selectedCountry !== "all" || searchQuery.trim().length > 0;

  return (
    <div className="w-full min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <div className="w-full px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 py-6 space-y-8 select-none">
        {/* ================= PAGE HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                <MdTv className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Live TV Channels
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white uppercase tracking-wider animate-pulse shadow-md shadow-red-600/50">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                24/7 LIVE
              </span>
            </div>
            <p className="text-white/40 text-xs sm:text-sm mt-1">
              Stream 24/7 global news, sports, movies, documentaries, and custom IPTV m3u playlists.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm transition-all shadow"
            >
              <IoAddCircleOutline className="w-4 h-4 text-primary" />
              <span>Import M3U Playlist</span>
            </button>

            {customChannels.length > 0 && (
              <button
                type="button"
                onClick={handleClearCustom}
                className="p-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-xs transition-colors"
                title="Clear imported playlist"
              >
                <IoTrashOutline className="w-4 h-4" />
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

        {/* ================= CONTROLS: CATEGORY SELECTOR & FILTER SUITE ================= */}
        <div className="space-y-4 pt-2">
          {/* Upper Filter Bar: Search + Category Select Dropdown + Country Filter + View Mode */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Live Search Input */}
            <div className="flex items-center bg-[#121319] rounded-xl border border-white/10 focus-within:border-white/30 px-3.5 py-2.5 max-w-md w-full shadow">
              <IoSearchOutline className="w-4 h-4 text-white/40 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channel name, country, or category..."
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

            {/* Filter Dropdowns & View Mode */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Category Selector Dropdown */}
              <div className="flex items-center bg-[#121319] border border-white/10 rounded-xl px-3 py-2 gap-2 text-xs">
                <IoFilter className="w-3.5 h-3.5 text-white/40" />
                <span className="text-white/40 font-medium hidden sm:inline">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ChannelCategory)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  aria-label="Filter by Category"
                >
                  {CHANNEL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#121319] text-white">
                      {cat === "All"
                        ? `All Categories (${allChannels.length})`
                        : cat === "Favorites"
                        ? `⭐ Favorites (${favorites.length})`
                        : `${cat} (${categoryCounts[cat] || 0})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country / Region Filter Dropdown */}
              {availableCountries.length > 0 && (
                <div className="flex items-center bg-[#121319] border border-white/10 rounded-xl px-3 py-2 gap-2 text-xs">
                  <IoGlobeOutline className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/40 font-medium hidden sm:inline">Country:</span>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                    aria-label="Filter by Country"
                  >
                    <option value="all" className="bg-[#121319] text-white">
                      All Regions ({allChannels.length})
                    </option>
                    {availableCountries.map((c) => (
                      <option key={c} value={c} className="bg-[#121319] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* View Mode Toggle: Grouped Sections vs Grid */}
              <div className="flex items-center bg-[#121319] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode("grouped")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "grouped" && !isFiltering
                      ? "bg-white text-black shadow"
                      : "text-white/50 hover:text-white"
                  }`}
                  title="Group by Category"
                >
                  <IoLayersOutline className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">By Category</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "grid" || isFiltering
                      ? "bg-white text-black shadow"
                      : "text-white/50 hover:text-white"
                  }`}
                  title="Unified Grid"
                >
                  <IoGridOutline className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Category Selector Pills Carousel */}
          <div
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1"
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-white text-black border-white shadow-md scale-105"
                      : "bg-[#121319] text-white/60 hover:text-white hover:bg-[#1a1c24] border-white/5"
                  }`}
                >
                  <span className="text-sm">{meta.icon}</span>
                  <span>{cat}</span>
                  {count > 0 && (
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
                      }`}
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
        ) : viewMode === "grouped" && !isFiltering ? (
          /* ================= GROUPED BY CATEGORY VIEW ================= */
          <div className="space-y-10 pb-20">
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

                  {/* Channel Cards Grid for this category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
                    {channels.map((ch) => (
                      <LiveChannelCard
                        key={ch.id}
                        channel={ch}
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
                </section>
              );
            })}
          </div>
        ) : (
          /* ================= UNIFIED GRID VIEW ================= */
          <div className="space-y-3 pb-20">
            <div className="text-xs font-semibold text-white/40 px-1">
              Showing {filteredChannels.length} {filteredChannels.length === 1 ? "channel" : "channels"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
              {filteredChannels.map((ch) => (
                <LiveChannelCard
                  key={ch.id}
                  channel={ch}
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
