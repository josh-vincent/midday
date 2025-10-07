import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { XeroProvider } from "../../src/providers/xero";
import type { TokenConfig, ProviderConfig } from "../../src/core/types";
import { mockGlobalFetch } from "../mocks";

describe("XeroProvider", () => {
  let provider: XeroProvider;
  let mockFetch: ReturnType<typeof mockGlobalFetch>;

  beforeEach(() => {
    provider = new XeroProvider();
  });

  afterEach(() => {
    if (mockFetch) {
      mockFetch.restore();
    }
  });

  describe("isTokenExpiring", () => {
    it("should detect expiring token with 30-minute default threshold", () => {
      const tokens: TokenConfig = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 1800, // 30 minutes
        connectedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
      };

      // Token expires in 10 minutes, threshold is 30 minutes (Xero default)
      const isExpiring = provider.isTokenExpiring(tokens, 30);
      expect(isExpiring).toBe(true);
    });

    it("should not detect expiring token when enough time remaining", () => {
      const tokens: TokenConfig = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 1800, // 30 minutes
        connectedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      };

      // Token expires in 25 minutes, threshold is 15 minutes
      const isExpiring = provider.isTokenExpiring(tokens, 15);
      expect(isExpiring).toBe(false);
    });

    it("should handle Xero's shorter token lifetime (30 minutes)", () => {
      const tokens: TokenConfig = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 1800, // Xero tokens expire in 30 minutes
        connectedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      };

      // Expires in 5 minutes, threshold is 30 minutes
      const isExpiring = provider.isTokenExpiring(tokens, 30);
      expect(isExpiring).toBe(true);
    });
  });

  describe("calculateExpiresAt", () => {
    it("should calculate correct expiration timestamp", () => {
      const expiresIn = 1800; // 30 minutes (Xero default)
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
        expiresIn: 1800,
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
        expiresIn: 1800,
        connectedAt: new Date().toISOString(),
      };

      const config: ProviderConfig = {
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
      };

      await expect(provider.refreshToken(tokens, config)).rejects.toThrow(
        "Xero token refresh failed"
      );
    });

    it("should use correct Xero token endpoint", async () => {
      let requestUrl = "";

      mockFetch = mockGlobalFetch();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init?: any) => {
        requestUrl = url;
        return originalFetch(url, init);
      };

      const tokens: TokenConfig = {
        accessToken: "test",
        refreshToken: "test",
        expiresIn: 1800,
        connectedAt: new Date().toISOString(),
      };

      const config: ProviderConfig = {
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
      };

      await provider.refreshToken(tokens, config);

      expect(requestUrl).toContain("identity.xero.com");
    });
  });

  describe("provider name", () => {
    it("should have correct provider name", () => {
      expect(provider.provider).toBe("xero");
    });
  });

  describe("environment support", () => {
    it("should support sandbox environment", async () => {
      mockFetch = mockGlobalFetch();

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 1800,
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
        expiresIn: 1800,
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
