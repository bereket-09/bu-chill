"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/utils/helpers";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import SafeImage from "@/components/ui/other/SafeImage";
import {
  IoSparkles,
  IoClose,
  IoSend,
  IoPlay,
  IoLockClosed,
  IoStar,
  IoRefreshOutline,
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
  "🍿 Recommend something based on my watch history",
  "🌌 Mind-bending sci-fi with insane plot twists",
  "🍕 Cozy feel-good comedy to relax tonight",
  "🔪 Dark gripping crime mystery like True Detective",
  "⚡ High-octane action with non-stop adrenaline",
];

export const AiConciergeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey there! 🍿 I'm your **Bu-Chill AI Concierge**. Tell me what kind of vibe, mood, story, or genre you're looking for, and I'll tailor recommendations to your taste!",
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
            content: data.message || "Something went wrong. Please try again later.",
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
          content: "Failed to connect to Bu-Chill AI. Please check your internet connection.",
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
      {/* Floating Trigger Button on Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/30 via-primary/40 to-purple-600/40 hover:from-amber-500/50 hover:via-primary/60 hover:to-purple-600/60 border border-white/20 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer select-none"
          title="Bu-Chill AI Concierge"
          aria-label="Open Bu-Chill AI Concierge"
        >
          <div className="relative flex items-center justify-center">
            <IoSparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
        </button>
      </div>

      {/* Modal / Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full sm:max-w-xl h-[85vh] sm:h-[720px] max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#0e0f14] border border-white/15 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#14151e] via-[#101117] to-[#0e0f14] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-primary text-black font-black shadow-md shadow-amber-500/20">
                  <IoSparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-white tracking-wide">
                      Bu-Chill AI Concierge
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Smart
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50 font-medium">
                    Personalized movie & TV recommendations
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {user && (
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
                    className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    title="Clear chat"
                  >
                    <IoRefreshOutline className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body: Authentication Wall OR Chat Interface */}
            {!isUserLoading && !user ? (
              /* Signed-out lock wall */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-xl">
                  <IoLockClosed className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-xl font-bold text-white">
                    Members Exclusive Feature
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Bu-Chill AI Concierge analyzes your personalized watch history and watchlist to discover movies and shows you'll love.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs pt-2">
                  <Link
                    href="/auth"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 px-5 rounded-xl bg-white text-black font-bold text-sm text-center shadow-lg hover:bg-white/90 active:scale-95 transition-all"
                  >
                    Sign In / Sign Up
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 px-5 rounded-xl bg-white/10 text-white/80 font-semibold text-sm hover:bg-white/15 transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            ) : (
              /* Active Chat Feed */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-white rounded-br-none shadow-md shadow-primary/20 font-medium"
                            : "bg-[#181922] text-white/90 border border-white/10 rounded-bl-none shadow-md"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Enriched TMDB Recommendation Cards */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 w-full max-w-lg">
                          {msg.recommendations.map((rec) => {
                            const posterUrl = rec.poster_path
                              ? `https://image.tmdb.org/t/p/w500${rec.poster_path}`
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
                                className="group/card flex flex-col rounded-xl overflow-hidden bg-[#13141b] border border-white/10 hover:border-white/30 transition-all shadow-lg"
                              >
                                <div className="relative aspect-[16/9] w-full bg-black/60 overflow-hidden">
                                  <SafeImage
                                    src={posterUrl}
                                    alt={rec.title}
                                    fallbackTitle={rec.title}
                                    fill
                                    className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                                    unoptimized
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                  {rec.vote_average ? (
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">
                                      <IoStar className="text-amber-400 text-[10px]" />
                                      <span>{rec.vote_average.toFixed(1)}</span>
                                    </div>
                                  ) : null}
                                  <span className="absolute top-2 right-2 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/70 text-white/80 border border-white/10">
                                    {rec.media_type}
                                  </span>
                                </div>

                                <div className="p-3 flex flex-col flex-1">
                                  <h4 className="font-bold text-sm text-white line-clamp-1 group-hover/card:text-primary transition-colors">
                                    {rec.title}
                                  </h4>
                                  <span className="text-[11px] text-white/40 mb-1.5 font-medium">
                                    {rec.year ? `${rec.year} • ` : ""}
                                    {rec.media_type === "movie" ? "Movie" : "TV Series"}
                                  </span>
                                  {rec.reason && (
                                    <p className="text-[11px] text-white/60 line-clamp-2 leading-tight mb-3">
                                      {rec.reason}
                                    </p>
                                  )}

                                  <div className="mt-auto flex items-center gap-2 pt-1">
                                    <Link
                                      href={playHref}
                                      onClick={() => setIsOpen(false)}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition-all shadow"
                                    >
                                      <IoPlay className="text-xs fill-black" />
                                      <span>Play</span>
                                    </Link>
                                    <Link
                                      href={detailHref}
                                      onClick={() => setIsOpen(false)}
                                      className="py-1.5 px-2.5 rounded-lg bg-white/10 text-white/80 font-semibold text-xs hover:bg-white/20 transition-colors border border-white/10"
                                    >
                                      Info
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
                    <div className="mr-auto flex items-center gap-2 p-3 rounded-2xl bg-[#181922] border border-white/10 text-white/60 text-xs">
                      <IoSparkles className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Bu-Chill AI is curating recommendations...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-3 sm:p-4 border-t border-white/10 bg-[#0f1015]">
                  <div className="flex items-center gap-2 bg-[#171822] rounded-2xl border border-white/15 focus-within:border-primary/60 px-3.5 py-1.5 shadow-inner transition-colors">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe the vibe (e.g. cozy sci-fi, dark crime, 90s nostalgia)..."
                      className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none py-2"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                      aria-label="Send message"
                    >
                      <IoSend className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AiConciergeModal;
