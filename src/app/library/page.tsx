import { siteConfig } from "@/config/site";
import { Metadata, NextPage } from "next/types";
import { cache, Suspense } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/server";

const UnauthorizedNotice = dynamic(() => import("@/components/ui/notice/Unauthorized"));
const MySpace = dynamic(() => import("@/components/sections/Library/MySpace"));

export const metadata: Metadata = {
  title: `My Space | Library | ${siteConfig.name}`,
  description: "Your personal streaming sanctuary, watchlist, and continue watching history.",
};

const getUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
});

const LibraryPage: NextPage = async () => {
  const { user, error } = await getUser();

  return (
    <Suspense>
      {error || !user ? (
        <div className="w-full min-h-screen px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 py-8">
          <UnauthorizedNotice
            title="Welcome to My Space"
            description="Create a free account to save your favorite movies and TV shows, resume watching across devices, and unlock AI recommendations."
          />
        </div>
      ) : (
        <MySpace />
      )}
    </Suspense>
  );
};

export default LibraryPage;
