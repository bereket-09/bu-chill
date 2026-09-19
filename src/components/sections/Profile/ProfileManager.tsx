"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  addToast,
  Spinner,
} from "@heroui/react";
import {
  FaCheck,
  FaPen,
  FaPlus,
  FaArrowLeft,
  FaGear,
  FaShieldHalved,
  FaClock,
} from "react-icons/fa6";
import { LuPopcorn, LuSparkles, LuHistory } from "react-icons/lu";
import { RiRobot3Fill, RiBookmarkFill } from "react-icons/ri";
import { IoLogInOutline, IoPersonOutline } from "react-icons/io5";
import { signOut } from "@/actions/auth";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { createClient } from "@/utils/supabase/client";
import { queryClient } from "@/app/providers";

// Netflix-style circular avatar presets
export const AVATAR_PRESETS = [
  { id: "robot", name: "Cyber Bot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Felix" },
  { id: "popcorn", name: "Cinema Pop", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=popcorn" },
  { id: "anime", name: "Anime Star", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight" },
  { id: "cyber", name: "Neon Runner", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Neon" },
  { id: "ninja", name: "Shadow", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Shadow" },
  { id: "cat", name: "Astro Cat", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Whiskers" },
  { id: "gamer", name: "Retro Pixel", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Gamer" },
  { id: "chill", name: "Bu-Chill", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Chill" },
];

export const AUDIO_LANGUAGES = [
  { key: "en", label: "English (Default)" },
  { key: "es", label: "Spanish (Español)" },
  { key: "fr", label: "French (Français)" },
  { key: "ja", label: "Japanese (日本語)" },
  { key: "ko", label: "Korean (한국어)" },
  { key: "de", label: "German (Deutsch)" },
  { key: "hi", label: "Hindi (हिन्दी)" },
];

const ProfileManager: React.FC = () => {
  const router = useRouter();
  const { data: user, isLoading } = useSupabaseUser();

  // Mode: "who_is_watching" | "account_setup"
  const [viewMode, setViewMode] = useState<"who_is_watching" | "account_setup">("who_is_watching");
  const [isManageMode, setIsManageMode] = useState(false);

  // Profile Edit State
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Playback Preferences (saved in localStorage, 0 Vercel calls)
  const [preferredLang, setPreferredLang] = useState<string>("en");
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const [preferredServer, setPreferredServer] = useState<string>("auto");

  // Sign out state
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Sync initial user data
  useEffect(() => {
    if (user) {
      setUsernameInput(user.username || "");
      const storedAvatar = localStorage.getItem(`buchill_avatar_${user.id}`);
      if (storedAvatar) {
        setSelectedAvatar(storedAvatar);
      } else {
        setSelectedAvatar(AVATAR_PRESETS[0].url);
      }
    }

    // Load playback prefs
    const savedLang = localStorage.getItem("buchill_preferred_lang") || "en";
    const savedAutoplay = localStorage.getItem("buchill_autoplay") !== "false";
    const savedServer = localStorage.getItem("buchill_preferred_server") || "auto";

    setPreferredLang(savedLang);
    setAutoplayNext(savedAutoplay);
    setPreferredServer(savedServer);
  }, [user]);

  // Save profile username directly to Supabase client PostgREST (0 Vercel function invocations)
  const handleSaveProfile = async () => {
    if (!user) return;
    const cleanName = usernameInput.trim();
    if (!cleanName) {
      addToast({ title: "Username cannot be empty", color: "danger" });
      return;
    }

    setIsSavingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, username: cleanName });

      if (error) throw error;

      // Save custom avatar preference
      if (selectedAvatar) {
        localStorage.setItem(`buchill_avatar_${user.id}`, selectedAvatar);
      }

      // Invalidate React Query cache so avatar/username updates instantly in UI
      queryClient.invalidateQueries({ queryKey: ["supabase-user"] });

      addToast({
        title: "Profile updated successfully!",
        color: "success",
      });
      setViewMode("who_is_watching");
    } catch (err: any) {
      addToast({
        title: "Failed to update profile",
        description: err?.message || "An error occurred",
        color: "danger",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save playback preferences to localStorage
  const handleUpdateLanguage = (lang: string) => {
    setPreferredLang(lang);
    localStorage.setItem("buchill_preferred_lang", lang);
    addToast({ title: `Preferred audio set to ${lang.toUpperCase()}`, color: "primary" });
  };

  const handleToggleAutoplay = (val: boolean) => {
    setAutoplayNext(val);
    localStorage.setItem("buchill_autoplay", String(val));
  };

  const handleUpdateServer = (srv: string) => {
    setPreferredServer(srv);
    localStorage.setItem("buchill_preferred_server", srv);
  };

  // Sign out
  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const { success, message } = await signOut();
    if (success) {
      addToast({ title: "Signed out successfully", color: "primary" });
      router.push("/auth");
    } else {
      addToast({ title: "Failed to sign out", description: message, color: "danger" });
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70dvh] items-center justify-center">
        <Spinner size="lg" color="primary" label="Loading profile..." />
      </div>
    );
  }

  if (!user) {
    router.push("/auth");
    return null;
  }

  const currentAvatarUrl = selectedAvatar || `${AVATAR_PRESETS[0].url}`;

  // ==========================================
  // VIEW 1: NETFLIX "WHO'S WATCHING?" SCREEN
  // ==========================================
  if (viewMode === "who_is_watching") {
    return (
      <div className="relative min-h-[80dvh] flex flex-col items-center justify-center py-12 px-4 select-none">
        {/* Ambient background theater lights */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[450px] sm:w-[650px] h-[350px] bg-red-600/10 dark:bg-primary/15 rounded-full blur-[130px] -z-10" />

        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Who&apos;s Watching?
          </h1>
          <p className="mt-2 text-sm sm:text-base text-default-400">
            {isManageMode
              ? "Select a profile to customize avatar, username, and streaming setup."
              : "Choose your profile to start streaming."}
          </p>
        </div>

        {/* Profile Circle Cards Grid */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 max-w-4xl">
          {/* Main User Profile Card */}
          <button
            type="button"
            onClick={() => {
              if (isManageMode) {
                setViewMode("account_setup");
              } else {
                router.push("/movies");
              }
            }}
            className="group flex flex-col items-center gap-3 cursor-pointer focus:outline-none"
          >
            <div className="relative">
              <div className="size-24 sm:size-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-white group-hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] group-focus:border-white transition-all duration-200 transform group-hover:scale-105 bg-default-800 flex items-center justify-center">
                <img
                  src={currentAvatarUrl}
                  alt={user.username}
                  className="size-full object-cover"
                />
              </div>

              {/* Edit Icon Overlay in Manage Mode */}
              {isManageMode && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center border-2 border-white transition-opacity">
                  <FaPen className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            <span className="text-sm sm:text-base font-medium text-default-400 group-hover:text-white transition-colors">
              {user.username}
            </span>
          </button>

          {/* Kids / Family Profile Card */}
          <button
            type="button"
            onClick={() => {
              if (isManageMode) {
                setViewMode("account_setup");
              } else {
                router.push("/anime");
              }
            }}
            className="group flex flex-col items-center gap-3 cursor-pointer focus:outline-none opacity-85 hover:opacity-100 transition-opacity"
          >
            <div className="relative">
              <div className="size-24 sm:size-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-white group-hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all duration-200 transform group-hover:scale-105 bg-cyan-950/60 flex items-center justify-center">
                <img
                  src={AVATAR_PRESETS[1].url}
                  alt="Kids & Anime"
                  className="size-full object-cover"
                />
              </div>
            </div>
            <span className="text-sm sm:text-base font-medium text-default-400 group-hover:text-white transition-colors">
              Kids & Anime
            </span>
          </button>

          {/* Chill / Guest Profile Card */}
          <button
            type="button"
            onClick={() => {
              if (isManageMode) {
                setViewMode("account_setup");
              } else {
                router.push("/movies");
              }
            }}
            className="group flex flex-col items-center gap-3 cursor-pointer focus:outline-none opacity-85 hover:opacity-100 transition-opacity"
          >
            <div className="relative">
              <div className="size-24 sm:size-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-white group-hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all duration-200 transform group-hover:scale-105 bg-purple-950/60 flex items-center justify-center">
                <img
                  src={AVATAR_PRESETS[7].url}
                  alt="Guest / Chill"
                  className="size-full object-cover"
                />
              </div>
            </div>
            <span className="text-sm sm:text-base font-medium text-default-400 group-hover:text-white transition-colors">
              Guest Chill
            </span>
          </button>

          {/* Add Profile Placeholder */}
          <button
            type="button"
            onClick={() => {
              addToast({
                title: "Multiple profiles enabled",
                description: "You can customize your current profile or manage settings.",
                color: "primary",
              });
              setViewMode("account_setup");
            }}
            className="group flex flex-col items-center gap-3 cursor-pointer focus:outline-none"
          >
            <div className="size-24 sm:size-32 rounded-full border-2 border-dashed border-default-500/50 group-hover:border-white group-hover:bg-white/5 flex items-center justify-center transition-all duration-200 transform group-hover:scale-105">
              <FaPlus className="w-8 h-8 text-default-500 group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm sm:text-base font-medium text-default-500 group-hover:text-white transition-colors">
              Add Profile
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="mt-14 flex items-center gap-4">
          <Button
            variant="bordered"
            size="md"
            className={`font-semibold tracking-wider uppercase text-xs sm:text-sm px-6 border-default-400 ${
              isManageMode
                ? "bg-white text-black border-white hover:bg-white/90"
                : "text-default-400 hover:text-white hover:border-white"
            }`}
            onClick={() => setIsManageMode(!isManageMode)}
          >
            {isManageMode ? "Done" : "Manage Profiles"}
          </Button>

          <Button
            variant="flat"
            size="md"
            startContent={<FaGear className="w-4 h-4" />}
            className="text-xs sm:text-sm text-default-400 hover:text-white"
            onClick={() => setViewMode("account_setup")}
          >
            Account Details & Setup
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: NETFLIX ACCOUNT DETAILS & SETUP
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Breadcrumb / Back */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-default-200/50 dark:border-white/10">
        <Button
          variant="light"
          size="sm"
          startContent={<FaArrowLeft className="w-4 h-4" />}
          onClick={() => setViewMode("who_is_watching")}
          className="text-default-400 hover:text-white"
        >
          Back to Who&apos;s Watching
        </Button>

        <span className="text-xs uppercase font-bold tracking-widest text-primary">
          Account Setup
        </span>
      </div>

      <div className="space-y-10">
        {/* 1. PROFILE IDENTITY & CIRCLE AVATAR SELECTOR */}
        <section className="bg-default-50/50 dark:bg-white/[0.02] border border-default-200/60 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <IoPersonOutline className="text-primary w-5 h-5" />
            Profile Identity & Avatar
          </h2>
          <p className="text-sm text-default-500 mt-1">
            Choose your signature circular avatar and update your streaming alias.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Active Avatar Preview */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="size-28 sm:size-32 rounded-full overflow-hidden border-3 border-primary shadow-[0_0_20px_rgba(229,9,20,0.3)] bg-default-800">
                <img
                  src={currentAvatarUrl}
                  alt="Current Avatar"
                  className="size-full object-cover"
                />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Current Avatar
              </span>
            </div>

            {/* Avatar Selector Gallery */}
            <div className="flex-1 w-full">
              <label className="text-xs font-semibold text-default-400 uppercase tracking-wider block mb-3">
                Select a Netflix Avatar
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.name}
                    onClick={() => setSelectedAvatar(preset.url)}
                    className={`size-14 rounded-full overflow-hidden border-2 transition-all transform hover:scale-110 focus:outline-none ${
                      selectedAvatar === preset.url
                        ? "border-primary scale-105 shadow-md shadow-primary/40 ring-2 ring-primary/30"
                        : "border-transparent opacity-70 hover:opacity-100 hover:border-white/50"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="size-full object-cover bg-default-800"
                    />
                  </button>
                ))}
              </div>

              {/* Username Input */}
              <div className="mt-6 flex flex-col sm:flex-row items-end gap-3">
                <Input
                  label="Display Username"
                  placeholder="Enter your streaming username"
                  value={usernameInput}
                  onValueChange={setUsernameInput}
                  variant="bordered"
                  className="flex-1"
                  isRequired
                />
                <Button
                  color="primary"
                  variant="shadow"
                  className="font-semibold h-12 px-6"
                  isLoading={isSavingProfile}
                  onClick={handleSaveProfile}
                >
                  Save Profile
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. STREAMING & PLAYBACK SETUP (English Default, Autoplay, Server) */}
        <section className="bg-default-50/50 dark:bg-white/[0.02] border border-default-200/60 dark:border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FaGear className="text-primary w-5 h-5" />
            Playback & Streaming Setup
          </h2>
          <p className="text-sm text-default-500 mt-1">
            Configure default audio language, autoplay triggers, and video servers.
          </p>

          <div className="mt-6 space-y-6">
            {/* Preferred Language */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-default-200/40 dark:border-white/5">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Default Audio Language
                </h3>
                <p className="text-xs text-default-500">
                  Player will automatically request this audio track when available (defaults to English).
                </p>
              </div>
              <div className="w-full sm:w-56">
                <Select
                  label="Audio Language"
                  selectedKeys={[preferredLang]}
                  onChange={(e) => handleUpdateLanguage(e.target.value)}
                  size="sm"
                  variant="bordered"
                >
                  {AUDIO_LANGUAGES.map((l) => (
                    <SelectItem key={l.key}>{l.label}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Autoplay Next Episode */}
            <div className="flex items-center justify-between py-3 border-b border-default-200/40 dark:border-white/5">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Autoplay Next Episode
                </h3>
                <p className="text-xs text-default-500">
                  Automatically start the next episode when the current one ends.
                </p>
              </div>
              <Switch
                isSelected={autoplayNext}
                onValueChange={handleToggleAutoplay}
                color="primary"
                size="sm"
              />
            </div>

            {/* Stream Server Preference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Preferred Video Server
                </h3>
                <p className="text-xs text-default-500">
                  Default streaming provider priority (Embed Player vs Direct HLS).
                </p>
              </div>
              <div className="w-full sm:w-56">
                <Select
                  label="Server Mode"
                  selectedKeys={[preferredServer]}
                  onChange={(e) => handleUpdateServer(e.target.value)}
                  size="sm"
                  variant="bordered"
                >
                  <SelectItem key="auto">Auto (Best Quality)</SelectItem>
                  <SelectItem key="embed">Universal Embed (Zero CORS)</SelectItem>
                  <SelectItem key="hls">Direct HLS Satellite</SelectItem>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* 3. ACCOUNT MEMBERSHIP & QUICK STATS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Watchlist Card */}
          <div className="p-5 rounded-2xl border border-default-200/60 dark:border-white/10 bg-default-50/50 dark:bg-white/[0.02] backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                <RiBookmarkFill className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Personal Watchlist</h4>
                <p className="text-xs text-default-500">Saved movies & series</p>
              </div>
            </div>
            <Button
              as={Link}
              href="/library"
              size="sm"
              variant="flat"
              color="warning"
              className="text-xs font-semibold"
            >
              View Library
            </Button>
          </div>

          {/* Account Membership Card */}
          <div className="p-5 rounded-2xl border border-default-200/60 dark:border-white/10 bg-default-50/50 dark:bg-white/[0.02] backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
                <FaShieldHalved className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Bu•Chill Streaming</h4>
                <p className="text-xs text-default-500">{user.email}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
              Active
            </span>
          </div>
        </section>

        {/* 4. SECURITY & NETFLIX SIGN OUT */}
        <section className="pt-6 border-t border-default-200/50 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            as={Link}
            href="/auth/reset-password"
            variant="light"
            size="sm"
            className="text-xs text-default-500 hover:text-foreground"
          >
            Reset Account Password
          </Button>

          <Button
            color="danger"
            variant="flat"
            size="md"
            className="font-semibold text-sm px-8"
            startContent={<IoLogInOutline className="w-5 h-5 rotate-180" />}
            isLoading={isSigningOut}
            onClick={handleSignOut}
          >
            Sign Out of Bu•Chill
          </Button>
        </section>
      </div>
    </div>
  );
};

export default ProfileManager;
