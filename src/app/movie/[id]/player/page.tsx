"use client";

import { tmdb } from "@/api/tmdb";
import { getMovieLastPosition } from "@/actions/histories";
import MoviePlayer from "@/components/sections/Movie/Player/Player";
import { Params } from "@/types";
import { siteConfig } from "@/config/site";
import { isEmpty } from "@/utils/helpers";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { NextPage } from "next";
import { notFound, useSearchParams } from "next/navigation";
import { use } from "react";
import { getActiveProfileId } from "@/services/profileStorage";

const MoviePlayerPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const urlStartAt = searchParams?.get("startAt") ? Number(searchParams.get("startAt")) : undefined;
  const activePid = typeof window !== "undefined" ? getActiveProfileId() : "main";

  const {
    data: movie,
    isPending,
    error,
  } = useQuery({
    queryFn: () => tmdb.movies.details(id),
    queryKey: ["movie-player-detail", id],
  });

  const { data: startAt, isPending: isPendingStartAt } = useQuery({
    queryFn: () => (activePid === "main" ? getMovieLastPosition(id) : 0),
    queryKey: ["movie-player-start-at", id, activePid],
  });

  if (isPending || isPendingStartAt) {
    return <Spinner size="lg" className="absolute-center" variant="simple" />;
  }

  if (error || isEmpty(movie)) return notFound();

  if (typeof document !== "undefined" && movie?.title) {
    document.title = `Watching: ${movie.title} · ${siteConfig.name}`;
  }

  return <MoviePlayer movie={movie} startAt={urlStartAt ?? startAt} />;
};

export default MoviePlayerPage;
