"use client";

import { Cast } from "tmdb-ts";
import { getImageUrl } from "@/utils/movies";

interface CastCardProps {
  casts: Cast[];
}

const CastsSection: React.FC<CastCardProps> = ({ casts }) => {
  if (!casts || casts.length === 0) return null;

  return (
    <section id="casts" className="my-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-wide text-white md:text-2xl">
          Top Cast
        </h2>
        <span className="text-xs font-medium text-white/40">
          {casts.length} Actors
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {casts.slice(0, 24).map((cast, index) => {
          const avatar = getImageUrl(cast.profile_path, "avatar");

          return (
            <div
              key={`${cast.id}-${index}`}
              className="group flex items-center gap-3.5 rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-3 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.06]"
            >
              <div className="relative shrink-0">
                {cast.profile_path ? (
                  <img
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white/10 transition-all duration-200 group-hover:ring-primary/60"
                    src={avatar}
                    alt={cast.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white/40">
                    {cast.name?.[0]}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col">
                <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-primary">
                  {cast.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/50">
                  {cast.character || "Cast"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CastsSection;
