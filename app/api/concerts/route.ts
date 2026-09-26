import { NextRequest, NextResponse } from "next/server";
import { fetchLiveConcerts } from "@/lib/api/concerts";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");

  if (!artist) {
    return NextResponse.json(
      {
        success: false,
        code: "INVALID_QUERY",
        error: "Missing required query parameter: 'artist'.",
        source: "live_api",
      },
      { status: 400 }
    );
  }

  const result = await fetchLiveConcerts(artist);

  if (!result.success) {
    const status =
      result.code === "NO_CONCERTS"
        ? 404
        : result.code === "RATE_LIMITED"
        ? 429
        : result.code === "AUTH_REQUIRED"
        ? 401
        : 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
