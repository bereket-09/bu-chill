import { Metadata, NextPage } from "next/types";
import { siteConfig } from "@/config/site";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const SportsHub = dynamic(() => import("@/components/sections/Sports/SportsHub"));

export const metadata: Metadata = {
  title: `Live Sports Arena | ${siteConfig.name}`,
  description: "Watch live Premier League, Champions League, NBA, UFC, Formula 1, and global sports.",
};

const SportsPage: NextPage = () => {
  return (
    <div className="w-full min-h-screen px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 py-8">
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <SportsHub />
      </Suspense>
    </div>
  );
};

export default SportsPage;
