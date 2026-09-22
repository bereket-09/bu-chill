"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Select,
  SelectItem,
  addToast,
  Spinner,
} from "@heroui/react";
import {
  FaPlay,
  FaTrash,
  FaGear,
  FaFilm,
  FaTv,
  FaClock,
  FaCheck,
  FaClockRotateLeft,
} from "react-icons/fa6";
import { LuPopcorn, LuUsers } from "react-icons/lu";
import { IoChevronBack, IoChevronForward, IoGrid, IoMenuOutline } from "react-icons/io5";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import {
  DEFAULT_AVATAR_ID,
  resolveAvatarUrl,
} from "@/constants/avatars";
import { cn } from "@/utils/helpers";
import {
  getActiveProfileId,
  getProfileWatchlist,
  saveProfileWatchlist,
  removeFromProfileWatchlist,
  clearProfileWatchlist,
  getProfileHistory,
  saveProfileHistory,
  saveProfileHistoryItem,
  removeFromProfileHistory,
  clearProfileHistory,
  setProfileHistoryItemCompleted,
  updateProfileWatchlistStatus,
  getUserProfiles,
  switchActiveProfile,
  UserProfileItem,
  ProfileWatchlistItem,
  ProfileHistoryItem,
} from "@/services/profileStorage";
import { getUserHistories, getMediaArt } from "@/actions/histories";
import { getWatchlist } from "@/actions/library";
import { formatDuration, getImageUrl } from "@/utils/movies";
import ConfirmationModal from "@/components/ui/overlay/ConfirmationModal";
import { useDisclosure } from "@mantine/hooks";

type ContentFilter = "all" | "movie" | "tv";
type LibraryStatusFilter = "all" | "watching" | "watchlist" | "planned" | "watched";
type SortOption = "created_at" | "vote_average" | "release_date" | "title";
type ViewLayout = "grid" | "shelf";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "created_at", label: "Date Added" },
  { key: "vote_average", label: "Rating" },
  { key: "release_date", label: "Release Date" },
  { key: "title", label: "Title" },
];

interface UnifiedLibraryItem {
  key: string;
  media_id: number;
  type: "movie" | "tv";
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  created_at?: string;
  updated_at?: string;
  duration: number;
  last_position: number;
  season?: number;
  episode?: number;
  completed: boolean;
  isWatching: boolean;
  isWatchlist: boolean;
  isPlanned: boolean;
  isWatched: boolean;
  primaryStatus: "watching" | "watchlist" | "planned" | "watched";
}

export const MySpace: React.FC = () => {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/auth");
    }
  }, [isUserLoading, user, router]);

  // Profile state
  const [profiles, setProfiles] = useState<UserProfileItem[]>([]);
  const [activeProfileId, setActiveId] = useState<string>("main");

  // Filters & Layout
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<LibraryStatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("created_at");
  const [viewLayout, setViewLayout] = useState<ViewLayout>("grid");

  // Profile data
  const [watchlistItems, setWatchlistItems] = useState<ProfileWatchlistItem[]>([]);
  const [historyItems, setHistoryItems] = useState<ProfileHistoryItem[]>([]);

  // Shelf ref for horizontal scrolling
  const shelfScrollRef = useRef<HTMLDivElement>(null);

  const scrollShelf = (direction: "left" | "right") => {
    if (!shelfScrollRef.current) return;
    const distance = shelfScrollRef.current.clientWidth * 0.75;
    shelfScrollRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  // Confirmation Modal
  const [clearModalOpened, { open: openClearModal, close: closeClearModal }] =
    useDisclosure(false);

  // Load profiles on mount / user change
  useEffect(() => {
    if (!user) return;
    const loadedProfiles = getUserProfiles(user.id, user.username);
    setProfiles(loadedProfiles);
    const currentActiveId = getActiveProfileId(user.id);
    setActiveId(currentActiveId);
  }, [user]);

  // Reload profile-specific data whenever active profile or user changes
  const reloadData = () => {
    const uid = user?.id || "guest";
    const currentPid = getActiveProfileId(uid);
    setActiveId(currentPid);

    const wList = getProfileWatchlist(uid, currentPid);
    setWatchlistItems(wList);

    const hList = getProfileHistory(uid, currentPid);
    setHistoryItems(hList);

    // Sync with Supabase ONLY for the primary main profile
    if (!user || currentPid !== "main") return;

    getUserHistories(50)
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setHistoryItems((prev) => {
            const map = new Map<string, ProfileHistoryItem>();
            prev.forEach((item) => {
              const key = `${item.type}-${item.media_id}-${item.season || 0}-${item.episode || 0}`;
              map.set(key, item);
            });
            res.data!.forEach((s) => {
              const key = `${s.type}-${s.media_id}-${s.season || 0}-${s.episode || 0}`;
              if (!map.has(key)) {
                map.set(key, {
                  id: s.id || s.media_id,
                  media_id: s.media_id,
                  type: (s.type === "tv" ? "tv" : "movie") as "movie" | "tv",
                  title: s.title,
                  poster_path: s.poster_path || undefined,
                  backdrop_path: s.backdrop_path || undefined,
                  duration: s.duration,
                  last_position: s.last_position,
                  completed: s.completed,
                  season: s.season,
                  episode: s.episode,
                  updated_at: s.updated_at,
                });
              } else {
                const existing = map.get(key)!;
                if (!existing.backdrop_path && s.backdrop_path) {
                  existing.backdrop_path = s.backdrop_path;
                }
                if (!existing.poster_path && s.poster_path) {
                  existing.poster_path = s.poster_path;
                }
              }
            });
            const merged = Array.from(map.values());
            if (currentPid === "main") {
              saveProfileHistory(user.id, "main", merged);
            }
            return merged;
          });
        }
      })
      .catch(() => {});

    getWatchlist("all", 1, 100)
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setWatchlistItems((prev) => {
            const map = new Map<string, ProfileWatchlistItem>();
            prev.forEach((item) => map.set(`${item.type}-${item.id}`, item));
            res.data!.forEach((s) => {
              const key = `${s.type}-${s.id}`;
              if (!map.has(key)) {
                map.set(key, {
                  id: s.id,
                  type: s.type,
                  title: s.title,
                  poster_path: s.poster_path || null,
                  backdrop_path: s.backdrop_path,
                  release_date: s.release_date,
                  vote_average: s.vote_average,
                  adult: s.adult,
                  created_at: s.created_at,
                });
              }
            });
            const merged = Array.from(map.values());
            if (currentPid === "main" && prev.length === 0) {
              saveProfileWatchlist(user.id, "main", merged);
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    reloadData();

    // Listen for custom events
    const handleProfileChange = () => {
      if (user?.id) {
        setProfiles(getUserProfiles(user.id, user.username));
      }
      reloadData();
    };
    const handleProfilesUpdate = () => {
      if (user?.id) {
        setProfiles(getUserProfiles(user.id, user.username));
      }
      reloadData();
    };
    const handleWatchlistChange = () => reloadData();
    const handleHistoryChange = () => reloadData();

    window.addEventListener("buchill_profile_changed", handleProfileChange);
    window.addEventListener("buchill_profiles_updated", handleProfilesUpdate);
    window.addEventListener("buchill_watchlist_changed", handleWatchlistChange);
    window.addEventListener("buchill_history_changed", handleHistoryChange);

    return () => {
      window.removeEventListener("buchill_profile_changed", handleProfileChange);
      window.removeEventListener("buchill_profiles_updated", handleProfilesUpdate);
      window.removeEventListener("buchill_watchlist_changed", handleWatchlistChange);
      window.removeEventListener("buchill_history_changed", handleHistoryChange);
    };
  }, [user, activeProfileId]);

  // Auto-repair missing artwork for items
  useEffect(() => {
    const missing = historyItems.filter((h) => !h.backdrop_path && !h.poster_path);
    if (missing.length === 0) return;

    missing.forEach(async (item) => {
      try {
        const art = await getMediaArt(Number(item.media_id), item.type, item.season, item.episode);
        if (art.backdrop_path || art.poster_path) {
          const uid = user?.id || "guest";
          const pid = activeProfileId;
          saveProfileHistoryItem(uid, pid, {
            media_id: Number(item.media_id),
            type: item.type,
            season: item.season,
            episode: item.episode,
            title: art.title || item.title,
            backdrop_path: art.backdrop_path,
            poster_path: art.poster_path,
            duration: item.duration,
            last_position: item.last_position,
            completed: item.completed,
          });
          setHistoryItems((prev) =>
            prev.map((h) => {
              if (
                h.media_id === item.media_id &&
                h.type === item.type &&
                (item.type !== "tv" || (h.season === item.season && h.episode === item.episode))
              ) {
                return {
                  ...h,
                  backdrop_path: art.backdrop_path || h.backdrop_path,
                  poster_path: art.poster_path || h.poster_path,
                  title: art.title || h.title,
                };
              }
              return h;
            })
          );
        }
      } catch (err) {
        console.warn("Failed to backfill media art:", err);
      }
    });
  }, [historyItems, user?.id, activeProfileId]);

  // Current active profile object
  const activeProfile = useMemo(() => {
    return (
      profiles.find((p) => p.id === activeProfileId) ||
      profiles[0] || { id: "main", name: "User", avatar: DEFAULT_AVATAR_ID }
    );
  }, [profiles, activeProfileId]);

  // Unified Media Collection (combines history and watchlist items into one cohesive list)
  const unifiedMediaList = useMemo(() => {
    const map = new Map<string, UnifiedLibraryItem>();

    // 1. Process history items
    historyItems.forEach((h) => {
      const mediaId = Number(h.media_id);
      const key = `${h.type}-${mediaId}`;
      // Only considered watched if explicitly marked completed by user
      const isCompleted = Boolean(h.completed);
      // As requested: keep it in watching only unless user explicitly moved to watched
      const isWatching = !isCompleted;
      const isWatched = isCompleted;

      map.set(key, {
        key,
        media_id: mediaId,
        type: h.type,
        title: h.title,
        poster_path: h.poster_path,
        backdrop_path: h.backdrop_path,
        duration: h.duration || 0,
        last_position: h.last_position || 0,
        season: h.season,
        episode: h.episode,
        completed: isCompleted,
        updated_at: h.updated_at,
        created_at: h.updated_at,
        isWatching,
        isWatchlist: false,
        isPlanned: false,
        isWatched,
        primaryStatus: isWatching ? "watching" : "watched",
      });
    });

    // 2. Process watchlist items
    watchlistItems.forEach((w) => {
      const mediaId = Number(w.id);
      const key = `${w.type}-${mediaId}`;
      const status = w.status || "watchlist";
      const isPlanned = status === "planned";
      const isWatched = status === "completed";
      const isWatchlist = status === "watchlist" || (!isPlanned && !isWatched);

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.isWatchlist = existing.isWatchlist || isWatchlist;
        existing.isPlanned = existing.isPlanned || isPlanned;
        existing.isWatched = existing.isWatched || isWatched;
        if (!existing.poster_path && w.poster_path) existing.poster_path = w.poster_path;
        if (!existing.backdrop_path && w.backdrop_path) existing.backdrop_path = w.backdrop_path;
        if (!existing.title && w.title) existing.title = w.title;
        if (w.release_date) existing.release_date = w.release_date;
        if (w.vote_average) existing.vote_average = w.vote_average;
        if (w.created_at) existing.created_at = w.created_at;

        // Keep in watching only unless explicitly moved to watched
        if (existing.isWatching) {
          existing.primaryStatus = "watching";
        } else {
          existing.primaryStatus = isWatched ? "watched" : isPlanned ? "planned" : "watchlist";
        }
      } else {
        map.set(key, {
          key,
          media_id: mediaId,
          type: w.type,
          title: w.title,
          poster_path: w.poster_path,
          backdrop_path: w.backdrop_path,
          release_date: w.release_date,
          vote_average: w.vote_average,
          created_at: w.created_at,
          duration: 0,
          last_position: 0,
          completed: isWatched,
          isWatching: false,
          isWatchlist,
          isPlanned,
          isWatched,
          primaryStatus: isWatched ? "watched" : isPlanned ? "planned" : "watchlist",
        });
      }
    });

    return Array.from(map.values());
  }, [historyItems, watchlistItems]);

  // Status counts for filter pills (respecting current content type filter)
  const statusCounts = useMemo(() => {
    let all = 0;
    let watching = 0;
    let watchlist = 0;
    let planned = 0;
    let watched = 0;

    unifiedMediaList.forEach((item) => {
      if (contentFilter !== "all" && item.type !== contentFilter) return;
      all++;
      if (item.isWatching) watching++;
      if (item.isWatchlist) watchlist++;
      if (item.isPlanned) planned++;
      if (item.isWatched) watched++;
    });

    return { all, watching, watchlist, planned, watched };
  }, [unifiedMediaList, contentFilter]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let list = [...unifiedMediaList];

    // Filter by content type
    if (contentFilter !== "all") {
      list = list.filter((item) => item.type === contentFilter);
    }

    // Filter by library status
    if (statusFilter !== "all") {
      list = list.filter((item) => {
        switch (statusFilter) {
          case "watching":
            return item.isWatching;
          case "watchlist":
            return item.isWatchlist;
          case "planned":
            return item.isPlanned;
          case "watched":
            return item.isWatched;
          default:
            return true;
        }
      });
    }

    // Sorting
    return list.sort((a, b) => {
      switch (sortOption) {
        case "vote_average":
          return (b.vote_average || 0) - (a.vote_average || 0);
        case "release_date":
          return new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime();
        case "created_at": {
          const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
          const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
          return timeB - timeA;
        }
        case "title":
        default:
          return (a.title || "").localeCompare(b.title || "");
      }
    });
  }, [unifiedMediaList, contentFilter, statusFilter, sortOption]);

  // Remove single item from profile library
  const handleRemoveItem = (item: UnifiedLibraryItem) => {
    if (!user) return;
    const uid = user.id;
    const pid = activeProfileId;

    // Remove from watchlist
    removeFromProfileWatchlist(uid, pid, item.media_id, item.type);
    // Remove from history
    removeFromProfileHistory(uid, pid, item.media_id, item.type, item.season, item.episode);

    addToast({
      title: `Removed ${item.title} from library`,
      color: "warning",
    });
    reloadData();
  };

  // Move item between Watching and Watched
  const handleToggleWatched = (item: UnifiedLibraryItem, markCompleted: boolean) => {
    if (!user) return;
    const uid = user.id;
    const pid = activeProfileId;

    // Update in profile history
    setProfileHistoryItemCompleted(
      uid,
      pid,
      item.media_id,
      item.type,
      markCompleted,
      item.season,
      item.episode
    );

    // If also in watchlist, update status accordingly
    if (item.isWatchlist || item.isPlanned || item.isWatched) {
      updateProfileWatchlistStatus(
        uid,
        pid,
        item.media_id,
        item.type,
        markCompleted ? "completed" : "watchlist"
      );
    }

    addToast({
      title: markCompleted ? `Moved "${item.title}" to Watched` : `Moved "${item.title}" to Watching`,
      color: markCompleted ? "success" : "primary",
    });
    reloadData();
  };

  // Clear items based on current status filter
  const handleConfirmClear = () => {
    if (!user) return;
    const uid = user.id;
    const pid = activeProfileId;

    if (statusFilter === "all") {
      clearProfileWatchlist(uid, pid, contentFilter);
      clearProfileHistory(uid, pid);
      addToast({
        title: "Cleared all items from library",
        color: "success",
      });
    } else if (statusFilter === "watching") {
      clearProfileHistory(uid, pid);
      addToast({
        title: "Cleared watching history",
        color: "success",
      });
    } else if (statusFilter === "watched") {
      clearProfileHistory(uid, pid);
      addToast({
        title: "Cleared watched history",
        color: "success",
      });
    } else {
      clearProfileWatchlist(uid, pid, contentFilter);
      addToast({
        title: `Cleared ${statusFilter} items`,
        color: "success",
      });
    }

    closeClearModal();
    reloadData();
  };

  if (isUserLoading) {
    return (
      <div className="flex h-[75vh] w-full items-center justify-center">
        <Spinner size="lg" color="primary" label="Loading My Space..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-x-hidden select-none pb-24">
      {/* Bingr-style Top Starfield Background Vignette */}
      <div className="absolute top-0 left-0 right-0 h-[380px] pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#181920] via-black/95 to-black opacity-100" />
        <svg
          className="absolute w-full h-full opacity-35 mix-blend-screen"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="myspace-stars" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle fill="#ffffff" cx="15" cy="15" r="1" opacity="0.9" />
              <circle fill="#ffffff" cx="60" cy="35" r="0.8" opacity="0.5" />
              <circle fill="#ffffff" cx="100" cy="80" r="1.5" opacity="0.3" />
              <circle fill="#ffffff" cx="30" cy="100" r="1" opacity="0.7" />
              <circle fill="#ffffff" cx="110" cy="20" r="0.8" opacity="0.6" />
              <circle fill="#ffffff" cx="50" cy="75" r="0.6" opacity="0.8" />
              <circle fill="#ffffff" cx="8" cy="65" r="1.2" opacity="0.4" />
              <circle fill="#ffffff" cx="85" cy="55" r="0.8" opacity="0.9" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#myspace-stars)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black" />
      </div>

      <div className="relative z-10 w-full pt-8 md:pt-14 px-4 sm:px-8 md:pl-28 md:pr-12">
        {/* ================================================================= */}
        {/* HEADER: USER EMAIL + ROTATING TAGLINE + SWITCH PROFILE & SETTINGS  */}
        {/* ================================================================= */}
        <header className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Prominent Profile Avatar */}
            <div className="relative group shrink-0">
              <img
                src={resolveAvatarUrl(activeProfile.avatar)}
                alt={activeProfile.name}
                className="size-16 sm:size-20 rounded-2xl object-cover ring-2 ring-primary/40 shadow-[0_0_24px_rgba(0,255,200,0.25)] transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 ring-2 ring-black animate-pulse" />
            </div>

            {/* Profile Name & Status */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {activeProfile.name}
                </h1>
                {activeProfile.isMain && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                    Primary
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-white/50">
                Personal Library & Watch Queue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button
                variant="flat"
                size="sm"
                startContent={<LuUsers className="w-3.5 h-3.5 text-white/70" />}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                Switch Profile
              </Button>
            </Link>

            <Link href="/settings">
              <Button
                variant="flat"
                size="sm"
                startContent={<FaGear className="w-3.5 h-3.5 text-white/70" />}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                Settings
              </Button>
            </Link>
          </div>
        </header>

        {/* Profile Switcher Quick Bar (when multi-profile exists) */}
        {profiles.length > 1 && (
          <div className="mb-8 flex flex-wrap items-center gap-2.5 p-2 rounded-2xl bg-white/[0.04] border border-white/10 w-fit max-w-full">
            <span className="text-xs font-bold text-white/50 px-2 uppercase tracking-wider">
              Profile:
            </span>
            {profiles.map((p) => {
              const isCurrent = p.id === activeProfileId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (isCurrent) return;
                    switchActiveProfile(user.id, p.id);
                    addToast({
                      title: `Switched to ${p.name}`,
                      description: "Watch history and library updated",
                      color: "primary",
                    });
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    isCurrent
                      ? "bg-primary text-black shadow-md shadow-primary/25 font-bold"
                      : "bg-white/5 text-white/70 hover:bg-white/15 hover:text-white"
                  )}
                >
                  <img
                    src={resolveAvatarUrl(p.avatar)}
                    alt={p.name}
                    className="size-5 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <span>{p.name}</span>
                </button>
              );
            })}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <LuUsers className="w-3.5 h-3.5" />
              <span>{profiles.length < 5 ? "+ Add Profile" : "Manage"}</span>
            </Link>
          </div>
        )}

        {/* ================================================================= */}
        {/* SINGLE UNIFIED LIBRARY SECTION                                    */}
        {/* ================================================================= */}
        <section className="relative group/shelf mb-16 select-none">
          {/* Section Header & Right-Side Control Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 px-1">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <LuPopcorn className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-white/95">
                My Library
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/70">
                {filteredItems.length}
              </span>
            </div>

            {/* Status Tabs, Type Filters, Sort, View Toggle & Clear */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter Tabs (All, Watching, Watchlist, Planned, Watched) */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  All ({statusCounts.all})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("watching")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === "watching"
                      ? "bg-primary/25 text-primary border border-primary/40 shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <FaPlay className="w-2 h-2 text-primary" />
                  Watching ({statusCounts.watching})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("watchlist")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === "watchlist"
                      ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <LuPopcorn className="w-2.5 h-2.5 text-amber-400" />
                  Watchlist ({statusCounts.watchlist})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("planned")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === "planned"
                      ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <FaClock className="w-2.5 h-2.5 text-indigo-400" />
                  Planned ({statusCounts.planned})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("watched")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === "watched"
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <FaCheck className="w-2.5 h-2.5 text-emerald-400" />
                  Watched ({statusCounts.watched})
                </button>
              </div>

              {/* Type Filters */}
              <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setContentFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    contentFilter === "all"
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setContentFilter("movie")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    contentFilter === "movie"
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <FaFilm className="w-2.5 h-2.5" />
                  Movies
                </button>
                <button
                  type="button"
                  onClick={() => setContentFilter("tv")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    contentFilter === "tv"
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <FaTv className="w-2.5 h-2.5" />
                  TV
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="w-32">
                <Select
                  size="sm"
                  selectedKeys={[sortOption]}
                  onChange={(e) => setSortOption((e.target.value as SortOption) || "created_at")}
                  variant="bordered"
                  className="max-w-xs"
                  aria-label="Sort library"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key}>{opt.label}</SelectItem>
                  ))}
                </Select>
              </div>

              {/* View Layout Toggle (Grid / Shelf) */}
              <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewLayout("grid")}
                  title="Grid View"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewLayout === "grid" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  <IoGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout("shelf")}
                  title="Shelf View"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewLayout === "shelf" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  <IoMenuOutline className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Clear Button */}
              {filteredItems.length > 0 && (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<FaTrash className="w-3 h-3" />}
                  onClick={openClearModal}
                  className="text-xs h-8 px-2.5 cursor-pointer"
                >
                  Clear
                </Button>
              )}

              {/* Shelf Navigation Arrows (only in shelf view) */}
              {viewLayout === "shelf" && filteredItems.length > 0 && (
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    type="button"
                    onClick={() => scrollShelf("left")}
                    aria-label="Scroll left"
                    className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                  >
                    <IoChevronBack className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollShelf("right")}
                    aria-label="Scroll right"
                    className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                  >
                    <IoChevronForward className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cards Container (Responsive Grid OR Horizontal Shelf) */}
          {filteredItems.length > 0 ? (
            <div
              ref={shelfScrollRef}
              className={
                viewLayout === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4"
                  : "flex items-stretch gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-4 pt-1"
              }
              style={viewLayout === "shelf" ? { scrollbarWidth: "none", msOverflowStyle: "none" } : undefined}
            >
              {filteredItems.map((item) => {
                const poster = getImageUrl(item.poster_path || item.backdrop_path || "");
                const year = item.release_date ? new Date(item.release_date).getFullYear() : null;
                const isResume = item.isWatching && item.last_position > 5;
                const resumeLink =
                  item.type === "movie"
                    ? `/movie/${item.media_id}/player?startAt=${item.last_position}`
                    : `/tv/${item.media_id}/${item.season || 1}/${item.episode || 1}/player?startAt=${item.last_position}`;
                const detailLink = item.type === "movie" ? `/movie/${item.media_id}` : `/tv/${item.media_id}`;
                const progressPct =
                  item.duration > 0
                    ? Math.min(100, Math.round((item.last_position / item.duration) * 100))
                    : 0;

                return (
                  <div
                    key={item.key}
                    className={cn(
                      "group relative rounded-xl overflow-hidden bg-neutral-900/60 border border-white/10 transition-all duration-300 hover:border-white/30 hover:-translate-y-1 hover:shadow-2xl flex flex-col",
                      viewLayout === "shelf" && "w-[150px] sm:w-[175px] md:w-[190px] shrink-0"
                    )}
                  >
                    {/* Poster Media Box */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800 flex items-center justify-center">
                      <img
                        src={poster}
                        alt={item.title}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Play / Resume Overlay */}
                      <Link
                        href={isResume ? resumeLink : detailLink}
                        className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                          <FaPlay className="w-4 h-4 ml-0.5" />
                        </div>
                      </Link>

                      {/* Type Badge (TV / Movie) */}
                      <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white border border-white/10">
                        {item.type === "tv" ? "TV" : "Movie"}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={cn(
                          "absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-md",
                          item.isWatching
                            ? "bg-primary text-black font-extrabold"
                            : item.isWatched
                            ? "bg-emerald-500 text-white font-bold"
                            : item.isPlanned
                            ? "bg-indigo-500 text-white font-bold"
                            : "bg-amber-500 text-black font-bold"
                        )}
                      >
                        {item.isWatching
                          ? "Watching"
                          : item.isWatched
                          ? "Watched"
                          : item.isPlanned
                          ? "Planned"
                          : "Watchlist"}
                      </span>

                      {/* TV Season / Episode Info */}
                      {item.type === "tv" && item.season && item.episode && (
                        <span className="absolute top-8 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-amber-400 border border-white/10">
                          S{item.season} E{item.episode}
                        </span>
                      )}

                      {/* Move to Watched / Watching Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleWatched(item, !item.isWatched)}
                        title={item.isWatched ? "Move to Watching" : "Move to Watched"}
                        className="absolute bottom-2 left-2 size-6 rounded-full bg-black/70 hover:bg-emerald-600 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer z-10"
                      >
                        {item.isWatched ? (
                          <FaClockRotateLeft className="w-2.5 h-2.5" />
                        ) : (
                          <FaCheck className="w-2.5 h-2.5" />
                        )}
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item)}
                        title="Remove from library"
                        className="absolute bottom-2 right-2 size-6 rounded-full bg-black/70 hover:bg-red-600 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer z-10"
                      >
                        <FaTrash className="w-2.5 h-2.5" />
                      </button>

                      {/* Progress Bar for Watching */}
                      {isResume && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Metadata Details */}
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <Link href={detailLink}>
                          <h4 className="font-semibold text-sm line-clamp-1 text-white/90 group-hover:text-white transition-colors">
                            {item.title}
                          </h4>
                        </Link>

                        {isResume ? (
                          <p className="text-xs text-primary font-medium mt-1 flex items-center justify-between">
                            <span>Stopped at {formatDuration(item.last_position)}</span>
                            {item.duration > 0 && (
                              <span className="text-white/40">{progressPct}%</span>
                            )}
                          </p>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-white/40 mt-1">
                            {year && <span>{year}</span>}
                            {item.vote_average && item.vote_average > 0 ? (
                              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                ★ {item.vote_average.toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-1 pt-2 border-t border-white/5">
                        {isResume ? (
                          <Link
                            href={resumeLink}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <FaPlay className="w-2 h-2" />
                            Resume
                          </Link>
                        ) : (
                          <Link
                            href={detailLink}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white hover:underline"
                          >
                            <FaPlay className="w-2 h-2" />
                            Watch
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleWatched(item, !item.isWatched)}
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer",
                            item.isWatched
                              ? "text-white/40 hover:text-primary"
                              : "text-emerald-400 hover:text-emerald-300"
                          )}
                        >
                          {item.isWatched ? (
                            <>
                              <FaClockRotateLeft className="w-2.5 h-2.5" />
                              <span>To Watching</span>
                            </>
                          ) : (
                            <>
                              <FaCheck className="w-2.5 h-2.5" />
                              <span>Move Watched</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Contextual Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center my-6">
              <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-3">
                🍿
              </div>
              <h4 className="font-bold text-base text-white">No titles found</h4>
              <p className="text-xs text-white/50 max-w-sm mt-1 mb-5">
                {statusFilter === "all"
                  ? "Your library is empty. Discover movies and TV shows to start watching or saving titles."
                  : `No titles found in "${statusFilter}". Try changing your status or content filter.`}
              </p>
              <div className="flex items-center gap-3">
                <Link href="/movies">
                  <Button color="primary" variant="solid" size="sm" startContent={<FaFilm className="w-3 h-3" />}>
                    Explore Movies
                  </Button>
                </Link>
                <Link href="/tv">
                  <Button color="warning" variant="flat" size="sm" startContent={<FaTv className="w-3 h-3" />}>
                    Explore TV Shows
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Confirmation Modal: Clear Library */}
      <ConfirmationModal
        title={`Clear ${statusFilter === "all" ? "Library" : statusFilter.toUpperCase()}?`}
        isOpen={clearModalOpened}
        onClose={closeClearModal}
        onConfirm={handleConfirmClear}
        confirmLabel="Clear All"
      >
        <p className="text-white/80 text-sm">
          {statusFilter === "all"
            ? `Are you sure you want to clear all ${contentFilter === "all" ? "titles" : contentFilter === "movie" ? "movies" : "TV shows"} from your library for this profile?`
            : `Are you sure you want to clear all ${statusFilter} items for this profile?`}
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default MySpace;
