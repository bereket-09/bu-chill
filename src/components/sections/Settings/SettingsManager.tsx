"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import {
  FaLaptop,
  FaChevronRight,
  FaChevronLeft,
  FaCheck,
  FaSliders,
  FaUserShield,
} from "react-icons/fa6";
import { IoPersonOutline, IoHelpCircleOutline, IoKeyOutline } from "react-icons/io5";
import { SiBuymeacoffee } from "react-icons/si";
import { siteConfig } from "@/config/site";
import { addToast, Spinner, Switch, Select, SelectItem } from "@heroui/react";
import { signOut, sendResetPasswordEmail } from "@/actions/auth";
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

const SERVER_OPTIONS = [
  { key: "vidlink", label: "Vidlink (Fastest, High Bitrate)" },
  { key: "vidsrc", label: "VidSrc (Reliable Redundancy)" },
  { key: "superembed", label: "SuperEmbed (Multi-Language)" },
  { key: "moviesapi", label: "MoviesAPI (Fast Fallback)" },
];

const SettingsManager: React.FC = () => {
  const router = useRouter();
  const { data: user, isLoading } = useSupabaseUser();

  const [activeTab, setActiveTab] = useState<"account" | "preferences">("account");
  const [mobileView, setMobileView] = useState<"menu" | "content">("menu");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [deviceName, setDeviceName] = useState("Chrome on macOS");

  // Streaming preferences (stored in localStorage)
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [preferredServer, setPreferredServer] = useState("vidlink");
  const [autoSubtitles, setAutoSubtitles] = useState(false);

  // Other devices state (active sessions)
  const [otherDevices, setOtherDevices] = useState([
    {
      id: "dev_2",
      name: "Safari on iOS",
      lastUsed: "2 days ago",
    },
  ]);

  useEffect(() => {
    setDeviceName(detectDevice());

    // Load preferences
    const savedAutoPlay = localStorage.getItem("buchill_pref_autoplay");
    if (savedAutoPlay !== null) setAutoPlayNext(savedAutoPlay === "true");

    const savedServer = localStorage.getItem("buchill_pref_server");
    if (savedServer) setPreferredServer(savedServer);

    const savedSubtitles = localStorage.getItem("buchill_pref_subtitles");
    if (savedSubtitles !== null) setAutoSubtitles(savedSubtitles === "true");
  }, []);

  const handleToggleAutoPlay = (enabled: boolean) => {
    setAutoPlayNext(enabled);
    localStorage.setItem("buchill_pref_autoplay", String(enabled));
    addToast({ title: enabled ? "Autoplay enabled" : "Autoplay disabled", color: "primary" });
  };

  const handleChangeServer = (server: string) => {
    setPreferredServer(server);
    localStorage.setItem("buchill_pref_server", server);
    addToast({ title: "Preferred streaming server updated", color: "primary" });
  };

  const handleToggleSubtitles = (enabled: boolean) => {
    setAutoSubtitles(enabled);
    localStorage.setItem("buchill_pref_subtitles", String(enabled));
    addToast({ title: enabled ? "Auto-subtitles enabled" : "Auto-subtitles disabled", color: "primary" });
  };

  const handleResetPassword = async () => {
    if (!user?.email || isResettingPassword) return;
    setIsResettingPassword(true);
    const { success, message } = await sendResetPasswordEmail({ email: user.email });
    setIsResettingPassword(false);

    if (success) {
      addToast({
        title: "Password Reset Link Sent",
        description: `Check your inbox at ${user.email} for instructions to reset your password.`,
        color: "success",
      });
    } else {
      addToast({ title: "Failed to send reset link", description: message, color: "danger" });
    }
  };

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
      description: "Device has been signed out of your Be Chill account.",
      color: "primary",
    });
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
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden pb-32 select-none">
      <div className="relative z-10 w-full px-4 md:px-12 lg:px-20 pt-8 lg:pt-14 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row w-full pt-6 lg:min-h-[580px]">
          {/* LEFT NAVIGATION COLUMN */}
          <div
            className={`w-full lg:w-[320px] shrink-0 flex-col pr-0 lg:pr-8 ${
              mobileView === "content" ? "hidden lg:flex" : "flex"
            }`}
          >
            <h1 className="text-2xl font-bold text-white/90 mb-6 pl-1 lg:pl-0 tracking-tight">
              Settings
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
                      Account & Security
                    </span>
                    <span className="text-xs text-white/50">Profile, sessions & devices</span>
                  </div>
                </div>
                <FaChevronRight
                  className={`w-4 h-4 transition-colors ${
                    activeTab === "account" ? "text-white/90" : "text-white/30 group-hover:text-white/60"
                  }`}
                />
              </button>

              {/* Tab 2: Streaming Preferences */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("preferences");
                  setMobileView("content");
                }}
                className={`group flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  activeTab === "preferences"
                    ? "border-white/[0.18] bg-white/[0.04]"
                    : "border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <FaSliders className="w-5 h-5 text-white/90" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm sm:text-base text-white/90">
                      Playback Preferences
                    </span>
                    <span className="text-xs text-white/50">Autoplay, servers & subtitles</span>
                  </div>
                </div>
                <FaChevronRight
                  className={`w-4 h-4 transition-colors ${
                    activeTab === "preferences" ? "text-white/90" : "text-white/30 group-hover:text-white/60"
                  }`}
                />
              </button>

              {/* External Link: Dedicated Help & Support */}
              <Link
                href="/support"
                className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:bg-white/[0.03] transition-all text-left mt-2"
              >
                <div className="flex items-center gap-4">
                  <IoHelpCircleOutline className="w-5 h-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm sm:text-base text-white/90 group-hover:text-white">
                      Help & Support
                    </span>
                    <span className="text-xs text-white/50">FAQs & feedback form</span>
                  </div>
                </div>
                <FaChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60" />
              </Link>

              {/* External Link: Donate / Buy Me a Coffee */}
              <a
                href={siteConfig.socials.buymeacoffee || "https://www.buymeacoffee.com/bereket.zelalem"}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between p-4 rounded-xl border border-[#FFDD00]/15 bg-[#FFDD00]/[0.03] hover:bg-[#FFDD00]/[0.08] transition-all text-left mt-1"
              >
                <div className="flex items-center gap-4">
                  <SiBuymeacoffee className="w-5 h-5 text-[#FFDD00]" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm sm:text-base text-white/90 group-hover:text-white">
                      Buy Me a Coffee
                    </span>
                    <span className="text-xs text-[#FFDD00]/70">Support & donate</span>
                  </div>
                </div>
                <FaChevronRight className="w-4 h-4 text-[#FFDD00]/50 group-hover:text-[#FFDD00]" />
              </a>
            </div>

            {/* Logout Button */}
            <div className="mt-12 pl-1 lg:pl-0">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="px-6 py-2.5 rounded-lg bg-[#1a1c22] hover:bg-red-600/30 hover:text-red-400 border border-white/10 transition-colors font-semibold text-sm text-white/90 disabled:opacity-50 cursor-pointer"
              >
                {isLoggingOut ? "Logging out…" : "Log Out"}
              </button>
            </div>
          </div>

          {/* RIGHT CONTENT COLUMN */}
          <div
            className={`w-full flex-1 flex-col ${
              mobileView === "menu" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Mobile Back to Menu */}
            <button
              type="button"
              onClick={() => setMobileView("menu")}
              className="lg:hidden flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 cursor-pointer"
            >
              <FaChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Settings</span>
            </button>

            {/* TAB 1: ACCOUNT & SECURITY */}
            {activeTab === "account" && (
              <div className="flex flex-col gap-10 animate-in fade-in duration-200">
                {/* Account Details Box */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                      Signed in account
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{user.email}</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Account ID: <code className="font-mono">{user.id.slice(0, 12)}...</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/profile">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 transition-colors"
                      >
                        Switch Profile
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Password & Security */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
                    Password & Security
                  </h3>
                  <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                        <IoKeyOutline className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">Reset Account Password</h4>
                        <p className="text-xs text-white/50 mt-0.5">
                          We'll email a secure password reset link to {user.email}.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {isResettingPassword ? "Sending..." : "Send Reset Link"}
                    </button>
                  </div>
                </div>

                {/* Current Device */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
                    Active Devices
                  </h3>

                  <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 inline-block">
                      Current Session
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <FaLaptop className="w-6 h-6 text-white/70" />
                        <div>
                          <span className="font-semibold text-sm sm:text-base text-white/90 block">
                            {deviceName}
                          </span>
                          <span className="text-xs text-white/50">Last active: Just now</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="px-4 py-2 rounded-xl bg-[#1a1c22] hover:bg-[#252830] transition-colors text-xs font-semibold text-white/90"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>

                  {/* Other Devices */}
                  {otherDevices.length > 0 && (
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 inline-block">
                        Other Authorized Devices
                      </span>
                      <div className="space-y-4">
                        {otherDevices.map((dev) => (
                          <div key={dev.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <FaLaptop className="w-5 h-5 text-white/50" />
                              <div>
                                <span className="font-semibold text-sm text-white/80 block">
                                  {dev.name}
                                </span>
                                <span className="text-xs text-white/40">Last used: {dev.lastUsed}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRevokeDevice(dev.id)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/70 hover:text-white"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: STREAMING PREFERENCES */}
            {activeTab === "preferences" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
                  Streaming & Player Preferences
                </h3>

                {/* Autoplay Switch */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-white">
                      Autoplay Next Episode
                    </h4>
                    <p className="text-xs text-white/50 mt-1 max-w-md">
                      When watching TV series, automatically load the next episode after the current one concludes.
                    </p>
                  </div>
                  <Switch
                    isSelected={autoPlayNext}
                    onValueChange={handleToggleAutoPlay}
                    color="primary"
                    aria-label="Autoplay next episode"
                  />
                </div>

                {/* Default Server Selector */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-white">
                      Default Streaming Server
                    </h4>
                    <p className="text-xs text-white/50 mt-1 max-w-md">
                      Choose which streaming provider loads first when you start playing a title.
                    </p>
                  </div>
                  <div className="w-full sm:w-64">
                    <Select
                      size="sm"
                      selectedKeys={[preferredServer]}
                      onChange={(e) => handleChangeServer(e.target.value || "vidlink")}
                      variant="bordered"
                      aria-label="Default streaming server"
                    >
                      {SERVER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.key}>{opt.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Auto Subtitles Switch */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-white">
                      Auto-Enable English Subtitles
                    </h4>
                    <p className="text-xs text-white/50 mt-1 max-w-md">
                      Automatically load and display English captions whenever available on media start.
                    </p>
                  </div>
                  <Switch
                    isSelected={autoSubtitles}
                    onValueChange={handleToggleSubtitles}
                    color="primary"
                    aria-label="Auto-enable English subtitles"
                  />
                </div>
              </div>
            )}

            {/* Donate / Buy Me a Coffee Banner */}
            <div className="mt-14 p-6 rounded-2xl border border-[#FFDD00]/25 bg-gradient-to-r from-[#FFDD00]/[0.08] via-white/[0.02] to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[#FFDD00]/20 text-[#FFDD00] flex items-center justify-center shrink-0 border border-[#FFDD00]/30">
                  <SiBuymeacoffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Support Independent Streaming</h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    Help keep Be Chill fast, free, and ad-free by buying the creator a coffee.
                  </p>
                </div>
              </div>
              <a
                href={siteConfig.socials.buymeacoffee || "https://www.buymeacoffee.com/bereket.zelalem"}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#FFDD00] hover:bg-[#ffe338] text-black font-bold text-xs shadow-lg shadow-[#FFDD00]/15 transition-all shrink-0 inline-flex items-center gap-2"
              >
                <SiBuymeacoffee className="w-4 h-4 text-black" />
                <span>Buy Me a Coffee</span>
              </a>
            </div>

            {/* Bottom Support Banner */}
            <div className="mt-4 p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-primary/10 via-transparent to-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <IoHelpCircleOutline className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Need help or want to request a title?</h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    Our dedicated Help & Support page has quick FAQs and an interactive feedback form.
                  </p>
                </div>
              </div>
              <Link href="/support">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs shadow-lg shadow-primary/25 shrink-0"
                >
                  Visit Help & Support
                </button>
              </Link>
            </div>

            {/* Legal Links Footer */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-white/40">
              <Link href="/about" className="hover:text-white transition-colors">
                About Be Chill
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/dmca" className="hover:text-white transition-colors">
                DMCA Notice
              </Link>
              <span>•</span>
              <Link href="/support" className="hover:text-white transition-colors">
                Support
              </Link>
              <span>•</span>
              <a
                href={siteConfig.socials.buymeacoffee || "https://www.buymeacoffee.com/bereket.zelalem"}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#FFDD00] transition-colors inline-flex items-center gap-1 text-[#FFDD00]/70"
              >
                <SiBuymeacoffee className="w-3.5 h-3.5" />
                <span>Donate</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;