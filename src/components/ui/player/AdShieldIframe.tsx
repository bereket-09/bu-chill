"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/helpers";
import { IoPlayForward, IoRefresh, IoServerOutline, IoPause, IoPlay } from "react-icons/io5";

interface AdShieldIframeProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src: string;
  title?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onLoad?: () => void;
  onError?: () => void;
  onTimeout?: () => void;
  onNextServer?: () => void;
  serverName?: string;
  nextServerName?: string;
  timeoutSeconds?: number;
  allowFullScreen?: boolean;
}

export const AdShieldIframe: React.FC<AdShieldIframeProps> = ({
  src,
  title = "Protected Stream",
  className,
  referrerPolicy = "no-referrer",
  allowFullScreen = true,
  onLoad,
  onError,
  onTimeout,
  onNextServer,
  serverName = "Server",
  nextServerName,
  timeoutSeconds = 25,
  ...rest
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [countdown, setCountdown] = useState(timeoutSeconds);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-dismiss "Server issues? Try next" prompt after iframe loads
  const [showServerIssuePrompt, setShowServerIssuePrompt] = useState(false);
  const [isPromptFading, setIsPromptFading] = useState(false);
  const promptFadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const promptRemoveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Maintain stable refs so parent re-renders never restart the effect
  const isLoadedRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const onNextServerRef = useRef(onNextServer);
  onNextServerRef.current = onNextServer;

  // Toggle pause on the auto-switch timer
  const togglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      return next;
    });
  };

  const handlePromptMouseEnter = () => {
    if (promptFadeTimerRef.current) clearTimeout(promptFadeTimerRef.current);
    if (promptRemoveTimerRef.current) clearTimeout(promptRemoveTimerRef.current);
    setIsPromptFading(false);
  };

  const handlePromptMouseLeave = () => {
    promptFadeTimerRef.current = setTimeout(() => {
      setIsPromptFading(true);
    }, 1200);

    promptRemoveTimerRef.current = setTimeout(() => {
      setShowServerIssuePrompt(false);
    }, 1700);
  };

  // Reset loading & timer ONLY when `src` or `timeoutSeconds` actually changes
  useEffect(() => {
    isLoadedRef.current = false;
    hasTriggeredRef.current = false;
    isPausedRef.current = false;
    setIsLoaded(false);
    setIsPaused(false);
    setCountdown(timeoutSeconds);
    setShowServerIssuePrompt(false);
    setIsPromptFading(false);

    if (promptFadeTimerRef.current) clearTimeout(promptFadeTimerRef.current);
    if (promptRemoveTimerRef.current) clearTimeout(promptRemoveTimerRef.current);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setInterval(() => {
      // If already loaded or paused, skip tick
      if (isLoadedRef.current) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      if (isPausedRef.current) {
        return;
      }

      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          if (!isLoadedRef.current && !hasTriggeredRef.current && !isPausedRef.current) {
            hasTriggeredRef.current = true;
            if (onTimeoutRef.current) {
              onTimeoutRef.current();
            } else if (onNextServerRef.current) {
              onNextServerRef.current();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (promptFadeTimerRef.current) clearTimeout(promptFadeTimerRef.current);
      if (promptRemoveTimerRef.current) clearTimeout(promptRemoveTimerRef.current);
    };
  }, [src, timeoutSeconds]);

  // When iframe fires load event, immediately cancel watchdog timer and schedule prompt auto-dismiss
  const handleIframeLoad = () => {
    isLoadedRef.current = true;
    setIsLoaded(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    onLoadRef.current?.();

    // Show prompt briefly upon iframe load, then automatically fade out and disappear
    setShowServerIssuePrompt(true);
    setIsPromptFading(false);

    if (promptFadeTimerRef.current) clearTimeout(promptFadeTimerRef.current);
    if (promptRemoveTimerRef.current) clearTimeout(promptRemoveTimerRef.current);

    promptFadeTimerRef.current = setTimeout(() => {
      setIsPromptFading(true);
    }, 2500);

    promptRemoveTimerRef.current = setTimeout(() => {
      setShowServerIssuePrompt(false);
    }, 3000);
  };

  // When iframe fires error event, single-fire switch if not loaded yet
  const handleIframeError = () => {
    if (isLoadedRef.current || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (onErrorRef.current) {
      onErrorRef.current();
    } else if (onNextServerRef.current) {
      onNextServerRef.current();
    }
  };

  return (
    <div className={cn("relative w-full h-full bg-black overflow-hidden select-none", className)}>
      {/* Loading & Watchdog Screen (shown until iframe finishes loading) */}
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 p-6 text-center text-white backdrop-blur-md animate-fade-in">
          <div className="relative mb-5 flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <IoServerOutline className="absolute text-xl text-primary" />
          </div>

          <p className="text-base sm:text-lg font-bold text-white tracking-wide">
            Connecting to {serverName}
          </p>

          <p className="mt-1 text-xs sm:text-sm text-white/50 max-w-sm">
            {isPaused
              ? "Auto-switch paused • Waiting for server response..."
              : countdown > 0
              ? `Waiting for stream response... Auto-switching to next server in ${countdown}s`
              : "Server response timed out. Switching to next server..."}
          </p>

          {/* Action buttons during connecting */}
          <div className="mt-5 flex items-center gap-2.5 flex-wrap justify-center">
            {/* Pause/Resume Auto-switch */}
            <button
              type="button"
              onClick={togglePause}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
            >
              {isPaused ? (
                <>
                  <IoPlay className="text-xs" />
                  <span>Resume Timer</span>
                </>
              ) : (
                <>
                  <IoPause className="text-xs" />
                  <span>Pause Timer</span>
                </>
              )}
            </button>

            {/* Quick Manual Skip Button */}
            {onNextServer && (
              <button
                type="button"
                onClick={() => {
                  hasTriggeredRef.current = true;
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                  onNextServer();
                }}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 active:scale-95 shadow-lg"
              >
                <IoPlayForward className="text-xs" />
                <span>{nextServerName ? `Skip to ${nextServerName}` : "Skip to Next Server"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transient Quick "Switch Server" Button (auto-disappears after iframe loads) */}
      {showServerIssuePrompt && onNextServer && (
        <div
          onMouseEnter={handlePromptMouseEnter}
          onMouseLeave={handlePromptMouseLeave}
          className={cn(
            "pointer-events-auto absolute bottom-4 left-4 z-30 transition-all duration-500 ease-out",
            isPromptFading
              ? "opacity-0 translate-y-2 pointer-events-none"
              : "opacity-80 hover:opacity-100 translate-y-0"
          )}
        >
          <button
            type="button"
            onClick={() => {
              setShowServerIssuePrompt(false);
              onNextServer();
            }}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/85 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md hover:bg-black hover:text-white shadow-lg transition-all active:scale-95"
            title="Video not loading inside server? Switch to next server"
          >
            <IoRefresh className="text-xs text-primary" />
            <span>Server issues? Try next</span>
          </button>
        </div>
      )}

      {/* The embed player iframe */}
      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy={referrerPolicy}
        allowFullScreen={allowFullScreen}
        className="w-full h-full border-0 bg-black"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        {...rest}
      />
    </div>
  );
};

export default AdShieldIframe;
