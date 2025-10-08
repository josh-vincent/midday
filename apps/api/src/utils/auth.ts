import { type JWTPayload, jwtVerify } from "jose";

export type Session = {
  user: {
    id: string;
    email?: string;
    full_name?: string;
  };
  teamId?: string;
};

type SupabaseJWTPayload = JWTPayload & {
  email?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: string | undefined;
  };
};

export async function verifyAccessToken(
  accessToken?: string,
  jwtSecret?: string,
): Promise<Session | null> {
  if (!accessToken) return null;

  const secret = jwtSecret || process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(secret),
    );

    const supabasePayload = payload as SupabaseJWTPayload;

    return {
      user: {
        id: supabasePayload.sub!,
        email: supabasePayload.email, // Email is at root level in Supabase JWT
        full_name: supabasePayload.user_metadata?.full_name,
      },
    };
  } catch (error) {
    return null;
  }
}
