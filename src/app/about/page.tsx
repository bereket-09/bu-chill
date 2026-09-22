import { siteConfig } from "@/config/site";
import { Metadata, NextPage } from "next";
import Link from "next/link";
import {
  FaPlay,
  FaTv,
  FaBolt,
  FaUsers,
  FaShieldHalved,
  FaDisplay,
  FaFilm,
  FaHeart,
  FaCircleCheck,
  FaGlobe,
  FaArrowRight,
} from "react-icons/fa6";
import {
  IoSparklesOutline,
  IoArrowBack,
  IoHelpCircleOutline,
} from "react-icons/io5";
import { LuPopcorn, LuSparkles, LuFlame, LuClapperboard } from "react-icons/lu";
import { SiBuymeacoffee } from "react-icons/si";

export const metadata: Metadata = {
  title: `About Us | ${siteConfig.name}`,
  description: "Learn about Be Chill, our mission, ultra-fast streaming engine, and cinema-grade platform.",
};

const STATS = [
  { value: "100K+", label: "Movies & Episodes", highlight: "Daily Updates" },
  { value: "4K / 1080p", label: "Ultra High Definition", highlight: "Crystal Clear" },
  { value: "5 Servers", label: "Redundant CDN Engines", highlight: "Zero Buffering" },
  { value: "100% Free", label: "No Subscriptions", highlight: "Zero Paywalls" },
];

const PLATFORM_FEATURES = [
  {
    icon: <FaBolt className="w-5 h-5 text-primary" />,
    badge: "Engine",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    title: "Multi-Server Resilient Streaming",
    desc: "Connected to multiple high-performance video CDNs. If a server experiences heavy traffic or latency, switch seamlessly to another provider with zero playback loss.",
  },
  {
    icon: <FaUsers className="w-5 h-5 text-purple-400" />,
    badge: "Multi-Profile",
    badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    title: "Personalized Profile Isolation",
    desc: "Create up to 5 streaming profiles with custom avatars. Each profile maintains its own completely isolated Watchlist, Continue Watching queue, and preferences.",
  },
  {
    icon: <LuSparkles className="w-5 h-5 text-amber-400" />,
    badge: "Watch Party",
    badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    title: "Real-Time Synced Watch Parties",
    desc: "Invite friends worldwide with a simple 6-digit room code. Watch movies and TV shows together with synchronized playback and real-time live party chat.",
  },
  {
    icon: <FaShieldHalved className="w-5 h-5 text-emerald-400" />,
    badge: "Security",
    badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    title: "Intelligent AdShield Protection",
    desc: "Automated browser defenses intercept aggressive popup triggers, malicious redirect loops, and annoying overlays for an undisturbed theatre experience.",
  },
  {
    icon: <FaDisplay className="w-5 h-5 text-cyan-400" />,
    badge: "Cross-Device",
    badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    title: "Universal Screen Freedom",
    desc: "Engineered for smartphones, tablets, laptops, and Smart TVs. Includes native AirPlay and Google Cast support to throw your stream to big screens effortlessly.",
  },
  {
    icon: <FaGlobe className="w-5 h-5 text-rose-400" />,
    badge: "Live Broadcast",
    badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    title: "Global Live Sports & TV",
    desc: "Instant live access to football leagues worldwide (English Premier League, La Liga, Serie A, Champions League) and global entertainment channels 24/7.",
  },
];

const TRADITIONAL_VS_BUCHILL = [
  {
    issue: "Dozens of fragmented subscriptions costing $100+/mo",
    solution: "One unified, completely free sanctuary for all entertainment",
  },
  {
    issue: "Titles disappear abruptly due to licensing disputes",
    solution: "Persistent global catalog tracking cinema releases & classics",
  },
  {
    issue: "Clunky apps filled with unskippable ads and bloatware",
    solution: "Blazing fast UI powered by Next.js, TMDB, and clean dark mode",
  },
  {
    issue: "Inflexible servers that stutter and buffer during peak hours",
    solution: "Instant multi-server failover with automated stream repair",
  },
];

const AboutPage: NextPage = () => {
  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans overflow-x-hidden select-none pb-28">
      {/* Top Starfield & Ambient Glow Background */}
      <div className="absolute top-0 left-0 right-0 h-[650px] pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-black/95 to-black" />
        <div className="absolute top-[-10%] left-[20%] size-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-[10%] right-[15%] size-[400px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />
        <svg
          className="absolute w-full h-full opacity-25 mix-blend-screen"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="about-stars" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle fill="#ffffff" cx="15" cy="15" r="1" opacity="0.9" />
              <circle fill="#ffffff" cx="60" cy="35" r="0.8" opacity="0.5" />
              <circle fill="#ffffff" cx="100" cy="80" r="1.5" opacity="0.3" />
              <circle fill="#ffffff" cx="30" cy="100" r="1" opacity="0.7" />
              <circle fill="#ffffff" cx="110" cy="20" r="0.8" opacity="0.6" />
              <circle fill="#ffffff" cx="50" cy="75" r="0.6" opacity="0.8" />
              <circle fill="#ffffff" cx="8" cy="65" r="1.2" opacity="0.4" />
              <circle fill="#ffffff" cx="85" cy="55" r="0.8" opacity="0.9" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#about-stars)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black" />
      </div>

      <div className="relative z-10 w-full pt-8 md:pt-12 px-4 sm:px-8 md:pl-28 md:pr-12 max-w-6xl mx-auto">
        {/* ================================================================= */}
        {/* TOP BAR / BREADCRUMB                                              */}
        {/* ================================================================= */}
        <header className="flex items-center justify-between mb-12 pb-5 border-b border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors cursor-pointer group"
          >
            <IoArrowBack className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Cinema</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5 text-xs font-semibold text-white/50">
            <Link href="/movies" className="hover:text-white transition-colors">
              Movies
            </Link>
            <span>•</span>
            <Link href="/tv" className="hover:text-white transition-colors">
              TV Shows
            </Link>
            <span>•</span>
            <Link href="/watch-party" className="hover:text-white transition-colors">
              Watch Party
            </Link>
            <span>•</span>
            <Link href="/support" className="text-primary hover:underline transition-colors">
              Help & FAQ
            </Link>
          </div>
        </header>

        {/* ================================================================= */}
        {/* HERO SECTION                                                      */}
        {/* ================================================================= */}
        <section className="text-center py-6 sm:py-12 relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-white/80 text-xs font-bold tracking-wider uppercase mb-6 shadow-inner">
            <LuPopcorn className="w-3.5 h-3.5 text-amber-400" />
            <span>The Modern Streaming Sanctuary</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
            Cinema Streaming, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-300 to-amber-300">
              Effortless & Free.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/65 max-w-2xl mx-auto leading-relaxed mb-8">
            <strong>Be•Chill</strong> is built on a single, uncompromising belief: watching movies and television series should be blazing fast, beautifully organized, and open to anyone without monthly paywalls or subscription fatigue.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/movies"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/25 hover:opacity-95 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <FaPlay className="w-3 h-3 ml-0.5" />
              <span>Explore Movies</span>
            </Link>
            <Link
              href="/tv"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <FaTv className="w-3.5 h-3.5 text-amber-400" />
              <span>Browse TV Shows</span>
            </Link>
          </div>
        </section>

        {/* ================================================================= */}
        {/* LIVE METRICS / STATS BAR                                          */}
        {/* ================================================================= */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-12 sm:my-16">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all text-center"
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-white/70 mb-1.5">
                {stat.label}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {stat.highlight}
              </span>
            </div>
          ))}
        </section>

        {/* ================================================================= */}
        {/* PLATFORM ARCHITECTURE & PILLARS                                   */}
        {/* ================================================================= */}
        <section className="my-16 sm:my-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2.5">
              Engineered for Pure Entertainment
            </h2>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
              Every pixel, server proxy, and interface component is optimized for speed, stability, and viewer delight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {PLATFORM_FEATURES.map((feat, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-neutral-900/40 border border-white/10 hover:border-white/25 hover:bg-neutral-900/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="size-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
                      {feat.icon}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${feat.badgeColor}`}
                    >
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* THE MISSION: TRADITIONAL VS BE•CHILL                              */}
        {/* ================================================================= */}
        <section className="my-16 sm:my-20 p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.04] via-white/[0.02] to-transparent border border-white/10">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
              Why We Built This
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              Rethinking How the World Watches Movies
            </h2>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              We were exhausted by subscription bloat, disappearing titles, and intrusive ads on the open web. Be•Chill was created to solve these exact frustrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRADITIONAL_VS_BUCHILL.map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-white/40 line-through">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>{item.issue}</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-white/95 font-medium">
                  <FaCircleCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item.solution}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <IoHelpCircleOutline className="w-4 h-4 text-primary" />
              <span>Need help or want to suggest a new feature or film?</span>
            </div>
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Visit Support Center</span>
              <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SUPPORT / BUY ME A COFFEE (SUBTLE & HIGH-GRADE)                   */}
        {/* ================================================================= */}
        <section className="my-16 rounded-3xl border border-amber-400/25 bg-gradient-to-r from-amber-500/[0.08] via-neutral-900/60 to-black/80 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3">
              <SiBuymeacoffee className="w-3.5 h-3.5 text-amber-300" />
              <span>Support Independent Developers</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Love Streaming on Be•Chill?
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Be•Chill is independently developed and maintained completely free without forced paywalls. If you enjoy bingeing here, consider buying a coffee to support streaming server bandwidth and continuous development!
            </p>
          </div>

          <a
            href={siteConfig.socials.buymeacoffee || "https://www.buymeacoffee.com/bereket.zelalem"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <SiBuymeacoffee className="w-4 h-4 text-black" />
            <span>Buy Me a Coffee</span>
          </a>
        </section>

        {/* ================================================================= */}
        {/* BOTTOM CTA: READY TO STREAM?                                      */}
        {/* ================================================================= */}
        <section className="my-12 text-center py-12 px-6 rounded-3xl bg-neutral-900/30 border border-white/10">
          <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mx-auto mb-4">
            🎬
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Your Movie Night Starts Right Now
          </h2>
          <p className="text-xs sm:text-sm text-white/50 max-w-md mx-auto mb-6">
            Dive into thousands of cinema titles, trending series, and sports streams completely free.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/movies"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/20 transition cursor-pointer"
            >
              <FaPlay className="w-2.5 h-2.5" />
              <span>Start Watching Movies</span>
            </Link>
            <Link
              href="/watch-party"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm transition cursor-pointer"
            >
              <FaUsers className="w-3.5 h-3.5" />
              <span>Host a Watch Party</span>
            </Link>
          </div>
        </section>

        {/* ================================================================= */}
        {/* LEGAL & COPYRIGHT FOOTER                                          */}
        {/* ================================================================= */}
        <footer className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>
            Be•Chill &copy; {new Date().getFullYear()} &bull; Cinema-Grade Entertainment &bull; Made with <FaHeart className="inline-block w-3 h-3 text-red-500 mx-0.5" /> for film lovers
          </p>

          <div className="flex items-center gap-4">
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
            <span>•</span>
            <Link href="/support" className="hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AboutPage;
