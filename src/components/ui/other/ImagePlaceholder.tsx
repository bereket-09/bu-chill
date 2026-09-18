"use client";

import React from "react";
import { cn } from "@/utils/helpers";

interface ImagePlaceholderProps {
  title?: string;
  className?: string;
  iconSize?: string;
  showTitle?: boolean;
}

export const SparkLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("fill-white/30 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]", className)}
  >
    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
  </svg>
);

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  title,
  className,
  iconSize = "w-8 h-8 sm:w-10 sm:h-10",
  showTitle = true,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col h-full w-full items-center justify-center bg-gradient-to-br from-[#1b1c24] via-[#121318] to-black p-3 text-center select-none",
        className
      )}
    >
      <SparkLogo className={cn(iconSize, "mb-2 animate-pulse")} />
      {showTitle && title && (
        <span className="text-[11px] sm:text-xs font-semibold text-white/50 line-clamp-2 px-2">
          {title}
        </span>
      )}
    </div>
  );
};

export default ImagePlaceholder;
