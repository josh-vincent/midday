import { describe, it, expect, beforeEach } from "bun:test";
import { MockStorageAdapter } from "../mocks";
import type { ConnectionRecord } from "../../src/core/types";

describe("MockStorageAdapter", () => {
  let storage: MockStorageAdapter;
  let testConnection: ConnectionRecord;

  beforeEach(() => {
    testConnection = {
      id: "conn_123",
      teamId: "team_456",
      userId: "user_789",
      provider: "quickbooks",
      credentials: {
        accessToken: "test_access_token",
        refreshToken: "test_refresh_token",
        expiresIn: 3600,
        connectedAt: new Date().toISOString(),
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage = new MockStorageAdapter([testConnection]);
  });

  describe("getExpiringConnections", () => {
    it("should return connections expiring within threshold", async () => {
      const connections = await storage.getExpiringConnections(60); // 60 minutes threshold
      expect(connections.length).toBe(1);
      expect(connections[0].id).toBe("conn_123");
    });

    it("should not return connections expiring outside threshold", async () => {
      const connections = await storage.getExpiringConnections(15); // 15 minutes threshold
      expect(connections.length).toBe(0);
    });

    it("should return multiple connections sorted by expiration", async () => {
      const connection2: ConnectionRecord = {
        ...testConnection,
        id: "conn_456",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      };

      const connection3: ConnectionRecord = {
        ...testConnection,
        id: "conn_789",
        expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 minutes
      };

      storage.addConnection(connection2);
      storage.addConnection(connection3);

      const connections = await storage.getExpiringConnections(60);
      expect(connections.length).toBe(3);
      expect(connections[0].id).toBe("conn_456"); // Expires soonest
      expect(connections[1].id).toBe("conn_789");
      expect(connections[2].id).toBe("conn_123");
    });
  });

  describe("getConnection", () => {
    it("should return connection by ID", async () => {
      const connection = await storage.getConnection("conn_123");
      expect(connection).toBeDefined();
      expect(connection?.id).toBe("conn_123");
    });

    it("should return null for non-existent connection", async () => {
      const connection = await storage.getConnection("non_existent");
      expect(connection).toBeNull();
    });
  });

  describe("getConnectionsByTeam", () => {
    it("should return all connections for a team", async () => {
      const connection2: ConnectionRecord = {
        ...testConnection,
        id: "conn_456",
        teamId: "team_456",
      };

      const connection3: ConnectionRecord = {
        ...testConnection,
        id: "conn_789",
        teamId: "team_different",
      };

      storage.addConnection(connection2);
      storage.addConnection(connection3);

      const connections = await storage.getConnectionsByTeam("team_456");
      expect(connections.length).toBe(2);
      expect(connections.map((c) => c.id)).toContain("conn_123");
      expect(connections.map((c) => c.id)).toContain("conn_456");
    });

    it("should return empty array for team with no connections", async () => {
      const connections = await storage.getConnectionsByTeam("team_nonexistent");
      expect(connections.length).toBe(0);
    });
  });

  describe("updateTokens", () => {
    it("should update connection tokens", async () => {
      const newTokens = {
        accessToken: "new_access_token",
        refreshToken: "new_refresh_token",
        expiresIn: 3600,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      };

      await storage.updateTokens("conn_123", newTokens);

      const updated = await storage.getConnection("conn_123");
      expect(updated?.credentials.accessToken).toBe("new_access_token");
      expect(updated?.credentials.refreshToken).toBe("new_refresh_token");
      expect(updated?.expiresAt).toBe(newTokens.expiresAt);
    });

    it("should throw error for non-existent connection", async () => {
      const newTokens = {
        accessToken: "new_access_token",
        refreshToken: "new_refresh_token",
        expiresIn: 3600,
        expiresAt: new Date().toISOString(),
      };

      await expect(
        storage.updateTokens("non_existent", newTokens)
      ).rejects.toThrow("Connection non_existent not found");
    });
  });

  describe("acquireLock and releaseLock", () => {
    it("should acquire lock successfully", async () => {
      const acquired = await storage.acquireLock("conn_123", 60000);
      expect(acquired).toBe(true);
      expect(storage.isLocked("conn_123")).toBe(true);
    });

    it("should not acquire lock if already held", async () => {
      const first = await storage.acquireLock("conn_123", 60000);
      const second = await storage.acquireLock("conn_123", 60000);

      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it("should release lock successfully", async () => {
      await storage.acquireLock("conn_123", 60000);
      expect(storage.isLocked("conn_123")).toBe(true);

      await storage.releaseLock("conn_123");
      expect(storage.isLocked("conn_123")).toBe(false);
    });

    it("should allow acquiring lock after previous lock expires", async () => {
      const first = await storage.acquireLock("conn_123", 100); // 100ms TTL
      expect(first).toBe(true);

      // Wait for lock to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const second = await storage.acquireLock("conn_123", 60000);
      expect(second).toBe(true);
    });
  });

  describe("helper methods", () => {
    it("should clear all connections", () => {
      expect(storage.getConnectionCount()).toBe(1);
      storage.clearConnections();
      expect(storage.getConnectionCount()).toBe(0);
    });

    it("should add connections", () => {
      const newConnection: ConnectionRecord = {
        ...testConnection,
        id: "conn_new",
      };

      storage.addConnection(newConnection);
      expect(storage.getConnectionCount()).toBe(2);
    });
  });
});
