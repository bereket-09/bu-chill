import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vuzgkwkeyqdinbmsoosg.supabase.co";

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    if (!path || path.length === 0) {
      return NextResponse.json({ error: "Missing Supabase path" }, { status: 400 });
    }

    const subPath = path.map((segment) => encodeURIComponent(segment)).join("/");
    const search = request.nextUrl.search || "";
    const targetUrl = `${SUPABASE_URL}/${subPath}${search}`;

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      // Exclude host so upstream Supabase recognizes the destination host
      if (lower !== "host") {
        headers.set(key, value);
      }
    });

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "follow",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const response = await fetch(targetUrl, init);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    // Ensure permissive CORS for browser client requests
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Credentials", "true");

    const responseBody = await response.arrayBuffer();
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("[Supabase Proxy Error]:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Supabase proxy error" },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
export const HEAD = proxyRequest;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
