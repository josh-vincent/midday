/**
 * Mock HTTP responses for OAuth token endpoints
 */

export interface MockFetchOptions {
  shouldFail?: boolean;
  delay?: number;
  customResponse?: any;
}

/**
 * Create a mock fetch function for testing
 */
export function createMockFetch(options: MockFetchOptions = {}) {
  return async (url: string, init?: RequestInit): Promise<Response> => {
    // Simulate network delay
    if (options.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    // Simulate failure
    if (options.shouldFail) {
      return new Response(JSON.stringify({ error: "Token refresh failed" }), {
        status: 401,
        statusText: "Unauthorized",
      });
    }

    // Custom response
    if (options.customResponse) {
      return new Response(JSON.stringify(options.customResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Default successful response
    const body = new URLSearchParams(
      init?.body as string
    );
    const grantType = body.get("grant_type");

    if (grantType === "refresh_token") {
      // QuickBooks/Xero token refresh response
      return new Response(
        JSON.stringify({
          access_token: "new_access_token_" + Date.now(),
          refresh_token: "new_refresh_token_" + Date.now(),
          expires_in: 3600,
          token_type: "bearer",
          scope: "openid email profile",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown request" }), {
      status: 400,
    });
  };
}

/**
 * Mock global fetch for testing
 */
export function mockGlobalFetch(options: MockFetchOptions = {}) {
  const originalFetch = globalThis.fetch;
  const mockFetch = createMockFetch(options);

  globalThis.fetch = mockFetch as any;

  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}
