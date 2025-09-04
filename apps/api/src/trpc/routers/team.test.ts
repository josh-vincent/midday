// Set up environment variables
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_resend_key";
process.env.RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "test_audience_id";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test_anon_key";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test_service_key";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { connectDb } from "@midday/db/client";
import {
  createTestCaller,
  createTestTeam,
  createTestUser,
  createTestTeamMember,
  cleanupTestData,
} from "../__tests__/test-utils";
import { v4 as uuidv4 } from "uuid";

describe("team router", () => {
  let db: any;
  let caller: any;
  const teamId = `test-team-${uuidv4()}`;
  const userId = `test-user-${uuidv4()}`;
  const otherUserId = `test-other-user-${uuidv4()}`;

  beforeEach(async () => {
    db = await connectDb();
    
    await createTestUser(db, userId);
    await createTestUser(db, otherUserId);
    await createTestTeam(db, teamId);
    await createTestTeamMember(db, teamId, userId, "owner");
    
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
    await cleanupTestData(db, teamId);
  });

  describe("current", () => {
    it("should fetch current team details", async () => {
      const result = await caller.team.current();
      
      expect(result).toBeDefined();
      expect(result.id).toBe(teamId);
      expect(result.name).toBe("Test Team");
      expect(result.baseCurrency).toBe("USD");
    });

    it("should return null when no teamId in context", async () => {
      const callerWithoutTeam = await createTestCaller({
        teamId: null,
        session: {
          user: { id: userId, email: "test@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: userId,
          email: "test@example.com",
          role: "authenticated",
        },
      });
      
      const result = await callerWithoutTeam.team.current();
      expect(result).toBeNull();
    });
  });

  describe("members", () => {
    it("should fetch team members", async () => {
      await createTestTeamMember(db, teamId, otherUserId, "member");
      
      const result = await caller.team.members();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((m: any) => m.userId === userId)).toBe(true);
      expect(result.some((m: any) => m.userId === otherUserId)).toBe(true);
    });

    it("should include member details", async () => {
      const result = await caller.team.members();
      
      expect(result).toBeDefined();
      expect(result[0]).toHaveProperty("teamId");
      expect(result[0]).toHaveProperty("userId");
      expect(result[0]).toHaveProperty("role");
      expect(result[0]).toHaveProperty("joinedAt");
    });
  });

  describe("teams", () => {
    it("should fetch all teams for the current user", async () => {
      const additionalTeamId = `test-additional-team-${uuidv4()}`;
      await createTestTeam(db, additionalTeamId);
      await createTestTeamMember(db, additionalTeamId, userId, "member");
      
      const result = await caller.team.teams();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((t: any) => t.id === teamId)).toBe(true);
      expect(result.some((t: any) => t.id === additionalTeamId)).toBe(true);
      
      await cleanupTestData(db, additionalTeamId);
    });
  });

  describe("invites", () => {
    it("should fetch team invites", async () => {
      await db.execute(`
        INSERT INTO team_invites (id, team_id, email, role, invited_by, code)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        uuidv4(),
        teamId,
        "invited@example.com",
        "member",
        userId,
        "invite-code-123",
      ]);
      
      const result = await caller.team.invites();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].email).toBe("invited@example.com");
    });
  });

  describe("create", () => {
    it("should create a new team", async () => {
      const newTeamData = {
        name: "New Test Team",
        baseCurrency: "EUR",
      };
      
      const result = await caller.team.create(newTeamData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(newTeamData.name);
      expect(result.baseCurrency).toBe(newTeamData.baseCurrency);
      
      await cleanupTestData(db, result.id);
    });
  });

  describe("updateById", () => {
    it("should update team details", async () => {
      const updateData = {
        name: "Updated Team Name",
        logoUrl: "https://example.com/new-logo.png",
      };
      
      const result = await caller.team.updateById(updateData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(teamId);
      expect(result.name).toBe(updateData.name);
      expect(result.logoUrl).toBe(updateData.logoUrl);
    });
  });

  describe("updateBaseCurrency", () => {
    it("should update team base currency", async () => {
      const result = await caller.team.updateBaseCurrency({
        baseCurrency: "GBP",
        exchangeRates: [
          { rate: 1.2, currency: "USD", date: new Date().toISOString() },
          { rate: 0.85, currency: "EUR", date: new Date().toISOString() },
        ],
      });
      
      expect(result).toBeDefined();
      expect(result.baseCurrency).toBe("GBP");
    });
  });

  describe("inviteMembers", () => {
    it("should invite new members", async () => {
      const inviteData = {
        invites: [
          { email: "new1@example.com", role: "member" as const },
          { email: "new2@example.com", role: "member" as const },
        ],
      };
      
      const result = await caller.team.inviteMembers(inviteData);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result.some((i: any) => i.email === "new1@example.com")).toBe(true);
      expect(result.some((i: any) => i.email === "new2@example.com")).toBe(true);
    });
  });

  describe("deleteInvite", () => {
    it("should delete a team invite", async () => {
      const inviteId = uuidv4();
      await db.execute(`
        INSERT INTO team_invites (id, team_id, email, role, invited_by, code)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        inviteId,
        teamId,
        "to-delete@example.com",
        "member",
        userId,
        "delete-code-123",
      ]);
      
      const result = await caller.team.deleteInvite({ id: inviteId });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(inviteId);
    });
  });

  describe("acceptInvite", () => {
    it("should accept a team invite", async () => {
      const inviteCode = "accept-code-123";
      await db.execute(`
        INSERT INTO team_invites (id, team_id, email, role, invited_by, code)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        uuidv4(),
        teamId,
        "test@example.com",
        "member",
        userId,
        inviteCode,
      ]);
      
      const result = await caller.team.acceptInvite({ code: inviteCode });
      
      expect(result).toBeDefined();
      expect(result.teamId).toBe(teamId);
    });
  });

  describe("declineInvite", () => {
    it("should decline a team invite", async () => {
      const inviteCode = "decline-code-123";
      const inviteId = uuidv4();
      await db.execute(`
        INSERT INTO team_invites (id, team_id, email, role, invited_by, code)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        inviteId,
        teamId,
        "test@example.com",
        "member",
        userId,
        inviteCode,
      ]);
      
      const result = await caller.team.declineInvite({ code: inviteCode });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(inviteId);
    });
  });

  describe("updateMember", () => {
    it("should update team member role", async () => {
      await createTestTeamMember(db, teamId, otherUserId, "member");
      
      const result = await caller.team.updateMember({
        userId: otherUserId,
        role: "admin",
      });
      
      expect(result).toBeDefined();
      expect(result.role).toBe("admin");
    });

    it("should not allow owner to update their own role", async () => {
      try {
        await caller.team.updateMember({
          userId,
          role: "member",
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("deleteMember", () => {
    it("should remove a team member", async () => {
      await createTestTeamMember(db, teamId, otherUserId, "member");
      
      const result = await caller.team.deleteMember({ userId: otherUserId });
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(otherUserId);
      
      const members = await caller.team.members();
      expect(members.some((m: any) => m.userId === otherUserId)).toBe(false);
    });

    it("should not allow owner to remove themselves", async () => {
      try {
        await caller.team.deleteMember({ userId });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("leave", () => {
    it("should allow member to leave team", async () => {
      const memberCaller = await createTestCaller({
        teamId,
        session: {
          user: { id: otherUserId, email: "other@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: otherUserId,
          email: "other@example.com",
          role: "authenticated",
        },
      });
      
      await createTestTeamMember(db, teamId, otherUserId, "member");
      
      const result = await memberCaller.team.leave();
      
      expect(result).toBeDefined();
      expect(result.userId).toBe(otherUserId);
    });

    it("should not allow owner to leave team", async () => {
      try {
        await caller.team.leave();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("delete", () => {
    it("should delete team (owner only)", async () => {
      const tempTeamId = `temp-team-${uuidv4()}`;
      await createTestTeam(db, tempTeamId);
      await createTestTeamMember(db, tempTeamId, userId, "owner");
      
      const tempCaller = await createTestCaller({
        teamId: tempTeamId,
        session: {
          user: { id: userId, email: "test@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: userId,
          email: "test@example.com",
          role: "authenticated",
        },
      });
      
      const result = await tempCaller.team.delete();
      
      expect(result).toBeDefined();
      expect(result.id).toBe(tempTeamId);
    });

    it("should not allow non-owner to delete team", async () => {
      await createTestTeamMember(db, teamId, otherUserId, "admin");
      
      const adminCaller = await createTestCaller({
        teamId,
        session: {
          user: { id: otherUserId, email: "other@example.com" },
          expires_at: Date.now() + 3600000,
          aud: "authenticated",
          sub: otherUserId,
          email: "other@example.com",
          role: "authenticated",
        },
      });
      
      try {
        await adminCaller.team.delete();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("authorization", () => {
    it("should require authentication for all endpoints", async () => {
      const unauthenticatedCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });
      
      try {
        await unauthenticatedCaller.team.current();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});