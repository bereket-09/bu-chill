"use client";

import { useState } from "react";
import { AppendToResponse, TV, TvShowDetails } from "tmdb-ts/dist/types";
import { cn } from "@/utils/helpers";
import TvShowRelatedList from "./RelatedList";

interface TvShowRelatedSectionProps {
  tv: AppendToResponse<TvShowDetails, ("recommendations" | "similar")[], "tvShow">;
}

const TvShowRelatedSection: React.FC<TvShowRelatedSectionProps> = ({ tv }) => {
  // @ts-expect-error: wrong type from tmdb-ts.
  const recommendations = (tv.recommendations?.results || []) as TV[];
  const similar = (tv.similar?.results || []) as TV[];

  const [activeTab, setActiveTab] = useState<"recommendations" | "similar">(
    recommendations.length > 0 ? "recommendations" : "similar"
  );

  if (recommendations.length === 0 && similar.length === 0) return null;

  const currentList = activeTab === "recommendations" ? recommendations : similar;

  return (
    <section id="related" className="my-10 w-full">
      {/* Header Row: Title & Subtitle on Left, Tab Pills on Right */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            More Like This
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Hand-picked TV shows and recommendations you might enjoy
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {recommendations.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("recommendations")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeTab === "recommendations"
                  ? "bg-white text-black shadow-lg shadow-white/20"
                  : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
              )}
            >
              Recommended
            </button>
          )}

          {similar.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("similar")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeTab === "similar"
                  ? "bg-white text-black shadow-lg shadow-white/20"
                  : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
              )}
            >
              Similar
            </button>
          )}
        </div>
      </div>

      {/* Grid of shows */}
      <TvShowRelatedList tvs={currentList} />
    </section>
  );
};

export default TvShowRelatedSection;
