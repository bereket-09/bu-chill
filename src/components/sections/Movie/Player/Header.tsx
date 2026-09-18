import { cn } from "@/utils/helpers";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { FaServer } from "react-icons/fa6";

interface MoviePlayerHeaderProps {
  id: number;
  movieName: string;
  subtitle?: string;
  hidden?: boolean;
  isEmbed?: boolean;
  currentServerName?: string;
  hasDirectOption?: boolean;
  onToggleMode?: (mode: "direct" | "embed") => void;
  onOpenSource: () => void;
}

const MoviePlayerHeader: React.FC<MoviePlayerHeaderProps> = ({
  id,
  movieName,
  subtitle,
  hidden,
  isEmbed,
  currentServerName,
  hasDirectOption,
  onToggleMode,
  onOpenSource,
}) => {
  return (
    <>
      {/* Top Header Overlay: Left (Back + Title) and Right (Server) */}
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
            href={`/movie/${id}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 shadow-md"
            aria-label="Back"
          >
            <IoArrowBack className="text-xl" />
          </Link>

          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold text-white leading-tight drop-shadow-md">
              {movieName}
            </span>
            {subtitle && (
              <span className="text-xs sm:text-sm text-white/70 font-medium drop-shadow-md">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Top-Right: [ ▶ Embed {ServerName} ] */}
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
        </div>
      </div>

      {/* Bottom Controls Overlay: DIRECT | EMBED Switch + Center Title */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 inset-x-0 z-40 flex flex-col justify-end p-4 sm:p-6 transition-opacity duration-300",
          { "opacity-0": hidden }
        )}
      >
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

        {/* Bottom Bar: Center Title */}
        <div className="relative flex items-center justify-between text-white">
          <div className="w-10 sm:w-20" />
          <div className="flex flex-1 justify-center px-4 overflow-hidden">
            <span className="text-xs sm:text-sm text-white/80 font-medium tracking-wide drop-shadow-md truncate text-center select-none">
              {movieName} {subtitle ? `— ${subtitle}` : ""}
            </span>
          </div>
          <div className="w-10 sm:w-20" />
        </div>
      </div>
    </>
  );
};

export default MoviePlayerHeader;

