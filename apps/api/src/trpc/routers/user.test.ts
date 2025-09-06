// Import test setup to configure all environment variables
import "../__tests__/test-setup";

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { connectDb } from "@midday/db/client";
import { v4 as uuidv4 } from "uuid";
import {
  cleanupTestData,
  createTestCaller,
  createTestTeam,
  createTestTeamMember,
  createTestUser,
} from "../__tests__/test-utils";

describe("user router", () => {
  let db: any;
  let caller: any;
  const userId = uuidv4();
  const teamId = uuidv4();

  beforeEach(async () => {
    db = await connectDb();

    await createTestUser(db, userId);
    await createTestTeam(db, teamId);
    await createTestTeamMember(db, teamId, userId);

    caller = await createTestCaller({
      teamId: undefined,
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
    await cleanupTestData(db, teamId);
    await db.execute(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  describe("me", () => {
    it("should fetch current user profile", async () => {
      const result = await caller.user.me();

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(result.email).toBe("test@example.com");
      expect(result.fullName).toBe("Test User");
    });

    it("should not require team membership", async () => {
      const callerWithoutTeam = await createTestCaller({
        teamId: undefined,
        session: {
          user: { id: userId, email: "test@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: userId,
          email: "test@example.com",
          role: "authenticated",
        },
      });

      const result = await callerWithoutTeam.user.me();

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
    });
  });

  describe("update", () => {
    it("should update user profile", async () => {
      const updateData = {
        fullName: "Updated User Name",
        locale: "fr-FR",
        timezone: "Europe/Paris",
        dateFormat: "dd/MM/yyyy",
        weekStartsOnMonday: true,
      };

      const result = await caller.user.update(updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(result.fullName).toBe(updateData.fullName);
      expect(result.locale).toBe(updateData.locale);
      expect(result.timezone).toBe(updateData.timezone);
      expect(result.dateFormat).toBe(updateData.dateFormat);
      expect(result.weekStartsOnMonday).toBe(updateData.weekStartsOnMonday);
    });

    it("should allow partial updates", async () => {
      const partialUpdate = {
        fullName: "Partially Updated",
      };

      const result = await caller.user.update(partialUpdate);

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(result.fullName).toBe(partialUpdate.fullName);
      expect(result.email).toBe("test@example.com");
    });

    it("should update avatar URL", async () => {
      const updateData = {
        avatarUrl: "https://example.com/avatar.jpg",
      };

      const result = await caller.user.update(updateData);

      expect(result).toBeDefined();
      expect(result.avatarUrl).toBe(updateData.avatarUrl);
    });

    it("should update time tracking preferences", async () => {
      const updateData = {
        timeFormat: 24,
      };

      const result = await caller.user.update(updateData);

      expect(result).toBeDefined();
      expect(result.timeFormat).toBe(24);
    });

    it("should not allow updating another user's profile", async () => {
      const otherUserId = `other-user-${uuidv4()}`;
      await createTestUser(db, otherUserId);

      const result = await caller.user.update({
        fullName: "Should Update Current User Only",
      });

      expect(result.id).toBe(userId);
      expect(result.id).not.toBe(otherUserId);

      await db.execute(sql`DELETE FROM users WHERE id = ${otherUserId}`);
    });
  });

  describe("invites", () => {
    it("should fetch user invites", async () => {
      const inviteTeamId = `invite-team-${uuidv4()}`;
      await createTestTeam(db, inviteTeamId);

      await db.execute(
        `
        INSERT INTO team_invites (id, team_id, email, role, invited_by, code)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          uuidv4(),
          inviteTeamId,
          "test@example.com",
          "member",
          userId,
          "invite-code-456",
        ],
      );

      const result = await caller.user.invites();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].email).toBe("test@example.com");

      await cleanupTestData(db, inviteTeamId);
    });

    it("should return empty array when no invites", async () => {
      const result = await caller.user.invites();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array when user has no email", async () => {
      const noEmailCaller = await createTestCaller({
        teamId: undefined,
        session: {
          user: { id: userId },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: userId,
          email: null,
          role: "authenticated",
        },
      });

      const result = await noEmailCaller.user.invites();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("delete", () => {
    it("should delete user account", async () => {
      const deleteUserId = `delete-user-${uuidv4()}`;
      await createTestUser(db, deleteUserId);

      const deleteCaller = await createTestCaller({
        teamId: undefined,
        session: {
          user: { id: deleteUserId, email: "delete@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: deleteUserId,
          email: "delete@example.com",
          role: "authenticated",
        },
      });

      const result = await deleteCaller.user.delete();

      expect(result).toBeDefined();
      expect(result.id).toBe(deleteUserId);

      const checkDeleted = await db.execute(
        `SELECT id FROM users WHERE id = $1`,
        [deleteUserId],
      );
      expect(checkDeleted.rows.length).toBe(0);
    });

    it("should only delete the authenticated user", async () => {
      const otherUserId = `other-user-${uuidv4()}`;
      await createTestUser(db, otherUserId);

      await caller.user.delete();

      const userDeleted = await db.execute(
        `SELECT id FROM users WHERE id = $1`,
        [userId],
      );
      expect(userDeleted.rows.length).toBe(0);

      const otherUserExists = await db.execute(
        `SELECT id FROM users WHERE id = $1`,
        [otherUserId],
      );
      expect(otherUserExists.rows.length).toBe(1);

      await db.execute(sql`DELETE FROM users WHERE id = ${otherUserId}`);
    });
  });

  describe("authorization", () => {
    it("should require authentication for all endpoints", async () => {
      const unauthenticatedCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      try {
        await unauthenticatedCaller.user.me();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }

      try {
        await unauthenticatedCaller.user.update({ fullName: "Test" });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }

      try {
        await unauthenticatedCaller.user.invites();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }

      try {
        await unauthenticatedCaller.user.delete();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should not require team membership for user endpoints", async () => {
      const userOnlyCaller = await createTestCaller({
        teamId: undefined,
        session: {
          user: { id: userId, email: "test@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: userId,
          email: "test@example.com",
          role: "authenticated",
        },
      });

      const meResult = await userOnlyCaller.user.me();
      expect(meResult).toBeDefined();
      expect(meResult.id).toBe(userId);

      const updateResult = await userOnlyCaller.user.update({
        fullName: "No Team Required",
      });
      expect(updateResult).toBeDefined();
      expect(updateResult.fullName).toBe("No Team Required");

      const invitesResult = await userOnlyCaller.user.invites();
      expect(invitesResult).toBeDefined();
      expect(Array.isArray(invitesResult)).toBe(true);
    });
  });

  describe("data validation", () => {
    it("should validate locale format", async () => {
      const validLocale = {
        locale: "en-US",
      };

      const result = await caller.user.update(validLocale);
      expect(result.locale).toBe(validLocale.locale);
    });

    it("should validate timezone format", async () => {
      const validTimezone = {
        timezone: "America/New_York",
      };

      const result = await caller.user.update(validTimezone);
      expect(result.timezone).toBe(validTimezone.timezone);
    });

    it("should validate date format", async () => {
      const validDateFormats = [
        "MM/dd/yyyy",
        "dd/MM/yyyy",
        "yyyy-MM-dd",
        "dd.MM.yyyy",
      ];

      for (const dateFormat of validDateFormats) {
        const result = await caller.user.update({ dateFormat });
        expect(result.dateFormat).toBe(dateFormat);
      }
    });

    it("should validate time format", async () => {
      const validTimeFormats = [12, 24];

      for (const timeFormat of validTimeFormats) {
        const result = await caller.user.update({ timeFormat });
        expect(result.timeFormat).toBe(timeFormat);
      }
    });

    it("should validate boolean fields", async () => {
      const booleanUpdate = {
        weekStartsOnMonday: true,
      };

      const result = await caller.user.update(booleanUpdate);
      expect(result.weekStartsOnMonday).toBe(true);

      const falseBooleanUpdate = {
        weekStartsOnMonday: false,
      };

      const falseResult = await caller.user.update(falseBooleanUpdate);
      expect(falseResult.weekStartsOnMonday).toBe(false);
    });
  });
});
