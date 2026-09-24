export interface ProgramItem {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  start: string; // ISO 8601 string
  stop: string; // ISO 8601 string
  progress: number; // 0 - 100 percentage
  durationMinutes: number;
  timeRemainingMinutes: number;
}

export interface ChannelEpg {
  channelId: string;
  channelName: string;
  currentProgram: ProgramItem | null;
  nextProgram: ProgramItem | null;
  upcoming: ProgramItem[];
  source: "xmltv" | "preset" | "fallback";
  updatedAt: string;
}
