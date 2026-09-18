"use client";

import React from "react";
import Image from "next/image";

interface CollectionBannerProps {
  collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
}

export const CollectionBanner: React.FC<CollectionBannerProps> = ({ collection }) => {
  if (!collection) return null;

  const bgImage = collection.backdrop_path || collection.poster_path
    ? `https://image.tmdb.org/t/p/original${collection.backdrop_path || collection.poster_path}`
    : "/img/mockup.png";

  return (
    <div className="group relative my-8 flex min-h-[220px] w-full flex-col justify-center overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/80 transition-all md:min-h-[260px]">
      <div className="absolute inset-0 h-full w-full">
        <Image
          src={bgImage}
          alt={collection.name}
          fill
          unoptimized
          sizes="100vw"
          className="object-cover object-center opacity-65 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6 md:px-12">
        <span className="mb-2 block text-xs font-bold tracking-widest text-primary uppercase">
          Franchise Collection
        </span>
        <h2 className="mb-2 text-2xl font-black text-white drop-shadow-md md:text-4xl">
          Part of the {collection.name}
        </h2>
        <p className="mb-4 max-w-lg text-sm text-white/70">
          Discover all entries, prequels, and sequels belonging to the {collection.name}.
        </p>
      </div>
    </div>
  );
};

export default CollectionBanner;
