"use client";

import React from "react";
import { AppendToResponse } from "tmdb-ts/dist/types/options";
import { MovieDetails } from "tmdb-ts/dist/types/movies";

interface MovieFactsProps {
  movie: AppendToResponse<MovieDetails, "credits"[], "movie">;
}

const formatCurrency = (amount?: number): string => {
  if (!amount || amount === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const MovieFacts: React.FC<MovieFactsProps> = ({ movie }) => {
  const directors = movie.credits?.crew?.filter((c) => c.job === "Director") || [];
  const writers =
    movie.credits?.crew?.filter(
      (c) => c.job === "Screenplay" || c.job === "Writer" || c.department === "Writing"
    ) || [];

  return (
    <div className="my-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm md:p-8">
      <h3 className="mb-6 text-xl font-bold text-white tracking-wide">
        Movie Details & Production
      </h3>

      <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {directors.length > 0 && (
          <div>
            <span className="text-xs font-semibold tracking-wider text-white/40 uppercase">
              {directors.length > 1 ? "Directors" : "Director"}
            </span>
            <p className="mt-1 text-sm font-medium text-white">
              {directors.map((d) => d.name).join(", ")}
            </p>
          </div>
        )}

        {writers.length > 0 && (
          <div>
            <span className="text-xs font-semibold tracking-wider text-white/40 uppercase">
              Screenplay
            </span>
            <p className="mt-1 text-sm font-medium text-white line-clamp-2">
              {writers.slice(0, 3).map((w) => w.name).join(", ")}
            </p>
          </div>
        )}

        <div>
          <span className="text-xs font-semibold tracking-wider text-white/40 uppercase">
            Status
          </span>
          <p className="mt-1 text-sm font-medium text-white">
            {movie.status || "Released"}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold tracking-wider text-white/40 uppercase">
            Original Audio
          </span>
          <p className="mt-1 text-sm font-medium text-white uppercase">
            {movie.original_language || "EN"}
          </p>
        </div>

        {movie.budget > 0 && (
          <div>
            <span className="text-xs font-semibold tracking-wider text-white/40 uppercase">
              Budget
            </span>
            <p className="mt-1 text-sm font-medium text-white">
              {formatCurrency(movie.budget)}
            </p>
          </div>
        )}

        {movie.revenue > 0 && (
          <div>
            <span className="text-xs font-semibold tracking-wider text-white/40 uppercase">
              Box Office
            </span>
            <p className="mt-1 text-sm font-medium text-white text-emerald-400 font-semibold">
              {formatCurrency(movie.revenue)}
            </p>
          </div>
        )}
      </div>

      {movie.production_companies && movie.production_companies.length > 0 && (
        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <span className="text-xs font-semibold tracking-wider text-white/40 uppercase block mb-3">
            Production Studios
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {movie.production_companies.map((company) => (
              <span
                key={company.id}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80"
              >
                {company.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieFacts;
