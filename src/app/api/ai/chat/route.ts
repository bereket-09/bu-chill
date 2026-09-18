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

    const body = await request.json();
    const { messages = [] } = body as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Bad Request", message: "Messages array cannot be empty" },
        { status: 400 }
      );
    }

    let historyItems = "";
    let watchlistItems = "";

    // If user is logged in, fetch their watch history and watchlist for personalized grounding
    if (user) {
      try {
        const [{ data: histories }, { data: watchlist }] = await Promise.all([
          supabase
            .from("histories")
            .select("title, type")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(10),
          supabase
            .from("watchlist")
            .select("title, type")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        historyItems = (histories || [])
          .map((h) => `${h.title || ""} (${h.type || "movie"})`)
          .filter(Boolean)
          .join(", ");

        watchlistItems = (watchlist || [])
          .map((w) => `${w.title || ""} (${w.type || "movie"})`)
          .filter(Boolean)
          .join(", ");
      } catch (err) {
        console.warn("Could not fetch user history for AI context:", err);
      }
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
    const model =
      process.env.AI_MODEL ||
      (process.env.GROQ_API_KEY ? "qwen/qwen3.8-27b" : "gpt-4o-mini");

    const systemPrompt = `You are "Bu-Chill AI Concierge" 🍿, a knowledgeable, charismatic movie and TV series curator for the Bu-Chill streaming platform.
Your job is to talk to the user about what they are in the mood for (vibe, genre, plot twist, emotion, pace, aesthetic) and recommend 2 to 4 exceptional titles that match their request.

User's Real Watch Profile:
- Recently Watched on Bu-Chill: ${historyItems || "No watch history recorded yet"}
- Saved to Watchlist: ${watchlistItems || "No saved titles yet"}

Important Guidelines:
1. Speak conversationally like an experienced cinephile. Explain the vibe and why each recommendation fits their taste.
2. If they have watched movies in their history, occasionally reference how their past taste informs these recommendations.
3. At the very end of your response, you MUST include a JSON block enclosed strictly in \`\`\`recommendations and \`\`\` containing the exact list of recommended titles:
\`\`\`recommendations
[
  { "title": "Exact Title", "type": "movie", "reason": "Short reason why it fits" }
]
\`\`\`
Note: "type" must be either "movie" or "tv".`;

    let aiReply = "";
    let rawRecs: Array<{ title: string; type: "movie" | "tv"; reason?: string }> = [];

    if (!apiKey) {
      // Graceful fallback when GROQ_API_KEY has not been placed in .env.local yet
      aiReply = `🍿 **Welcome to Bu-Chill AI Concierge!**

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
