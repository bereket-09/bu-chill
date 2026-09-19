"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import React from "react";
import {
  FaClock,
} from "react-icons/fa6";
import { LuHistory, LuPopcorn, LuSparkles } from "react-icons/lu";
import { RiBookmarkFill } from "react-icons/ri";
import { IoCompassOutline, IoLogInOutline } from "react-icons/io5";

interface UnauthorizedNoticeProps {
  title?: string;
  description?: string;
}

const FEATURES = [
  {
    icon: <RiBookmarkFill className="w-5 h-5 text-amber-400" />,
    bg: "bg-amber-400/10 border-amber-400/20",
    title: "Universal Watchlist",
    description:
      "Save movies, TV shows, and anime in one click. Organize your queue so you never lose track of what to watch next.",
  },
  {
    icon: <FaClock className="w-5 h-5 text-blue-400" />,
    bg: "bg-blue-400/10 border-blue-400/20",
    title: "Cross-Device Resume",
    description:
      "Pick up exactly where you left off on any phone, tablet, or laptop with instant playback timestamp sync.",
  },
  {
    icon: <LuHistory className="w-5 h-5 text-emerald-400" />,
    bg: "bg-emerald-400/10 border-emerald-400/20",
    title: "Watch History & Ratings",
    description:
      "Keep a comprehensive log of completed seasons and movies, rate your favorites, and manage your viewing journey.",
  },
  {
    icon: <LuSparkles className="w-5 h-5 text-purple-400" />,
    bg: "bg-purple-400/10 border-purple-400/20",
    title: "AI Taste Concierge",
    description:
      "Receive hyper-personalized movie and show recommendations tailored to your exact taste by Bu-Chill AI.",
  },
];

const UnauthorizedNotice: React.FC<UnauthorizedNoticeProps> = ({
  title = "Welcome to My Space",
  description = "Sign in to save favorites, sync your watch progress across all devices, and unlock AI recommendations.",
}) => {
  return (
    <div className="relative w-full max-w-5xl mx-auto py-8 sm:py-14 px-4 sm:px-6 flex flex-col items-center text-center overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[350px] sm:w-[500px] h-[300px] bg-primary/15 rounded-full blur-[110px] -z-10" />
      <div className="pointer-events-none absolute top-1/2 -right-20 w-[250px] h-[250px] bg-purple-500/10 rounded-full blur-[90px] -z-10" />

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 border border-primary/25 text-primary-400 mb-6 shadow-sm backdrop-blur-md">
        <LuPopcorn className="w-4 h-4 text-primary" />
        <span>Bu•Chill My Space</span>
      </div>

      {/* Hero Header */}
      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground max-w-2xl leading-tight">
        Your Personal{" "}
        <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Cinema Space
        </span>
      </h1>

      <p className="mt-4 text-base sm:text-lg text-default-500 max-w-xl leading-relaxed">
        {description}
      </p>

      {/* Call to Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
        <Button
          as={Link}
          href="/auth"
          color="primary"
          variant="shadow"
          size="lg"
          className="font-semibold text-sm sm:text-base px-8 h-12 shadow-primary/30"
          startContent={<IoLogInOutline className="w-5 h-5" />}
        >
          Sign In
        </Button>
        <Button
          as={Link}
          href="/auth?form=register"
          variant="bordered"
          size="lg"
          className="font-semibold text-sm sm:text-base px-8 h-12 border-default-300 dark:border-white/20 bg-background/50 backdrop-blur-md hover:bg-default-100 dark:hover:bg-white/10"
        >
          Create Free Account
        </Button>
      </div>

      {/* Feature Grid */}
      <div className="mt-14 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {FEATURES.map((feature, idx) => (
          <div
            key={idx}
            className="flex items-start gap-4 p-5 rounded-2xl border border-default-200/60 dark:border-white/10 bg-default-50/50 dark:bg-white/[0.02] backdrop-blur-md hover:border-primary/40 hover:bg-default-100/50 dark:hover:bg-white/[0.04] transition-all duration-200 group"
          >
            <div
              className={`p-3 rounded-xl border shrink-0 ${feature.bg} transition-transform group-hover:scale-105 duration-200`}
            >
              {feature.icon}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-foreground text-base tracking-tight">
                {feature.title}
              </h2>
              <p className="text-xs sm:text-sm text-default-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Explore Section */}
      <div className="mt-12 pt-8 border-t border-default-200/50 dark:border-white/10 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-default-400">
          <IoCompassOutline className="w-4 h-4 text-primary" />
          <span>Want to explore first without an account?</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Button
            as={Link}
            href="/movies"
            size="sm"
            variant="flat"
            className="text-xs text-default-600 dark:text-default-400 hover:text-foreground"
          >
            Movies
          </Button>
          <Button
            as={Link}
            href="/tv"
            size="sm"
            variant="flat"
            className="text-xs text-default-600 dark:text-default-400 hover:text-foreground"
          >
            TV Series
          </Button>
          <Button
            as={Link}
            href="/sports"
            size="sm"
            variant="flat"
            className="text-xs text-default-600 dark:text-default-400 hover:text-foreground"
          >
            Sports
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedNotice;
