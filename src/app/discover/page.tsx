import { Metadata, NextPage } from "next/types";
import { siteConfig } from "@/config/site";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const BingrDiscover = dynamic(() => import("@/components/sections/Discover/BingrDiscover"));

export const metadata: Metadata = {
  title: `Discover & Trending | ${siteConfig.name}`,
  description: "Browse trending titles, top rated media, and explore with instant fuzzy search.",
};

const DiscoverPage: NextPage = () => {
  return (
    <div className="w-full min-h-screen px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 py-8">
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <BingrDiscover />
      </Suspense>
    </div>
  );
};

export default DiscoverPage;
