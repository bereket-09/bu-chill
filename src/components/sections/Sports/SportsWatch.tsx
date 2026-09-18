"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Hls from "hls.js";
import { useQuery } from "@tanstack/react-query";
import { SportsMatch, SportsStream } from "@/services/sports";
import SafeImage from "@/components/ui/other/SafeImage";
import { getSportsBadgeUrl, getSportsPosterUrl } from "./SportsHeroCarousel";
import {
  IoArrowBack,
  IoPlay,
  IoPause,
  IoVolumeHigh,
  IoVolumeMute,
  IoRefresh,
  IoServer,
  IoCheckmark,
  IoGridOutline,
  IoClose,
  IoSearchOutline,
  IoRadio,
  IoTimeOutline,
  IoFlame,
  IoWarningOutline,
} from "react-icons/io5";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";

const DRAWER_CATEGORIES = [
  { id: "all", label: "All Sports" },
  { id: "live", label: "Live Now 🔴" },
  { id: "football", label: "Football ⚽" },
  { id: "basketball", label: "Basketball 🏀" },
  { id: "fight", label: "UFC / Combat 🥊" },
  { id: "motorsport", label: "Motorsport 🏎️" },
  { id: "american-football", label: "NFL 🏈" },
  { id: "baseball", label: "Baseball ⚾" },
  { id: "tennis", label: "Tennis 🎾" },
  { id: "cricket", label: "Cricket 🏏" },
  { id: "hockey", label: "Hockey 🏒" },
];

export const SportsWatch: React.FC = () => {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("id") || "";

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [drawerCategory, setDrawerCategory] = useState("all");

  // 1. Fetch match details - uses the unified all matches query
  const { data: allMatches, isLoading: isMatchesLoading } = useQuery<SportsMatch[]>({
    queryKey: ["sports-matches", "all"],
    queryFn: async () => {
      const res = await fetch("/api/sports/matches?type=all");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 3,
  });

  const currentMatch = useMemo(() => {
    return (allMatches || []).find((m) => m.id === matchId) || null;
  }, [allMatches, matchId]);

  // Count live matches for badge
  const liveMatchesCount = useMemo(() => {
    return (allMatches || []).filter(
      (m) =>
        m.category !== "upcoming" &&
        new Date(m.date).getTime() < Date.now() + 1000 * 60 * 60 * 3
    ).length;
  }, [allMatches]);

  // 2. Fetch streams for this match
  const {
    data: streams,
    isLoading: isStreamsLoading,
    refetch: refetchStreams,
    isFetching: isStreamsFetching,
  } = useQuery<SportsStream[]>({
    queryKey: ["sports-streams", matchId],
    queryFn: async () => {
      if (!currentMatch?.sources) return [];
      const res = await fetch("/api/sports/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: currentMatch.sources }),
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: Boolean(currentMatch?.sources && currentMatch.sources.length > 0),
    staleTime: 1000 * 60 * 2,
  });

  // Reset active server index when match changes
  useEffect(() => {
    setActiveServerIndex(0);
    setHasError(false);
  }, [matchId]);

  const activeStream =
    streams && streams.length > 0
      ? streams[activeServerIndex] || streams[0]
      : null;

  const isDirectHls = activeStream?.embedUrl?.includes(".m3u8");

  // HLS stream loader
  const initHls = useCallback(() => {
    const video = videoRef.current;
    if (!video || !activeStream?.embedUrl || !isDirectHls) return;

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
        manifestLoadingTimeOut: 12000,
      });

      hlsRef.current = hls;
      hls.loadSource(activeStream.embedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        setHasError(false);
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
      video.src = activeStream.embedUrl;
      video.play().catch(() => setIsPlaying(false));
    }
  }, [activeStream, isDirectHls]);

  useEffect(() => {
    if (isDirectHls) {
      initHls();
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initHls, isDirectHls]);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  // Filtered matches for the drawer
  const drawerFilteredMatches = useMemo(() => {
    let list = [...(allMatches || [])];

    if (drawerCategory === "live") {
      list = list.filter(
        (m) =>
          m.category !== "upcoming" &&
          new Date(m.date).getTime() < Date.now() + 1000 * 60 * 60 * 3
      );
    } else if (drawerCategory !== "all") {
      list = list.filter((m) =>
        m.category?.toLowerCase().includes(drawerCategory.toLowerCase())
      );
    }

    if (drawerSearch.trim()) {
      const q = drawerSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.teams?.home?.name.toLowerCase().includes(q) ||
          m.teams?.away?.name.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allMatches, drawerCategory, drawerSearch]);

  return (
    <div className="w-full min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 md:pl-28 md:pr-10 py-6 space-y-6">
        {/* Top Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/sports"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14151b] border border-white/10 text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-semibold transition-all shadow-md group"
          >
            <IoArrowBack className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Sports Arena</span>
          </Link>

          {/* Premium High-Visibility "Switch Match" Button */}
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="relative inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600/30 via-primary/30 to-amber-500/30 hover:from-red-600/50 hover:via-primary/50 hover:to-amber-500/50 border border-red-500/40 hover:border-red-500/70 text-white text-xs sm:text-sm font-black transition-all duration-300 shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 group cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <IoGridOutline className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
            <span>Switch Match</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/15 text-white border border-white/20 uppercase tracking-wide">
              {liveMatchesCount > 0 ? `${liveMatchesCount} Live` : "Browse"}
            </span>
          </button>
        </div>

        {/* Video Player Container */}
        <div
          ref={containerRef}
          className="group relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/80 select-none"
        >
          {isDirectHls ? (
            <video
              ref={videoRef}
              playsInline
              className="w-full h-full object-contain bg-black"
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setIsPlaying(true);
                setHasError(false);
              }}
              onError={() => {
                setHasError(true);
                setIsBuffering(false);
              }}
            />
          ) : activeStream?.embedUrl ? (
            <iframe
              src={activeStream.embedUrl}
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="no-referrer"
              className="w-full h-full border-0 bg-black"
              title={currentMatch?.title || "Sports Stream"}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              {isStreamsLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-3 border-red-500/20 border-t-red-500 animate-spin" />
                  <p className="text-sm font-semibold text-white/70">
                    Connecting to Sports Satellite Streams...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 max-w-md">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-amber-400">
                    <IoRadio className="w-7 h-7 animate-pulse" />
                  </div>
                  <p className="text-lg font-bold text-white">
                    Live stream feeds not active yet
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Live sports streams typically activate 15–30 minutes before kickoff.
                    If the match has started, click below to refresh live satellite sources.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchStreams()}
                    disabled={isStreamsFetching}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all shadow"
                  >
                    <IoRefresh className={`w-4 h-4 ${isStreamsFetching ? "animate-spin" : ""}`} />
                    <span>Refresh Stream Sources</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Buffering Spinner for Direct HLS */}
          {isBuffering && isDirectHls && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-white animate-spin" />
            </div>
          )}

          {/* Graceful Stream Error Recovery Overlay */}
          {hasError && isDirectHls && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <IoWarningOutline className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-bold text-white">Direct Feed Unavailable</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  This satellite feed is offline or pending kickoff. Switch to an alternate HD server for instant playback.
                </p>
              </div>
              {streams && streams.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setHasError(false);
                    setActiveServerIndex((prev) => (prev + 1) % streams.length);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white text-black font-black text-xs shadow-lg hover:bg-white/90 active:scale-95 transition-all"
                >
                  Switch to Server {((activeServerIndex + 1) % streams.length) + 1}
                </button>
              )}
            </div>
          )}

          {/* Stream Controls Overlay (for HLS Direct) */}
          {isDirectHls && !hasError && (
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!videoRef.current) return;
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();
                    setIsPlaying(!isPlaying);
                  }}
                  className="p-2 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <IoPause className="w-5 h-5" /> : <IoPlay className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!videoRef.current) return;
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-white"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <IoVolumeMute className="w-5 h-5" /> : <IoVolumeHigh className="w-5 h-5" />}
                </button>

                <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  LIVE
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full hover:bg-white/10 text-white"
                  aria-label="Toggle Fullscreen"
                >
                  {isFullscreen ? (
                    <MdFullscreenExit className="w-6 h-6" />
                  ) : (
                    <MdFullscreen className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= STREAM DETAILS & SERVER SELECTOR ================= */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 sm:p-6 rounded-2xl bg-[#0f1014] border border-white/10 shadow-xl">
          {/* Match Info */}
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE STREAM
              </span>
              {currentMatch?.category && (
                <span className="text-xs text-white/60 font-bold uppercase tracking-wide">
                  {currentMatch.category}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {currentMatch?.title || "Live Sports Match"}
            </h2>
          </div>

          {/* Server Switcher Picker */}
          {streams && streams.length > 0 && (
            <div className="flex flex-col items-start md:items-end gap-2.5 w-full md:w-auto">
              <div className="flex items-center justify-between w-full md:w-auto gap-4">
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <IoServer className="w-3.5 h-3.5 text-primary" />
                  <span>Stream Servers:</span>
                </span>
                <button
                  type="button"
                  onClick={() => refetchStreams()}
                  className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <IoRefresh className={`w-3 h-3 ${isStreamsFetching ? "animate-spin" : ""}`} />
                  <span>Reload Feeds</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {streams.map((stream, idx) => {
                  const isCurrent = idx === activeServerIndex;
                  const isHls = stream.embedUrl?.includes(".m3u8");
                  return (
                    <button
                      key={stream.id || idx}
                      type="button"
                      onClick={() => {
                        setActiveServerIndex(idx);
                        setHasError(false);
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isCurrent
                          ? "bg-white text-black border-white shadow-lg scale-105"
                          : "bg-[#16181f] text-white/80 hover:text-white hover:bg-white/10 border-white/10"
                      }`}
                    >
                      {isCurrent && <IoCheckmark className="w-3.5 h-3.5 text-black" />}
                      <span>Server {stream.streamNo || idx + 1}</span>
                      {stream.hd && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black">
                          HD
                        </span>
                      )}
                      {isHls ? (
                        <span className="px-1 py-0.2 rounded bg-primary/20 text-primary text-[9px] font-black">
                          DIRECT
                        </span>
                      ) : (
                        <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black">
                          EMBED
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= STUNNING QUICK MATCH SWITCHER DRAWER ================= */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg h-full bg-[#0d0e12] border-l border-white/10 p-5 sm:p-6 flex flex-col space-y-4 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 text-white font-bold shadow-md shadow-red-600/30">
                  <IoGridOutline className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Live Sports Arena
                  </h3>
                  <p className="text-[11px] text-white/50">
                    Switch match instantly without losing your place
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                aria-label="Close match switcher"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative shrink-0">
              <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search team, match, league..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#14151b] border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-red-500/60 transition-colors"
              />
              {drawerSearch && (
                <button
                  type="button"
                  onClick={() => setDrawerSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <IoClose className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 shrink-0">
              {DRAWER_CATEGORIES.map((cat) => {
                const isSelected = drawerCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDrawerCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                        : "bg-[#14151b] text-white/60 hover:text-white hover:bg-white/10 border-white/10"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Matches List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {drawerFilteredMatches.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-xs">
                  No matching games found for &quot;{drawerSearch}&quot;
                </div>
              ) : (
                drawerFilteredMatches.map((match) => {
                  const isCurrent = match.id === matchId;
                  const isLive =
                    match.category !== "upcoming" &&
                    new Date(match.date).getTime() <
                      Date.now() + 1000 * 60 * 60 * 3;
                  const homeBadge = getSportsBadgeUrl(match.teams?.home?.badge);
                  const awayBadge = getSportsBadgeUrl(match.teams?.away?.badge);
                  const matchTime = match.date
                    ? new Date(match.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Live";

                  return (
                    <Link
                      key={match.id}
                      href={`/sports/watch?id=${encodeURIComponent(match.id)}`}
                      onClick={() => setShowDrawer(false)}
                      className={`block p-3.5 rounded-2xl border transition-all ${
                        isCurrent
                          ? "bg-gradient-to-r from-red-950/40 via-black to-red-950/20 border-red-500/80 shadow-lg shadow-red-950/50 ring-1 ring-red-500"
                          : "bg-[#14151c] border-white/5 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-2">
                        {isCurrent ? (
                          <span className="flex items-center gap-1.5 font-black text-amber-400 uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            Playing Now
                          </span>
                        ) : isLive ? (
                          <span className="flex items-center gap-1 font-black text-red-500 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            LIVE
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-white/50 font-medium">
                            <IoTimeOutline className="w-3 h-3" />
                            {matchTime}
                          </span>
                        )}
                        <span className="px-2 py-0.2 rounded-full bg-white/10 text-white/60 text-[10px] uppercase font-bold">
                          {match.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {homeBadge && awayBadge ? (
                          <div className="flex items-center -space-x-2 shrink-0">
                            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 p-1 flex items-center justify-center overflow-hidden">
                              <SafeImage
                                src={homeBadge}
                                alt={match.teams?.home?.name || ""}
                                width={20}
                                height={20}
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 p-1 flex items-center justify-center overflow-hidden">
                              <SafeImage
                                src={awayBadge}
                                alt={match.teams?.away?.name || ""}
                                width={20}
                                height={20}
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          </div>
                        ) : null}

                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 flex-1">
                          {match.title}
                        </h4>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsWatch;

