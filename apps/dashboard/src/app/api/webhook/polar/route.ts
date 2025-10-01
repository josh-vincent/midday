import { NextResponse } from "next/server";

// Polar integration removed for MVP
export async function POST(req: Request) {
  return NextResponse.json({ error: "Polar webhook disabled for MVP" }, { status: 501 });
}
