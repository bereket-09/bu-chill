"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { SubtitleTrack } from "@/types";
import { cn } from "@/utils/helpers";
import { Spinner } from "@heroui/react";
import {
  IoPlay,
  IoPause,
  IoVolumeHigh,
  IoVolumeLow,
  IoVolumeMute,
  IoArrowBack,
  IoCheckmark,
  IoSettingsOutline,
} from "react-icons/io5";
import {
  MdFullscreen,
  MdFullscreenExit,
  MdClosedCaption,
  MdTv,
  MdSkipNext,
  MdForward10,
  MdReplay10,
  MdSpeed,
  MdAspectRatio,
  MdPictureInPictureAlt,
  MdKeyboard,
} from "react-icons/md";
import { List } from "@/utils/icons";
import Link from "next/link";

export interface NativePlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  poster?: string;
  startAt?: number;
  subtitles?: SubtitleTrack[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;

  // Bingr.one Player Controls
  backUrl?: string;
  onBack?: () => void;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
  onOpenEpisodes?: () => void;
  onOpenServer?: () => void;
  currentServerName?: string;
  hasDirectOption?: boolean;
  isEmbed?: boolean;
  onToggleMode?: (mode: "direct" | "embed") => void;
}

interface QualityLevel {
  height: number;
  bitrate: number;
  index: number;
  name: string;
}

interface AudioTrack {
  id: number;
  name: string;
  lang?: string;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const ASPECT_RATIOS = [
  { id: "contain", label: "Fit (Original)" },
  { id: "cover", label: "Fill (Zoom)" },
  { id: "fill", label: "Stretch (16:9)" },
] as const;

export const NativePlayer: React.FC<NativePlayerProps> = ({
  src,
  title,
  subtitle,
  poster,
  startAt = 0,
  subtitles = [],
  onTimeUpdate,
  onEnded,
  className,
  backUrl,
  onBack,
  hasNextEpisode,
  onNextEpisode,
  onOpenEpisodes,
  onOpenServer,
  currentServerName,
  hasDirectOption,
  isEmbed = false,
  onToggleMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showRemainingTime, setShowRemainingTime] = useState(false);

  // Settings & popovers
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = auto
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(-1);
  const [selectedSubtitle, setSelectedSubtitle] = useState<number>(-1); // -1 = off
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<"contain" | "cover" | "fill">("contain");

  // Popover menus
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAudioSubsOpen, setIsAudioSubsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"main" | "speed" | "quality" | "aspect">("main");

  // Timeline tooltip
  const [scrubberTooltip, setScrubberTooltip] = useState<{ visible: boolean; time: number; left: number }>({
    visible: false,
    time: 0,
    left: 0,
  });

  // Double-tap / double-click seek ripples
  const [seekRipple, setSeekRipple] = useState<"left" | "right" | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcut toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Next episode countdown banner
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState<number | null>(null);
  const nextEpisodeDismissedRef = useRef(false);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Show shortcut toast feedback
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1500);
  }, []);

  // Reset idle timer for controls and cursor
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setIsSettingsOpen(false);
        setIsAudioSubsOpen(false);
      }
    }, 3200);
  }, [isPlaying]);

  // HLS attachment and playback setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsBuffering(true);

    if (Hls.isSupported() && (src.includes(".m3u8") || !src.endsWith(".mp4"))) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels: QualityLevel[] = data.levels.map((lvl, index) => ({
          height: lvl.height,
          bitrate: lvl.bitrate,
          index,
          name: lvl.height ? `${lvl.height}p` : `Stream ${index + 1}`,
        }));
        setQualityLevels(levels);
        setIsBuffering(false);

        // Detect and auto-select English audio track
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const tracks: AudioTrack[] = hls.audioTracks.map((t, idx) => ({
            id: idx,
            name: t.name || t.lang || `Track ${idx + 1}`,
            lang: t.lang || "",
          }));
          setAudioTracks(tracks);
          const englishIndex = tracks.findIndex(
            (t) =>
              t.lang?.toLowerCase().startsWith("en") ||
              t.name?.toLowerCase().includes("eng")
          );
          if (englishIndex !== -1) {
            hls.audioTrack = englishIndex;
            setSelectedAudioTrack(englishIndex);
          } else {
            setSelectedAudioTrack(hls.audioTrack);
          }
        }

        if (startAt > 0) {
          video.currentTime = startAt;
        }
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          const tracks: AudioTrack[] = data.audioTracks.map((t, idx) => ({
            id: idx,
            name: t.name || t.lang || `Track ${idx + 1}`,
            lang: t.lang || "",
          }));
          setAudioTracks(tracks);
        }
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
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl") || src.endsWith(".mp4")) {
      video.src = src;
      if (startAt > 0) {
        video.currentTime = startAt;
      }
      setIsBuffering(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, startAt]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      showToast("Play");
    } else {
      video.pause();
      showToast("Pause");
    }
  }, [showToast]);

  // Handle Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const targetTime = Number(e.target.value);
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  // Handle Skip
  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), duration);
      showToast(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
    },
    [duration, showToast]
  );

  // Video click & double-click handler (Bingr gesture: double tap left/right to seek)
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickTimeoutRef.current) {
      // Double click detected!
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      if (clickX < width * 0.4) {
        // Left 40% -> rewind 10s
        skip(-10);
        setSeekRipple("left");
        setTimeout(() => setSeekRipple(null), 600);
      } else if (clickX > width * 0.6) {
        // Right 40% -> forward 10s
        skip(10);
        setSeekRipple("right");
        setTimeout(() => setSeekRipple(null), 600);
      } else {
        toggleFullscreen();
      }
    } else {
      // Single click -> wait 280ms to differentiate from double click
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        togglePlay();
      }, 280);
    }
  };

  // Handle Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Number(e.target.value);
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      showToast("Unmuted");
    } else {
      video.muted = true;
      setIsMuted(true);
      showToast("Muted");
    }
  }, [isMuted, showToast]);

  // Handle Fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
      showToast("Fullscreen");
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
      showToast("Exit Fullscreen");
    }
  }, [showToast]);

  // Handle PiP
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP error or not supported
    }
  };

  // Handle Quality Selection
  const changeQuality = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setSelectedQuality(index);
    }
    setIsSettingsOpen(false);
    showToast(`Quality: ${index === -1 ? "Auto" : qualityLevels.find((q) => q.index === index)?.name || "Auto"}`);
  };

  // Handle Speed Change
  const changeSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setIsSettingsOpen(false);
    showToast(`Speed: ${speed}x`);
  };

  // Handle Aspect Ratio
  const changeAspectRatio = (ratio: "contain" | "cover" | "fill") => {
    setAspectRatio(ratio);
    setIsSettingsOpen(false);
    showToast(`Aspect: ${ratio === "contain" ? "Fit" : ratio === "cover" ? "Fill" : "Stretch"}`);
  };

  // Handle Subtitle Change
  const changeSubtitle = (index: number) => {
    const video = videoRef.current;
    if (!video) return;
    const textTracks = video.textTracks;
    for (let i = 0; i < textTracks.length; i++) {
      textTracks[i].mode = i === index ? "showing" : "disabled";
    }
    setSelectedSubtitle(index);
    setIsAudioSubsOpen(false);
    showToast(index === -1 ? "Subtitles: Off" : `Subtitles: ${subtitles[index]?.label || "On"}`);
  };

  // Auto-select English subtitles if available
  useEffect(() => {
    if (subtitles.length > 0 && selectedSubtitle === -1) {
      const englishIndex = subtitles.findIndex(
        (s) =>
          s.default ||
          s.language?.toLowerCase().startsWith("en") ||
          s.label?.toLowerCase().includes("eng")
      );
      if (englishIndex !== -1) {
        changeSubtitle(englishIndex);
      }
    }
  }, [subtitles]);

  // Handle Audio Track Change
  const changeAudioTrack = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = index;
      setSelectedAudioTrack(index);
    }
    setIsAudioSubsOpen(false);
    showToast(`Audio: ${audioTracks.find((a) => a.id === index)?.name || "Default"}`);
  };

  // Keyboard Shortcuts (Space, F, M, ArrowLeft/Right, ArrowUp/Down, C, N, 0-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "arrowup":
          e.preventDefault();
          if (videoRef.current) {
            const v = Math.min(videoRef.current.volume + 0.1, 1);
            videoRef.current.volume = v;
            setVolume(v);
            showToast(`Volume ${Math.round(v * 100)}%`);
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (videoRef.current) {
            const v = Math.max(videoRef.current.volume - 0.1, 0);
            videoRef.current.volume = v;
            setVolume(v);
            showToast(`Volume ${Math.round(v * 100)}%`);
          }
          break;
        case "c":
          e.preventDefault();
          if (subtitles.length > 0) {
            const nextIdx = selectedSubtitle === -1 ? 0 : -1;
            changeSubtitle(nextIdx);
          }
          break;
        case "n":
          if (hasNextEpisode && onNextEpisode) {
            e.preventDefault();
            onNextEpisode();
          }
          break;
        case "?":
        case "/":
          if (e.key === "?" || e.shiftKey) {
            e.preventDefault();
            setIsShortcutsOpen((prev) => !prev);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, skip, duration, subtitles, selectedSubtitle, hasNextEpisode, onNextEpisode, showToast]);

  // Scrubber Hover Tooltip
  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = offsetX / rect.width;
    const hoverTime = percent * duration;

    setScrubberTooltip({
      visible: true,
      time: hoverTime,
      left: offsetX,
    });
  };

  const handleScrubberMouseLeave = () => {
    setScrubberTooltip((prev) => ({ ...prev, visible: false }));
  };

  // Next Episode Auto-Play Countdown Check
  useEffect(() => {
    if (!hasNextEpisode || !onNextEpisode || nextEpisodeDismissedRef.current) return;
    if (duration > 60 && currentTime > 0) {
      const remaining = duration - currentTime;
      if (remaining <= 35 && remaining > 1) {
        setNextEpisodeCountdown(Math.ceil(remaining));
      } else if (remaining <= 1) {
        setNextEpisodeCountdown(null);
        onNextEpisode();
      } else {
        setNextEpisodeCountdown(null);
      }
    }
  }, [currentTime, duration, hasNextEpisode, onNextEpisode]);

  const currentQualityName =
    selectedQuality === -1
      ? "Auto"
      : qualityLevels.find((q) => q.index === selectedQuality)?.name || "Auto";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative flex h-full w-full items-center justify-center overflow-hidden bg-black select-none",
        !showControls && isPlaying ? "cursor-none" : "cursor-default",
        className
      )}
    >
      {/* Ambient Video Vignette Backing */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-10" />

      {/* Main Video Element */}
      <div
        onClick={handleVideoClick}
        className="relative h-full w-full flex items-center justify-center cursor-pointer"
      >
        <video
          ref={videoRef}
          poster={poster}
          playsInline
          crossOrigin="anonymous"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (!video) return;
            setCurrentTime(video.currentTime);
            onTimeUpdate?.(video.currentTime, video.duration || 0);

            if (video.buffered.length > 0) {
              setBuffered(video.buffered.end(video.buffered.length - 1));
            }
          }}
          onLoadedMetadata={() => {
            const video = videoRef.current;
            if (!video) return;
            setDuration(video.duration || 0);
            setIsBuffering(false);
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (hasNextEpisode && onNextEpisode) {
              onNextEpisode();
            } else {
              onEnded?.();
            }
          }}
          className={cn(
            "h-full w-full",
            aspectRatio === "cover" ? "object-cover" : aspectRatio === "fill" ? "object-fill" : "object-contain"
          )}
        >
          {subtitles.map((sub, i) => (
            <track
              key={i}
              kind="subtitles"
              label={sub.label}
              srcLang={sub.language}
              src={sub.src}
              default={sub.default}
            />
          ))}
        </video>
      </div>

      {/* Double Tap / Seek Ripple Feedback Animations */}
      {seekRipple === "left" && (
        <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center animate-ping duration-500">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <span className="font-extrabold text-sm tracking-wider">« 10s</span>
          </div>
        </div>
      )}
      {seekRipple === "right" && (
        <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center animate-ping duration-500">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <span className="font-extrabold text-sm tracking-wider">10s »</span>
          </div>
        </div>
      )}

      {/* Visual OSD Toast Notification */}
      {toastMessage && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-black/80 px-4 py-1.5 text-xs font-bold tracking-wide text-white border border-white/20 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40">
          <Spinner size="lg" color="primary" />
          <span className="text-white/60 text-xs font-semibold mt-3 tracking-wider uppercase">Loading stream...</span>
        </div>
      )}

      {/* Big Center Play Button (When Paused) */}
      {!isPlaying && !isBuffering && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute z-20 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 transform hover:scale-110 active:scale-95 border border-white/25 cursor-pointer"
          aria-label="Play video"
        >
          <IoPlay className="ml-1 text-4xl text-white" />
        </button>
      )}

      {/* ================= TOP HEADER OVERLAY (Bingr OSD) ================= */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/95 via-black/50 to-transparent transition-all duration-300",
          showControls ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"
        )}
      >
        {/* Top-Left: Back Button + Title & Subtitle */}
        <div className="flex items-center gap-3.5">
          {backUrl ? (
            <Link
              href={backUrl}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-xl transition-all active:scale-95 shadow-lg cursor-pointer"
              aria-label="Back"
            >
              <IoArrowBack className="text-xl" />
            </Link>
          ) : onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-xl transition-all active:scale-95 shadow-lg cursor-pointer"
              aria-label="Back"
            >
              <IoArrowBack className="text-xl" />
            </button>
          ) : null}

          <div className="flex flex-col min-w-0">
            {title && (
              <h1 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md truncate max-w-sm sm:max-w-md md:max-w-lg">
                {title}
              </h1>
            )}
            {subtitle && (
              <span className="text-xs sm:text-sm text-white/60 font-semibold drop-shadow-md truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Top-Right Action Controls: Server, Direct/Embed, Episodes */}
        <div className="relative flex items-center gap-2 sm:gap-3">
          {/* Direct / Embed Switcher Pill */}
          {hasDirectOption && (
            <div className="flex items-center gap-0.5 rounded-full border border-white/20 bg-black/60 p-0.5 shadow-xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => onToggleMode?.("direct")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all",
                  !isEmbed ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                )}
              >
                Direct
              </button>
              <button
                type="button"
                onClick={() => onToggleMode?.("embed")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all",
                  isEmbed ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                )}
              >
                Embed
              </button>
            </div>
          )}

          {/* Episode Drawer Trigger (TV Shows / Anime) */}
          {onOpenEpisodes && (
            <button
              type="button"
              onClick={onOpenEpisodes}
              className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 text-xs sm:text-sm font-bold text-white transition-all backdrop-blur-xl active:scale-95 shadow-md cursor-pointer"
            >
              <List size={15} />
              <span>Episodes</span>
            </button>
          )}

          {/* Server Selector Trigger */}
          {onOpenServer && (
            <button
              type="button"
              onClick={onOpenServer}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 hover:bg-white/15 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white transition-all backdrop-blur-xl active:scale-95 shadow-lg cursor-pointer"
            >
              <span className="flex items-center justify-center rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black text-emerald-400">
                ⚡
              </span>
              <span>{isEmbed ? "Embed" : "Direct"}</span>
              <span className="text-white/50 font-normal hidden sm:inline">
                {currentServerName?.split("(")[0]?.trim() || "Server"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ================= NEXT EPISODE COUNTDOWN BANNER ================= */}
      {nextEpisodeCountdown !== null && hasNextEpisode && onNextEpisode && (
        <div className="absolute right-6 bottom-24 z-40 flex items-center gap-4 rounded-2xl border border-white/20 bg-black/85 p-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-wider text-primary">
              Up Next in {nextEpisodeCountdown}s
            </span>
            <span className="text-sm font-bold text-white">Next Episode</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNextEpisodeCountdown(null);
                onNextEpisode();
              }}
              className="flex items-center gap-1 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-black hover:bg-white/90 transition-colors shadow-md"
            >
              <MdSkipNext className="text-base" />
              <span>Watch Now</span>
            </button>
            <button
              type="button"
              onClick={() => {
                nextEpisodeDismissedRef.current = true;
                setNextEpisodeCountdown(null);
              }}
              className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= BOTTOM CONTROLS OVERLAY ================= */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-4 sm:px-8 sm:pb-6 pt-20 transition-all duration-300",
          showControls ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
        )}
      >
        {/* Scrubber Timeline Bar with Hover Timestamp Tooltip */}
        <div
          ref={progressBarRef}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={handleScrubberMouseLeave}
          className="relative mb-3 flex items-center group/scrubber h-7 cursor-pointer"
        >
          {/* Hover Time Tooltip */}
          {scrubberTooltip.visible && (
            <div
              className="absolute -top-7 -translate-x-1/2 z-40 px-2 py-0.5 rounded-md bg-black/90 border border-white/20 text-[11px] font-mono font-bold text-white shadow-lg pointer-events-none"
              style={{ left: `${scrubberTooltip.left}px` }}
            >
              {formatTime(scrubberTooltip.time)}
            </div>
          )}

          {/* Background Track */}
          <div className="absolute left-0 right-0 h-1.5 rounded-full bg-white/20 group-hover/scrubber:h-2.5 transition-all" />

          {/* Buffered Track */}
          <div
            className="absolute left-0 h-1.5 rounded-full bg-white/40 group-hover/scrubber:h-2.5 transition-all"
            style={{ width: `${(buffered / (duration || 1)) * 100}%` }}
          />

          {/* Played Track */}
          <div
            className="absolute left-0 h-1.5 rounded-full bg-white group-hover/scrubber:h-2.5 transition-all"
            style={{ width: `${((currentTime || 0) / (duration || 1)) * 100}%` }}
          />

          {/* Scrubber Knob Handle */}
          <div
            className="absolute h-4 w-4 -ml-2 rounded-full bg-white shadow-xl transform scale-0 group-hover/scrubber:scale-110 transition-transform pointer-events-none border border-black/20"
            style={{ left: `${((currentTime || 0) / (duration || 1)) * 100}%` }}
          />

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="relative z-10 h-7 w-full cursor-pointer appearance-none bg-transparent opacity-0"
          />
        </div>

        {/* Controls Row */}
        <div className="relative flex items-center justify-between text-white">
          {/* Left Controls: Play, Replay 10s, Forward 10s, Volume, Time */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="text-white hover:scale-110 active:scale-95 transition-transform p-1.5"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <IoPause className="text-2xl sm:text-3xl" />
              ) : (
                <IoPlay className="text-2xl sm:text-3xl ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skip(-10)}
              className="text-white/80 hover:text-white transition-all p-1 hover:scale-110 active:scale-95"
              aria-label="Replay 10 seconds"
              title="Replay 10 seconds (J / ←)"
            >
              <MdReplay10 className="text-2xl sm:text-3xl" />
            </button>

            <button
              type="button"
              onClick={() => skip(10)}
              className="text-white/80 hover:text-white transition-all p-1 hover:scale-110 active:scale-95"
              aria-label="Forward 10 seconds"
              title="Forward 10 seconds (L / →)"
            >
              <MdForward10 className="text-2xl sm:text-3xl" />
            </button>

            {/* Volume Control with hover expansion */}
            <div className="flex items-center gap-1.5 group/vol pl-1">
              <button
                type="button"
                onClick={toggleMute}
                className="text-white/80 hover:text-white transition-all p-1 hover:scale-105"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <IoVolumeMute className="text-xl sm:text-2xl" />
                ) : volume < 0.5 ? (
                  <IoVolumeLow className="text-xl sm:text-2xl" />
                ) : (
                  <IoVolumeHigh className="text-xl sm:text-2xl" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-14 sm:w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-white opacity-0 group-hover/vol:opacity-100 transition-all duration-200"
              />
            </div>

            {/* Time display with toggle remaining time */}
            <button
              type="button"
              onClick={() => setShowRemainingTime((prev) => !prev)}
              className="text-xs sm:text-sm font-semibold tracking-wider text-white/80 hover:text-white transition-colors shrink-0 font-mono select-none ml-2"
            >
              {showRemainingTime
                ? `-${formatTime(Math.max(0, duration - currentTime))}`
                : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </button>
          </div>

          {/* Center Title Subtitle */}
          <div className="hidden lg:flex flex-1 justify-center px-4 overflow-hidden">
            <span className="text-xs sm:text-sm text-white/70 font-semibold tracking-wide drop-shadow-md truncate select-none">
              {title} {subtitle ? `— ${subtitle}` : ""}
            </span>
          </div>

          {/* Right Controls: Next, Audio/Subs, Settings, PiP, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2.5">
            {hasNextEpisode && onNextEpisode && (
              <button
                type="button"
                onClick={onNextEpisode}
                className="text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all p-1.5"
                aria-label="Next Episode"
                title="Next Episode (N)"
              >
                <MdSkipNext className="text-2xl sm:text-3xl" />
              </button>
            )}

            {/* Audio & Subtitles Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsAudioSubsOpen((prev) => !prev);
                  setIsSettingsOpen(false);
                }}
                className={cn(
                  "p-1.5 transition-all rounded-lg hover:scale-110 active:scale-95",
                  isAudioSubsOpen ? "text-primary bg-white/10" : "text-white/80 hover:text-white"
                )}
                aria-label="Audio & Subtitles"
                title="Audio & Subtitles (C)"
              >
                <MdClosedCaption className="text-2xl sm:text-3xl" />
              </button>

              {isAudioSubsOpen && (
                <div className="absolute right-0 bottom-full mb-3 w-64 rounded-2xl bg-neutral-900/95 p-3 text-xs shadow-2xl backdrop-blur-2xl border border-white/15 z-50 space-y-3">
                  {/* Audio Tracks */}
                  <div>
                    <div className="px-1 py-1 font-extrabold text-neutral-400 text-[10px] uppercase tracking-wider">
                      Audio Track
                    </div>
                    {audioTracks.length > 0 ? (
                      <div className="space-y-0.5 max-h-36 overflow-y-auto">
                        {audioTracks.map((track) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => changeAudioTrack(track.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition hover:bg-white/10",
                              selectedAudioTrack === track.id ? "text-primary font-bold" : "text-white"
                            )}
                          >
                            <span className="truncate">{track.name}</span>
                            {selectedAudioTrack === track.id && <IoCheckmark className="text-base" />}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 text-white/60">English (Default)</div>
                    )}
                  </div>

                  {/* Subtitles */}
                  <div className="border-t border-white/10 pt-2">
                    <div className="px-1 py-1 font-extrabold text-neutral-400 text-[10px] uppercase tracking-wider">
                      Subtitles
                    </div>
                    <div className="space-y-0.5 max-h-40 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => changeSubtitle(-1)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition hover:bg-white/10",
                          selectedSubtitle === -1 ? "text-primary font-bold" : "text-white"
                        )}
                      >
                        <span>Off</span>
                        {selectedSubtitle === -1 && <IoCheckmark className="text-base" />}
                      </button>
                      {subtitles.map((sub, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => changeSubtitle(idx)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition hover:bg-white/10",
                            selectedSubtitle === idx ? "text-primary font-bold" : "text-white"
                          )}
                        >
                          <span className="truncate">{sub.label}</span>
                          {selectedSubtitle === idx && <IoCheckmark className="text-base" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Playback Settings Dropdown (Speed, Quality, Aspect Ratio) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen((prev) => !prev);
                  setIsAudioSubsOpen(false);
                  setSettingsTab("main");
                }}
                className={cn(
                  "p-1.5 transition-all rounded-lg hover:scale-110 active:scale-95",
                  isSettingsOpen ? "text-primary bg-white/10" : "text-white/80 hover:text-white"
                )}
                aria-label="Playback Settings"
                title="Playback Settings"
              >
                <IoSettingsOutline className="text-xl sm:text-2xl" />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 bottom-full mb-3 w-56 rounded-2xl bg-neutral-900/95 p-3 text-xs shadow-2xl backdrop-blur-2xl border border-white/15 z-50">
                  {settingsTab === "main" && (
                    <div className="space-y-1">
                      <div className="px-2 py-1 font-extrabold text-neutral-400 text-[10px] uppercase tracking-wider">
                        Settings
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsTab("speed")}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-white/10 transition text-white"
                      >
                        <span className="flex items-center gap-2">
                          <MdSpeed className="text-base text-white/70" />
                          <span>Speed</span>
                        </span>
                        <span className="text-white/50">{playbackSpeed}x ›</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettingsTab("aspect")}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-white/10 transition text-white"
                      >
                        <span className="flex items-center gap-2">
                          <MdAspectRatio className="text-base text-white/70" />
                          <span>Aspect Ratio</span>
                        </span>
                        <span className="text-white/50">
                          {aspectRatio === "contain" ? "Fit" : aspectRatio === "cover" ? "Fill" : "Stretch"} ›
                        </span>
                      </button>

                      {qualityLevels.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSettingsTab("quality")}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-white/10 transition text-white"
                        >
                          <span className="flex items-center gap-2">
                            <MdTv className="text-base text-white/70" />
                            <span>Quality</span>
                          </span>
                          <span className="text-white/50">{currentQualityName} ›</span>
                        </button>
                      )}
                    </div>
                  )}

                  {settingsTab === "speed" && (
                    <div>
                      <div className="flex items-center gap-2 px-2 py-1 mb-1 border-b border-white/10 pb-2">
                        <button
                          onClick={() => setSettingsTab("main")}
                          className="text-white/60 hover:text-white text-xs font-bold"
                        >
                          ‹ Back
                        </button>
                        <span className="font-extrabold text-[10px] uppercase tracking-wider text-white">Speed</span>
                      </div>
                      <div className="space-y-0.5">
                        {PLAYBACK_SPEEDS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => changeSpeed(s)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition hover:bg-white/10",
                              playbackSpeed === s ? "text-primary font-bold" : "text-white"
                            )}
                          >
                            <span>{s === 1 ? "1.0x (Normal)" : `${s}x`}</span>
                            {playbackSpeed === s && <IoCheckmark className="text-base" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {settingsTab === "aspect" && (
                    <div>
                      <div className="flex items-center gap-2 px-2 py-1 mb-1 border-b border-white/10 pb-2">
                        <button
                          onClick={() => setSettingsTab("main")}
                          className="text-white/60 hover:text-white text-xs font-bold"
                        >
                          ‹ Back
                        </button>
                        <span className="font-extrabold text-[10px] uppercase tracking-wider text-white">Aspect Ratio</span>
                      </div>
                      <div className="space-y-0.5">
                        {ASPECT_RATIOS.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => changeAspectRatio(r.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition hover:bg-white/10",
                              aspectRatio === r.id ? "text-primary font-bold" : "text-white"
                            )}
                          >
                            <span>{r.label}</span>
                            {aspectRatio === r.id && <IoCheckmark className="text-base" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {settingsTab === "quality" && (
                    <div>
                      <div className="flex items-center gap-2 px-2 py-1 mb-1 border-b border-white/10 pb-2">
                        <button
                          onClick={() => setSettingsTab("main")}
                          className="text-white/60 hover:text-white text-xs font-bold"
                        >
                          ‹ Back
                        </button>
                        <span className="font-extrabold text-[10px] uppercase tracking-wider text-white">Quality</span>
                      </div>
                      <div className="space-y-0.5 max-h-48 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => changeQuality(-1)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition hover:bg-white/10",
                            selectedQuality === -1 ? "text-primary font-bold" : "text-white"
                          )}
                        >
                          <span>Auto</span>
                          {selectedQuality === -1 && <IoCheckmark className="text-base" />}
                        </button>
                        {qualityLevels.map((lvl) => (
                          <button
                            key={lvl.index}
                            type="button"
                            onClick={() => changeQuality(lvl.index)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition hover:bg-white/10",
                              selectedQuality === lvl.index ? "text-primary font-bold" : "text-white"
                            )}
                          >
                            <span>{lvl.name}</span>
                            {selectedQuality === lvl.index && <IoCheckmark className="text-base" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PiP Button */}
            <button
              type="button"
              onClick={togglePiP}
              className="text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all p-1.5 hidden sm:inline-flex"
              aria-label="Picture-in-Picture"
              title="Picture-in-Picture"
            >
              <MdPictureInPictureAlt className="text-xl sm:text-2xl" />
            </button>

            {/* Keyboard Shortcuts Button */}
            <button
              type="button"
              onClick={() => setIsShortcutsOpen((prev) => !prev)}
              className="text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all p-1.5 hidden sm:inline-flex"
              aria-label="Keyboard Shortcuts"
              title="Keyboard Shortcuts (?)"
            >
              <MdKeyboard className="text-xl sm:text-2xl" />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all p-1.5"
              aria-label="Fullscreen"
              title="Fullscreen (F)"
            >
              {isFullscreen ? (
                <MdFullscreenExit className="text-2xl sm:text-3xl" />
              ) : (
                <MdFullscreen className="text-2xl sm:text-3xl" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Overlay Modal */}
      {isShortcutsOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsShortcutsOpen(false)}
        >
          <div
            className="relative max-w-md w-full rounded-2xl border border-white/20 bg-neutral-900/95 p-6 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <MdKeyboard className="text-xl text-primary" />
                <h3 className="font-bold text-base">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="text-white/50 hover:text-white transition-colors text-sm px-2 py-1 rounded-md hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-lg">
                <span className="text-white/70">Play / Pause</span>
                <kbd className="px-2 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">Space / K</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-lg">
                <span className="text-white/70">Fullscreen</span>
                <kbd className="px-2 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">F</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-lg">
                <span className="text-white/70">Mute / Unmute</span>
                <kbd className="px-2 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">M</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-lg">
                <span className="text-white/70">Rewind 10s</span>
                <kbd className="px-2 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">J / ←</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-lg">
                <span className="text-white/70">Forward 10s</span>
                <kbd className="px-2 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">L / →</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-lg">
                <span className="text-white/70">Volume</span>
                <kbd className="px-2 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">↑ / ↓</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-lg">
                <span className="text-white/70">Captions</span>
                <kbd className="px-2 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">C</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.04] p-2 rounded-lg">
                <span className="text-white/70">Next Episode</span>
                <kbd className="px-2 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">N</kbd>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-white/40">
              <span>Press <kbd className="font-mono text-white/70">?</kbd> anytime to toggle</span>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="text-primary hover:underline font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NativePlayer;
