import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { HandlerType } from "@/types/component";
import { Episode } from "tmdb-ts/dist/types/tv-episode";
import { EpisodeListCard } from "../Details/Episodes";

interface TvShowPlayerEpisodeSelectionProps extends HandlerType {
  id: number;
  episodes: Episode[];
}

const TvShowPlayerEpisodeSelection: React.FC<TvShowPlayerEpisodeSelectionProps> = ({
  opened,
  onClose,
  id,
  episodes,
}) => {
  return (
    <VaulDrawer
      open={opened}
      onClose={onClose}
      backdrop="blur"
      title="Episodes"
      direction="bottom"
      hiddenHandler
      withCloseButton
      classNames={{
        content: "max-h-[82vh] w-full max-w-5xl mx-auto bg-neutral-950/95 border-t border-white/10 text-white rounded-t-3xl shadow-2xl",
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-6 overflow-y-auto max-h-[72vh]">
        {episodes.map((episode, index) => (
          <EpisodeListCard
            id={id}
            key={episode.id}
            episode={episode}
            order={index + 1}
            withAnimation={false}
          />
        ))}
      </div>
    </VaulDrawer>
  );
};

export default TvShowPlayerEpisodeSelection;
