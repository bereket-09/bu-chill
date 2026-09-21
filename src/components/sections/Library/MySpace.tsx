"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
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
  FaCheck,
  FaPen,
  FaPlus,
  FaPlay,
  FaTrash,
  FaXmark,
  FaGear,
  FaClockRotateLeft,
  FaFilm,
  FaTv,
  FaStar,
} from "react-icons/fa6";
import { LuPopcorn } from "react-icons/lu";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { queryClient } from "@/app/providers";
import {
  AVATAR_PRESETS,
  DEFAULT_AVATAR_ID,
  resolveAvatarUrl,
} from "@/constants/avatars";
import {
  UserProfileItem,
  EditProfileView,
} from "@/components/sections/Profile/ProfileManager";
import {
  getActiveProfileId,
  setActiveProfileId,
  getProfileWatchlist,
  removeFromProfileWatchlist,
  clearProfileWatchlist,
  getProfileHistory,
  removeFromProfileHistory,
  clearProfileHistory,
  ProfileWatchlistItem,
  ProfileHistoryItem,
} from "@/services/profileStorage";
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

  // Profile state
  const [profiles, setProfiles] = useState<UserProfileItem[]>([]);
  const [activeProfileId, setActiveId] = useState<string>("main");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Editing profile modal state
  const [editingProfile, setEditingProfile] = useState<UserProfileItem | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editAvatarIndex, setEditAvatarIndex] = useState<number>(0);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Rotating tagline index
  const [taglineIdx, setTaglineIdx] = useState(0);

  // Library & Watchlist filters
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("created_at");
  const [activeTab, setActiveTab] = useState<"watchlist" | "history">("watchlist");

  // Profile data
  const [watchlistItems, setWatchlistItems] = useState<ProfileWatchlistItem[]>([]);
  const [historyItems, setHistoryItems] = useState<ProfileHistoryItem[]>([]);

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
    if (!user) return;
    const currentPid = getActiveProfileId(user.id);
    setActiveId(currentPid);

    const wList = getProfileWatchlist(user.id, currentPid);
    setWatchlistItems(wList);

    const hList = getProfileHistory(user.id, currentPid);
    setHistoryItems(hList);
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

  // Switch profile handler
  const handleSelectProfile = (profile: UserProfileItem) => {
    if (!user) return;

    if (isEditMode) {
      handleOpenEditProfile(profile);
      return;
    }

    setActiveProfileId(user.id, profile.id);
    setActiveId(profile.id);

    if (profile.avatar) {
      localStorage.setItem(`buchill_avatar_${user.id}`, profile.avatar);
      queryClient.invalidateQueries({ queryKey: ["supabase-user"] });
    }

    addToast({
      title: `Switched to ${profile.name}`,
      description: "Showing profile-specific watchlist and history",
      color: "primary",
    });

    reloadData();
  };

  // Open edit modal for an existing profile
  const handleOpenEditProfile = (profile: UserProfileItem) => {
    setEditingProfile(profile);
    setEditName(profile.name);
    const idx = AVATAR_PRESETS.findIndex(
      (a) => a.id === profile.avatar || a.url === profile.avatar
    );
    setEditAvatarIndex(idx >= 0 ? idx : 0);
  };

  // Open modal to add a new profile
  const handleOpenAddProfile = () => {
    if (profiles.length >= 5) {
      addToast({
        title: "Profile limit reached",
        description: "You can create up to 5 streaming profiles.",
        color: "warning",
      });
      return;
    }
    const newProfile: UserProfileItem = {
      id: `profile_${Date.now()}`,
      name: "",
      avatar: DEFAULT_AVATAR_ID,
    };
    setEditingProfile(newProfile);
    setEditName("");
    setEditAvatarIndex(0);
  };

  // Save profile edits
  const handleSaveProfile = async () => {
    if (!user || !editingProfile) return;
    const cleanName = editName.trim();
    if (!cleanName) {
      addToast({ title: "Profile name cannot be empty", color: "danger" });
      return;
    }

    const selectedAvatarItem = AVATAR_PRESETS[editAvatarIndex] || AVATAR_PRESETS[0];
    const avatarId = selectedAvatarItem.id;

    setIsSavingProfile(true);
    try {
      let updatedProfiles = [...profiles];
      const existingIdx = updatedProfiles.findIndex((p) => p.id === editingProfile.id);

      if (existingIdx >= 0) {
        updatedProfiles[existingIdx] = {
          ...updatedProfiles[existingIdx],
          name: cleanName,
          avatar: avatarId,
        };
      } else {
        updatedProfiles.push({
          id: editingProfile.id,
          name: cleanName,
          avatar: avatarId,
        });
      }

      setProfiles(updatedProfiles);
      localStorage.setItem(`buchill_profiles_${user.id}`, JSON.stringify(updatedProfiles));

      if (editingProfile.isMain || editingProfile.id === "main") {
        localStorage.setItem(`buchill_avatar_${user.id}`, avatarId);
        queryClient.invalidateQueries({ queryKey: ["supabase-user"] });
      }

      addToast({
        title: "Profile saved successfully!",
        color: "success",
      });

      setEditingProfile(null);
      setIsEditMode(false);
      reloadData();
    } catch (err: any) {
      addToast({
        title: "Failed to save profile",
        description: err?.message || "Please try again",
        color: "danger",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Delete secondary profile
  const handleDeleteProfile = () => {
    if (!user || !editingProfile) return;
    if (editingProfile.isMain || editingProfile.id === "main") {
      addToast({ title: "Cannot delete primary account profile", color: "danger" });
      return;
    }

    if (!confirm(`Delete "${editingProfile.name}" profile? Streaming history will be lost.`)) {
      return;
    }

    const updated = profiles.filter((p) => p.id !== editingProfile.id);
    setProfiles(updated);
    localStorage.setItem(`buchill_profiles_${user.id}`, JSON.stringify(updated));

    if (activeProfileId === editingProfile.id) {
      setActiveProfileId(user.id, "main");
      setActiveId("main");
    }

    addToast({ title: "Profile deleted", color: "primary" });
    setEditingProfile(null);
    reloadData();
  };

  // Continue watching items (in-progress, not completed, last_position > 5 seconds)
  const continueWatchingItems = useMemo(() => {
    return historyItems.filter(
      (item) => !item.completed && item.last_position > 5 && item.duration > 0
    );
  }, [historyItems]);

  // Already watched items
  const alreadyWatchedItems = useMemo(() => {
    return historyItems.filter((item) => item.completed || item.last_position >= item.duration * 0.9);
  }, [historyItems]);

  // Filtered and sorted watchlist
  const filteredWatchlist = useMemo(() => {
    let list = [...watchlistItems];
    if (contentFilter !== "all") {
      list = list.filter((item) => item.type === contentFilter);
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

  // If editing a profile in modal overlay
  if (editingProfile) {
    return (
      <EditProfileView
        profile={editingProfile}
        name={editName}
        setName={setEditName}
        selectedIndex={editAvatarIndex}
        setSelectedIndex={setEditAvatarIndex}
        onSave={handleSaveProfile}
        onCancel={() => setEditingProfile(null)}
        onDelete={
          editingProfile.isMain || editingProfile.id === "main" ? undefined : handleDeleteProfile
        }
        isSaving={isSavingProfile}
      />
    );
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
              <span className="text-primary font-medium">Active: {activeProfile.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button
                variant="flat"
                size="sm"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold"
              >
                Who&apos;s Watching?
              </Button>
            </Link>

            <Link href="/settings">
              <Button
                variant="flat"
                size="sm"
                startContent={<FaGear className="w-3.5 h-3.5 text-white/70" />}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold"
              >
                Help & Settings
              </Button>
            </Link>
          </div>
        </header>

        {/* ================================================================= */}
        {/* SECTION 2: PROFILES TRAY (EXACT MATCH TO BINGR MY SPACE)           */}
        {/* ================================================================= */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white/90">
                Profiles
              </h2>
              <span className="text-xs text-white/40 hidden sm:inline">
                (Click to switch library & watchlist)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEditMode((prev) => !prev)}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors border border-white/10 text-white/80 hover:text-white cursor-pointer"
            >
              {isEditMode ? (
                <>
                  <FaCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <FaPen className="w-3 h-3 text-white/60" />
                  <span>Edit Profiles</span>
                </>
              )}
            </button>
          </div>

          {/* Profiles Row */}
          <div className="flex flex-wrap items-start gap-6 sm:gap-10">
            {profiles.map((p) => {
              const avatarUrl = resolveAvatarUrl(p.avatar);
              const isActive = p.id === activeProfileId;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProfile(p)}
                  className="group flex flex-col items-center gap-2.5 outline-none cursor-pointer"
                >
                  <div className="relative">
                    <div
                      className={`relative size-20 sm:size-28 md:size-32 overflow-hidden rounded-full transition-all duration-300 ${
                        isActive
                          ? "ring-4 ring-primary ring-offset-4 ring-offset-black shadow-[0_0_24px_rgba(244,63,94,0.4)] scale-105"
                          : "ring-1 ring-white/15 opacity-80 group-hover:opacity-100 group-hover:scale-105 group-hover:ring-2 group-hover:ring-white/40"
                      }`}
                    >
                      {/* Edit Pencil Overlay */}
                      {isEditMode && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 backdrop-blur-[2px]">
                          <FaPen className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      )}

                      <img
                        src={avatarUrl}
                        alt={p.name}
                        className="size-full object-cover"
                      />
                    </div>

                    {/* Active Profile Checkmark Badge */}
                    {!isEditMode && isActive && (
                      <div className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 z-20 flex size-6 sm:size-7 items-center justify-center rounded-full bg-white text-black border-2 border-black shadow-lg">
                        <FaCheck className="w-3 h-3 font-bold" />
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-medium tracking-wide transition-colors ${
                      isActive ? "text-white font-bold" : "text-white/60 group-hover:text-white"
                    }`}
                  >
                    {p.name}
                  </span>
                </button>
              );
            })}

            {/* Add Profile Button */}
            {profiles.length < 5 && (
              <button
                type="button"
                onClick={handleOpenAddProfile}
                className="group flex flex-col items-center gap-2.5 outline-none cursor-pointer"
              >
                <div className="flex size-20 sm:size-28 md:size-32 items-center justify-center rounded-full border border-dashed border-white/25 bg-white/[0.03] text-white/50 transition-all duration-300 group-hover:border-white/60 group-hover:bg-white/10 group-hover:text-white group-hover:scale-105">
                  <FaPlus className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                  Add
                </span>
              </button>
            )}
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 3: CONTINUE WATCHING (ISOLATED TO ACTIVE PROFILE)         */}
        {/* ================================================================= */}
        {continueWatchingItems.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white/90">
                  Continue Watching for {activeProfile.name}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {continueWatchingItems.length}
                </span>
              </div>
            </div>

            {/* Carousel / Grid Tray */}
            <div className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {continueWatchingItems.map((item) => {
                const redirectLink =
                  item.type === "movie"
                    ? `/movie/${item.media_id}/player`
                    : `/tv/${item.media_id}/${item.season || 1}/${item.episode || 1}/player`;
                const progressPct =
                  item.duration > 0
                    ? Math.min(100, Math.round((item.last_position / item.duration) * 100))
                    : 0;
                const backdrop = getImageUrl(item.backdrop_path || item.poster_path || "");

                return (
                  <div
                    key={`${item.type}-${item.media_id}-${item.season}-${item.episode}`}
                    className="group relative flex-none w-[240px] sm:w-[280px] rounded-xl overflow-hidden bg-neutral-900/60 border border-white/10 transition-all duration-300 hover:border-white/30 hover:scale-[1.02]"
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
                        title="Remove from continue watching"
                        className="absolute top-2 left-2 size-6 rounded-full bg-black/70 hover:bg-red-600 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
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
                    <div className="p-3">
                      <h4 className="font-semibold text-sm truncate text-white/90 group-hover:text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-white/40 mt-0.5">
                        {timeAgo(item.updated_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 4: WATCHLIST & HISTORY TABS                               */}
        {/* ================================================================= */}
        <section className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
            {/* View Switcher Tabs: Watchlist vs History */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("watchlist")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "watchlist"
                    ? "bg-white text-black shadow-lg"
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                }`}
              >
                <LuPopcorn className="w-4 h-4" />
                <span>Watchlist</span>
                <span
                  className={`ml-1 text-xs px-1.5 py-0.2 rounded-full ${
                    activeTab === "watchlist" ? "bg-black/15 text-black" : "bg-white/15 text-white"
                  }`}
                >
                  {watchlistItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "history"
                    ? "bg-white text-black shadow-lg"
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                }`}
              >
                <FaClockRotateLeft className="w-3.5 h-3.5" />
                <span>History / Watched</span>
                <span
                  className={`ml-1 text-xs px-1.5 py-0.2 rounded-full ${
                    activeTab === "history" ? "bg-black/15 text-black" : "bg-white/15 text-white"
                  }`}
                >
                  {alreadyWatchedItems.length}
                </span>
              </button>
            </div>

            {/* Filter Pills & Sort Dropdown (For Watchlist) */}
            {activeTab === "watchlist" && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Content Type Filter Pills */}
                <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setContentFilter("all")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
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
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
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
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                      contentFilter === "tv"
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <FaTv className="w-2.5 h-2.5" />
                    TV Series
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="w-36">
                  <Select
                    size="sm"
                    label="Sort"
                    selectedKeys={[sortOption]}
                    onChange={(e) => setSortOption((e.target.value as SortOption) || "created_at")}
                    variant="bordered"
                    className="max-w-xs"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key}>{opt.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Clear Button */}
                {filteredWatchlist.length > 0 && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    startContent={<FaTrash className="w-3 h-3" />}
                    onClick={openClearWatchlist}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}

            {/* Clear History Button (For History Tab) */}
            {activeTab === "history" && alreadyWatchedItems.length > 0 && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                startContent={<FaTrash className="w-3 h-3" />}
                onClick={openClearHistory}
                className="text-xs"
              >
                Clear History
              </Button>
            )}
          </div>

          {/* TAB 1: WATCHLIST CONTENT */}
          {activeTab === "watchlist" && (
            <div>
              {filteredWatchlist.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {filteredWatchlist.map((item) => {
                    const poster = getImageUrl(item.poster_path || item.backdrop_path || "");
                    const link =
                      item.type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
                    const year = item.release_date
                      ? new Date(item.release_date).getFullYear()
                      : null;

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/60 border border-white/10 transition-all duration-300 hover:border-white/30 hover:-translate-y-1 hover:shadow-2xl"
                      >
                        {/* Poster Art */}
                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                          <img
                            src={poster}
                            alt={item.title}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Hover Play Button */}
                          <Link
                            href={link}
                            className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <div className="flex size-12 items-center justify-center rounded-full bg-white text-black shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                              <FaPlay className="w-4 h-4 ml-0.5" />
                            </div>
                          </Link>

                          {/* Type Chip */}
                          <span className="absolute top-2 left-2 text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-white/90 border border-white/10">
                            {item.type}
                          </span>

                          {/* Remove Bookmark Button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveWatchlistItem(item.id, item.type, item.title)
                            }
                            title="Remove from watchlist"
                            className="absolute top-2 right-2 size-7 rounded-full bg-black/70 hover:bg-red-600 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>

                          {/* Rating Badge */}
                          {item.vote_average ? (
                            <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-amber-400">
                              <FaStar className="w-2.5 h-2.5" />
                              <span>{item.vote_average.toFixed(1)}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Title & Metadata */}
                        <div className="p-3 flex flex-col justify-between flex-1">
                          <Link href={link}>
                            <h4 className="font-semibold text-sm line-clamp-1 text-white/90 group-hover:text-white transition-colors">
                              {item.title}
                            </h4>
                          </Link>
                          <div className="flex items-center justify-between text-xs text-white/40 mt-1">
                            <span>{year || "—"}</span>
                            <span className="capitalize">{item.type}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Ultra-clean Empty Watchlist State */
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
                    🍿
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {activeProfile.name}&apos;s Watchlist is empty
                  </h3>
                  <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
                    Explore trending movies and series to save them to your personal streaming queue.
                  </p>
                  <div className="flex items-center gap-3">
                    <Link href="/movies">
                      <Button color="primary" variant="shadow" size="sm" startContent={<FaFilm />}>
                        Explore Movies
                      </Button>
                    </Link>
                    <Link href="/tv">
                      <Button variant="flat" size="sm" startContent={<FaTv />}>
                        Browse TV Series
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORY & ALREADY WATCHED CONTENT */}
          {activeTab === "history" && (
            <div>
              {alreadyWatchedItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {alreadyWatchedItems.map((item) => {
                    const poster = getImageUrl(item.poster_path || item.backdrop_path || "");
                    const link =
                      item.type === "movie" ? `/movie/${item.media_id}` : `/tv/${item.media_id}`;

                    return (
                      <div
                        key={`${item.type}-${item.media_id}-${item.season}-${item.episode}`}
                        className="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/60 border border-white/10 transition-all duration-300 hover:border-white/30 hover:-translate-y-1 hover:shadow-2xl"
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
                            <div className="flex size-12 items-center justify-center rounded-full bg-white text-black shadow-xl">
                              <FaPlay className="w-4 h-4 ml-0.5" />
                            </div>
                          </Link>

                          {/* Completed Chip */}
                          <span className="absolute top-2 left-2 text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600/90 text-white shadow-md">
                            Watched
                          </span>

                          {/* Remove from history button */}
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
                            className="absolute top-2 right-2 size-7 rounded-full bg-black/70 hover:bg-red-600 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                          >
                            <FaTrash className="w-3 h-3" />
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
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
                    🎬
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    No watch history yet for {activeProfile.name}
                  </h3>
                  <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
                    Movies and episodes you watch to completion will appear here so you can revisit them anytime.
                  </p>
                  <Link href="/movies">
                    <Button color="primary" variant="shadow" size="sm" startContent={<FaPlay />}>
                      Start Streaming
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Confirmation Modal: Clear Watchlist */}
      <ConfirmationModal
        title={`Clear ${activeProfile.name}'s Watchlist?`}
        isOpen={clearWatchlistOpened}
        onClose={closeClearWatchlist}
        onConfirm={handleConfirmClearWatchlist}
        confirmLabel="Clear All"
      >
        <p className="text-white/80 text-sm">
          Are you sure you want to remove all {contentFilter === "all" ? "items" : contentFilter === "movie" ? "movies" : "TV shows"} from {activeProfile.name}&apos;s watchlist?
        </p>
      </ConfirmationModal>

      {/* Confirmation Modal: Clear History */}
      <ConfirmationModal
        title={`Clear ${activeProfile.name}'s Watch History?`}
        isOpen={clearHistoryOpened}
        onClose={closeClearHistory}
        onConfirm={handleConfirmClearHistory}
        confirmLabel="Clear History"
      >
        <p className="text-white/80 text-sm">
          Are you sure you want to clear the watch history for {activeProfile.name}?
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default MySpace;
