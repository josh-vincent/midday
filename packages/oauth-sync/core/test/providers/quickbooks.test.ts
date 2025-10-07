import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { QuickBooksProvider } from "../../src/providers/quickbooks";
import type { TokenConfig, ProviderConfig } from "../../src/core/types";
import { mockGlobalFetch } from "../mocks";

describe("QuickBooksProvider", () => {
  let provider: QuickBooksProvider;
  let mockFetch: ReturnType<typeof mockGlobalFetch>;

  beforeEach(() => {
    provider = new QuickBooksProvider();
  });

  afterEach(() => {
    if (mockFetch) {
      mockFetch.restore();
    }
  });

  describe("isTokenExpiring", () => {
    it("should detect expiring token (less than threshold)", () => {
      const tokens: TokenConfig = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 3600, // 1 hour
        connectedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(), // 50 minutes ago
      };

      // Token expires in 10 minutes, threshold is 60 minutes
      const isExpiring = provider.isTokenExpiring(tokens, 60);
      expect(isExpiring).toBe(true);
    });

    it("should not detect expiring token (more than threshold)", () => {
      const tokens: TokenConfig = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 3600, // 1 hour
        connectedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      };

      // Token expires in 50 minutes, threshold is 30 minutes
      const isExpiring = provider.isTokenExpiring(tokens, 30);
      expect(isExpiring).toBe(false);
    });

    it("should detect expired token", () => {
      const tokens: TokenConfig = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 3600,
        connectedAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(), // 70 minutes ago
      };

      const isExpiring = provider.isTokenExpiring(tokens, 60);
      expect(isExpiring).toBe(true);
    });

    it("should use expiresAt if provided", () => {
      const tokens: TokenConfig = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
      };

      // Threshold is 60 minutes, expires in 10 minutes
      const isExpiring = provider.isTokenExpiring(tokens, 60);
      expect(isExpiring).toBe(true);
    });
  });

  describe("calculateExpiresAt", () => {
    it("should calculate correct expiration timestamp", () => {
      const expiresIn = 3600; // 1 hour
      const before = Date.now();
      const expiresAt = provider.calculateExpiresAt(expiresIn);
      const after = Date.now();

      const expiresAtTime = new Date(expiresAt).getTime();
      const expectedMin = before + expiresIn * 1000;
      const expectedMax = after + expiresIn * 1000;

      expect(expiresAtTime).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAtTime).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe("refreshToken", () => {
    it("should successfully refresh token", async () => {
      mockFetch = mockGlobalFetch();

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      const config: ProviderConfig = {
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
      };

      const newTokens = await provider.refreshToken(tokens, config);

      expect(newTokens.accessToken).toContain("new_access_token");
      expect(newTokens.refreshToken).toContain("new_refresh_token");
      expect(newTokens.expiresIn).toBe(3600);
      expect(newTokens.tokenType).toBe("bearer");
    });

    it("should handle refresh failure", async () => {
      mockFetch = mockGlobalFetch({ shouldFail: true });

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      const config: ProviderConfig = {
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
      };

      await expect(provider.refreshToken(tokens, config)).rejects.toThrow(
        "QuickBooks token refresh failed"
      );
    });

    it("should use correct QuickBooks token endpoint", async () => {
      let requestUrl = "";
      let requestHeaders: Record<string, string> = {};

      mockFetch = mockGlobalFetch();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init?: any) => {
        requestUrl = url;
        requestHeaders = init?.headers || {};
        return originalFetch(url, init);
      };

      const tokens: TokenConfig = {
        accessToken: "test",
        refreshToken: "test",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      const config: ProviderConfig = {
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
      };

      await provider.refreshToken(tokens, config);

      expect(requestUrl).toContain("oauth.platform.intuit.com");
      expect(requestHeaders.Authorization).toContain("Basic");
    });
  });

  describe("provider name", () => {
    it("should have correct provider name", () => {
      expect(provider.provider).toBe("quickbooks");
    });
  });

  describe("environment support", () => {
    it("should support sandbox environment", async () => {
      mockFetch = mockGlobalFetch();

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      const config: ProviderConfig = {
        clientId: "sandbox_client_id",
        clientSecret: "sandbox_client_secret",
        environment: "sandbox",
      };

      const newTokens = await provider.refreshToken(tokens, config);

      expect(newTokens.accessToken).toContain("new_access_token");
      expect(newTokens.refreshToken).toContain("new_refresh_token");
    });

    it("should default to production environment", async () => {
      mockFetch = mockGlobalFetch();

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      const config: ProviderConfig = {
        clientId: "prod_client_id",
        clientSecret: "prod_client_secret",
        // No environment specified - should default to production
      };

      const newTokens = await provider.refreshToken(tokens, config);

      expect(newTokens.accessToken).toContain("new_access_token");
    });
  });
});
