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
  title: `Movies | ${siteConfig.name}`,
  description: "Stream the latest blockbusters, top-rated films, and cinema classics.",
};

async function getMoviesData() {
  const [trending, topRated, action, comedy, sciFi, horror] = await Promise.all([
    tmdb.trending.trending("movie", "day").catch(() => ({ results: [] })),
    tmdb.movies.topRated().catch(() => ({ results: [] })),
    tmdb.discover.movie({ with_genres: "28", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
    tmdb.discover.movie({ with_genres: "35", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
    tmdb.discover.movie({ with_genres: "878", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
    tmdb.discover.movie({ with_genres: "27", sort_by: "popularity.desc" }).catch(() => ({ results: [] })),
  ]);

  return {
    featured: (trending.results[0] || null) as unknown as BingrMediaItem | null,
    trending: trending.results as unknown as BingrMediaItem[],
    topRated: topRated.results as unknown as BingrMediaItem[],
    action: action.results as unknown as BingrMediaItem[],
    comedy: comedy.results as unknown as BingrMediaItem[],
    sciFi: sciFi.results as unknown as BingrMediaItem[],
    horror: horror.results as unknown as BingrMediaItem[],
  };
}

const MoviesPage: NextPage = async () => {
  const { featured, trending, topRated, action, comedy, sciFi, horror } = await getMoviesData();

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Featured Hero Banner */}
      {featured && (
        <section className="relative w-full h-[65vh] sm:h-[75vh] min-h-[480px]">
          {featured.backdrop_path && (
            <Image
              src={getImageUrl(featured.backdrop_path || undefined, "backdrop", true)}
              alt={featured.title || "Featured Movie"}
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
              <span className="rounded bg-white/20 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                Featured Movie
              </span>
              {featured.vote_average && (
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                  <IoStar className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{featured.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg mb-3">
              {featured.title}
            </h1>

            {featured.overview && (
              <p className="text-sm sm:text-base text-white/80 line-clamp-3 mb-6 max-w-2xl drop-shadow-md">
                {featured.overview}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Link
                href={`/movie/${featured.id}`}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm sm:text-base hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-black/60"
              >
                <IoPlay className="w-5 h-5 fill-black" />
                <span>Watch Now</span>
              </Link>
              <Link
                href={`/movie/${featured.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 backdrop-blur-md text-white font-semibold text-sm sm:text-base hover:bg-white/25 active:scale-95 transition-all border border-white/10"
              >
                <span>More Info</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trays Section */}
      <div className="relative z-20 px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 pb-20 space-y-4 w-full">
        <BingrTray title="Trending Movies" items={trending} type="movie" seeAllHref="/categories?genre=28" />
        <BingrTray title="Top Rated Classics" items={topRated} type="movie" />
        <BingrTray title="Action & Thrills" items={action} type="movie" seeAllHref="/categories?genre=28" />
        <BingrTray title="Sci-Fi & Fantasy Worlds" items={sciFi} type="movie" seeAllHref="/categories?genre=878" />
        <BingrTray title="Comedy Hits" items={comedy} type="movie" seeAllHref="/categories?genre=35" />
        <BingrTray title="Horror & Suspense" items={horror} type="movie" seeAllHref="/categories?genre=27" />
      </div>
    </div>
  );
};

export default MoviesPage;
