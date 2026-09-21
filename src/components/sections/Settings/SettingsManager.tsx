"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import {
  FaLaptop,
  FaMobileScreenButton,
  FaTabletScreenButton,
  FaChevronRight,
  FaChevronLeft,
  FaCheck,
  FaCopy,
  FaDiscord,
} from "react-icons/fa6";
import { IoPersonOutline, IoHelpCircleOutline } from "react-icons/io5";
import { LuTerminal } from "react-icons/lu";
import { addToast, Spinner } from "@heroui/react";
import { signOut } from "@/actions/auth";
import useSupabaseUser from "@/hooks/useSupabaseUser";

function detectDevice(): string {
  if (typeof navigator === "undefined") return "This browser";
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "Device";
  if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return `${browser} on ${os}`;
}

const API_PRESETS = [
  {
    key: "movie",
    label: "Movie",
    title: "Swapped",
    url: "https://bingr.one/watch/movie/1007757",
  },
  {
    key: "tv",
    label: "Series",
    title: "The Boys",
    url: "https://bingr.one/watch/tv/76479/1/1",
  },
  {
    key: "anime",
    label: "Anime",
    title: "Death Note",
    url: "https://bingr.one/watch/anime/1535/1",
  },
];

const SettingsManager: React.FC = () => {
  const router = useRouter();
  const { data: user, isLoading } = useSupabaseUser();

  const [activeTab, setActiveTab] = useState<"account" | "api" | "help">("account");
  const [mobileView, setMobileView] = useState<"menu" | "content">("menu");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [deviceName, setDeviceName] = useState("Chrome on macOS");

  // Other devices state (simulated session list)
  const [otherDevices, setOtherDevices] = useState([
    {
      id: "dev_2",
      name: "Chrome on macOS",
      lastUsed: "3 days ago",
    },
  ]);

  // API tab state
  const [selectedApiPreset, setSelectedApiPreset] = useState("movie");
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setDeviceName(detectDevice());
  }, []);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const { success, message } = await signOut();
    if (success) {
      addToast({ title: "Signed out successfully", color: "primary" });
      router.push("/auth");
    } else {
      addToast({ title: "Failed to sign out", description: message, color: "danger" });
      setIsLoggingOut(false);
    }
  };

  const handleRevokeDevice = (deviceId: string) => {
    setOtherDevices((prev) => prev.filter((d) => d.id !== deviceId));
    addToast({
      title: "Session Revoked",
      description: "Device has been signed out of your Bu-Chill account.",
      color: "primary",
    });
  };

  const currentPreset = API_PRESETS.find((p) => p.key === selectedApiPreset) || API_PRESETS[0];
  const iframeSnippet = `<iframe src="${currentPreset.url}"\n        width="100%" height="100%"\n        frameborder="0"\n        allow="autoplay; fullscreen; picture-in-picture"\n        allowfullscreen></iframe>`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(iframeSnippet);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
      addToast({ title: "Code copied to clipboard!", color: "success" });
    } catch (e) {
      addToast({ title: "Failed to copy code", color: "danger" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70dvh] items-center justify-center">
        <Spinner size="lg" color="primary" label="Loading settings..." />
      </div>
    );
  }

  if (!user) {
    router.push("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden pb-32">
      <div className="relative z-10 w-full px-4 md:px-12 lg:px-20 pt-8 lg:pt-14 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row w-full pt-6 lg:min-h-[580px]">
          {/* LEFT NAVIGATION COLUMN */}
          <div
            className={`w-full lg:w-[320px] shrink-0 flex-col pr-0 lg:pr-8 ${
              mobileView === "content" ? "hidden lg:flex" : "flex"
            }`}
          >
            <h1 className="text-2xl font-bold text-white/90 mb-6 pl-1 lg:pl-0 tracking-tight">
              Help & Settings
            </h1>

            <div className="flex flex-col gap-2">
              {/* Tab 1: Account & Devices */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("account");
                  setMobileView("content");
                }}
                className={`group flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  activeTab === "account"
                    ? "border-white/[0.18] bg-white/[0.04]"
                    : "border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <IoPersonOutline className="w-5 h-5 text-white/90" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm sm:text-base text-white/90">
                      Account & Devices
                    </span>
                    <span className="text-xs text-white/50">Manage Account & Devices</span>
                  </div>
                </div>
                <FaChevronRight
                  className={`w-4 h-4 transition-colors ${
                    activeTab === "account" ? "text-white/90" : "text-white/30 group-hover:text-white/60"
                  }`}
                />
              </button>

              {/* Tab 2: Bu-Chill API */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("api");
                  setMobileView("content");
                }}
                className={`group flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  activeTab === "api"
                    ? "border-white/[0.18] bg-white/[0.04]"
                    : "border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <LuTerminal className="w-5 h-5 text-white/90" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm sm:text-base text-white/90">
                      Bu-Chill API
                    </span>
                    <span className="text-xs text-white/50">Developer Access</span>
                  </div>
                </div>
                <FaChevronRight
                  className={`w-4 h-4 transition-colors ${
                    activeTab === "api" ? "text-white/90" : "text-white/30 group-hover:text-white/60"
                  }`}
                />
              </button>

              {/* Tab 3: Help & Support */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("help");
                  setMobileView("content");
                }}
                className={`group flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  activeTab === "help"
                    ? "border-white/[0.18] bg-white/[0.04]"
                    : "border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <IoHelpCircleOutline className="w-5 h-5 text-white/90" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm sm:text-base text-white/90">
                      Help & Support
                    </span>
                    <span className="text-xs text-white/50">Help Centre</span>
                  </div>
                </div>
                <FaChevronRight
                  className={`w-4 h-4 transition-colors ${
                    activeTab === "help" ? "text-white/90" : "text-white/30 group-hover:text-white/60"
                  }`}
                />
              </button>
            </div>

            {/* Logout Button */}
            <div className="mt-12 pl-1 lg:pl-0">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="px-6 py-2.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] transition-colors font-semibold text-sm text-white/90 disabled:opacity-50 cursor-pointer"
              >
                {isLoggingOut ? "Logging out…" : "Log Out"}
              </button>
            </div>
          </div>

          {/* VERTICAL DIVIDER */}
          <div className="hidden lg:block w-[1px] bg-gradient-to-b from-transparent via-white/[0.15] to-transparent mx-6 lg:mx-10 opacity-80 min-h-[550px]" />

          {/* RIGHT CONTENT PANEL */}
          <div
            className={`flex-1 flex-col gap-10 pt-2 lg:pt-0 ${
              mobileView === "menu" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Mobile Back button */}
            <button
              type="button"
              onClick={() => setMobileView("menu")}
              className="lg:hidden flex items-center gap-2 text-white/60 hover:text-white mb-6 -ml-2 cursor-pointer"
            >
              <FaChevronLeft className="w-4 h-4" />
              <span className="font-medium text-sm">Back to Settings</span>
            </button>

            {/* TAB 1: ACCOUNT & DEVICES */}
            {activeTab === "account" && (
              <div className="space-y-10 animate-in fade-in duration-200">
                {/* Donate Row */}
                <div className="flex items-center justify-between pr-0 lg:pr-8">
                  <span className="text-lg font-semibold text-white/90">Donate to Bu-Chill</span>
                  <a
                    href="https://buymeacoffee.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-2.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] transition-colors text-sm font-semibold text-white/90"
                  >
                    Donate
                  </a>
                </div>

                {/* Registered Email */}
                <div className="flex items-center justify-between pr-0 lg:pr-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-white/50">Registered Email</span>
                    <span className="text-base font-semibold text-white/90">{user.email}</span>
                  </div>
                </div>

                {/* This Device */}
                <div className="flex flex-col mt-4">
                  <h3 className="text-lg font-semibold text-white/90 mb-6">This Device</h3>
                  <div className="flex items-center justify-between pr-0 lg:pr-8">
                    <div className="flex items-center gap-5">
                      <FaLaptop className="w-6 h-6 text-white/70" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm sm:text-base text-white/90">
                          {deviceName}
                        </span>
                        <span className="text-xs font-medium text-white/50">Last used : Just now</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="px-6 py-2.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] transition-colors text-sm font-semibold text-white/90 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoggingOut ? "Logging out…" : "Log Out"}
                    </button>
                  </div>
                </div>

                {/* Other Devices */}
                {otherDevices.length > 0 && (
                  <div className="flex flex-col pt-2">
                    <h3 className="text-lg font-semibold text-white/90 mb-6">Other Devices</h3>
                    <div className="flex flex-col gap-6">
                      {otherDevices.map((dev) => (
                        <div key={dev.id} className="flex items-center justify-between pr-0 lg:pr-8">
                          <div className="flex items-center gap-5">
                            <FaLaptop className="w-6 h-6 text-white/70" />
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-sm sm:text-base text-white/90">
                                {dev.name}
                              </span>
                              <span className="text-xs font-medium text-white/50">
                                Last used : {dev.lastUsed}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRevokeDevice(dev.id)}
                            className="px-6 py-2.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] transition-colors text-sm font-semibold text-white/90 cursor-pointer"
                          >
                            Log Out
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: BU-CHILL API */}
            {activeTab === "api" && (
              <div className="flex flex-col pt-2 animate-in fade-in duration-200">
                <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase mb-8">
                  Bu-Chill API
                </h3>

                <div className="flex items-start justify-between gap-6 pr-0 lg:pr-8 mb-8">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-lg font-semibold text-white/90">Embeddable Player</span>
                    <p className="text-sm font-medium text-white/50 leading-relaxed max-w-lg">
                      Drop the Bu-Chill player into your own site with a single{" "}
                      <code className="px-1.5 py-0.5 rounded bg-[#1a1c22] text-white/80 text-xs font-mono">
                        &lt;iframe&gt;
                      </code>
                      . Pick a title below to try it live.
                    </p>
                  </div>
                  <span className="hidden md:inline-flex shrink-0 items-center px-3 py-1 rounded-full bg-[#1a1c22] border border-white/[0.08] text-[11px] font-bold text-primary uppercase tracking-widest">
                    V1 Live
                  </span>
                </div>

                {/* Preset Selector */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mb-6">
                  {API_PRESETS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedApiPreset(p.key)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                        p.key === selectedApiPreset
                          ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_rgba(229,9,20,0.15)]"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                        {p.label}
                      </span>
                      <span className="text-sm font-semibold text-white/90 truncate w-full">
                        {p.title}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Code Snippet */}
                <div className="relative max-w-2xl rounded-xl border border-white/10 bg-[#0d0e12] p-5 font-mono text-xs sm:text-sm text-white/80">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] transition-colors text-xs font-sans text-white/90 cursor-pointer"
                  >
                    {hasCopied ? (
                      <>
                        <FaCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <FaCopy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <pre className="overflow-x-auto pr-24 leading-relaxed">
                    <code>{iframeSnippet}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 3: HELP & SUPPORT */}
            {activeTab === "help" && (
              <div className="flex flex-col pt-2 animate-in fade-in duration-200">
                <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase mb-8">
                  Help & Support
                </h3>

                {/* Discord Community Card */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 border border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors max-w-2xl">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-base font-semibold text-white/90">Join the Community</h4>
                    <p className="text-sm font-medium text-white/50 max-w-md leading-relaxed">
                      Bu-Chill is actively evolving! Join our Discord server to request movies/series,
                      report streaming links, or hang out with fellow movie fans.
                    </p>
                  </div>
                  <a
                    href="https://discord.gg"
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] transition-colors text-sm font-semibold text-white shadow-lg"
                  >
                    <FaDiscord className="w-5 h-5" />
                    <span>Join Discord</span>
                  </a>
                </div>

                {/* Legal Policy Links */}
                <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm font-medium text-white/40 max-w-2xl">
                  <Link href="/about" className="hover:text-white/80 transition-colors underline underline-offset-4">
                    About Bu-Chill
                  </Link>
                  <span className="hidden sm:inline">•</span>
                  <a href="#" className="hover:text-white/80 transition-colors underline underline-offset-4">
                    Terms of Service
                  </a>
                  <span className="hidden sm:inline">•</span>
                  <a href="#" className="hover:text-white/80 transition-colors underline underline-offset-4">
                    Privacy Policy
                  </a>
                  <span className="hidden sm:inline">•</span>
                  <a href="#" className="hover:text-white/80 transition-colors underline underline-offset-4">
                    DMCA Notice
                  </a>
                </div>

                {/* Build Version Tag */}
                <div className="mt-8 flex flex-col items-start gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-white/30">Build</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-mono text-white/60">
                    bu-chill-v1.4.2 (Production)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;