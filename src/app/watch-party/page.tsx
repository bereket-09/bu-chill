"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Switch,
  addToast,
  Spinner,
} from "@heroui/react";
import {
  FaPlay,
  FaPlus,
  FaUsers,
  FaLock,
  FaGlobe,
  FaCopy,
  FaCheck,
  FaTv,
  FaFilm,
  FaMagnifyingGlass,
  FaArrowRight,
} from "react-icons/fa6";
import { LuPopcorn, LuSparkles } from "react-icons/lu";
import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { tmdb } from "@/api/tmdb";
import { ContentType } from "@/types";
import { WatchPartyRoom } from "@/types/watchParty";
import {
  generateRoomCode,
  createWatchPartyRoom,
  getPublicRooms,
} from "@/services/watchPartyService";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { getActiveProfileId } from "@/services/profileStorage";
import { getImageUrl } from "@/utils/movies";

interface SearchMediaItem {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export default function WatchPartyIndexPage() {
  const router = useRouter();
  const { data: user } = useSupabaseUser();

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, 350);
  const [selectedMedia, setSelectedMedia] = useState<SearchMediaItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isPublic, setIsPublic] = useState(false);

  // Ready Modal state
  const [readyRoom, setReadyRoom] = useState<WatchPartyRoom | null>(null);
  const [isReadyOpen, setIsReadyOpen] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Join by code input
  const [joinCode, setJoinCode] = useState("");

  // Public rooms list
  const publicRooms = useMemo(() => {
    return getPublicRooms();
  }, [isCreateOpen, isReadyOpen]);

  // Search TMDB query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["wp-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const res = await tmdb.search.multi({ query: debouncedSearch.trim() });
      return res.results.filter(
        (item: any) =>
          (item.media_type === "movie" || item.media_type === "tv") &&
          (item.poster_path || item.backdrop_path)
      ) as SearchMediaItem[];
    },
    enabled: Boolean(debouncedSearch.trim()),
    staleTime: 1000 * 60 * 5,
  });

  // Trending fallbacks if search is empty
  const { data: trendingResults } = useQuery({
    queryKey: ["wp-trending"],
    queryFn: async () => {
      const res = await tmdb.trending.trending("all", "day");
      return res.results.filter(
        (item: any) =>
          (item.media_type === "movie" || item.media_type === "tv") &&
          (item.poster_path || item.backdrop_path)
      ).slice(0, 10) as SearchMediaItem[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const handleCreateRoom = () => {
    if (!selectedMedia) {
      addToast({
        title: "Please pick a title first",
        color: "warning",
      });
      return;
    }

    const code = generateRoomCode();
    const mediaTitle = selectedMedia.title || selectedMedia.name || "Media";
    const hostName = user?.username || "Party Host";
    const hostAvatar = (user?.user_metadata as any)?.avatar || "01";

    const newRoom: WatchPartyRoom = {
      code,
      host_id: user?.id || "guest",
      host_name: hostName,
      host_avatar: hostAvatar,
      media_id: selectedMedia.id,
      media_type: selectedMedia.media_type,
      media_title: mediaTitle,
      media_poster: selectedMedia.poster_path || selectedMedia.backdrop_path || null,
      season: selectedMedia.media_type === "tv" ? selectedSeason : undefined,
      episode: selectedMedia.media_type === "tv" ? selectedEpisode : undefined,
      is_public: isPublic,
      max_participants: 5,
      created_at: new Date().toISOString(),
    };

    createWatchPartyRoom(newRoom);
    setIsCreateOpen(false);
    setReadyRoom(newRoom);
    setIsReadyOpen(true);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length < 4) {
      addToast({
        title: "Please enter a valid room code",
        color: "warning",
      });
      return;
    }
    router.push(`/watch-party/${clean}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
    addToast({
      title: "Room code copied to clipboard!",
      color: "success",
    });
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/watch-party/${code}`;
    navigator.clipboard.writeText(url);
    setHasCopiedLink(true);
    setTimeout(() => setHasCopiedLink(false), 2000);
    addToast({
      title: "Invite link copied to clipboard!",
      color: "success",
    });
  };

  return (
    <div className="min-h-screen w-full bg-black text-white px-4 sm:px-8 md:px-16 pt-24 pb-32">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/40 via-neutral-900/90 to-amber-950/30 p-8 sm:p-14 mb-16 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 size-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-6">
            <LuSparkles className="w-3.5 h-3.5" />
            <span>Synchronized Streaming</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Stream Together <br />
            <span className="bg-gradient-to-r from-amber-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              In Real-Time
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/70 mb-8 leading-relaxed">
            Create a watch room, invite your friends, and watch your favorite movies and TV series with synced playback and live party chat.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              color="primary"
              variant="solid"
              onPress={() => {
                setSelectedMedia(null);
                setSearchQuery("");
                setIsCreateOpen(true);
              }}
              startContent={<FaPlus className="w-4 h-4" />}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold shadow-lg shadow-orange-500/25 hover:scale-105 transition-transform"
            >
              Create Watch Party
            </Button>

            {/* Quick Join input form */}
            <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
              <Input
                size="md"
                placeholder="Enter 6-char code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                classNames={{
                  inputWrapper: "bg-white/10 border border-white/15 h-12 w-44 font-mono uppercase font-bold text-center tracking-widest",
                }}
              />
              <Button
                type="submit"
                size="lg"
                variant="flat"
                className="bg-white/15 hover:bg-white/25 text-white font-semibold h-12"
              >
                Join
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 flex flex-col gap-3">
          <div className="size-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FaPlay className="w-4 h-4 ml-0.5" />
          </div>
          <h3 className="text-base font-bold text-white">Synchronized Playback</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            When the host plays, pauses, or seeks, everyone in the room stays synchronized automatically.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 flex flex-col gap-3">
          <div className="size-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <LuPopcorn className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Live Party Chat</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Share reactions, laugh, and discuss your favorite scenes in real-time with your friends.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 flex flex-col gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FaUsers className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Private & Public Rooms</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Host a private movie night for up to 5 close friends or list your room publicly for community watch sessions.
          </p>
        </div>
      </div>

      {/* Public Watch Parties Shelf */}
      {publicRooms.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <FaGlobe className="text-purple-400 text-base" />
              <h2 className="text-xl font-bold text-white tracking-wide">
                Active Public Rooms
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/70">
              {publicRooms.length} active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {publicRooms.map((room) => (
              <div
                key={room.code}
                className="group relative rounded-2xl overflow-hidden bg-neutral-900/80 border border-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between p-4"
              >
                <div className="flex gap-3 mb-4">
                  <div className="relative aspect-[2/3] w-20 shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                    <img
                      src={getImageUrl(room.media_poster || "")}
                      alt={room.media_title}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {room.media_type === "tv" ? "TV Series" : "Movie"}
                      </span>
                      <h4 className="font-bold text-sm text-white line-clamp-2 mt-1.5">
                        {room.media_title}
                      </h4>
                      {room.season && room.episode && (
                        <p className="text-xs text-amber-400 mt-0.5 font-semibold">
                          S{room.season} • E{room.episode}
                        </p>
                      )}
                    </div>
                    <p className="text-[11px] text-white/50">
                      Host: <span className="text-white/80 font-medium">{room.host_name}</span>
                    </p>
                  </div>
                </div>

                <Link href={`/watch-party/${room.code}`}>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="w-full bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white font-semibold"
                    endContent={<FaArrowRight className="w-2.5 h-2.5" />}
                  >
                    Join Room ({room.code})
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: CREATE ROOM & PICK A TITLE (matching Bingr flow)     */}
      {/* ============================================================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-neutral-950 border border-white/15 text-white max-h-[90vh]",
          header: "border-b border-white/10 pb-4",
          footer: "border-t border-white/10 pt-4",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>🍿 Create Watch Party</span>
            </h3>
            <p className="text-xs text-white/50 font-normal">
              Pick a movie or TV show, choose your privacy, and invite your squad.
            </p>
          </ModalHeader>

          <ModalBody className="py-5 flex flex-col gap-6">
            {/* Step 1: Search and Pick Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">
                1. Pick a title
              </label>
              <Input
                placeholder="Search movies, TV shows, anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<FaMagnifyingGlass className="text-white/40 text-xs mr-1" />}
                isClearable
                onClear={() => setSearchQuery("")}
                classNames={{
                  inputWrapper: "bg-white/5 border border-white/10 hover:border-white/20 h-11",
                }}
              />

              {/* Selected Title Preview */}
              {selectedMedia && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                      <img
                        src={getImageUrl(selectedMedia.poster_path || selectedMedia.backdrop_path || "")}
                        alt="Selected"
                        className="size-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase">Selected Title</p>
                      <p className="text-sm font-bold text-white line-clamp-1">
                        {selectedMedia.title || selectedMedia.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => setSelectedMedia(null)}
                    className="text-xs"
                  >
                    Change
                  </Button>
                </div>
              )}

              {/* Search Results Grid */}
              {!selectedMedia && (
                <div className="mt-3 max-h-56 overflow-y-auto pr-1">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="md" color="warning" />
                    </div>
                  ) : (searchResults && searchResults.length > 0) || (trendingResults && trendingResults.length > 0) ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {(searchResults && searchResults.length > 0 ? searchResults : trendingResults || []).map(
                        (item) => (
                          <button
                            key={`${item.media_type}-${item.id}`}
                            type="button"
                            onClick={() => setSelectedMedia(item)}
                            className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition text-left cursor-pointer group"
                          >
                            <div className="size-11 rounded-md overflow-hidden shrink-0 bg-neutral-800">
                              <img
                                src={getImageUrl(item.poster_path || item.backdrop_path || "")}
                                alt={item.title || item.name || ""}
                                className="size-full object-cover"
                              />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-400">
                                {item.title || item.name}
                              </p>
                              <span className="text-[10px] text-white/50 uppercase font-semibold">
                                {item.media_type}
                              </span>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 text-center py-6">
                      Type above to search across movies and TV series
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: If TV show, pick Season & Episode */}
            {selectedMedia?.media_type === "tv" && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase text-white/70 block mb-1.5">
                    Season
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={String(selectedSeason)}
                    onChange={(e) => setSelectedSeason(Math.max(1, parseInt(e.target.value) || 1))}
                    classNames={{ inputWrapper: "bg-black/40 border border-white/10" }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase text-white/70 block mb-1.5">
                    Episode
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={String(selectedEpisode)}
                    onChange={(e) => setSelectedEpisode(Math.max(1, parseInt(e.target.value) || 1))}
                    classNames={{ inputWrapper: "bg-black/40 border border-white/10" }}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Privacy and Capacity */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  {isPublic ? <FaGlobe className="w-4 h-4 text-purple-400" /> : <FaLock className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {isPublic ? "Public Room" : "Private Room (Recommended)"}
                  </p>
                  <p className="text-xs text-white/50">
                    {isPublic
                      ? "Anyone on the site can view and join"
                      : "Only people with the invite code can enter"}
                  </p>
                </div>
              </div>
              <Switch
                isSelected={isPublic}
                onValueChange={setIsPublic}
                color="secondary"
                aria-label="Toggle Public Room"
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="flat" onPress={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              variant="solid"
              isDisabled={!selectedMedia}
              onPress={handleCreateRoom}
              className="bg-amber-500 text-black font-bold"
            >
              Create Room
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ============================================================= */}
      {/* MODAL 2: WATCH PARTY READY! (matching media_1790029737995.png) */}
      {/* ============================================================= */}
      <Modal
        isOpen={isReadyOpen}
        onClose={() => setIsReadyOpen(false)}
        size="md"
        classNames={{
          base: "bg-neutral-950 border border-white/15 text-white text-center p-2",
        }}
      >
        <ModalContent>
          <ModalBody className="py-6 flex flex-col items-center gap-5">
            <div className="size-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              🎉
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white">Watch Party Ready!</h3>
              <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
                Share this code with your friends or copy the direct link so they can join right now.
              </p>
            </div>

            {/* Room Code Big Spaced Display */}
            {readyRoom && (
              <div
                onClick={() => handleCopyCode(readyRoom.code)}
                className="group relative cursor-pointer flex items-center justify-center px-8 py-5 rounded-2xl bg-neutral-900 border border-white/15 hover:border-amber-500/50 transition-all shadow-xl"
              >
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-[0.4em] text-amber-400 drop-shadow-md select-all">
                  {readyRoom.code}
                </span>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-white transition">
                  {hasCopiedCode ? <FaCheck className="text-emerald-400 w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
              <Button
                size="md"
                variant="bordered"
                onPress={() => readyRoom && handleCopyLink(readyRoom.code)}
                startContent={
                  hasCopiedLink ? <FaCheck className="text-emerald-400" /> : <FaCopy />
                }
                className="border-white/20 text-white font-semibold hover:bg-white/10"
              >
                {hasCopiedLink ? "Invite Link Copied!" : "Copy Invite Link"}
              </Button>

              <Button
                size="lg"
                color="primary"
                variant="solid"
                onPress={() => {
                  if (readyRoom) {
                    setIsReadyOpen(false);
                    router.push(`/watch-party/${readyRoom.code}`);
                  }
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold shadow-lg shadow-orange-500/25"
              >
                Take me to the room
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
