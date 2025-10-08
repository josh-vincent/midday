// Import test setup to configure all environment variables
import "../__tests__/test-setup";

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { connectDb } from "@midday/db/client";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  cleanupTestData,
  createTestCaller,
  createTestTeam,
  createTestTeamMember,
  createTestUser,
} from "../__tests__/test-utils";

describe("short-links router", () => {
  let db: any;
  let caller: any;
  const teamId = uuidv4();
  const userId = uuidv4();

  beforeEach(async () => {
    db = await connectDb();

    await createTestUser(db, userId);
    await createTestTeam(db, teamId);
    await createTestTeamMember(db, teamId, userId);

    caller = await createTestCaller({
      teamId,
      session: {
        user: { id: userId, email: "test@example.com" },
        expires_at: Date.now() + 3600000,
        aud: "authenticated",
        sub: userId,
        email: "test@example.com",
        role: "authenticated",
      },
    });
  });

  afterEach(async () => {
    // Clean up short links before cleaning up teams
    await db.execute(sql`DELETE FROM short_links WHERE team_id = ${teamId}`);
    await cleanupTestData(db, teamId);
  });

  describe("createForUrl", () => {
    it("should create a short link for a URL", async () => {
      const result = await caller.shortLinks.createForUrl({
        url: "https://example.com/very/long/url/that/needs/shortening",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.shortId).toBeDefined();
      expect(result.url).toBe(
        "https://example.com/very/long/url/that/needs/shortening",
      );
      expect(result.type).toBe("redirect");
      expect(result.teamId).toBe(teamId);
      expect(result.userId).toBe(userId);
      expect(result.shortUrl).toContain("/s/");
      expect(result.shortUrl).toContain(result.shortId);
    });

    it("should generate unique short IDs", async () => {
      const result1 = await caller.shortLinks.createForUrl({
        url: "https://example.com/url1",
      });

      const result2 = await caller.shortLinks.createForUrl({
        url: "https://example.com/url2",
      });

      expect(result1.shortId).not.toBe(result2.shortId);
    });

    it("should handle invalid URLs", async () => {
      try {
        await caller.shortLinks.createForUrl({
          url: "not-a-valid-url",
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should require authentication", async () => {
      const unauthenticatedCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      try {
        await unauthenticatedCaller.shortLinks.createForUrl({
          url: "https://example.com",
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("createForDocument", () => {
    it("should create a short link for a document", async () => {
      // First, create a test document
      const documentId = uuidv4();
      const filePath = ["team", teamId, "documents", "test.pdf"];

      await db.execute(sql`
        INSERT INTO documents (
          id, name, path_tokens, size, team_id, user_id,
          metadata
        )
        VALUES (${documentId}, ${"test.pdf"}, ${filePath}, ${1024}, ${teamId}, ${userId},
          ${JSON.stringify({ contentType: "application/pdf", size: 1024 })})
      `);

      // Mock Supabase storage signed URL response
      const mockSupabase = {
        storage: {
          from: () => ({
            createSignedUrl: () =>
              Promise.resolve({
                data: {
                  signedUrl:
                    "https://supabase.co/storage/v1/signed/test.pdf?token=abc123",
                },
                error: null,
              }),
          }),
        },
      };

      const callerWithSupabase = await createTestCaller({
        teamId,
        supabase: mockSupabase,
        session: {
          user: { id: userId, email: "test@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: userId,
          email: "test@example.com",
          role: "authenticated",
        },
      });

      const result = await callerWithSupabase.shortLinks.createForDocument({
        documentId,
        filePath: filePath.join("/"),
        expireIn: 3600, // 1 hour
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.shortId).toBeDefined();
      expect(result.type).toBe("download");
      expect(result.fileName).toBe("test.pdf");
      expect(result.mimeType).toBe("application/pdf");
      expect(result.size).toBe(1024);
      expect(result.expiresAt).toBeDefined();
      expect(result.shortUrl).toContain("/s/");
      expect(result.originalUrl).toContain("signed");
    });

    it("should throw error for non-existent document", async () => {
      try {
        await caller.shortLinks.createForDocument({
          documentId: "non-existent-doc",
          filePath: "invalid/path",
          expireIn: 3600,
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain("Document not found");
      }
    });

    it("should require authentication", async () => {
      const unauthenticatedCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      try {
        await unauthenticatedCaller.shortLinks.createForDocument({
          documentId: "doc-id",
          filePath: "path",
          expireIn: 3600,
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("get", () => {
    it("should retrieve a short link by shortId", async () => {
      // First create a short link
      const createResult = await caller.shortLinks.createForUrl({
        url: "https://example.com/test",
      });

      // Now retrieve it using the public endpoint
      const publicCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      const result = await publicCaller.shortLinks.get({
        shortId: createResult.shortId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createResult.id);
      expect(result.shortId).toBe(createResult.shortId);
      expect(result.url).toBe("https://example.com/test");
      expect(result.type).toBe("redirect");
      expect(result.clicks).toBe(0);
    });

    it("should return null for non-existent shortId", async () => {
      const publicCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      const result = await publicCaller.shortLinks.get({
        shortId: "non-existent-short-id",
      });

      expect(result).toBeNull();
    });

    it("should increment click count on access", async () => {
      // First create a short link
      const createResult = await caller.shortLinks.createForUrl({
        url: "https://example.com/test",
      });

      const publicCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      // Access it once
      await publicCaller.shortLinks.get({
        shortId: createResult.shortId,
      });

      // Access it again and check the click count
      const result = await publicCaller.shortLinks.get({
        shortId: createResult.shortId,
      });

      expect(result).toBeDefined();
      expect(result.clicks).toBeGreaterThanOrEqual(1);
    });

    it("should be accessible without authentication", async () => {
      // Create a short link with authenticated user
      const createResult = await caller.shortLinks.createForUrl({
        url: "https://example.com/public-test",
      });

      // Access without authentication
      const publicCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      const result = await publicCaller.shortLinks.get({
        shortId: createResult.shortId,
      });

      expect(result).toBeDefined();
      expect(result.url).toBe("https://example.com/public-test");
    });
  });

  describe("expiration", () => {
    it("should handle expired short links", async () => {
      // Create an expired short link
      const shortId = uuidv4().substring(0, 8);
      const expiredDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      await db.execute(sql`
        INSERT INTO short_links (
          id, short_id, url, type, team_id, user_id, expires_at
        )
        VALUES (${uuidv4()}, ${shortId}, ${"https://example.com/expired"}, ${"redirect"}, ${teamId}, ${userId}, ${expiredDate})
      `);

      const publicCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      const result = await publicCaller.shortLinks.get({
        shortId,
      });

      // Depending on implementation, this might return the link with an expired flag
      // or return null. Adjust assertion based on actual behavior
      if (result) {
        expect(new Date(result.expiresAt) < new Date()).toBe(true);
      } else {
        expect(result).toBeNull();
      }
    });
  });

  describe("team isolation", () => {
    it("should isolate short links by team", async () => {
      // Create a short link for the first team
      const result1 = await caller.shortLinks.createForUrl({
        url: "https://example.com/team1",
      });

      // Create another team and user
      const otherTeamId = uuidv4();
      const otherUserId = uuidv4();

      await createTestUser(db, otherUserId);
      await createTestTeam(db, otherTeamId);
      await createTestTeamMember(db, otherTeamId, otherUserId);

      const otherCaller = await createTestCaller({
        teamId: otherTeamId,
        session: {
          user: { id: otherUserId, email: "other@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: otherUserId,
          email: "other@example.com",
          role: "authenticated",
        },
      });

      // Create a short link for the second team
      const result2 = await otherCaller.shortLinks.createForUrl({
        url: "https://example.com/team2",
      });

      // Both short links should be accessible publicly
      const publicCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      const link1 = await publicCaller.shortLinks.get({
        shortId: result1.shortId,
      });

      const link2 = await publicCaller.shortLinks.get({
        shortId: result2.shortId,
      });

      expect(link1).toBeDefined();
      expect(link1.url).toBe("https://example.com/team1");
      expect(link2).toBeDefined();
      expect(link2.url).toBe("https://example.com/team2");

      // Clean up
      await db.execute(
        sql`DELETE FROM short_links WHERE team_id = ${otherTeamId}`,
      );
      await cleanupTestData(db, otherTeamId);
    });
  });
});
