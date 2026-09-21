import { siteConfig } from "@/config/site";
import { Metadata, NextPage } from "next";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const SettingsManager = dynamic(
  () => import("@/components/sections/Settings/SettingsManager")
);

export const metadata: Metadata = {
  title: `Help & Settings | ${siteConfig.name}`,
  description: "Manage account, devices, API access, and streaming settings.",
};

const SettingsPage: NextPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="w-full min-h-screen md:pl-20 lg:pl-24 bg-black text-white">
      <SettingsManager />
    </div>
  );
};

export default SettingsPage;