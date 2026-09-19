"use client";

import React, { useRef } from "react";
import { cn } from "@/utils/helpers";

interface AdShieldIframeProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src: string;
  title?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onLoad?: () => void;
  allowFullScreen?: boolean;
}

export const AdShieldIframe: React.FC<AdShieldIframeProps> = ({
  src,
  title = "Protected Stream",
  className,
  referrerPolicy = "no-referrer",
  allowFullScreen = true,
  onLoad,
  ...rest
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className={cn("relative w-full h-full bg-black overflow-hidden select-none", className)}>
      {/* The embed player */}
      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy={referrerPolicy}
        allowFullScreen={allowFullScreen}
        className="w-full h-full border-0 bg-black"
        onLoad={onLoad}
        {...rest}
      />
    </div>
  );
};

export default AdShieldIframe;
