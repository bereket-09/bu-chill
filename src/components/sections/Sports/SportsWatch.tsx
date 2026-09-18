"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Hls from "hls.js";
import { useQuery } from "@tanstack/react-query";
import { SportsMatch, SportsStream } from "@/services/sports";
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
} from "react-icons/io5";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";

export const SportsWatch: React.FC = () => {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("id") || "";

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  // 1. Fetch match details
  const { data: allMatches } = useQuery<SportsMatch[]>({
    queryKey: ["sports-matches", "all"],
    queryFn: async () => {
      const res = await fetch("/api/sports/matches?type=all");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const currentMatch = (allMatches || []).find((m) => m.id === matchId) || null;

  // 2. Fetch streams for this match
  const { data: streams, isLoading: isStreamsLoading, refetch: refetchStreams } = useQuery<SportsStream[]>({
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

  const activeStream = streams && streams.length > 0 ? streams[activeServerIndex] || streams[0] : null;
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
        manifestLoadingTimeOut: 15000,
      });

      hlsRef.current = hls;
      hls.loadSource(activeStream.embedUrl);
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
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 md:pl-28 md:pr-10 py-6 space-y-6">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/sports"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16181f] border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-semibold transition-all shadow"
          >
            <IoArrowBack className="w-4 h-4" />
            <span>Back to Sports Arena</span>
          </Link>

          {/* Quick Match Switcher Button */}
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 text-xs sm:text-sm font-bold transition-all shadow"
          >
            <IoGridOutline className="w-4 h-4" />
            <span>Switch Match</span>
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
              allow="autoplay; encrypted-media; picture-in-picture"
              className="w-full h-full border-0 bg-black"
              title={currentMatch?.title || "Sports Stream"}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
              {isStreamsLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-3 border-white/20 border-t-white animate-spin" />
                  <p className="text-sm font-semibold text-white/60">Connecting to Sports Satellite Streams...</p>
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-white/80">No live stream feeds available yet.</p>
                  <p className="text-xs text-white/40 max-w-md">
                    Live stream links typically activate 15-30 minutes before kickoff. Try switching servers or refreshing.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchStreams()}
                    className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
                  >
                    Refresh Stream Sources
                  </button>
                </>
              )}
            </div>
          )}

          {/* Buffering Spinner */}
          {isBuffering && isDirectHls && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-white animate-spin" />
            </div>
          )}

          {/* Stream Controls Overlay (for HLS Direct) */}
          {isDirectHls && (
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
                  {isFullscreen ? <MdFullscreenExit className="w-6 h-6" /> : <MdFullscreen className="w-6 h-6" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= STREAM DETAILS & SERVER SELECTOR ================= */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 rounded-2xl bg-[#0f1014] border border-white/10 shadow-xl">
          {/* Match Info */}
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white animate-pulse">
                LIVE STREAM
              </span>
              {currentMatch?.category && (
                <span className="text-xs text-white/50 font-semibold uppercase">
                  {currentMatch.category}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentMatch?.title || "Live Sports Match"}
            </h2>
          </div>

          {/* Server Switcher Picker */}
          {streams && streams.length > 0 && (
            <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <IoServer className="w-3.5 h-3.5" />
                Select Stream Server:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {streams.map((stream, idx) => {
                  const isCurrent = idx === activeServerIndex;
                  return (
                    <button
                      key={stream.id || idx}
                      type="button"
                      onClick={() => setActiveServerIndex(idx)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isCurrent
                          ? "bg-white text-black border-white shadow-lg scale-105"
                          : "bg-[#16181f] text-white/70 hover:text-white hover:bg-white/10 border-white/10"
                      }`}
                    >
                      {isCurrent && <IoCheckmark className="w-3.5 h-3.5 text-black" />}
                      <span>Server {stream.streamNo || idx + 1}</span>
                      {stream.hd && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px]">
                          HD
                        </span>
                      )}
                      {stream.embedUrl?.includes(".m3u8") && (
                        <span className="px-1 py-0.2 rounded bg-primary/20 text-primary text-[9px]">
                          HLS
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

      {/* ================= ON-SCREEN QUICK MATCH SWITCHER DRAWER ================= */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md h-full bg-[#0f1014] border-l border-white/10 p-6 flex flex-col space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <IoGridOutline className="w-5 h-5 text-primary" />
                <span>Live Matches Zapper</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1">
              {(allMatches || []).map((match) => (
                <Link
                  key={match.id}
                  href={`/sports/watch?id=${encodeURIComponent(match.id)}`}
                  onClick={() => setShowDrawer(false)}
                  className={`block p-3 rounded-xl border transition-all ${
                    match.id === matchId
                      ? "bg-white/10 border-primary shadow-lg"
                      : "bg-[#16181f] border-white/5 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-red-500">LIVE</span>
                    <span className="text-white/40 uppercase">{match.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{match.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsWatch;
