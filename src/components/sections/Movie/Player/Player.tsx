import { ADS_WARNING_STORAGE_KEY, SpacingClasses } from "@/utils/constants";
import { siteConfig } from "@/config/site";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/utils/helpers";
import { mutateMovieTitle } from "@/utils/movies";
import { getMoviePlayers } from "@/utils/players";
import { Card, Skeleton } from "@heroui/react";
import { useDisclosure, useDocumentTitle, useIdle, useLocalStorage } from "@mantine/hooks";
import dynamic from "next/dynamic";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MovieDetails } from "tmdb-ts/dist/types/movies";
import { usePlayerEvents } from "@/hooks/usePlayerEvents";
import { useQuery } from "@tanstack/react-query";
import { OMSSService } from "@/services/omss";
import { PlayersProps } from "@/types";
import {
  clearStoredProgress,
  formatTimeDisplay,
  getStoredProgress,
  saveStoredProgress,
} from "@/utils/watchProgress";

const AdsWarning = dynamic(() => import("@/components/ui/overlay/AdsWarning"));
const MoviePlayerHeader = dynamic(() => import("./Header"));
const NativePlayer = dynamic(() => import("@/components/ui/player/NativePlayer"), { ssr: false });
const AdShieldIframe = dynamic(() => import("@/components/ui/player/AdShieldIframe"), { ssr: false });

interface MoviePlayerProps {
  movie: MovieDetails;
  startAt?: number;
}

const MoviePlayer: React.FC<MoviePlayerProps> = ({ movie, startAt }) => {
  const [seen] = useLocalStorage<boolean>({
    key: ADS_WARNING_STORAGE_KEY,
    getInitialValueInEffect: false,
  });

  // Query OMSS for direct ad-free streams
  const { data: omssData } = useQuery({
    queryKey: ["omss-movie-streams", movie.id],
    queryFn: () => OMSSService.getMovieStreams(movie.id),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const nativeSources: PlayersProps[] = useMemo(() => {
    if (!omssData?.sources?.length) return [];
    return omssData.sources.map((src, idx) => ({
      title: `Ad-Free Native (${src.quality || src.provider || `Source ${idx + 1}`})`,
      source: src.url,
      streamUrl: src.url,
      type: "native" as const,
      subtitles: omssData.subtitles,
      recommended: true,
      fast: true,
      ads: false,
      resumable: true,
    }));
  }, [omssData]);

  // Local storage watch progress check for instant resume on refresh
  const storedProgress = useMemo(
    () => getStoredProgress("movie", movie.id),
    [movie.id]
  );
  const initialPosition = useMemo(
    () => Math.max(storedProgress?.currentTime || 0, startAt || 0),
    [storedProgress, startAt]
  );

  const currentTimeRef = useRef<number>(initialPosition);
  const [activePlaybackTime, setActivePlaybackTime] = useState<number>(initialPosition);
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(initialPosition > 10);

  // Auto hide resume banner after 7 seconds
  useEffect(() => {
    if (showResumeBanner) {
      const timer = setTimeout(() => setShowResumeBanner(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [showResumeBanner]);

  const handleStartOver = useCallback(() => {
    clearStoredProgress("movie", movie.id);
    currentTimeRef.current = 0;
    setActivePlaybackTime(0);
    setShowResumeBanner(false);
  }, [movie.id]);

  const players = useMemo(
    () => getMoviePlayers(movie.id, activePlaybackTime, nativeSources),
    [movie.id, activePlaybackTime, nativeSources]
  );

  const title = mutateMovieTitle(movie);
  const idle = useIdle(3000);
  const { mobile } = useBreakpoints();
  const [opened, handlers] = useDisclosure(false);
  const [selectedSource, setSelectedSource] = useQueryState<number>(
    "src",
    parseAsInteger.withDefault(0)
  );

  usePlayerEvents({
    saveHistory: true,
    mediaId: movie.id,
    mediaType: "movie",
    title,
    onTimeUpdate: (data) => {
      if (data.currentTime > 0) {
        currentTimeRef.current = data.currentTime;
      }
    },
  });

  useDocumentTitle(`Play ${title} | ${siteConfig.name}`);

  useEffect(() => {
    try {
      localStorage.setItem("filmu_audio", "English");
      localStorage.setItem("preferred_language", "en");
      localStorage.setItem("preferred_audio", "en");
      localStorage.setItem("vidsrc_lang", "en");
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const PLAYER = useMemo(() => players[selectedSource] || players[0], [players, selectedSource]);
  const isNative = PLAYER?.type === "native";

  const firstNativeIndex = useMemo(
    () => players.findIndex((p) => p.type === "native"),
    [players]
  );
  const firstEmbedIndex = useMemo(
    () => players.findIndex((p) => p.type === "embed"),
    [players]
  );

  // Consecutive failure tracker to prevent infinite loops
  const consecutiveFailuresRef = useRef<number>(0);
  const [serverNotice, setServerNotice] = useState<string | null>(null);

  // Auto hide server notification
  useEffect(() => {
    if (serverNotice) {
      const timer = setTimeout(() => setServerNotice(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [serverNotice]);

  const handleSelectSource = useCallback(
    (newSource: number) => {
      consecutiveFailuresRef.current = 0;
      // Carry over exact playback time to newly chosen server
      const latestTime = Math.floor(currentTimeRef.current || activePlaybackTime);
      setActivePlaybackTime(latestTime);
      setSelectedSource(newSource);
    },
    [activePlaybackTime, setSelectedSource]
  );

  const nextServerIndex = useMemo(
    () => (players && players.length > 1 ? (selectedSource + 1) % players.length : selectedSource),
    [players, selectedSource]
  );

  const handleAutoSwitch = useCallback(() => {
    if (!players || players.length <= 1) return;

    consecutiveFailuresRef.current += 1;
    if (consecutiveFailuresRef.current >= players.length) {
      setServerNotice("All available servers were tried. Check your connection or choose a server manually.");
      return;
    }

    const nextIndex = (selectedSource + 1) % players.length;
    const currentName = players[selectedSource]?.title || "Server";
    const nextName = players[nextIndex]?.title || "Next Server";

    setServerNotice(`${currentName.replace(/\s*\([^)]*\)/g, "")} was unreachable. Auto-switched to ${nextName.replace(/\s*\([^)]*\)/g, "")}.`);
    
    // Carry over playback time
    const latestTime = Math.floor(currentTimeRef.current || activePlaybackTime);
    setActivePlaybackTime(latestTime);
    setSelectedSource(nextIndex);
  }, [players, selectedSource, activePlaybackTime, setSelectedSource]);

  const handleManualNextServer = useCallback(() => {
    if (!players || players.length <= 1) return;
    consecutiveFailuresRef.current = 0;
    const nextIndex = (selectedSource + 1) % players.length;
    handleSelectSource(nextIndex);
  }, [players, selectedSource, handleSelectSource]);

  const handleIframeLoaded = useCallback(() => {
    consecutiveFailuresRef.current = 0;
  }, []);

  const handleToggleMode = useCallback(
    (mode: "direct" | "embed") => {
      // Carry over exact playback time on mode toggle
      const latestTime = Math.floor(currentTimeRef.current || activePlaybackTime);
      setActivePlaybackTime(latestTime);
      if (mode === "direct" && firstNativeIndex !== -1) {
        setSelectedSource(firstNativeIndex);
      } else if (mode === "embed" && firstEmbedIndex !== -1) {
        setSelectedSource(firstEmbedIndex);
      }
    },
    [firstNativeIndex, firstEmbedIndex, activePlaybackTime, setSelectedSource]
  );

  return (
    <>
      {/* Only display ads warning for fallback players that actually have ads */}
      {PLAYER?.ads && <AdsWarning />}

      <div className="relative w-full h-screen overflow-hidden">
        {!isNative && (
          <MoviePlayerHeader
            id={movie.id}
            movieName={title}
            subtitle={
              movie.release_date
                ? `${movie.release_date.slice(0, 4)}${
                    movie.runtime
                      ? ` • ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
                      : ""
                  }`
                : undefined
            }
            hidden={idle && !mobile}
            servers={players}
            selectedSource={selectedSource}
            onSelectSource={handleSelectSource}
          />
        )}

        {/* Server Switch Notification Pill */}
        {serverNotice && (
          <div className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-full border border-amber-500/30 bg-black/90 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-2xl backdrop-blur-xl animate-fade-in transition-all">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>{serverNotice}</span>
            <button
              type="button"
              onClick={() => setServerNotice(null)}
              className="ml-2 text-white/50 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Resume Notification Pill */}
        {showResumeBanner && initialPosition > 10 && !serverNotice && (
          <div className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-white/20 bg-black/85 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-2xl backdrop-blur-xl animate-fade-in transition-all">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Resumed from {formatTimeDisplay(initialPosition)}
            </span>
            <button
              type="button"
              onClick={handleStartOver}
              className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/90 hover:bg-white/25 hover:text-white transition-colors"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={() => setShowResumeBanner(false)}
              className="text-white/50 hover:text-white transition-colors text-xs ml-1"
            >
              ✕
            </button>
          </div>
        )}

        <Card shadow="md" radius="none" className="relative h-screen bg-black">
          <Skeleton className="absolute h-full w-full" />
          {isNative ? (
            <div className="z-10 h-full w-full">
              <NativePlayer
                src={PLAYER.streamUrl || PLAYER.source}
                title={title}
                subtitle={
                  movie.release_date
                    ? `${movie.release_date.slice(0, 4)}${
                        movie.runtime
                          ? ` • ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
                          : ""
                      }`
                    : undefined
                }
                backUrl={`/movie/${movie.id}`}
                startAt={activePlaybackTime}
                subtitles={PLAYER.subtitles}
                onOpenServer={handlers.open}
                currentServerName={PLAYER?.title}
                hasDirectOption={firstNativeIndex !== -1 && firstEmbedIndex !== -1}
                isEmbed={false}
                onToggleMode={handleToggleMode}
                onTimeUpdate={(time, dur) => {
                  currentTimeRef.current = time;
                  saveStoredProgress({
                    mediaType: "movie",
                    mediaId: movie.id,
                    title,
                    currentTime: time,
                    duration: dur,
                  });
                }}
              />
            </div>
          ) : (
            (seen || !PLAYER.ads) && (
              <AdShieldIframe
                allowFullScreen
                referrerPolicy="origin"
                key={`${PLAYER.title}-${activePlaybackTime}`}
                src={PLAYER.source}
                title={title}
                serverName={PLAYER.title?.replace(/\s*\([^)]*\)/g, "") || "Server"}
                nextServerName={players[nextServerIndex]?.title?.replace(/\s*\([^)]*\)/g, "") || "Next Server"}
                onTimeout={handleAutoSwitch}
                onError={handleAutoSwitch}
                onNextServer={handleManualNextServer}
                onLoad={handleIframeLoaded}
                className="z-10 h-full w-full border-0"
              />
            )
          )}
        </Card>
      </div>
    </>
  );
};

MoviePlayer.displayName = "MoviePlayer";

export default MoviePlayer;
