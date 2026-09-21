"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import { useSearchParams } from "next/navigation";
import {
  FaLock,
  FaRegEnvelope,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaGithub,
  FaUser,
} from "react-icons/fa6";
import { IoHelpCircleOutline } from "react-icons/io5";
import { addToast, Spinner } from "@heroui/react";
import QRCode from "qrcode";
import { signIn, signUp, sendResetPasswordEmail } from "@/actions/auth";
import { createClient } from "@/utils/supabase/client";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import ThreeDMarquee from "@/components/ui/background/ThreeDMarquee";
import { tmdb } from "@/api/tmdb";
import { getImageUrl } from "@/utils/movies";
import { isEmpty, shuffleArray } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading } = useSupabaseUser();

  const initialMode =
    searchParams.get("mode") === "register" || searchParams.get("form") === "register"
      ? "register"
      : searchParams.get("mode") === "forgot" || searchParams.get("form") === "forgot"
      ? "forgot"
      : "login";

  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Code state
  const [qrSvg, setQrSvg] = useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(119); // 1:59

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/profile");
    }
  }, [user, isLoading, router]);

  // Generate QR code SVG
  useEffect(() => {
    const qrData =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth?qr_auth=mobile_quick_sync`
        : "https://bu-chill.vercel.app/auth";

    QRCode.toString(qrData, {
      type: "svg",
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      width: 175,
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error("QR Code error:", err));
  }, []);

  // Countdown timer for QR code
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) return 120;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  // Fetch trending posters for the 3D animated movie marquee background
  const { data: movies } = useQuery({
    queryFn: () => tmdb.trending.trending("movie", "day"),
    queryKey: ["movie-auth-posters"],
    staleTime: 1000 * 60 * 30,
  });

  const { data: tvShows } = useQuery({
    queryFn: () => tmdb.trending.trending("tv", "day"),
    queryKey: ["tv-auth-posters"],
    staleTime: 1000 * 60 * 30,
  });

  const IMAGES = useMemo(() => {
    if (!movies?.results && !tvShows?.results) return [];
    const moviePosters = (movies?.results || [])
      .filter((m) => m.poster_path)
      .map((m) => getImageUrl(m.poster_path, "poster"));
    const tvPosters = (tvShows?.results || [])
      .filter((s) => s.poster_path)
      .map((s) => getImageUrl(s.poster_path, "poster"));
    return shuffleArray([...moviePosters, ...tvPosters]);
  }, [movies?.results, tvShows?.results]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim() || (!password && mode !== "forgot")) {
      addToast({ title: "Please fill in all required fields", color: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const { success, message } = await signIn({
          email: email.trim(),
          loginPassword: password,
        });
        addToast({ title: message, color: success ? "success" : "danger" });
        if (success) {
          router.push("/profile");
          router.refresh();
        }
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          addToast({ title: "Passwords do not match", color: "danger" });
          setIsSubmitting(false);
          return;
        }
        const { success, message } = await signUp({
          username: username.trim() || email.split("@")[0],
          email: email.trim(),
          password,
          confirm: confirmPassword,
        });
        addToast({ title: message, color: success ? "success" : "danger" });
        if (success) {
          router.push("/profile");
          router.refresh();
        }
      } else if (mode === "forgot") {
        const { success, message } = await sendResetPasswordEmail({ email: email.trim() });
        addToast({ title: message, color: success ? "success" : "danger" });
        if (success) setMode("login");
      }
    } catch (err: any) {
      addToast({ title: "An error occurred", description: err?.message, color: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    try {
      const supabase = createClient();
      const redirectUrl =
        typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback` : "";
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl },
      });
    } catch (err: any) {
      addToast({ title: `Failed to connect with ${provider}`, color: "danger" });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white font-sans flex flex-col justify-between overflow-x-hidden select-none">
      {/* 3D Animated Moving Movie Tiles Marquee Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30 dark:opacity-40">
        {!isEmpty(IMAGES) && (
          <ThreeDMarquee className="absolute inset-0 scale-105" images={IMAGES} aspect="poster" />
        )}
      </div>

      {/* Dark Vignette & Gradient Overlays for Ultimate Readability */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/85 via-black/60 to-black/95" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)] backdrop-blur-[1.5px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[380px] bg-primary/15 rounded-full blur-[140px] -z-10" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-end px-6 py-5 md:px-12">
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all"
        >
          <IoHelpCircleOutline className="w-4 h-4 text-white/70" />
          <span>Help & Support</span>
        </Link>
      </header>

      {/* Main Two-Column Auth Box Directly on Screen */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="relative w-full max-w-[820px] rounded-2xl border border-white/[0.12] bg-[#0c0d12]/95 backdrop-blur-xl text-white shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-sans select-none animate-in fade-in zoom-in-95 duration-250">
          {/* Header */}
          <div className="px-6 sm:px-10 pt-7 pb-2 text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {mode === "login" && "Welcome back to Be Chill"}
              {mode === "register" && "Create your Be Chill account"}
              {mode === "forgot" && "Reset your password"}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-white/55 leading-relaxed">
              {mode === "login" && "Scan QR code or use email to log in"}
              {mode === "register" && "Start streaming thousands of movies & series for free"}
              {mode === "forgot" && "We'll email you a link to set a new password"}
            </p>
          </div>

          {/* Two-Column Split Layout */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1.25fr] gap-6 md:gap-8 px-6 sm:px-10 py-6 items-center">
            {/* LEFT COLUMN: QR CODE (Visible on tablet & desktop) */}
            <div className="hidden md:flex flex-col items-center text-center justify-center">
              <div className="relative p-3 bg-white rounded-2xl shadow-xl overflow-hidden flex items-center justify-center">
                {qrSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    className="size-[170px] flex items-center justify-center [&>svg]:size-full"
                  />
                ) : (
                  <div className="size-[170px] flex items-center justify-center bg-gray-100">
                    <Spinner size="sm" color="primary" />
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-bold tracking-tight shadow-md border border-white/20">
                    be-chill
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm font-semibold text-white/90">Use Camera App to Scan QR</p>
              <p className="mt-1 text-xs text-white/50 leading-relaxed max-w-[210px]">
                Click on the link generated to redirect to the Be Chill mobile app
              </p>

              <div className="mt-4 inline-flex items-center px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-white/70">
                Code expires in {formattedTime}
              </div>
            </div>

            {/* VERTICAL DIVIDER */}
            <div className="hidden md:flex items-center justify-center h-full">
              <div className="relative flex flex-col items-center h-full py-4">
                <div className="w-px flex-1 bg-gradient-to-b from-transparent via-white/15 to-white/15" />
                <span className="my-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  or
                </span>
                <div className="w-px flex-1 bg-gradient-to-b from-white/15 via-white/15 to-transparent" />
              </div>
            </div>

            {/* RIGHT COLUMN: FORMS & SOCIAL LOGIN */}
            <div className="flex flex-col gap-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                {/* Username Input (in Register mode) */}
                {mode === "register" && (
                  <div className="relative flex items-center">
                    <FaUser className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full h-11 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 pl-10 text-sm text-white placeholder-white/35 outline-none transition-all focus:border-white/40 focus:bg-white/[0.06]"
                    />
                  </div>
                )}

                {/* Email Input */}
                <div className="relative flex items-center">
                  <FaRegEnvelope className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 pl-10 text-sm text-white placeholder-white/35 outline-none transition-all focus:border-white/40 focus:bg-white/[0.06]"
                  />
                </div>

                {/* Password Input (Hidden in Forgot mode) */}
                {mode !== "forgot" && (
                  <div className="relative flex items-center">
                    <FaLock className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-11 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 pl-10 pr-10 text-sm text-white placeholder-white/35 outline-none transition-all focus:border-white/40 focus:bg-white/[0.06]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* Confirm Password (in Register mode) */}
                {mode === "register" && (
                  <div className="relative flex items-center">
                    <FaLock className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full h-11 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 pl-10 text-sm text-white placeholder-white/35 outline-none transition-all focus:border-white/40 focus:bg-white/[0.06]"
                    />
                  </div>
                )}

                {/* Forgot Password Link (in Login mode) */}
                {mode === "login" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-white hover:bg-white/90 text-black font-semibold text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer mt-1"
                >
                  {isSubmitting ? (
                    <Spinner size="sm" color="default" />
                  ) : mode === "login" ? (
                    "Sign in"
                  ) : mode === "register" ? (
                    "Create Account"
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              {/* OAuth Buttons (in Login & Register modes) */}
              {mode !== "forgot" && (
                <>
                  <div className="relative flex items-center my-1">
                    <div className="flex-1 h-px bg-white/[0.08]" />
                    <span className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                      or continue with
                    </span>
                    <div className="flex-1 h-px bg-white/[0.08]" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleOAuth("google")}
                      className="flex items-center justify-center gap-3 h-10 sm:h-11 rounded-lg border border-white/[0.1] bg-white/[0.025] hover:bg-white/[0.06] text-xs sm:text-sm font-medium text-white/90 transition-all cursor-pointer"
                    >
                      <FaGoogle className="w-4 h-4 text-red-400" />
                      <span>Continue with Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOAuth("github")}
                      className="flex items-center justify-center gap-3 h-10 sm:h-11 rounded-lg border border-white/[0.1] bg-white/[0.025] hover:bg-white/[0.06] text-xs sm:text-sm font-medium text-white/90 transition-all cursor-pointer"
                    >
                      <FaGithub className="w-4 h-4" />
                      <span>Continue with GitHub</span>
                    </button>
                  </div>
                </>
              )}

              {/* Mode Switcher Link */}
              <div className="text-center pt-2 text-xs text-white/50">
                {mode === "login" && (
                  <>
                    New to Be Chill?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-white font-semibold hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </>
                )}
                {mode === "register" && (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-white font-semibold hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </>
                )}
                {mode === "forgot" && (
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-white font-semibold hover:underline cursor-pointer"
                  >
                    Back to sign in
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Bar */}
          <div className="border-t border-white/[0.08] px-6 sm:px-10 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 gap-2 bg-black/30">
            <p>
              By continuing you agree to our{" "}
              <a href="#" className="underline hover:text-white/70">
                Terms
              </a>
              ,{" "}
              <a href="#" className="underline hover:text-white/70">
                Privacy
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-white/70">
                DMCA
              </a>
              .
            </p>
            <Link
              href="/settings"
              className="flex items-center gap-1 hover:text-white/70 transition-colors"
            >
              <IoHelpCircleOutline className="w-3.5 h-3.5" />
              <span>Get Help</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-white/30">
        Be Chill &copy; {new Date().getFullYear()} &bull; Free Ultra HD Cinema Streaming
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-black">
          <Spinner size="lg" color="primary" label="Loading sign in..." />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
