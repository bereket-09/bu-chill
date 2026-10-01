import { NextRequest, NextResponse } from "next/server";
import { env } from "@/utils/env";

export const dynamic = "force-dynamic";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    if (!path || path.length === 0) {
      return NextResponse.json(
        { success: false, message: "Missing TMDB endpoint path" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const subPath = path.map((segment) => encodeURIComponent(segment)).join("/");
    const search = request.nextUrl.search || "";
    const targetUrl = `${TMDB_BASE_URL}/${subPath}${search}`;

    // Prefer token from env, fallback to incoming Authorization header
    const token =
      env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN ||
      process.env.TMDB_ACCESS_TOKEN ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json;charset=utf-8",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
      next: { revalidate: 3600 },
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(data ?? {}, {
      status: response.status,
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("[TMDB Proxy Error]:", error?.message || error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch from TMDB upstream" },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
