import { NextResponse } from "next/server";
import { getStreamsForMatch, SportsStreamSource } from "@/services/sports";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sources: SportsStreamSource[] = body.sources || [];
    const streams = await getStreamsForMatch(sources);
    return NextResponse.json(streams);
  } catch (err) {
    return NextResponse.json([], { status: 500 });
  }
}
