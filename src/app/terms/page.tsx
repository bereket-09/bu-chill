import { siteConfig } from "@/config/site";
import { Metadata } from "next";
import Link from "next/link";
import { FaShieldHalved, FaFileContract } from "react-icons/fa6";
import { IoArrowBack, IoHelpCircleOutline } from "react-icons/io5";

export const metadata: Metadata = {
  title: `Terms of Service | ${siteConfig.name}`,
  description: "Terms of service, user agreements, and usage conditions for Be Chill streaming platform.",
};

export default function TermsPage() {
  return (
    <div className="w-full min-h-screen bg-black text-white md:pl-20 lg:pl-24 px-4 sm:px-8 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Back Link & Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <IoArrowBack className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
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
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
            <FaFileContract className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5">
              Last updated: September 2026 &bull; Effective for all Be Chill visitors and account holders
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-8 space-y-8 text-sm sm:text-base text-white/75 leading-relaxed">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span>1. Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, or using the <strong>Be Chill</strong> streaming platform (the "Service"), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please discontinue your use of the Service immediately.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span>2. Informational & Promotional Indexing</span>
            </h2>
            <p className="mb-3">
              Be Chill acts as an automated search index and media directory. <strong>Be Chill does not host, store, stream, or upload any video files, media files, or copyright-protected content onto its own servers.</strong>
            </p>
            <p>
              All video streams accessible through the platform are delivered by unaffiliated third-party video storage services and automated embed providers across the public Internet. We encourage all users to support content creators, studios, and production houses by purchasing original DVDs, Blu-rays, and authorized digital licenses.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span>3. User Accounts & Multi-Profile Integrity</span>
            </h2>
            <p className="mb-3">
              When creating an account on Be Chill, you agree to provide valid credentials and maintain the confidentiality of your account credentials. You are responsible for all activity conducted through your account and associated streaming profiles.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that engage in malicious activity, abuse our AI recommendation engine, or attempt unauthorized reverse-engineering of our services.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span>4. Third-Party Links & External Embeds</span>
            </h2>
            <p>
              Our platform contains hyperlinks and embedded media players provided by third-party services (such as TMDB, third-party video providers, and DiceBear). We have no control over the content, uptime, advertisements, or privacy practices of any third-party services. We strongly recommend using reputable ad-blocking software when browsing the web.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span>5. Disclaimer of Warranties</span>
            </h2>
            <p>
              The Service is provided on an <em>"AS IS"</em> and <em>"AS AVAILABLE"</em> basis without warranties of any kind, whether express or implied. Be Chill does not guarantee uninterrupted playback, specific server availability, or zero errors in metadata or streaming links.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span>6. Questions & Contact</span>
            </h2>
            <p>
              If you have any questions or feedback regarding our Terms of Service, please visit our{" "}
              <Link href="/support" className="text-primary hover:underline font-semibold">
                Help & Support Center
              </Link>{" "}
              or send us feedback directly.
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-xs text-white/40 pb-8">
          Be Chill &copy; {new Date().getFullYear()} &bull; Dedicated to smooth, modern cinema streaming.
        </div>
      </div>
    </div>
  );
}
