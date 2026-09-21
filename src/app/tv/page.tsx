import { Metadata, NextPage } from "next/types";
import { siteConfig } from "@/config/site";
import { tmdb } from "@/api/tmdb";
import BingrTray from "@/components/ui/tray/BingrTray";
import { BingrMediaItem } from "@/components/ui/card/BingrCard";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/utils/movies";
import { IoPlay, IoStar } from "react-icons/io5";

export const metadata: Metadata = {
  title: `TV | ${siteConfig.name}`,
  description: "Binge-watch the best TV shows, trending series, and episodic dramas.",
};

async function getTvData() {
  const [trending, topRated, drama, sciFi, comedy, action] = await Promise.all([
    tmdb.trending.trending("tv", "day").catch(() => ({ results: [] })),
    tmdb.tvShows.topRated().catch(() => ({ results: [] })),
    tmdb.discover.tvShow({ with_genres: "18", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
    tmdb.discover.tvShow({ with_genres: "10765", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
    tmdb.discover.tvShow({ with_genres: "35", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
    tmdb.discover.tvShow({ with_genres: "10759", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
  ]);

  return {
    featured: (trending.results[0] || null) as unknown as BingrMediaItem | null,
    trending: trending.results as unknown as BingrMediaItem[],
    topRated: topRated.results as unknown as BingrMediaItem[],
    drama: drama.results as unknown as BingrMediaItem[],
    sciFi: sciFi.results as unknown as BingrMediaItem[],
    comedy: comedy.results as unknown as BingrMediaItem[],
    action: action.results as unknown as BingrMediaItem[],
  };
}

const TvPage: NextPage = async () => {
  const { featured, trending, topRated, drama, sciFi, comedy, action } = await getTvData();

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Featured Hero Banner */}
      {featured && (
        <section className="relative w-full h-[65vh] sm:h-[75vh] min-h-[480px]">
          {featured.backdrop_path && (
            <Image
              src={getImageUrl(featured.backdrop_path || undefined, "backdrop", true)}
              alt={featured.name || "Featured Show"}
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
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                Featured Series
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
                <span>Watch Series</span>
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
        <BingrTray title="Trending TV Shows" items={trending} type="tv" />
        <BingrTray title="Top Rated TV Series" items={topRated} type="tv" />
        <BingrTray title="Gripping Dramas" items={drama} type="tv" />
        <BingrTray title="Sci-Fi & Fantasy Shows" items={sciFi} type="tv" />
        <BingrTray title="Bingeable Comedies" items={comedy} type="tv" />
        <BingrTray title="Action & Adventure Series" items={action} type="tv" />
      </div>
    </div>
  );
};

export default TvPage;
