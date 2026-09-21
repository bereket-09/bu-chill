import { NextPage } from "next";
import dynamic from "next/dynamic";

const HomeHero = dynamic(() => import("@/components/sections/Home/Hero/Hero"));
const ContinueWatching = dynamic(() => import("@/components/sections/Home/ContinueWatching"));
const HomePageList = dynamic(() => import("@/components/sections/Home/List"));

const HomePage: NextPage = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Full-Bleed Cinematic Hero with Background Trailer */}
      <HomeHero />

      {/* Netflix-Style Overlapping Content Rows */}
      <div className="relative z-20 flex flex-col gap-6 md:gap-10 mt-4 md:-mt-20 px-4 sm:px-8 md:pl-24 md:pr-10 pb-32 md:pb-20">
        <ContinueWatching />
        <HomePageList />
      </div>
    </div>
  );
};

export default HomePage;
