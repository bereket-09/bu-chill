"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/helpers";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import SafeImage from "@/components/ui/other/SafeImage";
import {
  IoSparkles,
  IoClose,
  IoSend,
  IoPlay,
  IoStar,
  IoRefreshOutline,
  IoPersonCircleOutline,
} from "react-icons/io5";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: RecommendationItem[];
}

interface RecommendationItem {
  id: number;
  title: string;
  media_type: "movie" | "tv";
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  year?: number | null;
  overview?: string;
  reason?: string;
}

const QUICK_PROMPTS = [
  "🍿 Popular picks tonight",
  "🌌 Mind-bending sci-fi",
  "🍕 Feel-good comedy",
  "🔪 Gripping thriller",
  "⚡ Adrenaline action",
  "❤️ Heartfelt romance",
];

export const AiConciergeModal: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: user } = useSupabaseUser();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! 🍿 I'm your **Bu-Chill AI Concierge**. Tell me what mood, vibe, or genre you're feeling, and I'll curate the perfect movies or shows for you.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Hide AI floating assistant completely on all player and video watch pages
  const isVideoPage =
    pathname?.includes("/player") ||
    pathname?.startsWith("/sports/watch") ||
    pathname?.startsWith("/live");

  if (isVideoPage) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.message || "Something went wrong. Please try again in a moment.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.message,
            recommendations: data.recommendations,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Failed to connect to Bu-Chill AI. Please check your network connection.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right, sleek circular icon, comfortably positioned above the mobile dock) */}
      <div className="fixed bottom-22 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "group relative flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 shadow-2xl cursor-pointer select-none",
            isOpen
              ? "bg-amber-500 text-black border-amber-400 scale-95 shadow-amber-500/40"
              : "bg-[#11121a]/95 hover:bg-[#181a24] text-white border-white/20 hover:border-amber-400/60 backdrop-blur-xl hover:scale-110 shadow-black/80"
          )}
          title="Bu-Chill AI Concierge"
          aria-label="Toggle Bu-Chill AI Concierge"
        >
          <div className="relative flex items-center justify-center">
            <IoSparkles
              className={cn(
                "w-5 h-5 transition-transform duration-300",
                isOpen ? "text-black rotate-45" : "text-amber-400 group-hover:rotate-12 animate-pulse"
              )}
            />
            {!isOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
        </button>
      </div>

      {/* Floating Assistant Window - Spacious & Tall */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-end justify-end sm:p-6 bg-black/60 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full sm:w-[460px] h-[92dvh] max-h-[95dvh] sm:h-[720px] sm:max-h-[calc(100vh-48px)] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#0c0d14]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.08)] overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-amber-500/10 via-amber-400 to-amber-500/10 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#12131b]/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm">
                  <IoSparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white tracking-wide">
                      Bu-Chill AI
                    </span>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50">
                    Curated movie & TV picks
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setMessages([
                        {
                          id: Date.now().toString(),
                          role: "assistant",
                          content:
                            "Fresh canvas! 🍿 Tell me another mood or vibe you want to explore.",
                        },
                      ])
                    }
                    className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Clear chat"
                  >
                    <IoRefreshOutline className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <IoClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Personalized Grounding Sub-banner */}
            <div className="px-4 py-1.5 bg-black/30 border-b border-white/5 text-[11px] text-white/60 flex items-center justify-between">
              {user ? (
                <div className="flex items-center gap-1.5 text-amber-300/90 font-medium">
                  <IoSparkles className="w-3 h-3 text-amber-400" />
                  <span>Personalized with your watch history</span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-white/50 truncate">
                    💡 Sign in for watch-history picks
                  </span>
                  <Link
                    href="/auth"
                    onClick={() => setIsOpen(false)}
                    className="text-amber-400 hover:text-amber-300 font-bold ml-2 underline underline-offset-2 shrink-0 flex items-center gap-1"
                  >
                    <IoPersonCircleOutline className="w-3.5 h-3.5" />
                    Sign in
                  </Link>
                </div>
              )}
            </div>

            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col",
                    msg.role === "user"
                      ? "ml-auto items-end max-w-[85%]"
                      : "mr-auto items-start max-w-[94%]"
                  )}
                >
                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-tr-xs shadow-md"
                        : "bg-white/[0.06] text-white/90 border border-white/10 rounded-tl-xs shadow-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Horizontal Compact Recommendation Cards */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 w-full">
                      {msg.recommendations.map((rec) => {
                        const posterUrl = rec.poster_path
                          ? `https://image.tmdb.org/t/p/w200${rec.poster_path}`
                          : undefined;

                        const playHref =
                          rec.media_type === "movie"
                            ? `/movie/${rec.id}/player`
                            : `/tv/${rec.id}/1/1/player`;

                        const detailHref =
                          rec.media_type === "movie"
                            ? `/movie/${rec.id}`
                            : `/tv/${rec.id}`;

                        return (
                          <div
                            key={`${rec.media_type}-${rec.id}`}
                            className="group/card flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-white/10 hover:border-amber-500/40 transition-all shadow-md"
                          >
                            {/* Mini Poster Thumbnail */}
                            <div className="relative w-12 h-16 rounded-md bg-white/5 overflow-hidden shrink-0 border border-white/10">
                              <SafeImage
                                src={posterUrl}
                                alt={rec.title}
                                fallbackTitle={rec.title}
                                fill
                                className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                                unoptimized
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover/card:text-amber-400 transition-colors">
                                  {rec.title}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/50">
                                {rec.vote_average ? (
                                  <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                                    <IoStar className="text-[10px]" />
                                    {rec.vote_average.toFixed(1)}
                                  </span>
                                ) : null}
                                <span>•</span>
                                <span>{rec.year || "Release"}</span>
                                <span>•</span>
                                <span className="uppercase text-[9px] font-bold text-white/70">
                                  {rec.media_type}
                                </span>
                              </div>

                              {rec.reason && (
                                <p className="text-[10px] text-white/60 line-clamp-1 italic mt-0.5">
                                  "{rec.reason}"
                                </p>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Link
                                  href={playHref}
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-black font-bold text-[11px] hover:bg-amber-400 active:scale-95 transition-all shadow-sm"
                                >
                                  <IoPlay className="w-2.5 h-2.5 fill-black" />
                                  <span>Play</span>
                                </Link>
                                <Link
                                  href={detailHref}
                                  onClick={() => setIsOpen(false)}
                                  className="px-2 py-1 rounded-md bg-white/10 text-white/80 font-medium text-[11px] hover:bg-white/20 transition-colors"
                                >
                                  Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing / Loading indicator */}
              {isLoading && (
                <div className="mr-auto flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.06] border border-white/10 text-white/70 text-xs animate-pulse">
                  <IoSparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Bu-Chill AI is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-3 py-1.5 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-[#0d0e14]/50">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap bg-white/5 hover:bg-white/15 text-white/75 hover:text-white border border-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input Capsule */}
            <div className="p-3 border-t border-white/10 bg-[#0e0f17] shrink-0">
              <div className="flex items-center gap-2 bg-white/[0.07] rounded-full border border-white/15 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 pl-3.5 pr-1.5 py-1 shadow-inner transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your mood or vibe..."
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none py-1.5"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-30 disabled:hover:bg-amber-500 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                  aria-label="Send message"
                >
                  <IoSend className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiConciergeModal;
