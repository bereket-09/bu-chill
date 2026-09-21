import { siteConfig } from "@/config/site";
import { Metadata, NextPage } from "next";
import Link from "next/link";
import { Button } from "@heroui/react";
import {
  FaPlay,
  FaTv,
  FaShieldHalved,
  FaUsers,
  FaBolt,
  FaDisplay,
} from "react-icons/fa6";
import {
  IoSparklesOutline,
  IoArrowBack,
  IoHelpCircleOutline,
} from "react-icons/io5";
import { SiBuymeacoffee } from "react-icons/si";

export const metadata: Metadata = {
  title: `About Us | ${siteConfig.name}`,
  description: "Learn about Be Chill, our mission, ultra-fast streaming engine, and cinema-grade platform.",
};

const AboutPage: NextPage = () => {
  return (
    <div className="w-full min-h-screen bg-black text-white md:pl-20 lg:pl-24 px-4 sm:px-8 py-10 select-none">
      <div className="max-w-4xl mx-auto">
        {/* Top Breadcrumb & Home Link */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <IoArrowBack className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <Link href="/support" className="hover:text-white transition-colors">
              Help & Support
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/dmca" className="hover:text-white transition-colors">
              DMCA
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center py-8 sm:py-14 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold tracking-wide mb-6">
            <IoSparklesOutline className="w-4 h-4" />
            <span>The Modern Cinema Sanctuary</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Cinema Streaming, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">
              Reimagined for Everyone.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/65 max-w-2xl mx-auto leading-relaxed">
            <strong>Be Chill</strong> was built with a simple conviction: streaming movies and series should be effortless, fast, beautifully organized, and accessible from any device without paying exorbitant subscription fees.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link href="/movies">
              <Button
                color="primary"
                size="md"
                startContent={<FaPlay className="w-3.5 h-3.5 ml-0.5" />}
                className="font-bold px-6 shadow-xl shadow-primary/25"
              >
                Start Streaming Movies
              </Button>
            </Link>
            <Link href="/tv">
              <Button
                variant="bordered"
                size="md"
                startContent={<FaTv className="w-3.5 h-3.5" />}
                className="font-bold px-6 border-white/20 text-white hover:bg-white/10"
              >
                Browse TV Series
              </Button>
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CORE PLATFORM PILLARS                                             */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-12">
          <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className="size-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-4 border border-primary/30">
              <FaBolt className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ultra-Fast Multi-Server Engine</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              We connect to multiple high-performance streaming CDNs. If a server is under heavy traffic or buffering, switch instantly to another server with zero interruption.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className="size-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/30">
              <FaUsers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Profile Cloud Sync</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Netflix-grade multi-profile system. Create personalized streaming profiles with custom avatars, independent continue watching progress, and private watchlists.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className="size-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
              <FaShieldHalved className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Intelligent AdShield Protection</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Our automated AdShield layer intercepts aggressive popup triggers, malicious redirects, and intrusive overlays so you can enjoy your movies peacefully.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className="size-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
              <FaDisplay className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Universal Device Freedom</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Fully optimized for desktop browsers, smartphones, tablets, and Smart TV screens with native AirPlay and Google Cast integration.
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* OUR STORY & MISSION                                               */}
        {/* ================================================================= */}
        <section className="mb-14 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            Our Mission: Free, Modern Entertainment for All
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-white/70 leading-relaxed">
            <p>
              In today's fragmented media landscape, consumers are expected to juggle dozens of streaming subscriptions totaling hundreds of dollars each month. Movies disappear from catalogs without warning, audio and subtitle synchronization is inconsistent, and apps are often bloated and slow.
            </p>
            <p>
              <strong>Be Chill</strong> brings back the joy of watching movies. A single unified interface, lightning-fast discovery powered by TMDB metadata, AI-driven recommendations, and instant playback across trending cinema releases, beloved classics, anime, and live channels.
            </p>
            <p>
              We believe in an open web where cinema can be appreciated by movie buffs around the globe.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <IoHelpCircleOutline className="w-4 h-4 text-primary" />
              <span>Have questions about streaming or want to contribute?</span>
            </div>
            <Link href="/support">
              <Button size="sm" variant="flat" color="primary">
                Visit Help & Support
              </Button>
            </Link>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SUPPORT BE CHILL / BUY ME A COFFEE                                */}
        {/* ================================================================= */}
        <section className="mb-14 rounded-3xl border border-[#FFDD00]/25 bg-gradient-to-r from-[#FFDD00]/[0.08] via-white/[0.02] to-transparent p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFDD00]/15 border border-[#FFDD00]/30 text-[#FFDD00] text-xs font-bold mb-3">
              <SiBuymeacoffee className="w-3.5 h-3.5" />
              <span>Support Independent Streaming</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Love Be Chill? Buy the Creator a Coffee!
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Be Chill is built and maintained as an open, free platform without ads or forced paywalls. Your donations help fund fast streaming CDN proxies, domain renewals, and continuous new features.
            </p>
          </div>
          <a
            href={siteConfig.socials.buymeacoffee || "https://www.buymeacoffee.com/bereket.zelalem"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#FFDD00] hover:bg-[#ffe338] text-black font-extrabold text-sm shadow-xl shadow-[#FFDD00]/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
          >
            <SiBuymeacoffee className="w-5 h-5 text-black" />
            <span>Buy Me a Coffee</span>
          </a>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-white/30 pb-8">
          Be Chill &copy; {new Date().getFullYear()} &bull; Free Ultra HD Cinema Streaming &bull; Made with 🍿 for movie lovers
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
