import { createTRPCContext } from "@api/trpc/init";
import { appRouter } from "@api/trpc/routers/_app";
import type { Session } from "@api/utils/auth";
import type { Database } from "@midday/db/client";
import { connectDb } from "@midday/db/client";
import { sql } from "drizzle-orm";
import type { Context } from "hono";

export const mockSession: Session = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
  },
  expires_at: Date.now() + 3600000,
  aud: "authenticated",
  sub: "test-user-id",
  email: "test@example.com",
  role: "authenticated",
};

export const mockContext = (overrides?: Partial<any>) => {
  const req = {
    header: (key: string) => {
      if (key === "Authorization") {
        return "Bearer mock-token";
      }
      return null;
    },
  };

  return {
    req,
    ...overrides,
  } as unknown as Context;
};

export const createMockTRPCContext = async (overrides?: Partial<any>) => {
  const db = await connectDb();

  return {
    session: mockSession,
    supabase: {} as any,
    db,
    geo: {
      country: "US",
      locale: "en",
      timezone: "America/New_York",
    },
    teamId: "test-team-id",
    ...overrides,
  };
};

export const createTestCaller = async (ctx?: Partial<any>) => {
  const context = await createMockTRPCContext(ctx);
  return appRouter.createCaller(context);
};

export const cleanupTestData = async (db: Database, teamId: string) => {
  await db.execute(sql`DELETE FROM invoices WHERE team_id = ${teamId}`);
  await db.execute(sql`DELETE FROM customers WHERE team_id = ${teamId}`);
  await db.execute(
    sql`DELETE FROM invoice_templates WHERE team_id = ${teamId}`,
  );
  await db.execute(sql`DELETE FROM users_on_team WHERE team_id = ${teamId}`);
  await db.execute(sql`DELETE FROM teams WHERE id = ${teamId}`);
};

export const createTestTeam = async (db: Database, teamId = "test-team-id") => {
  await db.execute(sql`
    INSERT INTO teams (id, name, base_currency)
    VALUES (${teamId}, ${"Test Team"}, ${"USD"})
    ON CONFLICT (id) DO NOTHING
  `);

  return teamId;
};

export const createTestUser = async (db: Database, userId = "test-user-id") => {
  await db.execute(sql`
    INSERT INTO users (id, email, full_name)
    VALUES (${userId}, ${"test@example.com"}, ${"Test User"})
    ON CONFLICT (id) DO NOTHING
  `);

  return userId;
};

export const createTestTeamMember = async (
  db: Database,
  teamId: string,
  userId: string,
  role = "owner",
) => {
  // Check if member already exists
  const existing = await db.execute(sql`
    SELECT 1 FROM users_on_team 
    WHERE team_id = ${teamId} AND user_id = ${userId}
  `);

  if (existing.length === 0) {
    await db.execute(sql`
      INSERT INTO users_on_team (team_id, user_id, role)
      VALUES (${teamId}, ${userId}, ${role})
    `);
  }
};

export const createTestCustomer = async (
  db: Database,
  teamId: string,
  customerId = "test-customer-id",
) => {
  const token = `cust_${customerId.replace(/-/g, "")}`;
  await db.execute(sql`
    INSERT INTO customers (id, team_id, name, email, token)
    VALUES (${customerId}, ${teamId}, ${"Test Customer"}, ${"customer@example.com"}, ${token})
    ON CONFLICT (id) DO NOTHING
  `);

  return customerId;
};

export const createTestInvoice = async (
  db: Database,
  teamId: string,
  invoiceId = "test-invoice-id",
) => {
  const lineItems = JSON.stringify([
    { name: "Test Item", quantity: 1, price: 100, vat: 0 },
  ]);
  const issueDate = new Date().toISOString();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.execute(sql`
    INSERT INTO invoices (
      id, team_id, user_id, customer_id, customer_name,
      invoice_number, status, currency, amount,
      line_items, issue_date, due_date
    )
    VALUES (
      ${invoiceId}, ${teamId}, ${"test-user-id"}, ${"test-customer-id"}, ${"Test Customer"},
      ${"INV-001"}, ${"draft"}, ${"USD"}, ${100.0},
      ${lineItems}::jsonb, ${issueDate}, ${dueDate}
    )
    ON CONFLICT (id) DO NOTHING
  `);

  return invoiceId;
};
