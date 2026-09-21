"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import {
  FaLock,
  FaRegEnvelope,
  FaEye,
  FaEyeSlash,
  FaXmark,
  FaGoogle,
  FaUser,
} from "react-icons/fa6";
import { IoHelpCircleOutline } from "react-icons/io5";
import { addToast, Spinner } from "@heroui/react";
import QRCode from "qrcode";
import { signIn, signUp, sendResetPasswordEmail } from "@/actions/auth";
import { createClient } from "@/utils/supabase/client";

interface CleanAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register" | "forgot";
}

export const CleanAuthModal: React.FC<CleanAuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = "login",
}) => {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">(defaultMode);

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
    setMode(defaultMode);
  }, [defaultMode]);

  // Generate QR code SVG
  useEffect(() => {
    if (!isOpen) return;

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
      width: 180,
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error("QR Code error:", err));
  }, [isOpen]);

  // Countdown timer for QR code
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) return 120; // reset
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim() || !password) {
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
          onClose();
          router.push("/");
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
          onClose();
          router.push("/");
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

  const handleOAuth = async (provider: "google") => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[820px] rounded-2xl border border-white/[0.12] bg-[#0c0d12] text-white shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-sans select-none animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          title="Close modal"
        >
          <FaXmark className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 sm:px-10 pt-7 pb-2 text-center">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {mode === "login" && "Welcome back to Be Chill"}
            {mode === "register" && "Create your Be Chill account"}
            {mode === "forgot" && "Reset your password"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-white/55 leading-relaxed">
            {mode === "login" && "Scan QR code or use email to log in"}
            {mode === "register" && "Start streaming thousands of movies & series for free"}
            {mode === "forgot" && "We'll email you a link to set a new password"}
          </p>
        </div>

        {/* Modal Body: Two-Column Split Layout */}
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

              {/* Center brand badge inside QR */}
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
            <Link href="/terms" className="underline hover:text-white/70" onClick={onClose}>
              Terms
            </Link>
            ,{" "}
            <Link href="/privacy" className="underline hover:text-white/70" onClick={onClose}>
              Privacy
            </Link>{" "}
            and{" "}
            <Link href="/dmca" className="underline hover:text-white/70" onClick={onClose}>
              DMCA
            </Link>
            .
          </p>
          <Link
            href="/support"
            onClick={onClose}
            className="flex items-center gap-1 hover:text-white/70 transition-colors"
          >
            <IoHelpCircleOutline className="w-3.5 h-3.5" />
            <span>Get Help</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
