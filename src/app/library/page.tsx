import { siteConfig } from "@/config/site";
import { Metadata, NextPage } from "next/types";
import { cache, Suspense } from "react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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

  if (error || !user) {
    redirect("/auth");
  }

  return (
    <Suspense>
      <MySpace />
    </Suspense>
  );
};

export default LibraryPage;
