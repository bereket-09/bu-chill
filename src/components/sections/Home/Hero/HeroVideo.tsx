"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/utils/helpers";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";

interface HeroVideoProps {
  backdropPath?: string;
  title: string;
  trailerKey?: string | null;
  className?: string;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({
  backdropPath,
  title,
  trailerKey,
  className,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const backdropUrl = backdropPath
    ? `https://image.tmdb.org/t/p/original${backdropPath}`
    : "/img/mockup.png";

  const toggleAudio = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      const command = isMuted ? "unMute" : "mute";
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: command, args: [] }),
        "*"
      );
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-black", className)}>
      {/* High-Resolution Static Backdrop with Ambient Motion */}
      <Image
        src={backdropUrl}
        alt={title}
        fill
        priority
        unoptimized
        sizes="100vw"
        className={cn(
          "object-cover object-center transition-opacity duration-1000",
          isVideoLoaded ? "opacity-0" : "opacity-100 scale-105 animate-pulse-slow"
        )}
      />

      {/* Autoplaying Background Video (Muted by default to permit autoplay) */}
      {trailerKey && (
        <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`}
            allow="autoplay; encrypted-media"
            onLoad={() => setIsVideoLoaded(true)}
            className={cn(
              "absolute top-1/2 left-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 object-cover transition-opacity duration-1000",
              isVideoLoaded ? "opacity-100" : "opacity-0"
            )}
            title={`${title} Trailer`}
          />
        </div>
      )}

      {/* Audio Toggle Button (Bottom-Right) */}
      {trailerKey && isVideoLoaded && (
        <button
          type="button"
          onClick={toggleAudio}
          className="absolute right-6 bottom-28 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95 md:right-12 md:bottom-24"
          aria-label={isMuted ? "Unmute trailer audio" : "Mute trailer audio"}
        >
          {isMuted ? (
            <IoVolumeMute className="text-xl" />
          ) : (
            <IoVolumeHigh className="text-xl text-primary" />
          )}
        </button>
      )}

      {/* Netflix-Style Vignette Gradients */}
      {/* Left to right dark vignette for text readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent w-full md:w-3/4" />
      
      {/* Bottom to top fade that seamlessly melts into content rows */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      {/* Top subtle shadow for transparent navbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent" />
    </div>
  );
};

export default HeroVideo;
