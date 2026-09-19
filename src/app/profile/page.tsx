import { siteConfig } from "@/config/site";
import { Metadata, NextPage } from "next";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const ProfileManager = dynamic(
  () => import("@/components/sections/Profile/ProfileManager")
);

export const metadata: Metadata = {
  title: `Who's Watching | Account Setup | ${siteConfig.name}`,
  description: "Netflix-style profile selector and streaming account setup.",
};

const ProfilePage: NextPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="w-full min-h-screen px-4 sm:px-8 md:pl-24 lg:pl-28 md:pr-10 py-8">
      <ProfileManager />
    </div>
  );
};

export default ProfilePage;
