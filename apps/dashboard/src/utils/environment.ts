export function getUrl() {
  // Prefer VERCEL_URL for all Vercel deployments (production, preview, etc.)
  // This ensures each deployment uses its own URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Manual override if needed
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  return "http://localhost:3333";
}
