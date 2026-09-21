import { siteConfig } from "@/config/site";
import { Metadata } from "next";
import Link from "next/link";
import { FaScaleBalanced, FaEnvelope } from "react-icons/fa6";
import { IoArrowBack, IoAlertCircleOutline } from "react-icons/io5";

export const metadata: Metadata = {
  title: `DMCA & Copyright Notice | ${siteConfig.name}`,
  description: "DMCA copyright compliance, takedown procedure, and infringement reporting for Be Chill.",
};

export default function DmcaPage() {
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
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/support" className="hover:text-white transition-colors">
              Help & Support
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <FaScaleBalanced className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              DMCA & Copyright Policy
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5">
              Digital Millennium Copyright Act Compliance & Takedown Guidelines
            </p>
          </div>
        </div>

        {/* Notice Alert */}
        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
          <IoAlertCircleOutline className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>Notice:</strong> Be Chill operates strictly in compliance with 17 U.S.C. &sect; 512 and the Digital Millennium Copyright Act ("DMCA"). It is our policy to respond to any infringement notices and take appropriate actions under the Digital Millennium Copyright Act and other applicable intellectual property laws.
          </p>
        </div>

        {/* Content Body */}
        <div className="mt-8 space-y-8 text-sm sm:text-base text-white/75 leading-relaxed">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
              1. Non-Hosting Declaration
            </h2>
            <p className="mb-3">
              <strong>Be Chill does not upload, host, maintain, or control any media files or video streams on our servers.</strong> We operate exclusively as a content discovery index and aggregator of publicly available web links.
            </p>
            <p>
              Video content accessible through our platform is hosted on independent third-party video storage platforms that are entirely unaffiliated with Be Chill. When you play a title on our service, the stream is delivered directly from external servers.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
              2. How to Submit a Copyright Infringement Notice
            </h2>
            <p className="mb-4">
              If your copyrighted work has been indexed by our service and you wish for the link or metadata listing to be removed, please submit a written DMCA notification containing the following elements:
            </p>
            <ul className="list-decimal list-inside space-y-2.5 text-white/70">
              <li>
                A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
              </li>
              <li>
                Identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works are covered by a single notification, a representative list of such works.
              </li>
              <li>
                Identification of the material that is claimed to be infringing and that is to be removed or access to which is to be disabled, including the exact URL(s) on Be Chill.
              </li>
              <li>
                Sufficient contact details: your full legal name, company name (if applicable), physical address, telephone number, and email address.
              </li>
              <li>
                A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
              3. Processing Timeframe
            </h2>
            <p>
              Upon receipt of a valid and complete DMCA notification, our team will promptly inspect the report and remove or disable links to the requested content within <strong>24 to 48 business hours</strong>.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <FaEnvelope className="w-4 h-4 text-primary" />
              <span>4. Submitting Your Notice</span>
            </h2>
            <p className="mb-4">
              You can submit your copyright notice directly through our online{" "}
              <Link href="/support" className="text-primary hover:underline font-semibold">
                Help & Support Center
              </Link>{" "}
              by choosing the <strong>"DMCA / Copyright Notice"</strong> category, or by contacting our designated copyright agent:
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm font-mono text-white/90">
              <p>Be Chill DMCA Compliance Department</p>
              <p className="mt-1 text-primary">Email: dmca@be-chill.cinema (or via the Support form)</p>
              <p className="text-white/50 text-xs mt-1 font-sans">Subject line must read: "DMCA Takedown Request - [Content Name]"</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-white/40 pb-8">
          Be Chill &copy; {new Date().getFullYear()} &bull; Dedicated to copyright compliance and transparent streaming.
        </div>
      </div>
    </div>
  );
}
