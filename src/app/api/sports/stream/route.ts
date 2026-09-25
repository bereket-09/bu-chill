import { NextResponse } from "next/server";
import { getStreamsForMatch, SportsStreamSource } from "@/services/sports";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let sources: SportsStreamSource[] = body.sources || [];
    if (sources.length === 0 && body.matchId) {
      sources = [{ source: "solaris", id: body.matchId }];
    }
    const streams = await getStreamsForMatch(sources, body.channels, body.matchId);
    return NextResponse.json(streams);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
