import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import { ChevronUp, List } from "@/utils/icons";
import { getTvShowPlayers } from "@/utils/players";
import { Card, Skeleton } from "@heroui/react";
import { useDisclosure, useDocumentTitle, useIdle, useLocalStorage } from "@mantine/hooks";
import dynamic from "next/dynamic";
import { parseAsInteger, useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Episode, TvShowDetails } from "tmdb-ts";
import useBreakpoints from "@/hooks/useBreakpoints";
import { ADS_WARNING_STORAGE_KEY, SpacingClasses } from "@/utils/constants";
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
const TvShowPlayerHeader = dynamic(() => import("./Header"));
const TvShowPlayerEpisodeSelection = dynamic(() => import("./EpisodeSelection"));
const NativePlayer = dynamic(() => import("@/components/ui/player/NativePlayer"), { ssr: false });
const AdShieldIframe = dynamic(() => import("@/components/ui/player/AdShieldIframe"), { ssr: false });

export interface TvShowPlayerProps {
  tv: TvShowDetails;
  id: number;
  seriesName: string;
  seasonName: string;
  episode: Episode;
  episodes: Episode[];
  nextEpisodeNumber: number | null;
  prevEpisodeNumber: number | null;
  startAt?: number;
}

const TvShowPlayer: React.FC<TvShowPlayerProps> = ({
  id,
  episode,
  episodes,
  startAt,
  ...props
}) => {
  const [seen] = useLocalStorage<boolean>({
    key: ADS_WARNING_STORAGE_KEY,
    getInitialValueInEffect: false,
  });

  const { mobile } = useBreakpoints();

  // Query OMSS for direct ad-free streams
  const { data: omssData } = useQuery({
    queryKey: ["omss-tv-streams", id, episode.season_number, episode.episode_number],
    queryFn: () =>
      OMSSService.getTvShowStreams(id, episode.season_number, episode.episode_number),
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
    () => getStoredProgress("tv", id, episode.season_number, episode.episode_number),
    [id, episode.season_number, episode.episode_number]
  );
  const initialPosition = useMemo(
    () => Math.max(storedProgress?.currentTime || 0, startAt || 0),
    [storedProgress, startAt]
  );

  const currentTimeRef = useRef<number>(initialPosition);
  const [activePlaybackTime, setActivePlaybackTime] = useState<number>(initialPosition);
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(initialPosition > 10);

  // Reset banner and playback time whenever navigating to a different episode
  useEffect(() => {
    setShowResumeBanner(initialPosition > 10);
    setActivePlaybackTime(initialPosition);
    currentTimeRef.current = initialPosition;
  }, [initialPosition, episode.season_number, episode.episode_number]);

  // Auto hide resume banner after 7 seconds
  useEffect(() => {
    if (showResumeBanner) {
      const timer = setTimeout(() => setShowResumeBanner(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [showResumeBanner]);

  const handleStartOver = useCallback(() => {
    clearStoredProgress("tv", id, episode.season_number, episode.episode_number);
    currentTimeRef.current = 0;
    setActivePlaybackTime(0);
    setShowResumeBanner(false);
  }, [id, episode.season_number, episode.episode_number]);

  const players = useMemo(
    () =>
      getTvShowPlayers(
        id,
        episode.season_number,
        episode.episode_number,
        activePlaybackTime,
        nativeSources
      ),
    [id, episode.season_number, episode.episode_number, activePlaybackTime, nativeSources]
  );

  const idle = useIdle(3000);
  const [sourceOpened, sourceHandlers] = useDisclosure(false);
  const [episodeOpened, episodeHandlers] = useDisclosure(false);
  const [selectedSource, setSelectedSource] = useQueryState<number>(
    "src",
    parseAsInteger.withDefault(0)
  );

  usePlayerEvents({
    saveHistory: true,
    mediaId: id,
    mediaType: "tv",
    title: props.seriesName,
    metadata: { season: episode.season_number, episode: episode.episode_number },
    onTimeUpdate: (data) => {
      if (data.currentTime > 0) {
        currentTimeRef.current = data.currentTime;
      }
    },
  });

  useDocumentTitle(
    `Play ${props.seriesName} - ${props.seasonName} - ${episode.name} | ${siteConfig.name}`
  );

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

  const handleSelectSource = useCallback(
    (newSource: number) => {
      // Carry over exact playback time to newly chosen server
      const latestTime = Math.floor(currentTimeRef.current || activePlaybackTime);
      setActivePlaybackTime(latestTime);
      setSelectedSource(newSource);
    },
    [activePlaybackTime, setSelectedSource]
  );

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

  const router = useRouter();

  const handleNextEpisode = useCallback(() => {
    if (props.nextEpisodeNumber) {
      router.push(
        `/tv/${id}/${episode.season_number}/${props.nextEpisodeNumber}/player?src=${selectedSource}`
      );
    }
  }, [router, id, episode.season_number, props.nextEpisodeNumber, selectedSource]);

  return (
    <>
      {/* Only display ads warning for fallback players that actually have ads */}
      {PLAYER?.ads && <AdsWarning />}

      <div className="relative w-full h-screen overflow-hidden">
        {!isNative && (
          <TvShowPlayerHeader
            id={id}
            seriesName={props.seriesName}
            episode={episode}
            hidden={idle && !mobile}
            servers={players}
            selectedSource={selectedSource}
            onSelectSource={handleSelectSource}
            nextEpisodeNumber={props.nextEpisodeNumber}
            onOpenEpisodes={episodeHandlers.open}
          />
        )}

        {/* Resume Notification Pill */}
        {showResumeBanner && initialPosition > 10 && (
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
                title={props.seriesName}
                subtitle={`S${episode.season_number} E${episode.episode_number} ${episode.name}`}
                backUrl={`/tv/${id}`}
                startAt={activePlaybackTime}
                subtitles={PLAYER.subtitles}
                hasNextEpisode={!!props.nextEpisodeNumber}
                onNextEpisode={handleNextEpisode}
                onOpenEpisodes={episodeHandlers.open}
                onOpenServer={sourceHandlers.open}
                currentServerName={PLAYER?.title}
                hasDirectOption={firstNativeIndex !== -1 && firstEmbedIndex !== -1}
                isEmbed={false}
                onToggleMode={handleToggleMode}
                onTimeUpdate={(time, dur) => {
                  currentTimeRef.current = time;
                  saveStoredProgress({
                    mediaType: "tv",
                    mediaId: id,
                    season: episode.season_number,
                    episode: episode.episode_number,
                    title: props.seriesName,
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
                title={props.seriesName}
                className="z-10 h-full w-full border-0"
              />
            )
          )}
        </Card>
      </div>

      <TvShowPlayerEpisodeSelection
        id={id}
        opened={episodeOpened}
        onClose={episodeHandlers.close}
        episodes={episodes}
        seriesName={props.seriesName}
        currentSeasonNumber={episode.season_number}
        currentEpisodeNumber={episode.episode_number}
        seasons={props.tv?.seasons || []}
        selectedSource={selectedSource}
      />
    </>
  );
};

export default memo(TvShowPlayer);
