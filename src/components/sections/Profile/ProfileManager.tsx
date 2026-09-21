"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import {
  Button,
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
  FaChevronLeft,
  FaChevronRight,
  FaGear,
  FaShieldHalved,
} from "react-icons/fa6";
import { IoLogInOutline } from "react-icons/io5";
import { signOut } from "@/actions/auth";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { createClient } from "@/utils/supabase/client";
import { queryClient } from "@/app/providers";
import {
  AVATAR_PRESETS,
  DEFAULT_AVATAR_ID,
  resolveAvatarUrl,
} from "@/constants/avatars";

export interface UserProfileItem {
  id: string;
  name: string;
  avatar: string;
  isMain?: boolean;
}

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

  // Mode: "who_is_watching" | "edit_profile" | "account_settings"
  const [viewMode, setViewMode] = useState<"who_is_watching" | "edit_profile" | "account_settings">("who_is_watching");
  const [isManageMode, setIsManageMode] = useState(false);

  // Profiles list
  const [profiles, setProfiles] = useState<UserProfileItem[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("main");

  // Editing state
  const [editingProfile, setEditingProfile] = useState<UserProfileItem | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editAvatarIndex, setEditAvatarIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Playback Preferences
  const [preferredLang, setPreferredLang] = useState<string>("en");
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const [preferredServer, setPreferredServer] = useState<string>("auto");
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Initialize profiles
  useEffect(() => {
    if (!user) return;

    const storedProfilesStr = localStorage.getItem(`buchill_profiles_${user.id}`);
    const storedMainAvatar = localStorage.getItem(`buchill_avatar_${user.id}`) || DEFAULT_AVATAR_ID;

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
          avatar: "08", // Grogu
        },
        {
          id: "chill",
          name: "Guest Chill",
          avatar: "03", // Buzz Lightyear
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

    const activeId = localStorage.getItem(`buchill_active_profile_${user.id}`) || "main";
    setActiveProfileId(activeId);

    // Playback settings
    setPreferredLang(localStorage.getItem("buchill_preferred_lang") || "en");
    setAutoplayNext(localStorage.getItem("buchill_autoplay") !== "false");
    setPreferredServer(localStorage.getItem("buchill_preferred_server") || "auto");
  }, [user]);

  // Open edit modal for a profile or for adding a new profile
  const handleOpenEdit = (profile: UserProfileItem) => {
    setEditingProfile(profile);
    setEditName(profile.name);

    // Find avatar index in presets
    const idx = AVATAR_PRESETS.findIndex((a) => a.id === profile.avatar || a.url === profile.avatar);
    setEditAvatarIndex(idx >= 0 ? idx : 0);
    setViewMode("edit_profile");
  };

  const handleAddNewProfile = () => {
    if (profiles.length >= 5) {
      addToast({
        title: "Profile Limit Reached",
        description: "You can have up to 5 streaming profiles per account.",
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
    setViewMode("edit_profile");
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user || !editingProfile) return;
    const cleanName = editName.trim();
    if (!cleanName) {
      addToast({ title: "Profile name cannot be empty", color: "danger" });
      return;
    }

    const selectedAvatarItem = AVATAR_PRESETS[editAvatarIndex] || AVATAR_PRESETS[0];
    const avatarId = selectedAvatarItem.id;

    setIsSaving(true);
    try {
      let updatedProfiles = [...profiles];
      const existingIdx = updatedProfiles.findIndex((p) => p.id === editingProfile.id);

      if (existingIdx >= 0) {
        // Update existing
        updatedProfiles[existingIdx] = {
          ...updatedProfiles[existingIdx],
          name: cleanName,
          avatar: avatarId,
        };
      } else {
        // Add new
        updatedProfiles.push({
          id: editingProfile.id,
          name: cleanName,
          avatar: avatarId,
        });
      }

      setProfiles(updatedProfiles);
      localStorage.setItem(`buchill_profiles_${user.id}`, JSON.stringify(updatedProfiles));

      // If updating the main profile, sync username to Supabase profiles & localStorage avatar
      if (editingProfile.isMain || editingProfile.id === "main") {
        localStorage.setItem(`buchill_avatar_${user.id}`, avatarId);

        const supabase = createClient();
        await supabase.from("profiles").upsert({ id: user.id, username: cleanName });
        queryClient.invalidateQueries({ queryKey: ["supabase-user"] });
      }

      addToast({
        title: "Profile saved successfully!",
        color: "success",
      });

      setViewMode("who_is_watching");
      setIsManageMode(false);
    } catch (err: any) {
      addToast({
        title: "Failed to save profile",
        description: err?.message || "Please try again",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete secondary profile
  const handleDeleteProfile = () => {
    if (!user || !editingProfile) return;
    if (editingProfile.isMain || editingProfile.id === "main") {
      addToast({ title: "Cannot delete primary account profile", color: "danger" });
      return;
    }

    if (!confirm(`Delete \"${editingProfile.name}\" profile? Streaming history for this profile will be removed.`)) {
      return;
    }

    const updated = profiles.filter((p) => p.id !== editingProfile.id);
    setProfiles(updated);
    localStorage.setItem(`buchill_profiles_${user.id}`, JSON.stringify(updated));

    if (activeProfileId === editingProfile.id) {
      setActiveProfileId("main");
      localStorage.setItem(`buchill_active_profile_${user.id}`, "main");
    }

    addToast({ title: "Profile deleted", color: "primary" });
    setViewMode("who_is_watching");
  };

  // Select profile and start streaming
  const handleSelectProfile = (profile: UserProfileItem) => {
    if (isManageMode) {
      handleOpenEdit(profile);
      return;
    }

    if (!user) return;
    setActiveProfileId(profile.id);
    localStorage.setItem(`buchill_active_profile_${user.id}`, profile.id);

    // Save avatar for immediate navbar sync
    if (profile.avatar) {
      localStorage.setItem(`buchill_avatar_${user.id}`, profile.avatar);
      queryClient.invalidateQueries({ queryKey: ["supabase-user"] });
    }

    addToast({
      title: `Watching as ${profile.name}`,
      color: "primary",
    });
    router.push("/movies");
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
      <div className="flex h-[75dvh] items-center justify-center">
        <Spinner size="lg" color="primary" label="Loading profiles..." />
      </div>
    );
  }

  if (!user) {
    router.push("/auth");
    return null;
  }

  // =========================================================
  // VIEW 2: EDIT PROFILE (AVATAR CAROUSEL + NAME INPUT)
  // =========================================================
  if (viewMode === "edit_profile" && editingProfile) {
    return (
      <EditProfileView
        profile={editingProfile}
        name={editName}
        setName={setEditName}
        selectedIndex={editAvatarIndex}
        setSelectedIndex={setEditAvatarIndex}
        onSave={handleSaveProfile}
        onCancel={() => setViewMode("who_is_watching")}
        onDelete={editingProfile.isMain || editingProfile.id === "main" ? undefined : handleDeleteProfile}
        isSaving={isSaving}
      />
    );
  }

  // =========================================================
  // VIEW 3: ACCOUNT & STREAMING SETTINGS
  // =========================================================
  if (viewMode === "account_settings") {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 text-white">
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
          <Button
            variant="light"
            size="sm"
            startContent={<FaChevronLeft className="w-3.5 h-3.5" />}
            onClick={() => setViewMode("who_is_watching")}
            className="text-white/70 hover:text-white"
          >
            Back to Profiles
          </Button>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Streaming & Setup
          </span>
        </div>

        <div className="space-y-8">
          {/* Playback Settings */}
          <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaGear className="text-primary w-5 h-5" />
              Playback & Streaming Setup
            </h2>
            <p className="text-sm text-white/50 mt-1">
              Default audio languages, episode auto-play, and preferred providers.
            </p>

            <div className="mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5">
                <div>
                  <h3 className="font-semibold text-white text-sm">Default Audio Language</h3>
                  <p className="text-xs text-white/50">Automatically select language when available.</p>
                </div>
                <div className="w-full sm:w-56">
                  <Select
                    label="Language"
                    selectedKeys={[preferredLang]}
                    onChange={(e) => {
                      setPreferredLang(e.target.value);
                      localStorage.setItem("buchill_preferred_lang", e.target.value);
                    }}
                    size="sm"
                    variant="bordered"
                  >
                    {AUDIO_LANGUAGES.map((l) => (
                      <SelectItem key={l.key}>{l.label}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <h3 className="font-semibold text-white text-sm">Autoplay Next Episode</h3>
                  <p className="text-xs text-white/50">Continuously binge episodes without manual clicks.</p>
                </div>
                <Switch
                  isSelected={autoplayNext}
                  onValueChange={(val) => {
                    setAutoplayNext(val);
                    localStorage.setItem("buchill_autoplay", String(val));
                  }}
                  color="primary"
                  size="sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div>
                  <h3 className="font-semibold text-white text-sm">Preferred Video Server</h3>
                  <p className="text-xs text-white/50">Default streaming engine priority.</p>
                </div>
                <div className="w-full sm:w-56">
                  <Select
                    label="Server"
                    selectedKeys={[preferredServer]}
                    onChange={(e) => {
                      setPreferredServer(e.target.value);
                      localStorage.setItem("buchill_preferred_server", e.target.value);
                    }}
                    size="sm"
                    variant="bordered"
                  >
                    <SelectItem key="auto">Auto (Fastest)</SelectItem>
                    <SelectItem key="embed">Universal Embed</SelectItem>
                    <SelectItem key="hls">Direct HLS Satellite</SelectItem>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* Account Card */}
          <section className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
                <FaShieldHalved className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Bu•Chill Streaming Account</h4>
                <p className="text-xs text-white/50">{user.email}</p>
              </div>
            </div>
            <Button
              color="danger"
              variant="flat"
              size="sm"
              isLoading={isSigningOut}
              onClick={handleSignOut}
              startContent={<IoLogInOutline className="w-4 h-4 rotate-180" />}
            >
              Sign Out
            </Button>
          </section>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW 1: WHO'S WATCHING? (MATCHING USER SCREENSHOT 1)
  // =========================================================
  return (
    <div className="min-h-[85vh] w-full bg-black text-white flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <span className="text-3xl drop-shadow-md">🍿</span>
          <span className="text-xl font-extrabold tracking-tight text-white/90 group-hover:text-white">
            Bu<span className="text-primary">•</span>Chill
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsManageMode((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/15 hover:text-white hover:border-white/30"
        >
          {isManageMode ? (
            <>
              <FaCheck className="w-3.5 h-3.5 text-primary" />
              <span>Done</span>
            </>
          ) : (
            <>
              <FaPen className="w-3.5 h-3.5 text-white/70" />
              <span>Edit</span>
            </>
          )}
        </button>
      </header>

      {/* Main Profile Circles Container */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-8 sm:pt-12">
        <h1 className="mb-12 sm:mb-16 text-center text-2xl font-bold tracking-tight sm:text-4xl text-white/90">
          {isManageMode ? "Edit Profile" : "Who's watching?"}
        </h1>

        <div className="flex flex-wrap items-start justify-center gap-8 md:gap-14 max-w-4xl">
          {profiles.map((profile, idx) => {
            const avatarUrl = resolveAvatarUrl(profile.avatar);

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSelectProfile(profile)}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="group flex flex-col items-center gap-3 outline-none cursor-pointer animate-in fade-in zoom-in-95 duration-300"
              >
                <div className="relative size-24 sm:size-32 overflow-hidden rounded-full ring-1 ring-white/15 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.9)] group-hover:ring-2 group-hover:ring-white bg-default-800 flex items-center justify-center">
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Edit Pencil Overlay when in Manage Mode */}
                  {isManageMode && (
                    <div className="absolute inset-0 bg-black/65 rounded-full flex items-center justify-center border-2 border-white/80 backdrop-blur-[1px] transition-opacity duration-200">
                      <FaPen className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                  )}
                </div>

                <span className="text-sm sm:text-base font-medium text-white/70 group-hover:text-white transition-colors">
                  {profile.name}
                </span>
              </button>
            );
          })}

          {/* Add Profile Button (Matching Screenshot 1) */}
          {profiles.length < 5 && (
            <button
              type="button"
              onClick={handleAddNewProfile}
              className="group flex flex-col items-center gap-3 outline-none cursor-pointer animate-in fade-in zoom-in-95 duration-300"
            >
              <div className="flex size-24 sm:size-32 items-center justify-center rounded-full border border-dashed border-white/25 bg-white/[0.03] text-white/60 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1.5 group-hover:border-white group-hover:bg-white/10 group-hover:text-white">
                <FaPlus className="w-8 h-8 sm:w-10 sm:h-10 text-white/60 group-hover:text-white transition-colors" />
              </div>
              <span className="text-sm sm:text-base font-medium text-white/70 group-hover:text-white transition-colors">
                Add
              </span>
            </button>
          )}
        </div>

        {/* Quick Settings Footer Link */}
        <div className="mt-16 sm:mt-20 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setViewMode("account_settings")}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <FaGear className="w-3.5 h-3.5" />
            <span>Streaming Preferences</span>
          </button>
        </div>
      </main>
    </div>
  );
};

// =======================================================================
// VIEW 2 IMPLEMENTATION: EDIT PROFILE WITH INTERACTIVE AVATAR CAROUSEL
// (MATCHING USER SCREENSHOT 2)
// =======================================================================

interface EditProfileViewProps {
  profile: UserProfileItem;
  name: string;
  setName: (val: string) => void;
  selectedIndex: number;
  setSelectedIndex: (idx: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSaving: boolean;
}

const EditProfileView: React.FC<EditProfileViewProps> = ({
  profile,
  name,
  setName,
  selectedIndex,
  setSelectedIndex,
  onSave,
  onCancel,
  onDelete,
  isSaving,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "ArrowRight") {
        setSelectedIndex(Math.min(AVATAR_PRESETS.length - 1, selectedIndex + 1));
      }
      if (e.key === "ArrowLeft") {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, selectedIndex, setSelectedIndex]);

  const canSave = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white font-sans select-none overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar (Back Arrow, Centered Title) */}
      <div className="flex items-center justify-between px-6 py-5 md:px-12 relative shrink-0 border-b border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors focus:outline-none cursor-pointer"
          title="Back"
        >
          <FaChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight md:text-xl text-white/90">
          Edit Profile
        </h2>

        <div className="w-9" />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12 gap-8 sm:gap-10 max-w-4xl mx-auto w-full">
        {/* Avatar Carousel */}
        <div className="w-full">
          <AvatarCarousel
            items={AVATAR_PRESETS}
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
          />
        </div>

        {/* Profile Name Input */}
        <div className="w-full max-w-sm mt-2">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Profile Name"
            maxLength={20}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3.5 text-base text-white placeholder-white/40 outline-none transition focus:border-white focus:bg-white/10 text-center sm:text-left"
          />
        </div>

        {/* Action Button: Save & Continue */}
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || isSaving}
            className="w-full rounded-lg bg-white py-3.5 sm:py-4 text-sm font-semibold text-black shadow-lg transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </button>

          {/* Delete Profile Button (for non-primary profiles) */}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-sm font-medium text-red-400/80 hover:text-red-400 transition-colors pt-2 cursor-pointer"
            >
              Delete profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// =======================================================================
// INTERACTIVE HORIZONTAL AVATAR CAROUSEL WITH TOUCH/DRAG SUPPORT
// =======================================================================

interface AvatarCarouselProps {
  items: typeof AVATAR_PRESETS;
  selectedIndex: number;
  onChange: (index: number) => void;
}

const AvatarCarousel: React.FC<AvatarCarouselProps> = ({
  items,
  selectedIndex,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_WIDTH = 120; // px spacing per avatar item

  // Pointer drag & swipe tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let isDown = false;
    let dragDist = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDown = true;
      startX = e.clientX;
      dragDist = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      dragDist = e.clientX - startX;
    };

    const onPointerUp = () => {
      if (!isDown) return;
      isDown = false;
      const step = -Math.round(dragDist / ITEM_WIDTH);
      if (Math.abs(dragDist) > 15 && step !== 0) {
        onChange(Math.max(0, Math.min(items.length - 1, selectedIndex + step)));
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [selectedIndex, onChange, items.length]);

  return (
    <div className="relative w-full mx-auto flex items-center justify-center overflow-hidden py-6">
      {/* Left Chevron Button */}
      <button
        type="button"
        aria-label="Previous Avatar"
        onClick={() => onChange(Math.max(0, selectedIndex - 1))}
        disabled={selectedIndex === 0}
        className="absolute left-2 sm:left-6 md:left-12 z-20 rounded-full p-3 text-white/60 transition hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none bg-black/40 backdrop-blur-sm focus:outline-none cursor-pointer"
      >
        <FaChevronLeft className="w-5 h-5" />
      </button>

      {/* Drag & Carousel Track */}
      <div
        ref={containerRef}
        className="relative h-44 sm:h-52 w-full overflow-hidden touch-pan-y select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
      >
        <div
          className="absolute top-1/2 flex items-center"
          style={{
            left: "50%",
            transform: `translate(calc(-50px - ${selectedIndex * ITEM_WIDTH}px), -50%)`,
            transition: "transform 400ms cubic-bezier(.22,.9,.3,1)",
            gap: "20px",
          }}
        >
          {items.map((item, idx) => {
            const dist = idx - selectedIndex;
            const absDist = Math.abs(dist);
            const isCenter = dist === 0;
            const scale = isCenter ? 1.4 : 1;
            const opacity = absDist > 8 ? 0 : Math.max(0.15, 1 - absDist * 0.12);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(idx)}
                style={{
                  width: "100px",
                  transform: `scale(${scale})`,
                  opacity,
                  transition: "transform 400ms cubic-bezier(.22,.9,.3,1), opacity 300ms",
                }}
                className="relative flex shrink-0 items-center justify-center outline-none focus:outline-none cursor-pointer"
                title={item.name}
              >
                <div
                  className={`relative overflow-hidden rounded-full transition-all duration-300 ${
                    isCenter
                      ? "h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-white ring-offset-4 ring-offset-black shadow-[0_0_25px_rgba(255,255,255,0.4)]"
                      : "h-16 w-16 sm:h-20 sm:w-20 ring-0 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    draggable={false}
                    className="size-full object-cover pointer-events-none"
                  />
                </div>

                {/* Selected Checkmark Badge (Bottom Right) */}
                {isCenter && (
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 flex size-6 sm:size-7 items-center justify-center rounded-full bg-white text-black shadow-lg animate-in zoom-in-75 duration-200">
                    <FaCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Chevron Button */}
      <button
        type="button"
        aria-label="Next Avatar"
        onClick={() => onChange(Math.min(items.length - 1, selectedIndex + 1))}
        disabled={selectedIndex === items.length - 1}
        className="absolute right-2 sm:right-6 md:right-12 z-20 rounded-full p-3 text-white/60 transition hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none bg-black/40 backdrop-blur-sm focus:outline-none cursor-pointer"
      >
        <FaChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ProfileManager;
