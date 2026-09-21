import { syncHistory } from "@/actions/histories";
import { ContentType } from "@/types";
import { diff } from "@/utils/helpers";
import { saveStoredProgress } from "@/utils/watchProgress";
import { useDocumentVisibility } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import useSupabaseUser from "./useSupabaseUser";
import { getActiveProfileId, saveProfileHistoryItem } from "@/services/profileStorage";

export type PlayerEventType = "play" | "pause" | "seeked" | "ended" | "timeupdate";

export interface BasePlayerEventEnvelope<T> {
  type: "PLAYER_EVENT" | "MEDIA_DATA";
  data: T;
}

export interface VidlinkEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  mtmdbId: number;
  mediaType: ContentType;
  season?: number;
  episode?: number;
}

export type VidlinkPlayerMessage = BasePlayerEventEnvelope<VidlinkEventData>;

export interface VidkingEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  id: string | number;
  mediaType: ContentType;
  season?: number;
  episode?: number;
  progress?: number;
}

export type VidkingPlayerMessage = BasePlayerEventEnvelope<VidkingEventData>;

export interface UnifiedPlayerEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  mediaId: string | number;
  mediaType: ContentType;
  season?: number;
  episode?: number;
  progress?: number;
}

export interface PlayerAdapter<RawMessage extends BasePlayerEventEnvelope<any>> {
  /** Domain origin for identifying source */
  origin: `https://${string}`;
  /** Converts raw → unified structure */
  parse: (raw: RawMessage) => UnifiedPlayerEventData | null;
}

export type AdapterMap = Record<string, PlayerAdapter<any>>;

export const playerAdapters = {
  vidlink: {
    origin: "https://vidlink.pro",
    parse: (raw) => {
      if (raw.type !== "PLAYER_EVENT") return null;
      const d = raw.data;
      return {
        ...d,
        mediaId: d.mtmdbId,
      };
    },
  } satisfies PlayerAdapter<VidlinkPlayerMessage>,

  vidking: {
    origin: "https://www.vidking.net",
    parse: (raw) => {
      if (raw.type !== "PLAYER_EVENT") return null;
      const d = raw.data;
      return {
        ...d,
        mediaId: d.id,
      };
    },
  } satisfies PlayerAdapter<VidkingPlayerMessage>,
} as const satisfies AdapterMap;

/**
 * Fallback parser for generic postMessages from third-party embed players
 */
function parseGenericMessage(
  raw: any,
  fallbackMediaId?: string | number,
  fallbackMediaType?: ContentType,
  metadata?: { season?: number; episode?: number }
): UnifiedPlayerEventData | null {
  if (!raw) return null;

  let parsedRaw = raw;
  if (typeof raw === "string") {
    try {
      parsedRaw = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!parsedRaw || typeof parsedRaw !== "object") return null;

  let data = parsedRaw.data !== undefined ? parsedRaw.data : parsedRaw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      // not JSON object
    }
  }

  if (!data || typeof data !== "object") return null;

  const rawType = (parsedRaw.event || parsedRaw.type || parsedRaw.action || data.event || data.type || "")
    .toString()
    .toLowerCase();

  let event: PlayerEventType = "timeupdate";
  if (rawType.includes("play")) event = "play";
  else if (rawType.includes("pause")) event = "pause";
  else if (rawType.includes("end") || rawType.includes("finish")) event = "ended";
  else if (rawType.includes("seek")) event = "seeked";
  else if (rawType.includes("time") || rawType.includes("progress")) event = "timeupdate";
  else if (!("currentTime" in data || "time" in data || "position" in data || "seconds" in data)) {
    return null;
  }

  const rawTime = data.currentTime ?? data.time ?? data.position ?? data.seconds;
  if (rawTime === undefined || rawTime === null) return null;

  const currentTime = Number(rawTime);
  if (isNaN(currentTime) || currentTime < 0) return null;

  const rawDuration = data.duration ?? data.totalDuration ?? data.durationSeconds ?? 0;
  const duration = Number(rawDuration) || 0;

  return {
    event,
    currentTime,
    duration,
    mediaId: data.mediaId || data.id || data.tmdbId || fallbackMediaId || 0,
    mediaType: data.mediaType || fallbackMediaType || "movie",
    season: data.season || metadata?.season,
    episode: data.episode || metadata?.episode,
  };
}

export interface UsePlayerEventsOptions {
  mediaId?: string | number;
  mediaType?: ContentType;
  title?: string;
  metadata?: { season?: number; episode?: number };
  saveHistory?: boolean;
  onPlay?: (data: UnifiedPlayerEventData) => void;
  onPause?: (data: UnifiedPlayerEventData) => void;
  onSeeked?: (data: UnifiedPlayerEventData) => void;
  onEnded?: (data: UnifiedPlayerEventData) => void;
  onTimeUpdate?: (data: UnifiedPlayerEventData) => void;
}

export function usePlayerEvents(options: UsePlayerEventsOptions = {}) {
  const { data: user } = useSupabaseUser();
  const documentState = useDocumentVisibility();

  const {
    mediaId,
    mediaType = "movie",
    title,
    metadata,
    saveHistory,
    onPlay,
    onPause,
    onSeeked,
    onEnded,
    onTimeUpdate,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastEvent, setLastEvent] = useState<PlayerEventType | null>(null);
  const [lastCurrentTime, setLastCurrentTime] = useState(0);

  const eventDataRef = useRef<UnifiedPlayerEventData | null>(null);

  const persistToLocalStorage = (data: UnifiedPlayerEventData) => {
    if (!data || data.currentTime <= 0) return;
    saveStoredProgress({
      mediaType: data.mediaType || mediaType,
      mediaId: data.mediaId || mediaId || 0,
      title,
      season: data.season || metadata?.season,
      episode: data.episode || metadata?.episode,
      currentTime: data.currentTime,
      duration: data.duration,
    });

    if (user?.id) {
      const activeProfileId = getActiveProfileId(user.id);
      saveProfileHistoryItem(user.id, activeProfileId, {
        media_id: Number(data.mediaId || mediaId || 0),
        type: data.mediaType || mediaType,
        season: data.season || metadata?.season,
        episode: data.episode || metadata?.episode,
        title: title || "Media",
        duration: data.duration,
        last_position: data.currentTime,
        completed: data.event === "ended",
      });
    }
  };

  const syncToServer = async (data: UnifiedPlayerEventData, completed?: boolean) => {
    persistToLocalStorage(data);

    if (!saveHistory || !user) return;
    if (diff(data.currentTime, lastCurrentTime) <= 5) return; // prevent spam

    const payload: UnifiedPlayerEventData = {
      ...data,
      season: data.season || metadata?.season || 0,
      episode: data.episode || metadata?.episode || 0,
    };

    const { success, message } = await syncHistory(payload, completed);
    if (success) setLastCurrentTime(data.currentTime);
    else console.error("Save history failed:", message);
  };

  useEffect(() => {
    if (!eventDataRef.current) return;
    persistToLocalStorage(eventDataRef.current);

    if (!saveHistory || !user) return;
    if (documentState === "visible") return;
    syncToServer(eventDataRef.current);
  }, [documentState, lastCurrentTime]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventDataRef.current) {
        persistToLocalStorage(eventDataRef.current);
      }

      if (!saveHistory || !user) return;
      if (!eventDataRef.current) return;

      const payload = {
        ...eventDataRef.current,
        completed: eventDataRef.current.event === "ended",
      };
      navigator.sendBeacon("/api/player/save-history", JSON.stringify(payload));
    };

    const handleMessage = (event: MessageEvent) => {
      let rawData: any;
      try {
        rawData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      const adapter = Object.values(playerAdapters).find((a) => a.origin === event.origin);
      const parsed = adapter
        ? adapter.parse(rawData)
        : parseGenericMessage(rawData, mediaId, mediaType, metadata);

      if (!parsed) return;

      eventDataRef.current = parsed;
      setLastEvent(parsed.event);
      persistToLocalStorage(parsed);

      switch (parsed.event) {
        case "play":
          setIsPlaying(true);
          onPlay?.(parsed);
          break;
        case "pause":
          setIsPlaying(false);
          persistToLocalStorage(parsed);
          onPause?.(parsed);
          break;
        case "ended":
          setIsPlaying(false);
          syncToServer(parsed, true);
          onEnded?.(parsed);
          break;
        case "seeked":
          setCurrentTime(parsed.currentTime);
          setDuration(parsed.duration);
          persistToLocalStorage(parsed);
          onSeeked?.(parsed);
          break;
        case "timeupdate":
          setCurrentTime(parsed.currentTime);
          setDuration(parsed.duration);
          onTimeUpdate?.(parsed);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (eventDataRef.current) {
        persistToLocalStorage(eventDataRef.current);
        handleBeforeUnload();
      }
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [mediaId, mediaType, title, metadata]);

  return { isPlaying, currentTime, duration, lastEvent };
}
