import { cn } from "@/utils/helpers";
import { ChevronUp, List } from "@/utils/icons";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { MdSkipNext } from "react-icons/md";
import { TvShowPlayerProps } from "./Player";

interface TvShowPlayerHeaderProps extends Omit<TvShowPlayerProps, "episodes" | "tv" | "startAt"> {
  hidden?: boolean;
  isEmbed?: boolean;
  selectedSource: number;
  currentServerName?: string;
  hasDirectOption?: boolean;
  onToggleMode?: (mode: "direct" | "embed") => void;
  onOpenSource: () => void;
  onOpenEpisodes?: () => void;
}

const TvShowPlayerHeader: React.FC<TvShowPlayerHeaderProps> = ({
  id,
  seriesName,
  episode,
  hidden,
  isEmbed,
  selectedSource,
  currentServerName,
  hasDirectOption,
  onToggleMode,
  nextEpisodeNumber,
  onOpenSource,
  onOpenEpisodes,
}) => {
  return (
    <>
      {/* Top Header Overlay: Left (Back + Title) and Right (Embed Server + Next Episode) */}
      <div
        className={cn(
          "pointer-events-none absolute top-0 inset-x-0 z-40 flex w-full items-center justify-between p-4 sm:p-6 text-white transition-opacity duration-300",
          "h-28 bg-gradient-to-b from-black/90 via-black/40 to-transparent",
          { "opacity-0": hidden }
        )}
      >
        {/* Top-Left: Circular Back Button + Title & Subtitle */}
        <div className="pointer-events-auto flex items-center gap-3">
          <Link
            href={`/tv/${id}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 shadow-md"
            aria-label="Back"
          >
            <IoArrowBack className="text-xl" />
          </Link>

          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold text-white leading-tight drop-shadow-md">
              {seriesName}
            </span>
            <span className="text-xs sm:text-sm text-white/70 font-medium drop-shadow-md">
              S{episode.season_number} E{episode.episode_number} {episode.name}
            </span>
          </div>
        </div>

        {/* Top-Right: [ ▶ Embed {ServerName} ] + [ ⏭ Next Episode ] */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenSource}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-black/50 hover:bg-white/15 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white/90 hover:text-white transition-all backdrop-blur-md active:scale-95 shadow-md"
          >
            <span className="flex items-center justify-center rounded bg-primary/20 px-1 py-0.5 text-[10px] text-primary">
              ▶
            </span>
            <span className="font-semibold">{isEmbed ? "Embed" : "Direct"}</span>
            <span className="text-white/60 font-normal">
              {currentServerName?.split("(")[0]?.trim() || "Server"}
            </span>
          </button>

          {nextEpisodeNumber && (
            <Link
              href={`/tv/${id}/${episode.season_number}/${nextEpisodeNumber}/player?src=${selectedSource}`}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 hover:bg-white/15 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white/90 hover:text-white transition-all backdrop-blur-md active:scale-95 shadow-md"
            >
              <MdSkipNext className="text-lg" />
              <span>Next Episode</span>
            </Link>
          )}
        </div>
      </div>

      {/* Bottom Controls Overlay (DIRECT | EMBED and Center Title + Episodes) */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 inset-x-0 z-40 flex flex-col justify-end p-4 sm:p-6 transition-opacity duration-300",
          { "opacity-0": hidden }
        )}
      >
        {/* Row Above Bottom: DIRECT | EMBED Switch (Right Aligned) */}
        {hasDirectOption && (
          <div className="flex justify-end mb-3">
            <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/20 bg-black/65 p-0.5 shadow-xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => onToggleMode?.("direct")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all",
                  !isEmbed ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                )}
              >
                Direct
              </button>
              <button
                type="button"
                onClick={() => onToggleMode?.("embed")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all",
                  isEmbed ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
                )}
              >
                Embed
              </button>
            </div>
          </div>
        )}

        {/* Bottom Bar: Center Title + Right Episodes */}
        <div className="relative flex items-center justify-between text-white">
          <div className="w-10 sm:w-20" />

          {/* Center: Reacher — S01E01 Welcome to Margrave */}
          <div className="flex flex-1 justify-center px-4 overflow-hidden">
            <span className="text-xs sm:text-sm text-white/80 font-medium tracking-wide drop-shadow-md truncate text-center select-none">
              {seriesName} — S{String(episode.season_number).padStart(2, "0")}E{String(episode.episode_number).padStart(2, "0")} {episode.name}
            </span>
          </div>

          {/* Right: Episodes Trigger */}
          {onOpenEpisodes && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenEpisodes}
                className="pointer-events-auto group/eps flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 hover:bg-black px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-xl backdrop-blur-xl hover:scale-105 active:scale-95 transition-all"
              >
                <List size={15} className="text-primary" />
                <span>Episodes</span>
                <ChevronUp size={14} className="transition-transform duration-200 group-hover/eps:-translate-y-0.5 text-white/70 group-hover/eps:text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TvShowPlayerHeader;

