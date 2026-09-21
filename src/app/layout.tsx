import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { Poppins } from "@/utils/fonts";
import "../styles/globals.css";
import "../styles/lightbox.css";
import Providers from "./providers";
import Sidebar from "@/components/ui/layout/Sidebar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { cn } from "@/utils/helpers";
import { IS_PRODUCTION } from "@/utils/constants";
import dynamic from "next/dynamic";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
const Disclaimer = dynamic(() => import("@/components/ui/overlay/Disclaimer"));
const AiConciergeModal = dynamic(() => import("@/components/ui/ai/AiConciergeModal"));

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} - Watch Movies, TV Shows & Live Sports`,
    template: `%s · ${siteConfig.name}`,
  },
  applicationName: siteConfig.name,
  description: siteConfig.description,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  twitter: {
    card: "summary",
    title: {
      default: siteConfig.name,
      template: siteConfig.name,
    },
    description: siteConfig.description,
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: {
      default: siteConfig.name,
      template: siteConfig.name,
    },
    description: siteConfig.description,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0C0F" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body className={cn("bg-background min-h-dvh antialiased select-none", Poppins.className)}>
        <Suspense>
          <NuqsAdapter>
            <Providers>
              {IS_PRODUCTION && <Disclaimer />}
              <Sidebar>
                <main className="w-full min-h-screen">
                  {children}
                </main>
              </Sidebar>
              <AiConciergeModal />
            </Providers>
          </NuqsAdapter>
        </Suspense>
        <SpeedInsights debug={false} />
        <Analytics debug={false} />
      </body>
    </html>
  );
}
