"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import { IoHelpCircleOutline } from "react-icons/io5";
import { Switch } from "@heroui/react";
import { CleanAuthModal } from "@/components/sections/Auth/CleanAuthModal";
import useSupabaseUser from "@/hooks/useSupabaseUser";

export default function AuthPage() {
  const router = useRouter();
  const { data: user, isLoading } = useSupabaseUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAds, setShowAds] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Read ads toggle pref
  useEffect(() => {
    const saved = localStorage.getItem("buchill_show_ads") === "true";
    setShowAds(saved);
  }, []);

  const handleToggleAds = (val: boolean) => {
    setShowAds(val);
    localStorage.setItem("buchill_show_ads", String(val));
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans flex flex-col justify-between overflow-x-hidden select-none">
      {/* Subtle Starfield / Theater Glow Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06)_0%,_rgba(0,0,0,0)_70%)]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-primary/10 rounded-full blur-[140px] -z-10" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <span className="text-3xl drop-shadow-md">🍿</span>
          <span className="text-xl font-extrabold tracking-tight text-white/90 group-hover:text-white">
            Bu<span className="text-primary">•</span>Chill
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all"
          >
            <IoHelpCircleOutline className="w-4 h-4 text-white/70" />
            <span>Help & Support</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2.5">
            <span className="text-xs text-white/50 font-medium">Show Ads</span>
            <Switch
              isSelected={showAds}
              onValueChange={handleToggleAds}
              size="sm"
              color="default"
            />
          </div>
        </div>
      </header>

      {/* Center Landing Graphic & Call To Action */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 text-center max-w-xl mx-auto">
        <div className="relative mb-8 transition-transform duration-500 hover:scale-105">
          <img
            src="/brand/device_login.png"
            alt="Bu-Chill on all devices"
            className="w-[220px] h-[220px] md:w-[270px] md:h-[270px] object-contain select-none pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
          />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
          Log in to Bu-Chill
        </h1>
        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-8 max-w-md">
          Start watching from where you left off, personalise for kids and more
        </p>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-11 px-12 rounded-xl bg-white hover:bg-white/90 text-black font-semibold text-base transition-all shadow-[0_10px_30px_rgba(255,255,255,0.15)] active:scale-[0.98] cursor-pointer"
        >
          Log In
        </button>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 py-6 text-center text-xs text-white/30">
        Bu-Chill &copy; {new Date().getFullYear()} &bull; Free Ultra HD Cinema Streaming
      </footer>

      {/* Interactive 2-Column Auth Modal */}
      <CleanAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultMode="login"
      />
    </div>
  );
}
