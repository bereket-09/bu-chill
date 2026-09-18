import { FaGithub } from "react-icons/fa6";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { NextPage } from "next";
const FAQ = dynamic(() => import("@/components/sections/About/FAQ"));

export const metadata: Metadata = {
  title: `About | ${siteConfig.name}`,
};

const AboutPage: NextPage = () => {
  return (
    <div className="flex w-full justify-center px-4 md:pl-24 lg:pl-28 md:pr-10 py-12 min-h-screen">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <Suspense>
          <FAQ />
        </Suspense>
        <Link target="_blank" href={siteConfig.socials.github} className="flex justify-center">
          <FaGithub size={30} />
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
