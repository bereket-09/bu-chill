import { NextResponse } from "next/server";
import { getPopularMatches, getAllTodayMatches, getAllMatches } from "@/services/sports";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "popular";

  let matches;
  if (type === "today") {
    matches = await getAllTodayMatches();
  } else if (type === "all") {
    matches = await getAllMatches();
  } else {
    matches = await getPopularMatches();
  }

  return NextResponse.json(matches);
}
