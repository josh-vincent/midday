import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { TokenSyncManager } from "../src/core/token-manager";
import { MockStorageAdapter, mockGlobalFetch } from "./mocks";
import type { ConnectionRecord, TokenSyncManagerConfig } from "../src";

describe("TokenSyncManager", () => {
  let storage: MockStorageAdapter;
  let manager: TokenSyncManager;
  let mockFetch: ReturnType<typeof mockGlobalFetch>;

  const createTestConnection = (
    overrides: Partial<ConnectionRecord> = {}
  ): ConnectionRecord => ({
    id: "conn_123",
    teamId: "team_456",
    userId: "user_789",
    provider: "quickbooks",
    credentials: {
      accessToken: "test_access_token",
      refreshToken: "test_refresh_token",
      expiresIn: 3600,
      connectedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(), // 50 minutes ago
    },
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    storage = new MockStorageAdapter();
    mockFetch = mockGlobalFetch();

    const config: TokenSyncManagerConfig = {
      storage,
      providers: {
        quickbooks: {
          clientId: "test_qb_client",
          clientSecret: "test_qb_secret",
        },
        xero: {
          clientId: "test_xero_client",
          clientSecret: "test_xero_secret",
        },
        gmail: {
          clientId: "test_gmail_client",
          clientSecret: "test_gmail_secret",
        },
        outlook: {
          clientId: "test_outlook_client",
          clientSecret: "test_outlook_secret",
        },
      },
      scheduler: {
        thresholdMinutes: 60,
        retryAttempts: 2,
        retryDelayMs: 100,
      },
    };

    manager = new TokenSyncManager(config);
  });

  afterEach(() => {
    if (mockFetch) {
      mockFetch.restore();
    }
  });

  describe("refreshExpiringTokens", () => {
    it("should refresh expiring tokens successfully", async () => {
      const connection = createTestConnection();
      storage.addConnection(connection);

      const results = await manager.refreshExpiringTokens();

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].connectionId).toBe("conn_123");
      expect(results[0].provider).toBe("quickbooks");
    });

    it("should return empty array when no tokens are expiring", async () => {
      const connection = createTestConnection({
        expiresAt: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // 2 hours from now
      });
      storage.addConnection(connection);

      const results = await manager.refreshExpiringTokens();

      expect(results.length).toBe(0);
    });

    it("should process multiple connections", async () => {
      storage.addConnection(createTestConnection({ id: "conn_1" }));
      storage.addConnection(createTestConnection({ id: "conn_2", provider: "xero" }));
      storage.addConnection(createTestConnection({ id: "conn_3" }));

      const results = await manager.refreshExpiringTokens();

      expect(results.length).toBe(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it("should handle refresh failures gracefully", async () => {
      mockFetch.restore();
      mockFetch = mockGlobalFetch({ shouldFail: true });

      const connection = createTestConnection();
      storage.addConnection(connection);

      const results = await manager.refreshExpiringTokens();

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain("Token refresh failed");
    });

    it("should update tokens in storage after successful refresh", async () => {
      const connection = createTestConnection();
      storage.addConnection(connection);

      await manager.refreshExpiringTokens();

      const updated = await storage.getConnection("conn_123");
      expect(updated?.credentials.accessToken).toContain("new_access_token");
      expect(updated?.credentials.refreshToken).toContain("new_refresh_token");
    });
  });

  describe("refreshConnection", () => {
    it("should refresh specific connection", async () => {
      const connection = createTestConnection();
      storage.addConnection(connection);

      const result = await manager.refreshConnection("conn_123", "quickbooks");

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe("conn_123");
    });

    it("should handle connection not found", async () => {
      const result = await manager.refreshConnection("non_existent", "quickbooks");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should skip refresh if token not yet expiring", async () => {
      const connection = createTestConnection({
        expiresAt: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // 2 hours from now
        credentials: {
          accessToken: "test_access_token",
          refreshToken: "test_refresh_token",
          expiresIn: 7200, // 2 hours
          connectedAt: new Date().toISOString(), // Just now
        },
      });
      storage.addConnection(connection);

      const result = await manager.refreshConnection("conn_123", "quickbooks");

      expect(result.success).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("not yet expiring");
    });

    it("should use distributed locking", async () => {
      const connection = createTestConnection();
      storage.addConnection(connection);

      // Acquire lock manually
      await storage.acquireLock("conn_123", 60000);

      const result = await manager.refreshConnection("conn_123", "quickbooks");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Lock already held");
    });

    it("should release lock after refresh", async () => {
      const connection = createTestConnection();
      storage.addConnection(connection);

      await manager.refreshConnection("conn_123", "quickbooks");

      expect(storage.isLocked("conn_123")).toBe(false);
    });

    it("should release lock even if refresh fails", async () => {
      mockFetch.restore();
      mockFetch = mockGlobalFetch({ shouldFail: true });

      const connection = createTestConnection();
      storage.addConnection(connection);

      await manager.refreshConnection("conn_123", "quickbooks");

      expect(storage.isLocked("conn_123")).toBe(false);
    });
  });

  describe("refreshTeamTokens", () => {
    it("should refresh all tokens for a team", async () => {
      storage.addConnection(createTestConnection({ id: "conn_1", teamId: "team_456" }));
      storage.addConnection(createTestConnection({ id: "conn_2", teamId: "team_456" }));
      storage.addConnection(createTestConnection({ id: "conn_3", teamId: "team_different" }));

      const results = await manager.refreshTeamTokens("team_456");

      expect(results.length).toBe(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it("should return empty array for team with no connections", async () => {
      const results = await manager.refreshTeamTokens("team_nonexistent");

      expect(results.length).toBe(0);
    });
  });

  describe("checkTokenStatus", () => {
    it("should return correct token status", async () => {
      const connection = createTestConnection({
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });
      storage.addConnection(connection);

      const status = await manager.checkTokenStatus("conn_123");

      expect(status.needsRefresh).toBe(true); // Threshold is 60 minutes
      expect(status.expiresAt).toBeDefined();
      expect(status.minutesUntilExpiry).toBeGreaterThan(0);
      expect(status.minutesUntilExpiry).toBeLessThan(15);
    });

    it("should indicate no refresh needed when not expiring", async () => {
      const connection = createTestConnection({
        expiresAt: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // 2 hours
        credentials: {
          accessToken: "test_access_token",
          refreshToken: "test_refresh_token",
          expiresIn: 7200, // 2 hours
          connectedAt: new Date().toISOString(), // Just now
        },
      });
      storage.addConnection(connection);

      const status = await manager.checkTokenStatus("conn_123");

      expect(status.needsRefresh).toBe(false);
    });

    it("should throw error for non-existent connection", async () => {
      await expect(
        manager.checkTokenStatus("non_existent")
      ).rejects.toThrow("not found");
    });
  });

  describe("retry logic", () => {
    it("should retry failed refreshes", async () => {
      let attemptCount = 0;

      mockFetch.restore();
      globalThis.fetch = async (url: any, init?: any) => {
        attemptCount++;
        if (attemptCount < 2) {
          // Fail first attempt
          return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
        }
        // Succeed on second attempt
        return new Response(
          JSON.stringify({
            access_token: "new_access_token",
            refresh_token: "new_refresh_token",
            expires_in: 3600,
            token_type: "bearer",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      const connection = createTestConnection();
      storage.addConnection(connection);

      const result = await manager.refreshConnection("conn_123", "quickbooks");

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(2); // First attempt failed, second succeeded
    });

    it("should fail after max retry attempts", async () => {
      mockFetch.restore();
      mockFetch = mockGlobalFetch({ shouldFail: true });

      const connection = createTestConnection();
      storage.addConnection(connection);

      const result = await manager.refreshConnection("conn_123", "quickbooks");

      expect(result.success).toBe(false);
    });
  });

  describe("batch processing", () => {
    it("should process connections in batches", async () => {
      // Add 15 connections (batch size is 10)
      for (let i = 0; i < 15; i++) {
        storage.addConnection(createTestConnection({ id: `conn_${i}` }));
      }

      const results = await manager.refreshExpiringTokens();

      expect(results.length).toBe(15);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe("custom logger", () => {
    it("should use custom logger if provided", async () => {
      const logs: string[] = [];

      const customLogger = {
        info: (msg: string, data?: any) => logs.push(`INFO: ${msg}`),
        warn: (msg: string, data?: any) => logs.push(`WARN: ${msg}`),
        error: (msg: string, data?: any) => logs.push(`ERROR: ${msg}`),
        debug: (msg: string, data?: any) => logs.push(`DEBUG: ${msg}`),
      };

      const customManager = new TokenSyncManager({
        storage,
        providers: {
          quickbooks: { clientId: "test", clientSecret: "test" },
          xero: { clientId: "test", clientSecret: "test" },
          gmail: { clientId: "test", clientSecret: "test" },
          outlook: { clientId: "test", clientSecret: "test" },
        },
        logger: customLogger,
      });

      const connection = createTestConnection();
      storage.addConnection(connection);

      await customManager.refreshExpiringTokens();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.includes("INFO"))).toBe(true);
    });
  });
});
