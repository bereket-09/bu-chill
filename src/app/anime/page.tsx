import { Metadata, NextPage } from "next/types";
import { siteConfig } from "@/config/site";
import { tmdb } from "@/api/tmdb";
import BingrTray from "@/components/ui/tray/BingrTray";
import { BingrMediaItem } from "@/components/ui/card/BingrCard";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/utils/movies";
import { IoPlay, IoStar, IoMoon } from "react-icons/io5";

export const metadata: Metadata = {
  title: `Anime | ${siteConfig.name}`,
  description: "Stream the best anime series, top seasonal anime, and acclaimed animated films.",
};

async function getAnimeData() {
  const [popularTv, topRatedTv, actionTv, fantasyTv, animeMovies] = await Promise.all([
    tmdb.discover.tvShow({ with_genres: "16", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
    tmdb.discover.tvShow({ with_genres: "16", sort_by: "vote_average.desc", "vote_count.gte": 200 } as any).catch(() => ({ results: [] })),
    tmdb.discover.tvShow({ with_genres: "16,10759", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
    tmdb.discover.tvShow({ with_genres: "16,10765", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
    tmdb.discover.movie({ with_genres: "16", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
  ]);

  return {
    featured: (popularTv.results[0] || null) as unknown as BingrMediaItem | null,
    popular: popularTv.results as unknown as BingrMediaItem[],
    topRated: topRatedTv.results as unknown as BingrMediaItem[],
    action: actionTv.results as unknown as BingrMediaItem[],
    fantasy: fantasyTv.results as unknown as BingrMediaItem[],
    movies: animeMovies.results as unknown as BingrMediaItem[],
  };
}

const AnimePage: NextPage = async () => {
  const { featured, popular, topRated, action, fantasy, movies } = await getAnimeData();

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Featured Anime Hero Banner */}
      {featured && (
        <section className="relative w-full h-[65vh] sm:h-[75vh] min-h-[480px]">
          {featured.backdrop_path && (
            <Image
              src={getImageUrl(featured.backdrop_path || undefined, "backdrop", true)}
              alt={featured.name || "Featured Anime"}
              fill
              priority
              className="object-cover object-top"
            />
          )}

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />

          {/* Hero Content */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end px-4 sm:px-8 md:pl-24 lg:pl-28 pb-12 sm:pb-16 max-w-3xl">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <IoMoon className="w-3 h-3" />
                Featured Anime
              </span>
              {featured.vote_average && (
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                  <IoStar className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{featured.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg mb-3">
              {featured.name}
            </h1>

            {featured.overview && (
              <p className="text-sm sm:text-base text-white/80 line-clamp-3 mb-6 max-w-2xl drop-shadow-md">
                {featured.overview}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Link
                href={`/tv/${featured.id}`}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm sm:text-base hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-black/60"
              >
                <IoPlay className="w-5 h-5 fill-black" />
                <span>Watch Anime</span>
              </Link>
              <Link
                href={`/tv/${featured.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 backdrop-blur-md text-white font-semibold text-sm sm:text-base hover:bg-white/25 active:scale-95 transition-all border border-white/10"
              >
                <span>Episodes & Info</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trays Section */}
      <div className="relative z-20 px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 pb-20 space-y-4 w-full">
        <BingrTray title="Trending Anime Series" items={popular} type="tv" />
        <BingrTray title="Top Rated Classics" items={topRated} type="tv" />
        <BingrTray title="Action & Shonen" items={action} type="tv" />
        <BingrTray title="Fantasy & Supernatural" items={fantasy} type="tv" />
        <BingrTray title="Acclaimed Anime Films" items={movies} type="movie" />
      </div>
    </div>
  );
};

export default AnimePage;
