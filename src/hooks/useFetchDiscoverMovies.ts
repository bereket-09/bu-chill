"use client";

import { tmdb } from "@/api/tmdb";
import { DiscoverMoviesFetchQueryType } from "@/types/movie";
import { MovieDiscoverResult } from "tmdb-ts/dist/types/discover";

interface FetchDiscoverMovies {
  page?: number;
  type?: DiscoverMoviesFetchQueryType;
  genres?: string;
}

const useFetchDiscoverMovies = ({
  page = 1,
  type = "discover",
  genres,
}: FetchDiscoverMovies): Promise<MovieDiscoverResult> => {
  const discover = () => tmdb.discover.movie({ page: page, with_genres: genres });
  const todayTrending = () => tmdb.trending.trending("movie", "day", { page: page });
  const thisWeekTrending = () => tmdb.trending.trending("movie", "week", { page: page });
  const popular = () => tmdb.movies.popular({ page: page });
  const nowPlaying = () => tmdb.movies.nowPlaying({ page: page });
  const upcoming = () => tmdb.movies.upcoming({ page: page });
  const topRated = () => tmdb.movies.topRated({ page: page });
  const korean = () => tmdb.discover.movie({ page: page, with_original_language: "ko", sort_by: "popularity.desc" });
  const koreanMovies = korean;

  const queryData = {
    discover,
    todayTrending,
    thisWeekTrending,
    popular,
    nowPlaying,
    upcoming,
    topRated,
    korean,
    koreanMovies,
  }[type];

  return queryData();
};

export default useFetchDiscoverMovies;
