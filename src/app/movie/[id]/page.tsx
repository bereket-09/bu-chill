"use client";

import { Suspense, use } from "react";
import { Spinner } from "@heroui/spinner";
import { useQuery } from "@tanstack/react-query";
import { tmdb } from "@/api/tmdb";
import { Cast } from "tmdb-ts/dist/types/credits";
import { notFound } from "next/navigation";
import { Image } from "tmdb-ts";
import dynamic from "next/dynamic";
import { Params } from "@/types";
import { NextPage } from "next";
import { siteConfig } from "@/config/site";

const DetailHero = dynamic(() => import("@/components/sections/Movie/Detail/DetailHero"));
const CastsSection = dynamic(() => import("@/components/sections/Movie/Detail/Casts"));
const CollectionBanner = dynamic(() => import("@/components/sections/Movie/Detail/CollectionBanner"));
const MovieFacts = dynamic(() => import("@/components/sections/Movie/Detail/MovieFacts"));
const PhotosSection = dynamic(() => import("@/components/ui/other/PhotosSection"));
const RelatedSection = dynamic(() => import("@/components/sections/Movie/Detail/Related"));

const MovieDetailPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);

  const {
    data: movie,
    isPending,
    error,
  } = useQuery({
    queryFn: () =>
      tmdb.movies.details(id, [
        "images",
        "videos",
        "credits",
        "keywords",
        "recommendations",
        "similar",
        "reviews",
        "watch/providers",
      ]),
    queryKey: ["movie-detail", id],
  });

  if (isPending) {
    return <Spinner size="lg" className="absolute-center" variant="simple" />;
  }

  if (error || !movie) notFound();

  if (typeof document !== "undefined" && movie?.title) {
    document.title = `${movie.title} · ${siteConfig.name}`;
  }

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <Suspense fallback={<Spinner size="lg" className="absolute-center" variant="simple" />}>
        {/* Full-bleed Bingr.one Hero Banner with Background Trailer */}
        <div className="-mx-3 -mt-8 sm:-mx-5">
          <DetailHero movie={movie} />
        </div>

        {/* Interior Content Sections */}
        <div className="relative z-20 -mt-6 md:-mt-10 w-full px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 pb-24 space-y-8">
          {/* Cast & Characters Grid (Bingr.one 4-column) */}
          <CastsSection casts={(movie.credits?.cast || []) as Cast[]} />

          {/* Franchise Collection Banner */}
          {movie.belongs_to_collection && (
            <CollectionBanner collection={movie.belongs_to_collection} />
          )}

          {/* Movie Details & Production Facts */}
          <MovieFacts movie={movie} />

          {/* Photos / Stills Gallery */}
          {movie.images?.backdrops && movie.images.backdrops.length > 0 && (
            <PhotosSection images={movie.images.backdrops as Image[]} />
          )}

          {/* Recommendations & Similar Titles Grid */}
          <RelatedSection movie={movie} />
        </div>
      </Suspense>
    </div>
  );
};

export default MovieDetailPage;
