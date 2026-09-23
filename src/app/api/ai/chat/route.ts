import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { tmdb } from "@/api/tmdb";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Enforce Authentication: Only logged-in users can use AI chat
    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Please sign in to your Bu-Chill account to chat with the AI concierge.",
          requiresLogin: true,
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages = [], localHistory = [] } = body as {
      messages: ChatMessage[];
      localHistory?: Array<{
        title: string;
        type: string;
        progress?: number;
        completed?: boolean;
        season_number?: number;
        episode_number?: number;
        genres?: string[];
      }>;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Bad Request", message: "Messages array cannot be empty" },
        { status: 400 }
      );
    }

    // 2. Fetch user's watch history and watchlist from Supabase database
    let dbHistories: any[] = [];
    let dbWatchlist: any[] = [];

    try {
      const [{ data: hData }, { data: wData }] = await Promise.all([
        supabase
          .from("histories")
          .select("title, type, season, episode, duration, last_position, completed, vote_average")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(30),
        supabase
          .from("watchlist")
          .select("title, type, vote_average")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      dbHistories = hData || [];
      dbWatchlist = wData || [];
    } catch (err) {
      console.warn("Could not fetch user history from Supabase for AI context:", err);
    }

    // 3. Unify and deduplicate watch history across local profile storage & Supabase database
    const seenTitles = new Set<string>();
    const unifiedHistory: string[] = [];

    // Prioritize local profile items (most recent session)
    for (const item of localHistory) {
      if (!item.title) continue;
      const key = `${item.title.toLowerCase()}_${item.type}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        let desc = `${item.title} (${item.type})`;
        if (item.season_number && item.episode_number) {
          desc += ` [S${item.season_number}E${item.episode_number}]`;
        }
        if (item.completed) {
          desc += ` - Completed`;
        } else if (item.progress && item.progress > 0) {
          desc += ` - In Progress (${Math.round(item.progress)}% watched)`;
        }
        if (item.genres && item.genres.length > 0) {
          desc += ` (Genres: ${item.genres.slice(0, 3).join(", ")})`;
        }
        unifiedHistory.push(desc);
      }
    }

    // Also include any stored in Supabase database
    for (const item of dbHistories) {
      if (!item.title) continue;
      const key = `${item.title.toLowerCase()}_${item.type}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        let desc = `${item.title} (${item.type})`;
        if (item.season && item.episode) {
          desc += ` [S${item.season}E${item.episode}]`;
        }
        if (item.completed) {
          desc += ` - Completed`;
        } else if (item.duration && item.last_position) {
          const pct = Math.round((item.last_position / item.duration) * 100);
          desc += ` - In Progress (${pct}% watched)`;
        }
        unifiedHistory.push(desc);
      }
    }

    const historyItemsFormatted =
      unifiedHistory.length > 0
        ? unifiedHistory.map((h) => `- ${h}`).join("\n")
        : "No watch history recorded yet.";

    const watchlistFormatted =
      dbWatchlist.length > 0
        ? dbWatchlist.map((w) => `- ${w.title || ""} (${w.type || "movie"})`).join("\n")
        : "No saved titles in watchlist yet.";

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
    const model =
      process.env.AI_MODEL ||
      (process.env.GROQ_API_KEY ? "qwen/qwen3.8-27b" : "gpt-4o-mini");

    const username = user.user_metadata?.full_name || user.email?.split("@")[0] || "cinephile";

    const systemPrompt = `You are "Be Chill AI Concierge" 🍿, a world-class, charismatic movie and TV series advisor for the Be Chill streaming platform.
You are talking to an authenticated member: "${username}".

KNOWLEDGE BASE: THIS USER'S REAL WATCH HISTORY ON BE CHILL:
${historyItemsFormatted}

USER'S SAVED WATCHLIST:
${watchlistFormatted}

CRITICAL RULES FOR PERSONALIZATION & WATCH HISTORY:
1. You have DEEP, FIRST-CLASS KNOWLEDGE of everything this user has watched on Be Chill (listed above).
2. DO NOT recommend movies or TV series they have already completed or watched, unless they explicitly ask for a rewatch or discussion about that specific title.
3. EXPLICIT TASTE TIE-INS: Actively reference their watched titles to explain why your recommendations fit their taste! (e.g. "Since you completed [Title] and loved its tension, you'll be blown away by...", or "Picking up on your love for [Title]...").
4. Tailor your recommendations to the user's specific genre patterns, favorite actors/directors, or thematic mood drawn from their watch history.
5. Recommend 2 to 4 exceptional titles that match their current request or prompt.
6. At the very end of your response, you MUST include a JSON block enclosed strictly in \`\`\`recommendations and \`\`\` containing the exact list of recommended titles:
\`\`\`recommendations
[
  { "title": "Exact Title", "type": "movie", "reason": "Short personalized reason based on their taste" }
]
\`\`\`
Note: "type" must be either "movie" or "tv".`;

    let aiReply = "";
    let rawRecs: Array<{ title: string; type: "movie" | "tv"; reason?: string }> = [];

    if (!apiKey) {
      // Graceful fallback when GROQ_API_KEY has not been placed in .env.local yet
      aiReply = `🍿 **Welcome to Be Chill AI Concierge!**

I noticed your \`GROQ_API_KEY\` is not set in \`.env.local\` yet. Once you add it, you'll unlock lightning-fast AI recommendations powered by LLaMA 3.3 70B!

In the meantime, based on popular streaming picks and your taste, here are some phenomenal titles you should check out:`;

      rawRecs = [
        { title: "Dune", type: "movie", reason: "Epic visual masterpiece and sci-fi grandeur" },
        { title: "Severance", type: "tv", reason: "Gripping mystery thriller with mind-bending tension" },
        { title: "The Bear", type: "tv", reason: "High-intensity drama with brilliant characters and pace" },
      ];
    } else {
      // Call OpenAI-compatible endpoint (Groq, OpenAI, Ollama, etc.)
      const response = await fetch(`${baseURL.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI API Error:", errorText);
        return NextResponse.json(
          {
            error: "AI Provider Error",
            message: `AI provider error (${response.status}). Please check your GROQ_API_KEY.`,
          },
          { status: 502 }
        );
      }

      const data = await response.json();
      aiReply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate recommendations right now.";

      // Extract JSON recommendations block if present
      const jsonMatch = aiReply.match(/```(?:recommendations|json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          rawRecs = JSON.parse(jsonMatch[1]);
          // Clean the markdown to remove the raw JSON from user-facing text
          aiReply = aiReply.replace(/```(?:recommendations|json)?\s*\[[\s\S]*?\]\s*```/, "").trim();
        } catch {
          // Ignore JSON parse error
        }
      }
    }

    // Enrich recommendations with live TMDB assets (posters, ratings, ids, overviews)
    const enrichedRecommendations: RecommendationItem[] = [];

    for (const rec of rawRecs.slice(0, 4)) {
      try {
        const searchResult = await tmdb.search.multi({ query: rec.title });
        const match = searchResult.results?.find(
          (item) =>
            (item.media_type === "movie" || item.media_type === "tv") &&
            ("poster_path" in item || "backdrop_path" in item)
        );

        if (match && (match.media_type === "movie" || match.media_type === "tv")) {
          const itemTitle = match.media_type === "movie" ? match.title : match.name;
          const releaseDate = match.media_type === "movie" ? match.release_date : match.first_air_date;
          const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

          enrichedRecommendations.push({
            id: match.id,
            title: itemTitle || rec.title,
            media_type: match.media_type,
            poster_path: match.poster_path,
            backdrop_path: match.backdrop_path,
            vote_average: match.vote_average,
            year,
            overview: match.overview,
            reason: rec.reason,
          });
        }
      } catch (err) {
        console.warn(`Could not resolve TMDB assets for "${rec.title}":`, err);
      }
    }

    return NextResponse.json({
      message: aiReply,
      recommendations: enrichedRecommendations,
      modelUsed: model,
    });
  } catch (err: unknown) {
    console.error("AI Chat Route Error:", err);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
