import { siteConfig } from "@/config/site";
import { Metadata } from "next";
import Link from "next/link";
import { FaShieldHalved } from "react-icons/fa6";
import { IoArrowBack, IoLockClosedOutline } from "react-icons/io5";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: "Privacy policy and data protection practices for Be Chill streaming platform.",
};

export default function PrivacyPage() {
  return (
    <div className="w-full min-h-screen bg-black text-white md:pl-20 lg:pl-24 px-4 sm:px-8 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Back Link & Navigation */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <IoArrowBack className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/dmca" className="hover:text-white transition-colors">
              DMCA Notice
            </Link>
            <span>•</span>
            <Link href="/support" className="hover:text-white transition-colors">
              Help & Support
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <FaShieldHalved className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5">
              Last updated: September 2026 &bull; Your privacy and data security are our top priorities
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-8 space-y-8 text-sm sm:text-base text-white/75 leading-relaxed">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
              1. Our Privacy Philosophy
            </h2>
            <p>
              At <strong>Be Chill</strong>, we believe in privacy by design. We do not sell your personal data, track your browsing behavior across external websites, or serve invasive tracking advertisements. Our platform is built to provide an uninterrupted, high-performance streaming experience while respecting your autonomy.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
              2. Information We Collect
            </h2>
            <p className="mb-3">We collect only the minimal information required to deliver personalized streaming features:</p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>
                <strong>Account Credentials:</strong> Your email address and encrypted password hash (managed securely via Supabase Auth) when you register an account.
              </li>
              <li>
                <strong>Streaming Profiles & Playback Data:</strong> Custom profile names, avatars, continue watching positions, watch history, and watchlist titles so you can resume playback seamlessly across your devices.
              </li>
              <li>
                <strong>Technical Diagnostics:</strong> Minimal non-identifying telemetry (such as browser user-agent and OS) strictly used to optimize video player rendering and manage your active session count.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
              3. Local Storage & Cookies
            </h2>
            <p className="mb-3">
              We utilize browser LocalStorage and essential session cookies strictly to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Maintain your authenticated login session.</li>
              <li>Persist your multi-profile selection and custom avatars locally.</li>
              <li>Cache temporary playback timestamps to ensure instant resume without lag.</li>
            </ul>
            <p className="mt-3">
              We do not use third-party advertising cookies or tracking pixels.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
              4. Data Protection & Security
            </h2>
            <p>
              All user authentication and database operations are transmitted via secure HTTPS/TLS encryption. Sensitive credentials are never stored in plaintext. You can delete your watchlist, clear your watch history, or log out of all active devices at any time from your account settings.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
              5. Contacting Us
            </h2>
            <p>
              For privacy-related inquiries or data requests, please contact us via our{" "}
              <Link href="/support" className="text-primary hover:underline font-semibold">
                Help & Support Center
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-white/40 pb-8">
          Be Chill &copy; {new Date().getFullYear()} &bull; Built with security and user privacy first.
        </div>
      </div>
    </div>
  );
}
