import { Resend } from "resend";

// Lazy initialization to avoid errors during build/deploy
let _resend: Resend | null = null;

// Helper to get env var that works in both Node.js and Cloudflare Workers
function getEnv(key: string): string | undefined {
  // @ts-ignore - Cloudflare Workers env
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }
  return process.env[key];
}

export const getResend = (apiKey?: string) => {
  const key = apiKey || getEnv('RESEND_API_KEY');
  if (!key) {
    throw new Error('RESEND_API_KEY is not set');
  }

  if (!_resend) {
    _resend = new Resend(key);
  }
  return _resend;
};

// For backward compatibility
export const resend = new Proxy({} as Resend, {
  get: (target, prop) => {
    return getResend()[prop as keyof Resend];
  },
});
