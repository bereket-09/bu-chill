import { PlayersProps } from "@/types";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { HandlerType } from "@/types/component";
import { cn } from "@/utils/helpers";
import { FaPlay } from "react-icons/fa6";
import { MdCastConnected } from "react-icons/md";
import { Chip } from "@heroui/react";

interface TvShowPlayerSourceSelectionProps extends HandlerType {
  players: PlayersProps[];
  selectedSource: number;
  setSelectedSource: (source: number) => void;
}

const getServerSubtitle = (player: PlayersProps, index: number) => {
  if (player.type === "native") return "Premium Ad-Free HD Stream";
  const subtitles = [
    "Direct-play HD stream",
    "Multi-language HD stream",
    "Ultra HD fast CDN",
    "Direct embed stream",
    "Adaptive multi-bitrate",
    "High-speed backup stream",
  ];
  return subtitles[index % subtitles.length];
};

const TvShowPlayerSourceSelection: React.FC<TvShowPlayerSourceSelectionProps> = ({
  opened,
  onClose,
  players,
  selectedSource,
  setSelectedSource,
}) => {
  return (
    <VaulDrawer
      open={opened}
      onClose={onClose}
      backdrop="blur"
      title="Select Stream Server"
      direction="right"
      hiddenHandler
      withCloseButton
      classNames={{ content: "space-y-0 max-w-md w-full bg-neutral-950/95 border-l border-white/10 text-white" }}
    >
      <div className="flex flex-col gap-3 p-5 overflow-y-auto">
        <p className="text-xs text-neutral-400 mb-2 font-normal">
          Switch between active streaming servers. Active servers deliver instant direct playback.
        </p>

        <div className="flex flex-col gap-2">
          {players.map((player, index) => {
            const isSelected = selectedSource === index;
            const subtitle = getServerSubtitle(player, index);

            return (
              <div
                key={index}
                onClick={() => {
                  setSelectedSource(index);
                  onClose();
                }}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "bg-white/10 border border-warning/50 shadow-md shadow-warning/10"
                    : "hover:bg-white/5 border border-white/5"
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-base md:text-lg font-black tracking-tight transition-colors",
                        isSelected ? "text-white" : "text-neutral-300 group-hover:text-white"
                      )}
                    >
                      {player.title}
                    </span>
                    {player.type === "native" && (
                      <Chip size="sm" color="success" variant="flat" className="text-[10px] h-5">
                        Ad-Free
                      </Chip>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400 font-medium">
                    {subtitle}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {isSelected ? (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                      <MdCastConnected className="text-xs animate-pulse" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-500 font-mono">
                      Queue —
                    </span>
                  )}

                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                      isSelected
                        ? "bg-warning text-white"
                        : "bg-white/10 text-neutral-400 group-hover:bg-warning group-hover:text-white"
                    )}
                  >
                    <FaPlay className="text-[10px] ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </VaulDrawer>
  );
};

export default TvShowPlayerSourceSelection;
