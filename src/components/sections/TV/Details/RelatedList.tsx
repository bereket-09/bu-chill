import { TV } from "tmdb-ts/dist/types";
import { getImageUrl } from "@/utils/movies";
import Link from "next/link";
import SafeImage from "@/components/ui/other/SafeImage";
import { FaPlay, FaStar } from "react-icons/fa6";

interface TvShowRelatedListProps {
  tvs: TV[];
}

const TvShowRelatedList: React.FC<TvShowRelatedListProps> = ({ tvs }) => {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 sm:gap-4 md:gap-5 w-full">
      {tvs.map((tv) => {
        const backdropUrl = tv.backdrop_path
          ? `https://image.tmdb.org/t/p/w500${tv.backdrop_path}`
          : getImageUrl(tv.poster_path, "poster");
        const year = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : null;

        return (
          <Link
            key={tv.id}
            href={`/tv/${tv.id}`}
            className="group flex flex-col gap-2 w-full transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98]"
          >
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#16181f] border border-white/10 group-hover:border-white/30 shadow-lg shadow-black/40">
              <SafeImage
                src={backdropUrl}
                alt={tv.name}
                fallbackTitle={tv.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                unoptimized
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

              {/* Hover Center Play Pill */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
                  <FaPlay className="text-xs ml-0.5" />
                </div>
              </div>

              {/* Bottom Rating Badge */}
              {tv.vote_average > 0 && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded-md backdrop-blur-md border border-white/10 shadow-sm">
                  <FaStar className="text-amber-400 text-[9px]" />
                  <span>{tv.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col px-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-white leading-snug truncate transition-colors group-hover:text-primary">
                {tv.name}
              </h3>
              <p className="text-[11px] text-white/50 font-medium mt-0.5">
                {year ? `${year} • TV Series` : "TV Series"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default TvShowRelatedList;
