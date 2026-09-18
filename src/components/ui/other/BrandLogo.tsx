"use client";

import Link from "next/link";
import { Saira } from "@/utils/fonts";
import { cn } from "@/utils/helpers";

export interface BrandLogoProps {
  animate?: boolean;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ animate = false, className }) => {
  return (
    <Link href="/" className="group flex items-center gap-2 select-none">
      <span className="text-2xl md:text-3xl filter drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] group-hover:scale-110 transition-transform">
        🍿
      </span>
      <span
        className={cn(
          "flex items-center text-2xl font-black md:text-3xl tracking-tight transition-all",
          Saira.className,
          className,
        )}
      >
        <span className="bg-gradient-to-r from-red-500 via-rose-500 to-primary bg-clip-text text-transparent group-hover:drop-shadow-[0_0_15px_rgba(244,63,94,0.6)] transition-all">
          Bu
        </span>
        <span className="mx-1 text-sm text-white/40 group-hover:text-primary transition-colors font-light">
          •
        </span>
        <span className="text-white font-extrabold tracking-wider group-hover:text-white/95">
          CHILL
        </span>
      </span>
    </Link>
  );
};

export default BrandLogo;
