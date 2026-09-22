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
  Progress,
  Chip,
} from "@heroui/react";
import {
  FaPlay,
  FaTrash,
  FaXmark,
  FaGear,
  FaClockRotateLeft,
  FaFilm,
  FaTv,
  FaStar,
  FaClock,
  FaCheck,
} from "react-icons/fa6";
import { LuPopcorn, LuUsers } from "react-icons/lu";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import {
  DEFAULT_AVATAR_ID,
  resolveAvatarUrl,
} from "@/constants/avatars";
import { UserProfileItem } from "@/components/sections/Profile/ProfileManager";
import {
  getActiveProfileId,
  getProfileWatchlist,
  saveProfileWatchlist,
  removeFromProfileWatchlist,
  clearProfileWatchlist,
  getProfileHistory,
  saveProfileHistory,
  removeFromProfileHistory,
  clearProfileHistory,
  ProfileWatchlistItem,
  ProfileHistoryItem,
} from "@/services/profileStorage";
import { getUserHistories } from "@/actions/histories";
import { getWatchlist } from "@/actions/library";
import { formatDuration, getImageUrl, timeAgo } from "@/utils/movies";
import ConfirmationModal from "@/components/ui/overlay/ConfirmationModal";
import { useDisclosure } from "@mantine/hooks";

const WITTY_TAGLINES = [
  "Pop the popcorn and dramatically lower your standards.",
  "Cheaper than therapy, twice as addictive.",
  "Start watching from where you left off, personalize for kids and more.",
  "99% less buffering, 100% more late night movie binges.",
  "Welcome to your streaming sanctuary. Pants optional.",
  "Cancel your plans. You're not going anywhere anyway.",
  "Go ahead, hit 'Next Episode'. We won't judge your lack of self-control.",
  "Your personal cinema hub, synced across all your devices.",
];

type ContentFilter = "all" | "movie" | "tv";
type SortOption = "created_at" | "vote_average" | "release_date" | "title";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "created_at", label: "Date Added" },
  { key: "vote_average", label: "Rating" },
  { key: "release_date", label: "Release Date" },
  { key: "title", label: "Title" },
];

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

  // Rotating tagline index
  const [taglineIdx, setTaglineIdx] = useState(0);

  // Library & Watchlist filters
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "watchlist" | "planned" | "completed">("all");
  const [sortOption, setSortOption] = useState<SortOption>("created_at");

  // Profile data
  const [watchlistItems, setWatchlistItems] = useState<ProfileWatchlistItem[]>([]);
  const [historyItems, setHistoryItems] = useState<ProfileHistoryItem[]>([]);

  // Horizontal scroll shelf refs
  const watchingScrollRef = useRef<HTMLDivElement>(null);
  const watchlistScrollRef = useRef<HTMLDivElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);

  const scrollShelf = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (!ref.current) return;
    const distance = ref.current.clientWidth * 0.75;
    ref.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  // Confirmation Modals
  const [clearWatchlistOpened, { open: openClearWatchlist, close: closeClearWatchlist }] =
    useDisclosure(false);
  const [clearHistoryOpened, { open: openClearHistory, close: closeClearHistory }] =
    useDisclosure(false);

  // Rotate tagline
  useEffect(() => {
    const timer = setInterval(() => {
      setTaglineIdx((prev) => (prev + 1) % WITTY_TAGLINES.length);
    }, 4800);
    return () => clearInterval(timer);
  }, []);

  // Load profiles on mount / user change
  useEffect(() => {
    if (!user) return;

    const storedProfilesStr = localStorage.getItem(`buchill_profiles_${user.id}`);
    const storedMainAvatar =
      localStorage.getItem(`buchill_avatar_${user.id}`) || DEFAULT_AVATAR_ID;

    let loadedProfiles: UserProfileItem[] = [];
    if (storedProfilesStr) {
      try {
        loadedProfiles = JSON.parse(storedProfilesStr);
      } catch (e) {
        console.error("Failed to parse stored profiles", e);
      }
    }

    if (!loadedProfiles || loadedProfiles.length === 0) {
      loadedProfiles = [
        {
          id: "main",
          name: user.username || "User",
          avatar: storedMainAvatar,
          isMain: true,
        },
        {
          id: "kids",
          name: "Kids & Anime",
          avatar: "08",
        },
        {
          id: "chill",
          name: "Guest Chill",
          avatar: "03",
        },
      ];
      localStorage.setItem(`buchill_profiles_${user.id}`, JSON.stringify(loadedProfiles));
    } else {
      const mainIdx = loadedProfiles.findIndex((p) => p.isMain || p.id === "main");
      if (mainIdx >= 0) {
        loadedProfiles[mainIdx].name = user.username || loadedProfiles[mainIdx].name;
        if (storedMainAvatar) loadedProfiles[mainIdx].avatar = storedMainAvatar;
      }
    }

    setProfiles(loadedProfiles);

    const activeId = getActiveProfileId(user.id);
    setActiveId(activeId);
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
              }
            });
            const merged = Array.from(map.values());
            if (currentPid === "main" && prev.length === 0) {
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
    const handleProfileChange = () => reloadData();
    const handleWatchlistChange = () => reloadData();
    const handleHistoryChange = () => reloadData();

    window.addEventListener("buchill_profile_changed", handleProfileChange);
    window.addEventListener("buchill_watchlist_changed", handleWatchlistChange);
    window.addEventListener("buchill_history_changed", handleHistoryChange);

    return () => {
      window.removeEventListener("buchill_profile_changed", handleProfileChange);
      window.removeEventListener("buchill_watchlist_changed", handleWatchlistChange);
      window.removeEventListener("buchill_history_changed", handleHistoryChange);
    };
  }, [user, activeProfileId]);

  // Current active profile object
  const activeProfile = useMemo(() => {
    return (
      profiles.find((p) => p.id === activeProfileId) ||
      profiles[0] || { id: "main", name: "User", avatar: DEFAULT_AVATAR_ID }
    );
  }, [profiles, activeProfileId]);

  // Continue watching items (in-progress, not completed)
  const continueWatchingItems = useMemo(() => {
    return historyItems.filter((item) => {
      if (item.completed) return false;
      if (item.duration > 0 && item.last_position >= item.duration * 0.92) return false;
      return true;
    });
  }, [historyItems]);

  // Already watched items
  const alreadyWatchedItems = useMemo(() => {
    return historyItems.filter((item) => item.completed || item.last_position >= item.duration * 0.9);
  }, [historyItems]);

  // Status counts for badges
  const statusCounts = useMemo(() => {
    let all = 0;
    let wl = 0;
    let planned = 0;
    let completed = 0;
    watchlistItems.forEach((item) => {
      if (contentFilter !== "all" && item.type !== contentFilter) return;
      all++;
      const s = item.status || "watchlist";
      if (s === "planned") planned++;
      else if (s === "completed") completed++;
      else wl++;
    });
    return { all, wl, planned, completed };
  }, [watchlistItems, contentFilter]);

  // Filtered and sorted watchlist
  const filteredWatchlist = useMemo(() => {
    let list = [...watchlistItems];
    if (contentFilter !== "all") {
      list = list.filter((item) => item.type === contentFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((item) => {
        const s = item.status || "watchlist";
        return s === statusFilter;
      });
    }

    return list.sort((a, b) => {
      switch (sortOption) {
        case "vote_average":
          return (b.vote_average || 0) - (a.vote_average || 0);
        case "release_date":
          return new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime();
        case "created_at":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "title":
        default:
          return (a.title || "").localeCompare(b.title || "");
      }
    });
  }, [watchlistItems, contentFilter, sortOption]);

  // Remove single item from watchlist
  const handleRemoveWatchlistItem = (id: number, type: "movie" | "tv", title: string) => {
    if (!user) return;
    removeFromProfileWatchlist(user.id, activeProfileId, id, type);
    addToast({
      title: `Removed ${title} from watchlist`,
      color: "warning",
    });
    reloadData();
  };

  // Clear entire watchlist for active profile
  const handleConfirmClearWatchlist = () => {
    if (!user) return;
    clearProfileWatchlist(user.id, activeProfileId, contentFilter);
    addToast({
      title: `Cleared ${contentFilter === "all" ? "all items" : contentFilter === "movie" ? "movies" : "TV shows"} from watchlist`,
      color: "success",
    });
    closeClearWatchlist();
    reloadData();
  };

  // Remove single item from continue watching
  const handleRemoveContinueWatching = (
    mediaId: number,
    type: "movie" | "tv",
    season?: number,
    episode?: number
  ) => {
    if (!user) return;
    removeFromProfileHistory(user.id, activeProfileId, mediaId, type, season, episode);
    addToast({
      title: "Removed from continue watching",
      color: "primary",
    });
    reloadData();
  };

  // Clear history
  const handleConfirmClearHistory = () => {
    if (!user) return;
    clearProfileHistory(user.id, activeProfileId);
    addToast({
      title: "Cleared watch history",
      color: "success",
    });
    closeClearHistory();
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
        {/* SECTION 1: HEADER (USER EMAIL + ROTATING WITTY TAGLINE + SETTINGS) */}
        {/* ================================================================= */}
        <header className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            {/* Animated Rotating Tagline */}
            <div className="h-7 overflow-hidden relative">
              <p
                key={taglineIdx}
                className="text-lg sm:text-xl font-bold tracking-tight text-white/90 animate-in fade-in slide-in-from-bottom-2 duration-400"
              >
                {WITTY_TAGLINES[taglineIdx]}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/50">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Signed in as <strong className="text-white/80">{user.email}</strong></span>
              <span className="text-white/30">•</span>
              <span className="inline-flex items-center gap-1.5 text-white/90 font-medium">
                <img
                  src={resolveAvatarUrl(activeProfile.avatar)}
                  alt={activeProfile.name}
                  className="size-4.5 rounded-full object-cover ring-1 ring-white/20"
                />
                <span className="text-primary font-semibold">{activeProfile.name}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button
                variant="flat"
                size="sm"
                startContent={<LuUsers className="w-3.5 h-3.5 text-white/70" />}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold"
              >
                Switch Profile
              </Button>
            </Link>

            <Link href="/settings">
              <Button
                variant="flat"
                size="sm"
                startContent={<FaGear className="w-3.5 h-3.5 text-white/70" />}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold"
              >
                Settings
              </Button>
            </Link>
          </div>
        </header>

        {/* ================================================================= */}
        {/* ROW 1: WATCHING (IN-PROGRESS MEDIA - only if items exist)        */}
        {/* ================================================================= */}
        {continueWatchingItems.length > 0 && (
          <section className="relative group/shelf mb-12 select-none">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
                  <FaPlay className="w-3 h-3 ml-0.5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white/95">
                  Watching
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {continueWatchingItems.length}
                </span>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollShelf(watchingScrollRef, "left")}
                  aria-label="Scroll left"
                  className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                >
                  <IoChevronBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollShelf(watchingScrollRef, "right")}
                  aria-label="Scroll right"
                  className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                >
                  <IoChevronForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={watchingScrollRef}
              className="flex items-stretch gap-4 overflow-x-auto scroll-smooth pb-3 pt-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {continueWatchingItems.map((item) => {
                const redirectLink =
                  item.type === "movie"
                    ? `/movie/${item.media_id}/player${item.last_position > 5 ? `?startAt=${item.last_position}` : ""}`
                    : `/tv/${item.media_id}/${item.season || 1}/${item.episode || 1}/player${item.last_position > 5 ? `?startAt=${item.last_position}` : ""}`;
                const progressPct =
                  item.duration > 0
                    ? Math.min(100, Math.round((item.last_position / item.duration) * 100))
                    : 0;
                const backdrop = getImageUrl(item.backdrop_path || item.poster_path || "");

                return (
                  <div
                    key={`${item.type}-${item.media_id}-${item.season}-${item.episode}`}
                    className="group relative w-[260px] sm:w-[300px] md:w-[320px] shrink-0 rounded-xl overflow-hidden bg-neutral-900/60 border border-white/10 transition-all duration-300 hover:border-white/30 hover:scale-[1.02] hover:shadow-2xl flex flex-col"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                      <img
                        src={backdrop}
                        alt={item.title}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Play Button Overlay */}
                      <Link
                        href={redirectLink}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                          <FaPlay className="w-4 h-4 ml-0.5" />
                        </div>
                      </Link>

                      {/* TV Tag (Season / Episode) */}
                      {item.type === "tv" && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-amber-400 border border-white/10">
                          S{item.season} E{item.episode}
                        </span>
                      )}

                      {/* Time Left Badge */}
                      <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-white/80">
                        {formatDuration(item.last_position)}
                      </span>

                      {/* Dismiss / Remove Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveContinueWatching(
                            item.media_id,
                            item.type,
                            item.season,
                            item.episode
                          )
                        }
                        title="Remove from watching"
                        className="absolute top-2 left-2 size-6 rounded-full bg-black/70 hover:bg-red-600 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <FaXmark className="w-3 h-3" />
                      </button>

                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="p-3.5 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="font-semibold text-sm line-clamp-1 text-white/90 group-hover:text-white transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-white/50 mt-1 flex items-center gap-1.5">
                          <span className="text-primary font-medium">
                            {item.last_position > 5
                              ? `Stopped at ${formatDuration(item.last_position)}`
                              : "Just started"}
                          </span>
                          {item.duration > 0 && (
                            <span className="text-white/40">
                              • {Math.round(progressPct)}% watched
                            </span>
                          )}
                        </p>
                      </div>
                      <Link
                        href={redirectLink}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <FaPlay className="w-2.5 h-2.5" />
                        Resume Playing
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* ROW 2: WATCHLIST & STATUS SECTIONS                                */}
        {/* ================================================================= */}
        {watchlistItems.length > 0 && (
          <section className="relative group/shelf mb-12 select-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <LuPopcorn className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white/95">
                  My Watchlist
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {statusFilter === "all" ? watchlistItems.length : filteredWatchlist.length}
                </span>
              </div>

              {/* Status Tabs, Type Filters, Sort & Navigation */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Status Filter Tabs (Watchlist, Planned, Completed) */}
                <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors ${
                      statusFilter === "all"
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    All ({statusCounts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("watchlist")}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      statusFilter === "watchlist"
                        ? "bg-primary/25 text-primary border border-primary/40 shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <FaPlay className="w-2 h-2 text-primary" />
                    Watchlist ({statusCounts.wl})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("planned")}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      statusFilter === "planned"
                        ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <FaClock className="w-2.5 h-2.5 text-amber-400" />
                    Planned ({statusCounts.planned})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("completed")}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      statusFilter === "completed"
                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <FaCheck className="w-2.5 h-2.5 text-emerald-400" />
                    Completed ({statusCounts.completed})
                  </button>
                </div>

                {/* Type Filters */}
                <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setContentFilter("all")}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors ${
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
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
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
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
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
                    aria-label="Sort watchlist"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key}>{opt.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Clear Watchlist */}
                {filteredWatchlist.length > 0 && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    startContent={<FaTrash className="w-3 h-3" />}
                    onClick={openClearWatchlist}
                    className="text-xs h-8 px-2.5"
                  >
                    Clear
                  </Button>
                )}

                {/* Navigation Arrows */}
                {filteredWatchlist.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <button
                      type="button"
                      onClick={() => scrollShelf(watchlistScrollRef, "left")}
                      aria-label="Scroll left"
                      className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                    >
                      <IoChevronBack className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollShelf(watchlistScrollRef, "right")}
                      aria-label="Scroll right"
                      className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                    >
                      <IoChevronForward className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {filteredWatchlist.length > 0 ? (
              <div
                ref={watchlistScrollRef}
                className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-3 pt-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {filteredWatchlist.map((item) => {
                  const poster = getImageUrl(item.poster_path || item.backdrop_path || "");
                  const link = item.type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
                  const year = item.release_date ? new Date(item.release_date).getFullYear() : null;

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="group relative w-[140px] sm:w-[170px] md:w-[185px] shrink-0 rounded-xl overflow-hidden bg-neutral-900/60 border border-white/10 transition-all duration-300 hover:border-white/30 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                        <img
                          src={poster}
                          alt={item.title}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        <Link
                          href={link}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="flex size-11 items-center justify-center rounded-full bg-amber-500 text-black shadow-xl">
                            <FaPlay className="w-4 h-4 ml-0.5" />
                          </div>
                        </Link>

                        {/* Media Type Badge */}
                        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white border border-white/10">
                          {item.type === "tv" ? "TV" : "Movie"}
                        </span>

                        {/* Status Tag Badge */}
                        {item.status && item.status !== "watchlist" && (
                          <span
                            className={`absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              item.status === "completed"
                                ? "bg-emerald-500/90 text-white shadow-md"
                                : "bg-amber-500/90 text-black shadow-md"
                            }`}
                          >
                            {item.status}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveWatchlistItem(item.id, item.type, item.title)}
                          title="Remove from watchlist"
                          className="absolute bottom-2 right-2 size-6 rounded-full bg-black/70 hover:bg-red-600 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                        >
                          <FaTrash className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <div className="p-3 flex flex-col justify-between flex-1">
                        <Link href={link}>
                          <h4 className="font-semibold text-sm line-clamp-1 text-white/90 group-hover:text-white transition-colors">
                            {item.title}
                          </h4>
                        </Link>
                        <div className="flex items-center justify-between text-xs text-white/40 mt-1">
                          {year && <span>{year}</span>}
                          {item.vote_average > 0 && (
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                              ★ {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between p-6 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                    🍿
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">No titles in this section</h4>
                    <p className="text-xs text-white/45 mt-0.5">
                      No titles matched the selected filters.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================= */}
        {/* ROW 3: MY HISTORY (ALREADY WATCHED - only if items exist)         */}
        {/* ================================================================= */}
        {alreadyWatchedItems.length > 0 && (
          <section className="relative group/shelf mb-14 select-none">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FaClockRotateLeft className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white/95">
                  My History
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {alreadyWatchedItems.length}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<FaTrash className="w-3 h-3" />}
                  onClick={openClearHistory}
                  className="text-xs h-8 px-2.5"
                >
                  Clear History
                </Button>

                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    type="button"
                    onClick={() => scrollShelf(historyScrollRef, "left")}
                    aria-label="Scroll left"
                    className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                  >
                    <IoChevronBack className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollShelf(historyScrollRef, "right")}
                    aria-label="Scroll right"
                    className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                  >
                    <IoChevronForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={historyScrollRef}
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-3 pt-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {alreadyWatchedItems.map((item) => {
                const poster = getImageUrl(item.poster_path || item.backdrop_path || "");
                const link = item.type === "movie" ? `/movie/${item.media_id}` : `/tv/${item.media_id}`;

                return (
                  <div
                    key={`${item.type}-${item.media_id}-${item.season}-${item.episode}`}
                    className="group relative w-[140px] sm:w-[170px] md:w-[185px] shrink-0 rounded-xl overflow-hidden bg-neutral-900/60 border border-white/10 transition-all duration-300 hover:border-white/30 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                      <img
                        src={poster}
                        alt={item.title}
                        className="size-full object-cover"
                      />

                      <Link
                        href={link}
                        className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="flex size-11 items-center justify-center rounded-full bg-white text-black shadow-xl">
                          <FaPlay className="w-4 h-4 ml-0.5" />
                        </div>
                      </Link>

                      <span className="absolute top-2 left-2 text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600/90 text-white shadow-md">
                        Watched
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveContinueWatching(
                            item.media_id,
                            item.type,
                            item.season,
                            item.episode
                          )
                        }
                        title="Remove from history"
                        className="absolute top-2 right-2 size-6 rounded-full bg-black/70 hover:bg-red-600 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                      >
                        <FaTrash className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1">
                      <Link href={link}>
                        <h4 className="font-semibold text-sm line-clamp-1 text-white/90 group-hover:text-white transition-colors">
                          {item.title}
                        </h4>
                      </Link>
                      <div className="flex items-center justify-between text-xs text-white/40 mt-1">
                        <span>{timeAgo(item.updated_at)}</span>
                        <span className="capitalize">{item.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Global Empty State if ALL shelves are empty */}
        {continueWatchingItems.length === 0 && watchlistItems.length === 0 && alreadyWatchedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center my-8">
            <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
              🍿
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Your Library is Empty</h3>
            <p className="text-sm text-white/50 max-w-md mb-6 leading-relaxed">
              Titles you start watching or add to your Watchlist, Planned, or Completed lists will appear here.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/movies">
                <Button color="primary" variant="solid" startContent={<FaFilm className="w-3.5 h-3.5" />}>
                  Explore Movies
                </Button>
              </Link>
              <Link href="/tv">
                <Button color="warning" variant="flat" startContent={<FaTv className="w-3.5 h-3.5" />}>
                  Explore TV Shows
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Clear Watchlist */}
      <ConfirmationModal
        title="Clear Your Watchlist?"
        isOpen={clearWatchlistOpened}
        onClose={closeClearWatchlist}
        onConfirm={handleConfirmClearWatchlist}
        confirmLabel="Clear All"
      >
        <p className="text-white/80 text-sm">
          Are you sure you want to remove all {contentFilter === "all" ? "items" : contentFilter === "movie" ? "movies" : "TV shows"} from your watchlist?
        </p>
      </ConfirmationModal>

      {/* Confirmation Modal: Clear History */}
      <ConfirmationModal
        title="Clear Your Watch History?"
        isOpen={clearHistoryOpened}
        onClose={closeClearHistory}
        onConfirm={handleConfirmClearHistory}
        confirmLabel="Clear History"
      >
        <p className="text-white/80 text-sm">
          Are you sure you want to clear your watch history?
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default MySpace;
