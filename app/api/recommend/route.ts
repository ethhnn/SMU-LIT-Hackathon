import { NextResponse } from "next/server";

import { recommendationRequestSchema } from "@/lib/contracts";
import { recommendTools } from "@/lib/recommendations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = recommendationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a short training objective before asking for recommendations." },
        { status: 400 },
      );
    }

    return NextResponse.json(await recommendTools(parsed.data.scenario));
  } catch {
    return NextResponse.json(
      { error: "Recommendations are unavailable right now. Please try again." },
      { status: 500 },
    );
  }
}
