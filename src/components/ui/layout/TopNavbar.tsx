"use client";

import BackButton from "@/components/ui/button/BackButton";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { useWindowScroll } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FullscreenToggleButton from "../button/FullscreenToggleButton";
import UserProfileButton from "../button/UserProfileButton";
import SearchInput from "../input/SearchInput";
import ThemeSwitchDropdown from "../input/ThemeSwitchDropdown";
import BrandLogo from "../other/BrandLogo";

const TopNavbar = () => {
  const pathName = usePathname();
  const [{ y }] = useWindowScroll();
  const opacity = Math.min((y / 1000) * 5, 1);
  const hrefs = siteConfig.navItems.map((item) => item.href);
  const show = hrefs.includes(pathName);
  const tv = pathName.includes("/tv/");
  const player = pathName.includes("/player");
  const auth = pathName.includes("/auth");

  if (auth || player) return null;

  const isHome = pathName === "/";
  const isScrolled = y > 50;

  return (
    <Navbar
      disableScrollHandler
      isBlurred={false}
      position="sticky"
      maxWidth="full"
      classNames={{ wrapper: "px-2 md:px-4" }}
      className={cn(
        "inset-0 h-min transition-all duration-300 z-50",
        isHome
          ? isScrolled
            ? "bg-black/75 backdrop-blur-md border-b border-white/10 shadow-lg"
            : "bg-gradient-to-b from-black/90 via-black/40 to-transparent border-transparent"
          : show
          ? "bg-background/90 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      )}
    >
      <NavbarBrand className="gap-4">
        {show ? <BrandLogo /> : <BackButton href={tv ? "/?content=tv" : "/"} />}
        {show && (
          <div className="hidden lg:flex items-center gap-1 ml-2">
            <Link
              href="/"
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                pathName === "/" ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
              )}
            >
              Home
            </Link>
            <Link
              href="/discover"
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                pathName === "/discover" ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
              )}
            >
              Discover
            </Link>
            <Link
              href="/live"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all",
                pathName === "/live"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/40"
                  : "bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-white"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Live TV</span>
            </Link>
          </div>
        )}
      </NavbarBrand>
      {show && !pathName.startsWith("/search") && (
        <NavbarContent className="hidden w-full max-w-lg gap-2 md:flex" justify="center">
          <NavbarItem className="w-full">
            <Link href="/search" className="w-full">
              <SearchInput
                className="pointer-events-none"
                placeholder="Search your favorite movies..."
              />
            </Link>
          </NavbarItem>
        </NavbarContent>
      )}
      <NavbarContent justify="end">
        <NavbarItem className="flex gap-1">
          <ThemeSwitchDropdown />
          <FullscreenToggleButton />
          <UserProfileButton />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default TopNavbar;
