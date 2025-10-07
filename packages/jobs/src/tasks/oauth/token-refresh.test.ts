import { describe, expect, test } from "bun:test";
import { type TokenConfig, isTokenExpiring } from "./token-refresh";

describe("Token Expiry Detection", () => {
  describe("isTokenExpiring", () => {
    test("should return true for QuickBooks token expiring within 1 hour", () => {
      const config: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3600, // 1 hour
        connected_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      };

      const result = isTokenExpiring(config, "quickbooks");
      expect(result).toBe(true);
    });

    test("should return false for QuickBooks token not expiring within 1 hour", () => {
      const config: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 7200, // 2 hours
        connected_at: new Date().toISOString(), // Now
      };

      const result = isTokenExpiring(config, "quickbooks");
      expect(result).toBe(false);
    });

    test("should return true for QuickBooks token that has already expired", () => {
      const config: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3600, // 1 hour
        connected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      };

      const result = isTokenExpiring(config, "quickbooks");
      expect(result).toBe(true);
    });

    test("should return true for Xero token expiring within 30 minutes", () => {
      const config: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 1800, // 30 minutes
        connected_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
      };

      const result = isTokenExpiring(config, "xero");
      expect(result).toBe(true);
    });

    test("should return false for Xero token not expiring within 30 minutes", () => {
      const config: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3600, // 1 hour
        connected_at: new Date().toISOString(), // Now
      };

      const result = isTokenExpiring(config, "xero");
      expect(result).toBe(false);
    });

    test("should return true for Xero token that has already expired", () => {
      const config: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 1800, // 30 minutes
        connected_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      };

      const result = isTokenExpiring(config, "xero");
      expect(result).toBe(true);
    });

    test("should handle missing connected_at gracefully", () => {
      const config: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3600,
        connected_at: undefined as any,
      };

      const result = isTokenExpiring(config, "quickbooks");
      expect(result).toBe(true); // Should default to expiring for safety
    });

    test("should handle invalid dates gracefully", () => {
      const config: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3600,
        connected_at: "invalid-date",
      };

      const result = isTokenExpiring(config, "quickbooks");
      expect(result).toBe(true); // Should default to expiring for safety
    });

    test("should handle missing expires_in gracefully", () => {
      const config: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: undefined as any,
        connected_at: new Date().toISOString(),
      };

      const result = isTokenExpiring(config, "quickbooks");
      expect(result).toBe(true); // Should default to expiring for safety
    });

    test("should correctly calculate time windows for different providers", () => {
      const currentTime = Date.now();
      const oneHourFromNow = currentTime + 60 * 60 * 1000;
      const thirtyMinutesFromNow = currentTime + 30 * 60 * 1000;

      // QuickBooks token expiring in 59 minutes should be refreshed
      const qbConfig: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3540, // 59 minutes
        connected_at: new Date(currentTime).toISOString(),
      };
      expect(isTokenExpiring(qbConfig, "quickbooks")).toBe(true);

      // QuickBooks token expiring in 61 minutes should not be refreshed
      const qbConfig2: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3660, // 61 minutes
        connected_at: new Date(currentTime).toISOString(),
      };
      expect(isTokenExpiring(qbConfig2, "quickbooks")).toBe(false);

      // Xero token expiring in 29 minutes should be refreshed
      const xeroConfig: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 1740, // 29 minutes
        connected_at: new Date(currentTime).toISOString(),
      };
      expect(isTokenExpiring(xeroConfig, "xero")).toBe(true);

      // Xero token expiring in 31 minutes should not be refreshed
      const xeroConfig2: TokenConfig = {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 1860, // 31 minutes
        connected_at: new Date(currentTime).toISOString(),
      };
      expect(isTokenExpiring(xeroConfig2, "xero")).toBe(false);
    });
  });
});
