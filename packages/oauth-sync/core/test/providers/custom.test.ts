import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createCustomProvider, CustomProvider } from "../../src/providers/custom";
import type { TokenConfig, CustomProviderConfig } from "../../src/core/types";
import { mockGlobalFetch } from "../mocks";

describe("CustomProvider", () => {
  let mockFetch: ReturnType<typeof mockGlobalFetch>;

  afterEach(() => {
    if (mockFetch) {
      mockFetch.restore();
    }
  });

  describe("createCustomProvider", () => {
    it("should create custom provider with minimal config", () => {
      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
      };

      const provider = createCustomProvider(config);

      expect(provider).toBeInstanceOf(CustomProvider);
      expect(provider.provider).toBe("my-service");
    });

    it("should create custom provider with full config", () => {
      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        defaultExpiresIn: 7200,
        defaultThresholdMinutes: 30,
        authMethod: "basic",
        scopes: ["read", "write"],
        additionalHeaders: { "X-Custom-Header": "value" },
        additionalParams: { custom_param: "value" },
      };

      const provider = createCustomProvider(config);

      expect(provider).toBeInstanceOf(CustomProvider);
      const providerConfig = provider.getConfig();
      expect(providerConfig.defaultExpiresIn).toBe(7200);
      expect(providerConfig.defaultThresholdMinutes).toBe(30);
      expect(providerConfig.authMethod).toBe("basic");
    });

    it("should apply default values", () => {
      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
      };

      const provider = createCustomProvider(config);
      const providerConfig = provider.getConfig();

      expect(providerConfig.defaultExpiresIn).toBe(3600);
      expect(providerConfig.defaultThresholdMinutes).toBe(60);
      expect(providerConfig.authMethod).toBe("body");
    });

    it("should validate configuration", () => {
      const invalidConfig = {
        providerName: "my-service",
        tokenUrl: "not-a-url", // Invalid URL
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
      } as CustomProviderConfig;

      expect(() => createCustomProvider(invalidConfig)).toThrow();
    });
  });

  describe("isTokenExpiring", () => {
    let provider: CustomProvider;

    beforeEach(() => {
      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        defaultThresholdMinutes: 45,
      };

      provider = createCustomProvider(config);
    });

    it("should use custom threshold from config", () => {
      const tokens: TokenConfig = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 3600,
        connectedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
      };

      // Token expires in 40 minutes, custom threshold is 45 minutes
      const isExpiring = provider.isTokenExpiring(tokens);
      expect(isExpiring).toBe(true);
    });

    it("should allow overriding threshold", () => {
      const tokens: TokenConfig = {
        accessToken: "test_token",
        refreshToken: "test_refresh",
        expiresIn: 3600,
        connectedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
      };

      // Token expires in 40 minutes, override threshold to 30 minutes
      const isExpiring = provider.isTokenExpiring(tokens, 30);
      expect(isExpiring).toBe(false);
    });
  });

  describe("refreshToken", () => {
    it("should refresh token with body auth method", async () => {
      mockFetch = mockGlobalFetch();

      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        authMethod: "body",
      };

      const provider = createCustomProvider(config);

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      const newTokens = await provider.refreshToken(tokens);

      expect(newTokens.accessToken).toContain("new_access_token");
      expect(newTokens.refreshToken).toContain("new_refresh_token");
      expect(newTokens.expiresIn).toBe(3600);
    });

    it("should refresh token with basic auth method", async () => {
      let requestHeaders: Record<string, string> = {};

      mockFetch = mockGlobalFetch();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init?: any) => {
        requestHeaders = init?.headers || {};
        return originalFetch(url, init);
      };

      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        authMethod: "basic",
      };

      const provider = createCustomProvider(config);

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      await provider.refreshToken(tokens);

      expect(requestHeaders.Authorization).toContain("Basic");
    });

    it("should include custom scopes", async () => {
      let requestBody: Record<string, string> = {};

      mockFetch = mockGlobalFetch();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init?: any) => {
        const body = init?.body?.toString() || "";
        const params = new URLSearchParams(body);
        params.forEach((value, key) => {
          requestBody[key] = value;
        });
        return originalFetch(url, init);
      };

      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        scopes: ["read", "write", "admin"],
      };

      const provider = createCustomProvider(config);

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      await provider.refreshToken(tokens);

      expect(requestBody.scope).toBe("read write admin");
    });

    it("should include additional headers", async () => {
      let requestHeaders: Record<string, string> = {};

      mockFetch = mockGlobalFetch();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init?: any) => {
        requestHeaders = init?.headers || {};
        return originalFetch(url, init);
      };

      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        additionalHeaders: {
          "X-Custom-Header": "custom-value",
          "X-API-Version": "v2",
        },
      };

      const provider = createCustomProvider(config);

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      await provider.refreshToken(tokens);

      expect(requestHeaders["X-Custom-Header"]).toBe("custom-value");
      expect(requestHeaders["X-API-Version"]).toBe("v2");
    });

    it("should include additional params", async () => {
      let requestBody: Record<string, string> = {};

      mockFetch = mockGlobalFetch();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init?: any) => {
        const body = init?.body?.toString() || "";
        const params = new URLSearchParams(body);
        params.forEach((value, key) => {
          requestBody[key] = value;
        });
        return originalFetch(url, init);
      };

      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        additionalParams: {
          custom_param: "custom_value",
          resource: "https://api.myservice.com",
        },
      };

      const provider = createCustomProvider(config);

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      await provider.refreshToken(tokens);

      expect(requestBody.custom_param).toBe("custom_value");
      expect(requestBody.resource).toBe("https://api.myservice.com");
    });

    it("should use default expires_in if not returned", async () => {
      mockFetch = mockGlobalFetch({
        customResponse: {
          access_token: "new_access_token",
          refresh_token: "new_refresh_token",
          token_type: "bearer",
          // No expires_in in response
        },
      });

      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        defaultExpiresIn: 7200,
      };

      const provider = createCustomProvider(config);

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      const newTokens = await provider.refreshToken(tokens);

      expect(newTokens.expiresIn).toBe(7200);
    });

    it("should handle refresh failure with custom error message", async () => {
      mockFetch = mockGlobalFetch({ shouldFail: true });

      const config: CustomProviderConfig = {
        providerName: "my-custom-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
      };

      const provider = createCustomProvider(config);

      const tokens: TokenConfig = {
        accessToken: "old_access_token",
        refreshToken: "old_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      };

      await expect(provider.refreshToken(tokens)).rejects.toThrow(
        "Custom provider (my-custom-service) token refresh failed"
      );
    });
  });

  describe("getConfig", () => {
    it("should return provider configuration", () => {
      const config: CustomProviderConfig = {
        providerName: "my-service",
        tokenUrl: "https://api.myservice.com/oauth/token",
        clientId: "test_client_id",
        clientSecret: "test_client_secret",
        defaultExpiresIn: 7200,
      };

      const provider = createCustomProvider(config);
      const providerConfig = provider.getConfig();

      expect(providerConfig.providerName).toBe("my-service");
      expect(providerConfig.tokenUrl).toBe("https://api.myservice.com/oauth/token");
      expect(providerConfig.defaultExpiresIn).toBe(7200);
    });
  });
});
