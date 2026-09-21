"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import {
  FaPlay,
  FaDiscord,
  FaPaperPlane,
  FaCheck,
  FaShieldHalved,
  FaScaleBalanced,
  FaFileContract,
} from "react-icons/fa6";
import {
  IoHelpCircleOutline,
  IoSearchOutline,
  IoChatbubbleEllipsesOutline,
  IoArrowBack,
  IoMailOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import { SiBuymeacoffee } from "react-icons/si";
import { siteConfig } from "@/config/site";
import useSupabaseUser from "@/hooks/useSupabaseUser";

interface FAQItem {
  id: string;
  category: "streaming" | "account" | "devices" | "general";
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: "servers",
    category: "streaming",
    question: "How do I fix buffering, slow playback, or a video that won't start?",
    answer:
      "If a stream is slow or buffering, click the 'Servers' switcher button located in the top-right corner of the video player. We offer multiple redundant streaming providers (e.g. Vidlink, VidSrc, SuperEmbed, MoviesAPI). Switching to an alternate server almost always provides an instant, fast 1080p/4K stream.",
  },
  {
    id: "subtitles",
    category: "streaming",
    question: "How do I turn on subtitles or change audio language?",
    answer:
      "Inside the video player, click the 'CC' (Closed Captions) icon on the bottom control bar. You can choose from dozens of languages or customize font size, color, and background opacity. If auto-synced subtitles are slightly off, you can adjust the subtitle delay by ±0.5s directly in player settings.",
  },
  {
    id: "ads",
    category: "streaming",
    question: "How do I prevent unwanted popups or ads?",
    answer:
      "Be Chill itself does not serve popup advertisements. However, third-party video storage providers may occasionally attempt to spawn advertising tabs. We have built-in AdShield protection, and we highly recommend pairing your browser with uBlock Origin or using Brave browser for a completely clean, zero-ad cinema experience.",
  },
  {
    id: "continue-watching",
    category: "account",
    question: "How does Continue Watching and Watchlist sync work?",
    answer:
      "When logged in to your free Be Chill account, your playback position is automatically bookmarked every few seconds. When you pause or exit, the movie or series appears in 'Watching' on your Library page and home banner so you can resume on any device right where you stopped.",
  },
  {
    id: "profiles",
    category: "account",
    question: "How do streaming profiles work?",
    answer:
      "Just like Netflix, you can create up to 5 personalized profiles under one account (such as Kids & Anime, Family, or Guest). Each profile maintains its own completely isolated Watchlist, Continue Watching queue, and custom avatar. Click 'Switch Profile' in the top header anytime to change profiles.",
  },
  {
    id: "devices",
    category: "devices",
    question: "Can I watch on my Smart TV, mobile phone, or tablet?",
    answer:
      "Yes! Be Chill is built with a fully responsive progressive web layout. It works smoothly on iOS Safari, Android Chrome, Mac, Windows, and Smart TV browsers. You can also use Google Cast or Apple AirPlay from within the player to cast directly to your big screen TV.",
  },
  {
    id: "cost",
    category: "general",
    question: "Is Be Chill free to use?",
    answer:
      "Yes, Be Chill is 100% free to access. There are no paywalls, premium tiers, or hidden subscription fees. You can optionally create an account to unlock multi-profile sync, personalized watchlists, and resume playback.",
  },
  {
    id: "content-request",
    category: "general",
    question: "How do I request a movie or TV show that isn't listed?",
    answer:
      "Use our Send Us Feedback form below and select 'Movie / TV Show Request', or join our Discord community to submit title requests. Our catalog updates daily with new cinema and television releases.",
  },
];

const FEEDBACK_CATEGORIES = [
  { key: "streaming", label: "Streaming / Playback Issue" },
  { key: "bug", label: "Bug Report" },
  { key: "feature", label: "Feature Request" },
  { key: "content", label: "Movie / TV Show Request" },
  { key: "dmca", label: "DMCA / Copyright Inquiry" },
  { key: "general", label: "General Feedback" },
];

export default function SupportPage() {
  const { data: user } = useSupabaseUser();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Feedback form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState(user?.email || "");
  const [formCategory, setFormCategory] = useState("streaming");
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter FAQs based on search and category
  const filteredFAQs = FAQ_LIST.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim()) {
      addToast({ title: "Please enter your message", color: "warning" });
      return;
    }

    setIsSubmitting(true);
    // Simulate responsive feedback dispatch
    await new Promise((resolve) => setTimeout(resolve, 600));

    setIsSubmitting(false);
    setIsSubmitted(true);
    addToast({
      title: "Feedback Received! 🍿",
      description: "Thank you for helping us improve Be Chill. Our team will review your report.",
      color: "success",
    });

    // Reset form fields
    setFormSubject("");
    setFormMessage("");
  };

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
            <Link href="/about" className="hover:text-white transition-colors">
              About
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
        <div className="text-center py-6 sm:py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-4">
            <IoSparklesOutline className="w-3.5 h-3.5" />
            <span>Be Chill Help Centre & Community</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
            How can we help you?
          </h1>
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed">
            Find immediate answers to playback questions, explore tips for zero-buffer streaming, or reach out to our team.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-xl mx-auto">
            <Input
              size="lg"
              placeholder="Search help topics (e.g. servers, subtitles, buffering)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<IoSearchOutline className="w-5 h-5 text-white/40 ml-1" />}
              isClearable
              onClear={() => setSearchQuery("")}
              classNames={{
                inputWrapper:
                  "bg-white/[0.05] border border-white/15 hover:border-white/30 focus-within:!border-primary/80 rounded-2xl shadow-xl h-14",
                input: "text-sm sm:text-base text-white placeholder:text-white/40",
              }}
            />
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 1: QUICK Q&A (FAQ)                                        */}
        {/* ================================================================= */}
        <section className="mt-8 mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                <IoHelpCircleOutline className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Frequently Asked Questions
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: "all", label: "All Topics" },
                { key: "streaming", label: "Streaming" },
                { key: "account", label: "Account" },
                { key: "devices", label: "Devices" },
                { key: "general", label: "General" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === tab.key
                      ? "bg-white text-black font-bold shadow"
                      : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion List */}
          {filteredFAQs.length > 0 ? (
            <Accordion
              variant="splitted"
              className="px-0 gap-3"
              itemClasses={{
                base: "bg-white/[0.025] hover:bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-1 transition-all",
                title: "text-sm sm:text-base font-semibold text-white/90",
                content: "text-xs sm:text-sm text-white/65 leading-relaxed pb-4 pt-1",
                trigger: "py-3",
              }}
            >
              {filteredFAQs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  aria-label={faq.question}
                  title={faq.question}
                >
                  {faq.answer}
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
              <p className="text-sm text-white/50 mb-2">
                No help topics found matching "{searchQuery}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Reset search filters
              </button>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* SECTION 2: SEND US FEEDBACK FORM                                  */}
        {/* ================================================================= */}
        <section className="mb-16 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <IoChatbubbleEllipsesOutline className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Send Us Feedback
              </h2>
              <p className="text-xs sm:text-sm text-white/50">
                Have a suggestion, bug report, or need help? We read every submission.
              </p>
            </div>
          </div>

          {isSubmitted ? (
            <div className="mt-8 p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center animate-in fade-in duration-300">
              <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <FaCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Feedback Submitted!</h3>
              <p className="text-sm text-white/70 max-w-md mx-auto mb-4">
                Thank you for reaching out. Your feedback helps us make Be Chill faster and better for everyone.
              </p>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onClick={() => setIsSubmitted(false)}
              >
                Send Another Note
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name (Optional)"
                  placeholder="e.g. Alex"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  variant="bordered"
                  size="sm"
                  classNames={{
                    inputWrapper: "border-white/15 bg-white/[0.02]",
                  }}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  variant="bordered"
                  size="sm"
                  classNames={{
                    inputWrapper: "border-white/15 bg-white/[0.02]",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  selectedKeys={[formCategory]}
                  onChange={(e) => setFormCategory(e.target.value || "streaming")}
                  variant="bordered"
                  size="sm"
                  classNames={{
                    trigger: "border-white/15 bg-white/[0.02]",
                  }}
                >
                  {FEEDBACK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.key}>{cat.label}</SelectItem>
                  ))}
                </Select>

                <Input
                  label="Subject"
                  placeholder="e.g. Server 2 issue on Dune Part Two"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  variant="bordered"
                  size="sm"
                  classNames={{
                    inputWrapper: "border-white/15 bg-white/[0.02]",
                  }}
                />
              </div>

              <Textarea
                label="Your Message"
                placeholder="Describe what happened, what you'd love to see improved, or titles you'd like added..."
                minRows={4}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                variant="bordered"
                required
                classNames={{
                  inputWrapper: "border-white/15 bg-white/[0.02]",
                }}
              />

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-white/40">
                  Response time is typically within 24 hours.
                </p>
                <Button
                  type="submit"
                  color="primary"
                  size="md"
                  isLoading={isSubmitting}
                  startContent={!isSubmitting && <FaPaperPlane className="w-3.5 h-3.5" />}
                  className="font-bold px-6 shadow-lg shadow-primary/25"
                >
                  Submit Feedback
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* ================================================================= */}
        {/* SECTION 3: COMMUNITY, DONATE & LEGAL RESOURCE CARDS               */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {/* Buy Me a Coffee / Donate Card */}
          <div className="p-6 rounded-2xl border border-[#FFDD00]/20 bg-gradient-to-b from-[#FFDD00]/[0.06] to-white/[0.02] hover:border-[#FFDD00]/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#FFDD00] font-bold text-sm mb-2">
                <SiBuymeacoffee className="w-5 h-5" />
                <span>Support & Donate</span>
              </div>
              <h3 className="font-bold text-base text-white mb-1">
                Buy Me a Coffee
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Be Chill is 100% free with no subscriptions. If you love streaming here, consider supporting development and server bandwidth.
              </p>
            </div>
            <a
              href={siteConfig.socials.buymeacoffee || "https://www.buymeacoffee.com/bereket.zelalem"}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFDD00] hover:bg-[#ffe338] text-xs font-bold text-black shadow-lg shadow-[#FFDD00]/15 transition-all"
            >
              <SiBuymeacoffee className="w-4 h-4 text-black" />
              <span>Buy Me a Coffee</span>
            </a>
          </div>

          {/* Discord Card */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#5865F2] font-bold text-sm mb-2">
                <FaDiscord className="w-5 h-5" />
                <span>Discord Community</span>
              </div>
              <h3 className="font-bold text-base text-white mb-1">
                Join Our Discord
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Connect with thousands of movie and anime enthusiasts, get instant server uptime alerts, and request new releases in real time.
              </p>
            </div>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-xs font-bold text-white transition-colors"
            >
              <FaDiscord className="w-4 h-4" />
              <span>Join Discord</span>
            </a>
          </div>

          {/* Quick Legal & About Card */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
                <IoMailOutline className="w-5 h-5" />
                <span>Legal & Platform</span>
              </div>
              <h3 className="font-bold text-base text-white mb-1">
                Transparency
              </h3>
              <p className="text-xs text-white/50 leading-relaxed mb-4">
                Explore our legal guidelines, data protection standards, and copyright takedown compliance policies.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/terms"
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <FaFileContract className="w-3.5 h-3.5 text-white/60" />
                <span>Terms</span>
              </Link>
              <Link
                href="/privacy"
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <FaShieldHalved className="w-3.5 h-3.5 text-emerald-400" />
                <span>Privacy</span>
              </Link>
              <Link
                href="/dmca"
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <FaScaleBalanced className="w-3.5 h-3.5 text-amber-400" />
                <span>DMCA</span>
              </Link>
              <Link
                href="/about"
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <FaPlay className="w-3.5 h-3.5 text-primary" />
                <span>About Us</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="text-center text-xs text-white/30 pb-8">
          Be Chill &copy; {new Date().getFullYear()} &bull; Free Ultra HD Cinema Streaming &bull; Help Centre
        </div>
      </div>
    </div>
  );
}
