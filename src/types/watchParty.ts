import { ContentType } from "@/types";

export interface WatchPartyMember {
  id: string;
  name: string;
  avatar: string;
  is_host: boolean;
  joined_at: string;
}

export interface WatchPartyMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  text: string;
  is_system?: boolean;
  created_at: string;
}

export interface WatchPartyRoom {
  code: string;
  host_id: string;
  host_name: string;
  host_avatar: string;
  media_id: number;
  media_type: ContentType;
  media_title: string;
  media_poster: string | null;
  season?: number;
  episode?: number;
  is_public: boolean;
  max_participants: number;
  created_at: string;
}

export interface SyncPlaybackEvent {
  action: "play" | "pause" | "seek";
  currentTime: number;
  sender_name: string;
  timestamp: number;
}
