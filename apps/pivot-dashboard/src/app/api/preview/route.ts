import type { NextRequest } from "next/server";

// PDF preview functionality removed for MVP - requires canvas and pdfjs-dist
export async function GET(request: NextRequest) {
  return new Response("PDF preview disabled for MVP", { status: 501 });
}
