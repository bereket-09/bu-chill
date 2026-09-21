"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  IoHomeOutline,
  IoHome,
  IoSearchOutline,
  IoSearch,
  IoTvOutline,
  IoTv,
  IoMoonOutline,
  IoMoon,
  IoGridOutline,
  IoGrid,
  IoPersonOutline,
  IoPerson,
  IoFootballOutline,
  IoFootball,
} from "react-icons/io5";
import { LuPopcorn } from "react-icons/lu";
import { RiLiveLine, RiLiveFill } from "react-icons/ri";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { env } from "@/utils/env";
import SafeImage from "@/components/ui/other/SafeImage";
import { resolveAvatarUrl } from "@/constants/avatars";

interface NavItem {
  id: "home" | "search" | "tv" | "anime" | "movies" | "sports" | "live" | "categories" | "space";
  label: string;
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  isAvatar?: boolean;
  hasLiveBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: <IoHomeOutline className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    activeIcon: <IoHome className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
  },
  {
    id: "search",
    label: "Search",
    href: "/search",
    icon: <IoSearchOutline className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    activeIcon: <IoSearch className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
  },
  {
    id: "tv",
    label: "TV Series",
    href: "/tv",
    icon: <IoTvOutline className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    activeIcon: <IoTv className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
  },
  {
    id: "anime",
    label: "Anime",
    href: "/anime",
    icon: <IoMoonOutline className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    activeIcon: <IoMoon className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
  },
  {
    id: "movies",
    label: "Movies",
    href: "/movies",
    icon: <LuPopcorn className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    activeIcon: <LuPopcorn className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
  },
  {
    id: "sports",
    label: "Sports",
    href: "/sports",
    icon: <IoFootballOutline className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    activeIcon: <IoFootball className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
  },
  {
    id: "live",
    label: "Live TV",
    href: "/live",
    icon: <RiLiveLine className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    activeIcon: <RiLiveFill className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    hasLiveBadge: true,
  },
  {
    id: "categories",
    label: "Categories",
    href: "/categories",
    icon: <IoGridOutline className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    activeIcon: <IoGrid className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
  },
  {
    id: "space",
    label: "My Space",
    href: "/library",
    icon: <IoPersonOutline className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    activeIcon: <IoPerson className="w-5 h-5 md:w-[22px] md:h-[22px]" />,
    isAvatar: true,
  },
];

const SidebarInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const { data: user } = useSupabaseUser();
  const [isVisibleMobile, setIsVisibleMobile] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [avatarVersion, setAvatarVersion] = useState(0);

  // Update avatar immediately when profile switches
  useEffect(() => {
    const onProfileChange = () => setAvatarVersion((v) => v + 1);
    window.addEventListener("buchill_profile_changed", onProfileChange);
    return () => window.removeEventListener("buchill_profile_changed", onProfileChange);
  }, []);

  // Auto-hide mobile dock on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsVisibleMobile(!(currentY > lastScrollY && currentY > 50));
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Hide sidebar completely on video player pages
  const isPlayer = pathName.includes("/player") || pathName.includes("/watch");
  if (isPlayer) {
    return <>{children}</>;
  }

  const storedAvatar = typeof window !== "undefined" && user?.id
    ? localStorage.getItem(`buchill_avatar_${user.id}`)
    : null;
  const avatarUrl = user ? resolveAvatarUrl(storedAvatar || user?.user_metadata?.avatar) : null;

  // Granular, mutually exclusive active status calculation
  const content = searchParams.get("content");
  const genres = searchParams.get("genres") || searchParams.get("with_genres");

  const isAnimeActive =
    pathName.startsWith("/anime") ||
    (pathName.startsWith("/discover") && Boolean(genres === "16" || genres?.split(",").includes("16")));

  const isTvActive =
    !isAnimeActive &&
    (pathName === "/tv" ||
      pathName.startsWith("/tv/") ||
      (pathName.startsWith("/discover") && content === "tv"));

  const isMovieActive =
    !isAnimeActive &&
    (pathName === "/movies" ||
      pathName.startsWith("/movie/") ||
      (pathName.startsWith("/discover") && (content === "movie" || (!content && !genres))));

  const isItemActive = (id: NavItem["id"]): boolean => {
    switch (id) {
      case "home":
        return pathName === "/";
      case "search":
        return pathName.startsWith("/search");
      case "tv":
        return isTvActive;
      case "anime":
        return isAnimeActive;
      case "movies":
        return isMovieActive;
      case "sports":
        return pathName.startsWith("/sports");
      case "live":
        return pathName.startsWith("/live");
      case "categories":
        return pathName.startsWith("/categories");
      case "space":
        return pathName.startsWith("/profile") || pathName.startsWith("/library");
      default:
        return false;
    }
  };

  return (
    <>
      {/* ================= DESKTOP / TABLET BINGR SIDEBAR ================= */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex flex-col justify-center fixed left-0 top-0 bottom-0 z-50 transition-[width] duration-300 ease-in-out select-none ${isHovered ? "w-[240px]" : "w-[80px]"
          }`}
      >
        {/* Layer 1: Permanent 120px subtle black-to-transparent vignette on left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-[120px] bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none z-[-2]" />

        {/* Layer 2: Expanded 360px-440px soft dark background when hovering */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-[360px] lg:w-[440px] bg-gradient-to-r from-black/95 via-black/75 to-transparent transition-opacity duration-500 pointer-events-none z-[-1] ${isHovered ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Top Brand Logo (Emoji Popcorn + Be Chill) */}
        <div className="absolute top-8 left-0 w-full flex items-center px-6 z-[60]">
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 outline-none focus:outline-none"
            aria-label="Be Chill"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl filter drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]">
              🍿
            </div>
            <span
              className={`font-black tracking-wider text-[17px] text-white whitespace-nowrap transition-all duration-300 ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 pointer-events-none"
                }`}
            >
              BE<span className="text-primary mx-1">•</span>CHILL
            </span>
          </Link>
        </div>

        {/* Navigation List: Vertically Centered */}
        <nav className="flex flex-col py-10 w-full z-10">
          <div className="flex flex-col">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.id);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group relative flex items-center px-7 py-3.5 cursor-pointer transition-colors outline-none focus:outline-none focus-visible:outline-none"
                >
                  {/* Icon */}
                  <span
                    className={`relative flex-shrink-0 flex items-center justify-center transition-all duration-300 rounded-full ${item.isAvatar && avatarUrl
                        ? "w-7 h-7 -ml-0.5 overflow-hidden border border-transparent group-hover:border-white/50"
                        : "w-5 h-5 md:w-[22px] md:h-[22px]"
                      } ${active
                        ? "text-white scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                        : "text-[#8f98a2] group-hover:text-white group-hover:scale-110"
                      }`}
                  >
                    {item.isAvatar && avatarUrl ? (
                      <SafeImage
                        src={avatarUrl}
                        alt="User"
                        width={28}
                        height={28}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : active ? (
                      item.activeIcon
                    ) : (
                      item.icon
                    )}

                    {/* Collapsed tiny red live dot indicator */}
                    {item.hasLiveBadge && !isHovered && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                      </span>
                    )}
                  </span>

                  {/* Text Label + Badges */}
                  <div
                    className={`ml-6 flex items-center flex-1 justify-between transition-all duration-300 ${isHovered
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4 pointer-events-none"
                      }`}
                  >
                    <span
                      className={`text-[16px] tracking-wide whitespace-nowrap ${active
                          ? "font-extrabold text-white"
                          : "font-bold text-[#8f98a2] group-hover:text-white"
                        }`}
                    >
                      {item.label}
                    </span>

                    {item.hasLiveBadge && (
                      <span className="ml-3 text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-red-600/90 text-white tracking-widest animate-pulse shadow-sm shadow-red-500/50">
                        LIVE
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ================= MOBILE FLOATING GLASS DOCK ================= */}
      <div className="md:hidden">
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ease-in-out ${isVisibleMobile
              ? "bottom-4 translate-y-0 opacity-100"
              : "-bottom-24 translate-y-full opacity-0 pointer-events-none"
            }`}
        >
          <div className="mx-auto flex h-14 items-center gap-1.5 rounded-2xl bg-[#0f1014]/90 backdrop-blur-xl border border-white/10 px-3 shadow-2xl shadow-black">
            {NAV_ITEMS.filter((item) =>
              ["home", "search", "tv", "movies", "sports", "live", "space"].includes(item.id)
            ).map((item) => {
              const active = isItemActive(item.id);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${active ? "bg-white/15 text-white scale-105" : "text-[#8f98a2] hover:text-white"
                    }`}
                  aria-label={item.label}
                >
                  {active ? item.activeIcon : item.icon}
                  {item.hasLiveBadge && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content: Full-Bleed without awkward admin offsets */}
      <div className="w-full min-h-screen">
        {children}
      </div>
    </>
  );
};

const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={<div className="w-full min-h-screen">{children}</div>}>
      <SidebarInner>{children}</SidebarInner>
    </Suspense>
  );
};

export default Sidebar;
