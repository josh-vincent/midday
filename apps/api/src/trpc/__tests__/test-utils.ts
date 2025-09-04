import { createTRPCContext } from "@api/trpc/init";
import { appRouter } from "@api/trpc/routers/_app";
import type { Database } from "@midday/db/client";
import { connectDb } from "@midday/db/client";
import type { Session } from "@api/utils/auth";
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
  await db.execute(`DELETE FROM invoices WHERE team_id = $1`, [teamId]);
  await db.execute(`DELETE FROM customers WHERE team_id = $1`, [teamId]);
  await db.execute(`DELETE FROM invoice_templates WHERE team_id = $1`, [teamId]);
  await db.execute(`DELETE FROM team_members WHERE team_id = $1`, [teamId]);
  await db.execute(`DELETE FROM teams WHERE id = $1`, [teamId]);
};

export const createTestTeam = async (db: Database, teamId: string = "test-team-id") => {
  await db.execute(`
    INSERT INTO teams (id, name, base_currency)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
  `, [teamId, "Test Team", "USD"]);
  
  return teamId;
};

export const createTestUser = async (db: Database, userId: string = "test-user-id") => {
  await db.execute(`
    INSERT INTO users (id, email, full_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
  `, [userId, "test@example.com", "Test User"]);
  
  return userId;
};

export const createTestTeamMember = async (
  db: Database,
  teamId: string,
  userId: string,
  role: string = "owner"
) => {
  await db.execute(`
    INSERT INTO team_members (team_id, user_id, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (team_id, user_id) DO NOTHING
  `, [teamId, userId, role]);
};

export const createTestCustomer = async (
  db: Database,
  teamId: string,
  customerId: string = "test-customer-id"
) => {
  await db.execute(`
    INSERT INTO customers (id, team_id, name, email, user_id)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
  `, [customerId, teamId, "Test Customer", "customer@example.com", "test-user-id"]);
  
  return customerId;
};

export const createTestInvoice = async (
  db: Database,
  teamId: string,
  invoiceId: string = "test-invoice-id"
) => {
  await db.execute(`
    INSERT INTO invoices (
      id, team_id, user_id, customer_id, customer_name,
      invoice_number, status, currency, amount,
      line_items, issue_date, due_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (id) DO NOTHING
  `, [
    invoiceId,
    teamId,
    "test-user-id",
    "test-customer-id",
    "Test Customer",
    "INV-001",
    "draft",
    "USD",
    100.00,
    JSON.stringify([{ name: "Test Item", quantity: 1, price: 100, vat: 0 }]),
    new Date().toISOString(),
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  ]);
  
  return invoiceId;
};