"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Input,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FaPlay,
  FaPause,
  FaUsers,
  FaCrown,
  FaPaperPlane,
  FaCopy,
  FaCheck,
  FaServer,
  FaChevronLeft,
  FaLock,
  FaArrowRightFromBracket,
  FaArrowsRotate,
} from "react-icons/fa6";
import { LuPopcorn, LuSparkles } from "react-icons/lu";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { createClient } from "@/utils/supabase/client";
import { getWatchPartyRoom, getRoomMessages, addRoomMessage } from "@/services/watchPartyService";
import { WatchPartyRoom, WatchPartyMember, WatchPartyMessage } from "@/types/watchParty";
import { getMoviePlayers, getTvShowPlayers } from "@/utils/players";
import { PlayersProps } from "@/types";
import { resolveAvatarUrl } from "@/constants/avatars";
import AdShieldIframe from "@/components/ui/player/AdShieldIframe";

const QUICK_REACTIONS = ["🍿", "🔥", "😭", "👏", "🤣", "❤️"];

export default function WatchPartyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = ((params?.code as string) || "").toUpperCase();

  const { data: user } = useSupabaseUser();
  const [room, setRoom] = useState<WatchPartyRoom | null>(null);
  const [loading, setLoading] = useState(true);

  // Active player server
  const [players, setPlayers] = useState<PlayersProps[]>([]);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);

  // Chat & Members
  const [messages, setMessages] = useState<WatchPartyMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [members, setMembers] = useState<WatchPartyMember[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "members">("chat");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Channel reference
  const channelRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Current user info
  const currentUserId = useMemo(() => {
    return user?.id || (typeof window !== "undefined" ? localStorage.getItem("buchill_guest_id") || "guest_" + Math.random().toString(36).substring(2, 8) : "guest");
  }, [user]);

  const currentUserName = useMemo(() => {
    return user?.username || "Guest Watcher";
  }, [user]);

  const currentUserAvatar = useMemo(() => {
    return (user?.user_metadata as any)?.avatar || "01";
  }, [user]);

  // Load Room Data
  useEffect(() => {
    if (!roomCode) return;

    const loadedRoom = getWatchPartyRoom(roomCode);
    if (!loadedRoom) {
      // Room not found in local, create a fallback or redirect
      addToast({
        title: "Room not found",
        description: `No active watch party with code ${roomCode}`,
        color: "danger",
      });
      setLoading(false);
      return;
    }

    setRoom(loadedRoom);
    setMessages(getRoomMessages(roomCode));

    // Load players list (CineSrc is first!)
    if (loadedRoom.media_type === "tv") {
      const tvPlayers = getTvShowPlayers(
        loadedRoom.media_id,
        loadedRoom.season || 1,
        loadedRoom.episode || 1
      );
      setPlayers(tvPlayers);
    } else {
      const moviePlayers = getMoviePlayers(loadedRoom.media_id);
      setPlayers(moviePlayers);
    }

    setLoading(false);
  }, [roomCode]);

  // Is current user host?
  const isHost = useMemo(() => {
    if (!room) return false;
    return room.host_id === currentUserId || room.host_id === "guest";
  }, [room, currentUserId]);

  // Setup Supabase Realtime Broadcast & Presence
  useEffect(() => {
    if (!roomCode || !room) return;

    try {
      const supabase = createClient();
      const channel = supabase.channel(`watch-party-${roomCode}`, {
        config: {
          broadcast: { self: true },
          presence: { key: currentUserId },
        },
      });

      channelRef.current = channel;

      // Broadcast Chat Messages
      channel.on("broadcast", { event: "chat" }, ({ payload }) => {
        const msg = payload as WatchPartyMessage;
        setMessages((prev) => [...prev, msg]);
        addRoomMessage(roomCode, msg);
      });

      // Broadcast Playback Sync
      channel.on("broadcast", { event: "sync-playback" }, ({ payload }) => {
        const { action, sender_name, serverIndex } = payload;
        if (typeof serverIndex === "number") {
          setSelectedServerIndex(serverIndex);
        }
        addToast({
          title: `Party Sync: ${sender_name} ${action} the video`,
          color: "primary",
        });
      });

      // Presence: Sync active online members
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeMembers: WatchPartyMember[] = [];
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            const p = presences[0];
            activeMembers.push({
              id: p.id || key,
              name: p.name || "Party Guest",
              avatar: p.avatar || "01",
              is_host: p.is_host || false,
              joined_at: p.joined_at || new Date().toISOString(),
            });
          }
        });

        // Ensure host is listed if presence is loading
        if (activeMembers.length === 0 && room) {
          activeMembers.push({
            id: room.host_id,
            name: room.host_name,
            avatar: room.host_avatar,
            is_host: true,
            joined_at: room.created_at,
          });
        }

        setMembers(activeMembers);
      });

      // Subscribe and track presence
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: currentUserId,
            name: currentUserName,
            avatar: currentUserAvatar,
            is_host: isHost,
            joined_at: new Date().toISOString(),
          });

          // Send system join message
          const joinMsg: WatchPartyMessage = {
            id: "sys_" + Math.random().toString(36).substring(2, 9),
            sender_id: "system",
            sender_name: "Party Bot",
            sender_avatar: "01",
            text: `${currentUserName} joined the room! 👋`,
            is_system: true,
            created_at: new Date().toISOString(),
          };
          channel.send({
            type: "broadcast",
            event: "chat",
            payload: joinMsg,
          });
        }
      });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.error("Supabase realtime connection error:", e);
    }
  }, [roomCode, room, currentUserId, currentUserName, currentUserAvatar, isHost]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: WatchPartyMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_avatar: currentUserAvatar,
      text: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat",
        payload: newMsg,
      });
    } else {
      setMessages((prev) => [...prev, newMsg]);
      addRoomMessage(roomCode, newMsg);
    }

    setInputText("");
  };

  const handleSendReaction = (emoji: string) => {
    const reactionMsg: WatchPartyMessage = {
      id: "rx_" + Math.random().toString(36).substring(2, 9),
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_avatar: currentUserAvatar,
      text: emoji,
      created_at: new Date().toISOString(),
    };

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat",
        payload: reactionMsg,
      });
    } else {
      setMessages((prev) => [...prev, reactionMsg]);
      addRoomMessage(roomCode, reactionMsg);
    }
  };

  const handleBroadcastSync = (action: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync-playback",
        payload: {
          action,
          sender_name: currentUserName,
          serverIndex: selectedServerIndex,
          timestamp: Date.now(),
        },
      });
      addToast({
        title: `Broadcasted ${action} to party`,
        color: "success",
      });
    }
  };

  const handleCopyInvite = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    addToast({
      title: "Invite link copied to clipboard!",
      color: "success",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-white/60">Connecting to Watch Party...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white px-4 text-center">
        <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
          🍿
        </div>
        <h2 className="text-2xl font-bold mb-2">Watch Party Not Found</h2>
        <p className="text-sm text-white/50 max-w-sm mb-6">
          Room code <span className="font-mono text-amber-400 font-bold">{roomCode}</span> does not exist or has already ended.
        </p>
        <Link href="/watch-party">
          <Button color="primary" className="bg-amber-500 text-black font-bold">
            Back to Watch Party
          </Button>
        </Link>
      </div>
    );
  }

  const currentPlayer = players[selectedServerIndex] || players[0];
  const participantCount = Math.max(1, members.length);

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col select-none overflow-hidden">
      {/* ========================================================= */}
      {/* TOP ROOM NAVBAR                                           */}
      {/* ========================================================= */}
      <header className="h-14 border-b border-white/10 bg-neutral-950 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/watch-party"
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
            title="Leave Party"
          >
            <FaChevronLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-white line-clamp-1 max-w-[180px] sm:max-w-xs md:max-w-md">
              {room.media_title}
            </span>
            {room.season && room.episode && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                S{room.season} • E{room.episode}
              </span>
            )}
          </div>
        </div>

        {/* Center/Right Party Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Capacity Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/80">
            <FaUsers className="w-3.5 h-3.5 text-primary" />
            <span>{participantCount}/{room.max_participants || 5}</span>
          </div>

          {/* Room Code Pill */}
          <button
            type="button"
            onClick={handleCopyInvite}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer"
            title="Click to copy invite"
          >
            <span>{room.code}</span>
            {hasCopied ? <FaCheck className="w-2.5 h-2.5 text-emerald-400" /> : <FaCopy className="w-2.5 h-2.5" />}
          </button>

          {/* Invite Button */}
          <Button
            size="sm"
            variant="flat"
            onPress={() => setIsInviteOpen(true)}
            startContent={<FaUsers className="w-3 h-3" />}
            className="bg-white/10 text-white font-semibold text-xs h-8 px-3"
          >
            Invite
          </Button>

          {/* Leave Button */}
          <Link href="/watch-party">
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={<FaArrowRightFromBracket className="w-3 h-3" />}
              className="text-xs h-8 px-2.5"
            >
              <span className="hidden sm:inline">Leave</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN LAYOUT: PLAYER (LEFT) & CHAT/MEMBERS (RIGHT)         */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* VIDEO PLAYER SECTION */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
          {/* Active Iframe Embed */}
          <div className="relative flex-1 w-full bg-black flex items-center justify-center">
            {currentPlayer ? (
              <AdShieldIframe
                src={currentPlayer.source}
                title={`Watch Party - ${room.media_title}`}
                className="w-full h-full border-0"
                allowFullScreen
                serverName={currentPlayer.title}
              />
            ) : (
              <p className="text-white/40 text-sm">No player stream available</p>
            )}
          </div>

          {/* Player Bottom Bar: Server Switcher & Sync Controls */}
          <div className="h-12 border-t border-white/10 bg-neutral-950/90 px-4 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <FaServer className="text-primary text-xs shrink-0" />
              <select
                value={selectedServerIndex}
                onChange={(e) => {
                  const idx = parseInt(e.target.value) || 0;
                  setSelectedServerIndex(idx);
                  if (isHost) {
                    handleBroadcastSync(`switched server to ${players[idx]?.title}`);
                  }
                }}
                className="bg-white/10 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white outline-none cursor-pointer"
              >
                {players.map((p, idx) => (
                  <option key={p.title} value={idx} className="bg-neutral-900 text-white">
                    {p.title} {p.recommended ? "★" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Host Sync Action */}
            {isHost && (
              <Button
                size="sm"
                variant="flat"
                color="warning"
                onPress={() => handleBroadcastSync("synced")}
                startContent={<FaArrowsRotate className="w-2.5 h-2.5" />}
                className="text-xs h-7 px-2.5 font-bold"
              >
                Sync with Party
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: LIVE CHAT & MEMBERS */}
        <div className="w-full lg:w-80 xl:w-96 h-64 lg:h-full border-t lg:border-t-0 lg:border-l border-white/10 bg-neutral-950 flex flex-col shrink-0 z-20">
          {/* Tab Switcher */}
          <div className="p-2.5 border-b border-white/10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "chat"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <LuPopcorn className="w-3.5 h-3.5" />
              <span>Party Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "members"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <FaUsers className="w-3.5 h-3.5" />
              <span>Squad ({participantCount})</span>
            </button>
          </div>

          {/* TAB 1: CHAT STREAM */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <p className="text-xs font-semibold text-white/40">
                      Welcome to the watch party! 🎉
                    </p>
                    <p className="text-[11px] text-white/30 mt-1">
                      Say hi to everyone or drop a quick reaction below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    if (msg.is_system) {
                      return (
                        <div key={msg.id} className="flex justify-center my-1">
                          <span className="text-[10px] font-semibold text-white/40 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    const isMe = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div className="size-6 rounded-full overflow-hidden bg-neutral-800 shrink-0 border border-white/10 mt-0.5">
                          <img
                            src={resolveAvatarUrl(msg.sender_avatar)}
                            alt={msg.sender_name}
                            className="size-full object-cover"
                          />
                        </div>
                        <div className={`max-w-[78%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          {!isMe && (
                            <span className="text-[10px] text-white/50 font-medium px-1 mb-0.5">
                              {msg.sender_name}
                            </span>
                          )}
                          <div
                            className={`rounded-2xl px-3 py-1.5 text-xs font-normal leading-relaxed break-words ${
                              isMe
                                ? "bg-amber-500 text-black font-medium rounded-tr-xs"
                                : "bg-white/10 text-white rounded-tl-xs border border-white/5"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Reactions */}
              <div className="px-3 py-1.5 border-t border-white/5 flex items-center justify-between gap-1">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendReaction(emoji)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-sm transition hover:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Message Input Bar */}
              <form onSubmit={handleSendMessage} className="p-2.5 border-t border-white/10 flex items-center gap-2">
                <Input
                  size="sm"
                  placeholder="Message the party..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  classNames={{
                    inputWrapper: "bg-white/5 border border-white/15 h-9",
                  }}
                />
                <Button
                  type="submit"
                  size="sm"
                  isIconOnly
                  isDisabled={!inputText.trim()}
                  className="bg-amber-500 text-black shrink-0 h-9 w-9 rounded-xl"
                >
                  <FaPaperPlane className="w-3 h-3" />
                </Button>
              </form>
            </div>
          )}

          {/* TAB 2: SQUAD / MEMBERS LIST */}
          {activeTab === "members" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                <span>MEMBERS ({participantCount}/5)</span>
                <span>STATUS</span>
              </div>

              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative size-8 rounded-full overflow-hidden bg-neutral-800 border border-white/10">
                      <img
                        src={resolveAvatarUrl(member.avatar)}
                        alt={member.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white line-clamp-1">
                          {member.name}
                        </span>
                        {member.is_host && (
                          <FaCrown className="w-3 h-3 text-amber-400" title="Host" />
                        )}
                      </div>
                      <span className="text-[10px] text-white/40">
                        {member.id === currentUserId ? "You" : "Guest"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-emerald-400">Online</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* INVITE MODAL                                              */}
      {/* ========================================================= */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        size="md"
        classNames={{
          base: "bg-neutral-950 border border-white/15 text-white text-center p-3",
        }}
      >
        <ModalContent>
          <ModalBody className="py-6 flex flex-col items-center gap-5">
            <div className="size-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl">
              <FaUsers />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Invite Friends</h3>
              <p className="text-xs text-white/60 mt-1">
                Share this room code or copy the direct watch link.
              </p>
            </div>

            <div
              onClick={handleCopyInvite}
              className="cursor-pointer flex items-center justify-center px-8 py-4 rounded-2xl bg-neutral-900 border border-white/15 hover:border-amber-500/50 transition w-full"
            >
              <span className="font-mono text-3xl font-black tracking-[0.3em] text-amber-400">
                {room.code}
              </span>
            </div>

            <Button
              size="md"
              variant="solid"
              onPress={handleCopyInvite}
              startContent={hasCopied ? <FaCheck /> : <FaCopy />}
              className="w-full bg-amber-500 text-black font-bold"
            >
              {hasCopied ? "Copied to Clipboard!" : "Copy Invite Link"}
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
