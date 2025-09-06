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

describe("jobs router", () => {
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
    // Clean up jobs before cleaning up teams
    await db.execute(sql`DELETE FROM jobs WHERE team_id = ${teamId}`);
    await cleanupTestData(db, teamId);
  });

  describe("list", () => {
    it("should list all jobs for the team", async () => {
      // Create test job
      const jobId = uuidv4();
      await db.execute(sql`
        INSERT INTO jobs (
          id, team_id, created_by, customer_name, dump_location, 
          scheduled_date, quantity, price_per_unit, status
        )
        VALUES (${jobId}, ${teamId}, ${userId}, ${"Test Customer"}, ${"123 Main St"},
        ${new Date().toISOString()}, ${10}, ${50.0}, ${"pending"})
      `);

      const result = await caller.job.list();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].teamId).toBe(teamId);
    });

    it("should return empty array when no team ID", async () => {
      const callerNoTeam = await createTestCaller({
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

      const result = await callerNoTeam.job.list();
      expect(result).toEqual([]);
    });
  });

  describe("listByDateRange", () => {
    it("should list jobs within date range", async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await caller.job.listByDateRange({
        startDate: yesterday.toISOString(),
        endDate: tomorrow.toISOString(),
      });

      expect(result).toBeInstanceOf(Array);
    });

    it("should filter jobs by status", async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await caller.job.listByDateRange({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        status: "pending",
      });

      expect(result).toBeInstanceOf(Array);
    });

    it("should return empty array when no team ID", async () => {
      const callerNoTeam = await createTestCaller({
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

      const result = await callerNoTeam.job.listByDateRange({
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      });

      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create a new job", async () => {
      const jobData = {
        customerName: "New Customer",
        description: "Test job description",
        dumpLocation: "456 Oak Ave",
        scheduledDate: new Date().toISOString(),
        quantity: 5,
        pricePerUnit: 100.5,
        status: "pending" as const,
      };

      const result = await caller.job.create(jobData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.teamId).toBe(teamId);
      expect(result.customerName).toBe(jobData.customerName);
      expect(result.description).toBe(jobData.description);
      expect(result.dumpLocation).toBe(jobData.dumpLocation);
      expect(result.quantity).toBe(jobData.quantity);
      expect(result.pricePerUnit).toBe(jobData.pricePerUnit);
      expect(result.status).toBe(jobData.status);
      expect(result.createdBy).toBe(userId);
    });

    it("should create job with minimal data", async () => {
      const minimalJobData = {
        customerName: "Minimal Customer",
        dumpLocation: "789 Pine St",
        scheduledDate: new Date().toISOString(),
        quantity: 1,
        pricePerUnit: 25.0,
      };

      const result = await caller.job.create(minimalJobData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.customerName).toBe(minimalJobData.customerName);
      expect(result.status).toBe("pending"); // default status
    });

    it("should throw error when no team ID", async () => {
      const callerNoTeam = await createTestCaller({
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

      try {
        await callerNoTeam.job.create({
          customerName: "Test Customer",
          dumpLocation: "123 Main St",
          scheduledDate: new Date().toISOString(),
          quantity: 1,
          pricePerUnit: 50.0,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
        expect(error.message).toContain("No team selected");
      }
    });

    it("should validate required fields", async () => {
      try {
        await caller.job.create({
          customerName: "",
          dumpLocation: "123 Main St",
          scheduledDate: new Date().toISOString(),
          quantity: 1,
          pricePerUnit: 50.0,
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("update", () => {
    it("should update an existing job", async () => {
      // Create a job first
      const jobId = uuidv4();
      await db.execute(sql`
        INSERT INTO jobs (
          id, team_id, created_by, customer_name, dump_location, 
          scheduled_date, quantity, price_per_unit, status
        )
        VALUES (${jobId}, ${teamId}, ${userId}, ${"Original Customer"}, ${"123 Main St"},
        ${new Date().toISOString()}, ${10}, ${50.0}, ${"pending"})
      `);

      const updateData = {
        id: jobId,
        customerName: "Updated Customer",
        description: "Updated description",
        quantity: 15,
        status: "in_progress" as const,
      };

      const result = await caller.job.update(updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(jobId);
      expect(result.customerName).toBe(updateData.customerName);
      expect(result.description).toBe(updateData.description);
      expect(result.quantity).toBe(updateData.quantity);
      expect(result.status).toBe(updateData.status);
    });

    it("should partially update a job", async () => {
      // Create a job first
      const jobId = uuidv4();
      await db.execute(sql`
        INSERT INTO jobs (
          id, team_id, created_by, customer_name, dump_location, 
          scheduled_date, quantity, price_per_unit, status
        )
        VALUES (${jobId}, ${teamId}, ${userId}, ${"Original Customer"}, ${"123 Main St"},
        ${new Date().toISOString()}, ${10}, ${50.0}, ${"pending"})
      `);

      const partialUpdate = {
        id: jobId,
        status: "completed" as const,
        completedDate: new Date().toISOString(),
      };

      const result = await caller.job.update(partialUpdate);

      expect(result).toBeDefined();
      expect(result.id).toBe(jobId);
      expect(result.status).toBe(partialUpdate.status);
      expect(result.completedDate).toBeDefined();
      expect(result.customerName).toBe("Original Customer"); // unchanged
    });

    it("should handle updating non-existent job", async () => {
      const updateData = {
        id: "non-existent-id",
        customerName: "Should not update",
      };

      const result = await caller.job.update(updateData);
      expect(result.affectedRows).toBe(0);
    });
  });

  describe("delete", () => {
    it("should delete an existing job", async () => {
      // Create a job first
      const jobId = uuidv4();
      await db.execute(sql`
        INSERT INTO jobs (
          id, team_id, created_by, customer_name, dump_location, 
          scheduled_date, quantity, price_per_unit, status
        )
        VALUES (${jobId}, ${teamId}, ${userId}, ${"To Delete Customer"}, ${"123 Main St"},
        ${new Date().toISOString()}, ${10}, ${50.0}, ${"pending"})
      `);

      const result = await caller.job.delete({ id: jobId });

      expect(result).toBeDefined();
      expect(result.id).toBe(jobId);

      // Verify the job is deleted
      const checkDeleted = await db.execute(
        sql`SELECT id FROM jobs WHERE id = ${jobId}`,
      );
      expect(checkDeleted.rows.length).toBe(0);
    });

    it("should handle deleting non-existent job", async () => {
      const result = await caller.job.delete({ id: "non-existent-id" });
      expect(result.affectedRows).toBe(0);
    });
  });

  describe("authorization", () => {
    it("should require authentication", async () => {
      const unauthenticatedCaller = await createTestCaller({
        teamId: undefined,
        session: null,
      });

      try {
        await unauthenticatedCaller.job.list();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should enforce team isolation", async () => {
      // Create another team and job
      const otherTeamId = uuidv4();
      await createTestTeam(db, otherTeamId);

      const otherJobId = uuidv4();
      await db.execute(sql`
        INSERT INTO jobs (
          id, team_id, created_by, customer_name, dump_location, 
          scheduled_date, quantity, price_per_unit, status
        )
        VALUES (${otherJobId}, ${otherTeamId}, ${userId}, ${"Other Team Job"}, ${"999 Other St"},
        ${new Date().toISOString()}, ${1}, ${100.0}, ${"pending"})
      `);

      // Try to update job from another team
      const result = await caller.job.update({
        id: otherJobId,
        customerName: "Should not update",
      });

      expect(result.affectedRows).toBe(0);

      // Verify the job wasn't updated
      const checkJob = await db.execute(
        sql`SELECT customer_name FROM jobs WHERE id = ${otherJobId}`,
      );
      expect(checkJob.rows[0].customer_name).toBe("Other Team Job");
    });
  });
});
