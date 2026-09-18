"use client";

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Hls from "hls.js";
import { Channel } from "@/services/iptv";
import { cn } from "@/utils/helpers";
import {
  IoPlay,
  IoPause,
  IoVolumeHigh,
  IoVolumeMute,
  IoStar,
  IoStarOutline,
  IoArrowBack,
  IoClose,
  IoSearchOutline,
} from "react-icons/io5";
import {
  MdFullscreen,
  MdFullscreenExit,
  MdTv,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
  MdRefresh,
  MdAspectRatio,
} from "react-icons/md";
import Link from "next/link";
import SafeImage from "@/components/ui/other/SafeImage";

export interface LivePlayerProps {
  channel: Channel;
  channels?: Channel[];
  onSelectChannel?: (channel: Channel) => void;
  onPrevChannel?: () => void;
  onNextChannel?: () => void;
  onOpenGuide?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  className?: string;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  channel,
  channels = [],
  onSelectChannel,
  onPrevChannel,
  onNextChannel,
  onOpenGuide,
  isFavorite,
  onToggleFavorite,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<"contain" | "cover">("contain");
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [drawerCategory, setDrawerCategory] = useState("All");
  const [showOsd, setShowOsd] = useState(true);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger OSD on channel change
  useEffect(() => {
    setShowOsd(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setShowOsd(false);
    }, 4000);
    return () => {
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    };
  }, [channel.id]);

  // Mouse idle hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (isPlaying && !showChannelDrawer) {
        setShowControls(false);
      }
    }, 3500);
  }, [isPlaying, showChannelDrawer]);

  // Load and play HLS stream
  const initHls = useCallback(() => {
    const video = videoRef.current;
    if (!video || !channel.url) return;

    setHasError(false);
    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 8,
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
      });

      hlsRef.current = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setIsBuffering(false);
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.url;
      video.play().catch(() => setIsPlaying(false));
    }
  }, [channel.url]);

  useEffect(() => {
    initHls();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initHls]);

  // Keyboard navigation for TV zapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        onPrevChannel?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onNextChannel?.();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        setShowChannelDrawer((prev) => !prev);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrevChannel, onNextChannel]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleAspectRatio = () => {
    setAspectRatio((prev) => (prev === "contain" ? "cover" : "contain"));
  };

  // Drawer filtering
  const drawerCategories = useMemo(() => {
    const set = new Set<string>(["All"]);
    channels.forEach((c) => {
      const cat = c.group || c.category;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [channels]);

  const filteredDrawerChannels = useMemo(() => {
    return channels.filter((ch) => {
      const cat = ch.group || ch.category || "";
      if (drawerCategory !== "All" && cat !== drawerCategory) return false;
      if (drawerSearch.trim()) {
        const q = drawerSearch.toLowerCase();
        return ch.name.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
      }
      return true;
    });
  }, [channels, drawerCategory, drawerSearch]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/90 select-none",
        className
      )}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        className={cn(
          "w-full h-full bg-black transition-all",
          aspectRatio === "cover" ? "object-cover" : "object-contain"
        )}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onError={() => {
          setHasError(true);
          setIsBuffering(false);
        }}
      />

      {/* Buffering Spinner */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs pointer-events-none z-20 gap-3">
          <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-white animate-spin" />
          <span className="text-xs font-semibold text-white/70 tracking-wider uppercase animate-pulse">
            Tuning in to {channel.name}...
          </span>
        </div>
      )}

      {/* Stream Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-20 p-6 text-center space-y-3">
          <div className="p-3 rounded-full bg-red-600/20 text-red-500 border border-red-500/30">
            <MdTv className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-white">Live Stream Signal Lost</h4>
          <p className="text-xs text-white/50 max-w-sm">
            This broadcast feed may be temporarily offline or restricted. Try reloading the stream or zapping to another channel.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={initHls}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 shadow-lg"
            >
              <MdRefresh className="w-4 h-4" />
              <span>Retry Signal</span>
            </button>
            <button
              type="button"
              onClick={() => setShowChannelDrawer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10"
            >
              <span>Switch Channel</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= ON-SCREEN TV OSD BANNER ================= */}
      <div
        className={cn(
          "absolute top-6 left-6 z-30 flex items-center gap-3.5 p-2.5 pr-5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl transition-all duration-500 pointer-events-none",
          showOsd
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4"
        )}
      >
        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white/10 p-1 border border-white/10 shrink-0">
          {channel.logo ? (
            <SafeImage src={channel.logo} alt={channel.name} fill className="object-contain p-1" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-black text-xs text-white">
              {channel.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              LIVE NOW
            </span>
            {(channel.group || channel.category) && (
              <span className="text-[10px] font-bold text-white/50 uppercase px-1.5 py-0.2 rounded bg-white/10">
                {channel.group || channel.category}
              </span>
            )}
          </div>
          <h3 className="text-sm font-black text-white truncate max-w-xs">{channel.name}</h3>
        </div>
      </div>

      {/* Top Floating Action Controls */}
      <div
        className={cn(
          "absolute top-4 right-4 z-30 flex items-center gap-2 transition-opacity duration-300",
          showControls || showChannelDrawer ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Quick Channel Switcher Trigger Button */}
        <button
          type="button"
          onClick={() => setShowChannelDrawer((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
          title="Open Channel Switcher (Press C)"
        >
          <MdTv className="w-4 h-4 text-primary" />
          <span>Channels</span>
        </button>

        {/* Favorite Toggle */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 shadow-lg transition-all"
            aria-label="Toggle Favorite"
          >
            {isFavorite ? (
              <IoStar className="w-4 h-4 fill-amber-400 text-amber-400" />
            ) : (
              <IoStarOutline className="w-4 h-4 text-white/70" />
            )}
          </button>
        )}
      </div>

      {/* Bottom Video Controls Overlay */}
      <div
        className={cn(
          "absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300",
          showControls || showChannelDrawer ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Left: Play/Pause, Channel Nav, Volume */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black hover:bg-white/90 active:scale-95 transition-all shadow"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <IoPause className="w-4 h-4 fill-black" /> : <IoPlay className="w-4 h-4 fill-black translate-x-0.5" />}
          </button>

          {/* Previous / Next Channel Zappers */}
          {onPrevChannel && (
            <button
              type="button"
              onClick={onPrevChannel}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Previous Channel (Arrow Up)"
            >
              <MdKeyboardArrowUp className="w-5 h-5" />
            </button>
          )}
          {onNextChannel && (
            <button
              type="button"
              onClick={onNextChannel}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Next Channel (Arrow Down)"
            >
              <MdKeyboardArrowDown className="w-5 h-5" />
            </button>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-2 pl-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <IoVolumeMute className="w-5 h-5 text-red-400" />
              ) : (
                <IoVolumeHigh className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-black text-red-500 uppercase tracking-widest pl-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            LIVE
          </span>
        </div>

        {/* Right: Aspect Ratio, Stream Refresh, Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAspectRatio}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1"
            title={`Aspect: ${aspectRatio}`}
          >
            <MdAspectRatio className="w-4 h-4" />
            <span className="hidden sm:inline capitalize text-[11px]">{aspectRatio}</span>
          </button>

          <button
            type="button"
            onClick={initHls}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Reconnect Stream"
          >
            <MdRefresh className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <MdFullscreenExit className="w-5 h-5" /> : <MdFullscreen className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ================= ON-SCREEN QUICK CHANNEL SWITCHER DRAWER ================= */}
      {showChannelDrawer && (
        <div className="absolute inset-0 z-40 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-80 sm:w-96 h-full bg-[#0f1014]/95 backdrop-blur-xl border-l border-white/15 p-4 flex flex-col space-y-3.5 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MdTv className="w-4 h-4 text-primary" />
                <span>Channels Switcher</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowChannelDrawer(false)}
                className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex items-center bg-black/60 rounded-xl border border-white/10 px-3 py-1.5">
              <IoSearchOutline className="w-4 h-4 text-white/40 mr-2 shrink-0" />
              <input
                type="text"
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                placeholder="Search channels..."
                className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
              />
              {drawerSearch && (
                <button type="button" onClick={() => setDrawerSearch("")} className="text-white/40 hover:text-white">
                  <IoClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 shrink-0" style={{ scrollbarWidth: "none" }}>
              {drawerCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDrawerCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border",
                    drawerCategory === cat
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/60 hover:text-white border-white/5"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Channels Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: "thin" }}>
              {filteredDrawerChannels.map((ch) => {
                const isActive = ch.id === channel.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      onSelectChannel?.(ch);
                      setShowChannelDrawer(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all border",
                      isActive
                        ? "bg-primary/20 border-primary text-white shadow-lg"
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-white/80"
                    )}
                  >
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black/80 p-1 shrink-0 border border-white/10">
                      {ch.logo ? (
                        <SafeImage src={ch.logo} alt={ch.name} fill className="object-contain p-0.5" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white">
                          {ch.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate">{ch.name}</span>
                      <span className="text-[10px] text-white/40 uppercase">{ch.group || ch.category}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePlayer;
