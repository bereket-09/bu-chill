import { siteConfig } from "@/config/site";
import { Metadata, NextPage } from "next/types";
import { Suspense } from "react";
import BingrExplore from "@/components/sections/Search/BingrExplore";

export const metadata: Metadata = {
  title: `Search & Explore | ${siteConfig.name}`,
  description: "Search and explore movies, TV series, and anime with real-time suggestions.",
};

const SearchPage: NextPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <BingrExplore />
    </Suspense>
  );
};

export default SearchPage;
