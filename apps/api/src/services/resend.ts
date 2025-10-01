import { Resend } from "resend";

// Lazy initialization to avoid errors during build/deploy
let _resend: Resend | null = null;

export const getResend = () => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return _resend;
};

// For backward compatibility
export const resend = new Proxy({} as Resend, {
  get: (target, prop) => {
    return getResend()[prop as keyof Resend];
  },
});
