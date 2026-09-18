import { Metadata, NextPage } from "next/types";
import { siteConfig } from "@/config/site";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const SportsWatch = dynamic(() => import("@/components/sections/Sports/SportsWatch"));

export const metadata: Metadata = {
  title: `Watch Live Sports | ${siteConfig.name}`,
  description: "Live sports streaming with direct HLS satellites, multi-server selection, and live match switching.",
};

const SportsWatchPage: NextPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SportsWatch />
    </Suspense>
  );
};

export default SportsWatchPage;
