/**
 * Auth Context System
 * Auto-detects userId, teamId, orgId from various auth providers
 * Supports: NextAuth, Clerk, Supabase Auth, Custom JWT
 */

import { cookies, headers } from 'next/headers';
import type { TokenContext } from './oauth-sync';

export interface AuthContextExtractor {
  /**
   * Extract user context from request
   */
  extract(): Promise<TokenContext> | TokenContext;
}

/**
 * NextAuth context extractor
 * Reads from next-auth session token cookie
 */
export class NextAuthExtractor implements AuthContextExtractor {
  async extract(): Promise<TokenContext> {
    try {
      // Import next-auth dynamically to avoid hard dependency
      // @ts-expect-error - next-auth is an optional peer dependency
      const { getServerSession } = await import('next-auth/next');
      const session = await getServerSession();

      if (!session?.user) {
        return {};
      }

      // Extract IDs from session
      // Assumes session.user has id, teamId, orgId fields
      return {
        userId: (session.user as any).id,
        teamId: (session.user as any).teamId,
        orgId: (session.user as any).orgId,
      };
    } catch (error) {
      console.warn('[NextAuthExtractor] Failed to extract context:', error);
      return {};
    }
  }
}

/**
 * Clerk context extractor
 * Reads from Clerk session
 */
export class ClerkExtractor implements AuthContextExtractor {
  async extract(): Promise<TokenContext> {
    try {
      // Import @clerk/nextjs dynamically
      // @ts-expect-error - @clerk/nextjs is an optional peer dependency
      const { auth } = await import('@clerk/nextjs/server');
      const { userId, orgId } = await auth();

      if (!userId) {
        return {};
      }

      return {
        userId,
        orgId: orgId || undefined,
      };
    } catch (error) {
      console.warn('[ClerkExtractor] Failed to extract context:', error);
      return {};
    }
  }
}

/**
 * Supabase Auth context extractor
 * Reads from Supabase session cookie
 */
export class SupabaseAuthExtractor implements AuthContextExtractor {
  async extract(): Promise<TokenContext> {
    try {
      // Read Supabase auth cookie
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('sb-access-token') ||
                         cookieStore.get('supabase-auth-token');

      if (!authCookie) {
        return {};
      }

      // Import Supabase dynamically
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {};
      }

      return {
        userId: user.id,
        // Check user metadata for teamId/orgId
        teamId: user.user_metadata?.teamId,
        orgId: user.user_metadata?.orgId,
      };
    } catch (error) {
      console.warn('[SupabaseAuthExtractor] Failed to extract context:', error);
      return {};
    }
  }
}

/**
 * JWT context extractor (generic)
 * Reads from Authorization header or cookie
 */
export class JWTExtractor implements AuthContextExtractor {
  constructor(
    private options: {
      /**
       * JWT secret for verification
       */
      secret: string;
      /**
       * Cookie name (if using cookies)
       */
      cookieName?: string;
      /**
       * Field names in JWT payload
       */
      fields?: {
        userId?: string;
        teamId?: string;
        orgId?: string;
      };
    }
  ) {}

  async extract(): Promise<TokenContext> {
    try {
      let token: string | undefined;

      // Try to get token from Authorization header
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // Fallback to cookie
      if (!token && this.options.cookieName) {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get(this.options.cookieName);
        token = authCookie?.value;
      }

      if (!token) {
        return {};
      }

      // Verify and decode JWT
      // @ts-expect-error - jsonwebtoken is an optional peer dependency
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.verify(token, this.options.secret) as Record<string, any>;

      // Extract fields using custom field names or defaults
      const fields = this.options.fields || {};

      return {
        userId: decoded[fields.userId || 'userId'] || decoded.sub,
        teamId: decoded[fields.teamId || 'teamId'],
        orgId: decoded[fields.orgId || 'orgId'] || decoded.organizationId,
      };
    } catch (error) {
      console.warn('[JWTExtractor] Failed to extract context:', error);
      return {};
    }
  }
}

/**
 * Custom context extractor
 * Allows users to provide their own extraction logic
 */
export class CustomExtractor implements AuthContextExtractor {
  constructor(
    private extractFn: () => Promise<TokenContext> | TokenContext
  ) {}

  async extract(): Promise<TokenContext> {
    try {
      return await this.extractFn();
    } catch (error) {
      console.warn('[CustomExtractor] Failed to extract context:', error);
      return {};
    }
  }
}

/**
 * Auto-detect auth provider and create appropriate extractor
 */
export function createAutoExtractor(): AuthContextExtractor {
  // Check environment variables to detect auth provider
  if (process.env.NEXTAUTH_URL || process.env.NEXTAUTH_SECRET) {
    return new NextAuthExtractor();
  }

  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return new ClerkExtractor();
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseAuthExtractor();
  }

  // Fallback: try to find JWT in common locations
  if (process.env.JWT_SECRET) {
    return new JWTExtractor({
      secret: process.env.JWT_SECRET,
      cookieName: process.env.JWT_COOKIE_NAME || 'auth-token',
    });
  }

  // No auth detected - return empty context
  return new CustomExtractor(() => ({}));
}

/**
 * Merge user-provided context with auto-detected context
 * User-provided values take precedence
 */
export function mergeContext(
  userContext: TokenContext,
  autoContext: TokenContext
): TokenContext {
  return {
    userId: userContext.userId || autoContext.userId,
    teamId: userContext.teamId || autoContext.teamId,
    orgId: userContext.orgId || autoContext.orgId,
    providers: userContext.providers || autoContext.providers,
  };
}
