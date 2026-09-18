import withPWAInit from "@ducanh2912/next-pwa";
import { NextConfig } from "next/dist/server/config";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // https://github.com/payloadcms/payload/issues/12550#issuecomment-2939070941
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "http",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "wallpapercave.com",
      },
      {
        protocol: "https",
        hostname: "dancyflix.com",
      },
      {
        protocol: "https",
        hostname: "static.ppvservices.st",
      },
      {
        protocol: "https",
        hostname: "api.bingr.one",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["@heroui/react"],
    prefetchInlining: true,
  },
};

const pwa = withPWA(nextConfig);

export default pwa;
