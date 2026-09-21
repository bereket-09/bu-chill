"use client";

import { tmdb } from "@/api/tmdb";
import { Params } from "@/types";
import { Spinner } from "@heroui/react";
import { useScrollIntoView } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Suspense, use } from "react";
import dynamic from "next/dynamic";
import { NextPage } from "next";
import { siteConfig } from "@/config/site";
const PhotosSection = dynamic(() => import("@/components/ui/other/PhotosSection"));
const TvShowRelatedSection = dynamic(() => import("@/components/sections/TV/Details/Related"));
const TvShowCastsSection = dynamic(() => import("@/components/sections/TV/Details/Casts"));
const TvDetailHero = dynamic(() => import("@/components/sections/TV/Details/TvDetailHero"));
const TvShowsSeasonsSelection = dynamic(() => import("@/components/sections/TV/Details/Seasons"));

const TVShowDetailPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);
  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    duration: 500,
  });

  const {
    data: tv,
    isPending,
    error,
  } = useQuery({
    queryFn: () =>
      tmdb.tvShows.details(id, [
        "images",
        "videos",
        "credits",
        "keywords",
        "recommendations",
        "similar",
        "reviews",
        "watch/providers",
      ]),
    queryKey: ["tv-show-detail", id],
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl">
        <Spinner size="lg" className="absolute-center" color="warning" variant="simple" />
      </div>
    );
  }

  if (error || !tv) notFound();

  if (typeof document !== "undefined" && tv?.name) {
    document.title = `${tv.name} · ${siteConfig.name}`;
  }

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <Suspense
        fallback={
          <Spinner size="lg" className="absolute-center" color="warning" variant="simple" />
        }
      >
        {/* Full-bleed Bingr-style Hero Banner with Background Trailer */}
        <div className="-mx-3 -mt-8 sm:-mx-5">
          <TvDetailHero
            tv={tv}
            onViewEpisodesClick={() => scrollIntoView({ alignment: "start" })}
          />
        </div>

        {/* Interior Content Sections */}
        <div className="relative z-20 -mt-6 md:-mt-10 w-full px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 pb-32 md:pb-24 space-y-10">
          {/* Seasons & Episodes Selector */}
          <TvShowsSeasonsSelection ref={targetRef} id={id} seasons={tv.seasons} />

          {/* Top Cast Grid */}
          <TvShowCastsSection casts={tv.credits?.cast || []} />

          {/* Photos / Stills Gallery */}
          {tv.images?.backdrops && tv.images.backdrops.length > 0 && (
            <PhotosSection images={tv.images.backdrops} type="tv" />
          )}

          {/* Recommendations & Similar */}
          <TvShowRelatedSection tv={tv} />
        </div>
      </Suspense>
    </div>
  );
};

export default TVShowDetailPage;
