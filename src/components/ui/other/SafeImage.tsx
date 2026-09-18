"use client";

import React, { useState, useEffect } from "react";
import Image, { type ImageProps, type StaticImageData } from "next/image";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { cn } from "@/utils/helpers";

export interface SafeImageProps extends Omit<ImageProps, "onError" | "src"> {
  src?: string | StaticImageData | { default: StaticImageData } | null;
  fallbackTitle?: string;
  containerClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackTitle,
  className,
  containerClassName,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={cn("relative w-full h-full", containerClassName)}>
        <ImagePlaceholder title={fallbackTitle || (typeof alt === "string" ? alt : "")} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || ""}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};

export default SafeImage;
