import { tmdb } from "@/api/tmdb";
import { cn, formatDate, isEmpty } from "@/utils/helpers";
import { PlayOutline } from "@/utils/icons";
import { getImageUrl, getLoadingLabel, movieDurationString } from "@/utils/movies";
import { Card, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { memo } from "react";
import { Episode } from "tmdb-ts/dist/types/tv-episode";
import SafeImage from "@/components/ui/other/SafeImage";

interface TvShowEpisodesSelectionProps {
  id: number;
  seasonNumber: number;
  filters?: {
    searchQuery?: string;
    sortedByName?: boolean;
    layout?: "list" | "grid";
  };
}

interface EpisodeCardProps {
  id: number;
  episode: Episode;
  order?: number;
  withAnimation?: boolean;
}

const TvShowEpisodesSelection: React.FC<TvShowEpisodesSelectionProps> = ({
  id,
  seasonNumber,
  filters: { searchQuery, sortedByName, layout } = {},
}) => {
  const { data, isPending } = useQuery({
    queryFn: () => tmdb.tvShows.season(id, seasonNumber),
    queryKey: ["tv-show-episodes", id, seasonNumber],
  });

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner variant="wave" size="lg" label={getLoadingLabel()} color="warning" />
      </div>
    );
  }

  if (!data) return null;

  const EPISODES = data.episodes
    .filter((episode) =>
      searchQuery ? episode.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
    )
    .sort((a, b) => (sortedByName ? a.name.localeCompare(b.name) : 0));

  if (isEmpty(EPISODES)) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-center text-sm text-white/50">No episodes found matching your search.</p>
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {EPISODES.map((episode) => (
          <EpisodeGridCard key={episode.id} episode={episode} id={id} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {EPISODES.map((episode, index) => (
        <EpisodeListCard key={episode.id} episode={episode} order={index + 1} id={id} />
      ))}
    </div>
  );
};

export const EpisodeListCard: React.FC<EpisodeCardProps> = ({
  episode,
  id,
}) => {
  const imageUrl = getImageUrl(episode.still_path);
  const isNotReleased = !episode.air_date || new Date(episode.air_date) > new Date();
  const href = !isNotReleased
    ? `/tv/${id}/${episode.season_number}/${episode.episode_number}/player`
    : undefined;

  return (
    <Card
      isPressable={!isNotReleased}
      as={(isNotReleased ? "div" : Link) as "a"}
      href={href}
      shadow="none"
      className={cn(
        "group border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200 grid grid-cols-[auto_1fr] gap-4 rounded-xl overflow-hidden p-2.5 sm:p-3",
        {
          "cursor-not-allowed opacity-50": isNotReleased,
        },
      )}
    >
      <div className="relative w-36 sm:w-48 aspect-video rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/5">
        <SafeImage
          alt={episode.name}
          src={imageUrl}
          fallbackTitle={episode.name}
          fill
          sizes="(max-width: 640px) 150px, 200px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        {!isNotReleased && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-md border border-white/20 transition-opacity group-hover:opacity-100 text-white shadow-lg">
              <PlayOutline className="h-4 w-4 ml-0.5" />
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 z-20 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white/90 backdrop-blur-md border border-white/10">
          {isNotReleased ? "Coming Soon" : movieDurationString(episode.runtime)}
        </div>
        <div className="absolute bottom-2 left-2 z-20 min-w-6 px-1.5 py-0.5 rounded text-[10px] font-black bg-black/80 text-white text-center backdrop-blur-md border border-white/10">
          E{episode.episode_number}
        </div>
      </div>
      <div className="flex flex-col justify-center min-w-0 pr-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-primary">Episode {episode.episode_number}</span>
          {episode.air_date && (
            <>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-xs text-white/40">{formatDate(episode.air_date, "en-US")}</span>
            </>
          )}
        </div>
        <p
          title={episode.name}
          className="line-clamp-1 text-sm sm:text-base font-bold text-white transition-colors group-hover:text-primary"
        >
          {episode.name}
        </p>
        {episode.overview && (
          <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-white/50 leading-relaxed" title={episode.overview}>
            {episode.overview}
          </p>
        )}
      </div>
    </Card>
  );
};

const EpisodeGridCard: React.FC<EpisodeCardProps> = ({ episode, id }) => {
  const imageUrl = getImageUrl(episode.still_path);
  const isNotReleased = !episode.air_date || new Date(episode.air_date) > new Date();
  const href = !isNotReleased
    ? `/tv/${id}/${episode.season_number}/${episode.episode_number}/player`
    : undefined;

  return (
    <Card
      isPressable={!isNotReleased}
      as={(isNotReleased ? "div" : Link) as "a"}
      href={href}
      shadow="none"
      className={cn(
        "group border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200 rounded-xl overflow-hidden p-2.5 flex flex-col",
        {
          "cursor-not-allowed opacity-50": isNotReleased,
        },
      )}
    >
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/5 mb-3">
        <SafeImage
          alt={episode.name}
          src={imageUrl}
          fallbackTitle={episode.name}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        {!isNotReleased && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-md border border-white/20 transition-opacity group-hover:opacity-100 text-white shadow-lg">
              <PlayOutline className="h-5 w-5 ml-0.5" />
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 z-20 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white/90 backdrop-blur-md border border-white/10">
          {isNotReleased ? "Coming Soon" : movieDurationString(episode.runtime)}
        </div>
        <div className="absolute bottom-2 left-2 z-20 min-w-6 px-1.5 py-0.5 rounded text-[10px] font-black bg-black/80 text-white text-center backdrop-blur-md border border-white/10">
          E{episode.episode_number}
        </div>
      </div>
      <div className="flex flex-col flex-1 px-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-primary">Episode {episode.episode_number}</span>
          {episode.air_date && (
            <>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-xs text-white/40">{formatDate(episode.air_date, "en-US")}</span>
            </>
          )}
        </div>
        <p
          title={episode.name}
          className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-primary mb-1"
        >
          {episode.name}
        </p>
        {episode.overview && (
          <p className="line-clamp-2 text-xs text-white/50 leading-relaxed" title={episode.overview}>
            {episode.overview}
          </p>
        )}
      </div>
    </Card>
  );
};

export default memo(TvShowEpisodesSelection);
