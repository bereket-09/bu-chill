"use client";

import React, { useState, useEffect } from "react";
import { IoDownloadOutline, IoClose, IoShareOutline, IoAddCircleOutline } from "react-icons/io5";
import { siteConfig } from "@/config/site";

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running as standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Check if dismissed recently (within 7 days)
    const dismissedTime = localStorage.getItem("buchill_pwa_dismissed");
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime, 10);
      if (elapsed < 1000 * 60 * 60 * 24 * 7) {
        return;
      }
    }

    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari =
      isAppleDevice &&
      /WebKit/.test(ua) &&
      !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);

    if (isSafari) {
      setIsIOS(true);
      // Delay showing prompt slightly for natural entrance
      const timer = setTimeout(() => setIsVisible(true), 3500);
      return () => clearTimeout(timer);
    }

    // Chrome / Edge / Android install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSModal(false);
    try {
      localStorage.setItem("buchill_pwa_dismissed", Date.now().toString());
    } catch {}
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Install Pill */}
      <div className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-2.5 rounded-full border border-white/20 bg-neutral-900/95 p-1.5 pl-3.5 pr-2 text-white shadow-2xl backdrop-blur-xl transition-all hover:border-white/35">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={handleInstallClick}>
            <div className="flex size-7 items-center justify-center rounded-full bg-primary text-black">
              <IoDownloadOutline className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight text-white">Install {siteConfig.name}</span>
              <span className="text-[10px] text-white/50 leading-tight">Fast, full-screen app</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="ml-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-black transition-all hover:bg-white/90 active:scale-95"
          >
            Install
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            title="Dismiss"
            aria-label="Dismiss"
          >
            <IoClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Instructions Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-neutral-900/95 p-6 shadow-2xl text-white text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-primary mb-3">
              <IoShareOutline className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Install {siteConfig.name} on iPhone</h3>
            <p className="mt-1 text-xs text-white/60">
              Enjoy a clean fullscreen experience with zero browser address bars.
            </p>

            <div className="mt-5 space-y-3 text-left text-xs bg-white/[0.04] p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-primary text-xs">
                  1
                </span>
                <span>
                  Tap the <strong className="text-white">Share</strong> button in Safari toolbar below.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-primary text-xs">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  Scroll down and tap <strong className="text-white">Add to Home Screen</strong> <IoAddCircleOutline className="w-4 h-4 text-primary" />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-primary text-xs">
                  3
                </span>
                <span>
                  Tap <strong className="text-white">Add</strong> in the top-right corner.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="mt-5 w-full rounded-xl bg-white py-3 text-xs font-bold text-black transition-all hover:bg-white/90 active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
