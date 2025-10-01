import { describe, test, expect } from "bun:test";
import { connectDb } from "@midday/db/client";
import { sql } from "drizzle-orm";

describe("Direct Database Connection", () => {
  test("should connect and verify jobs table", async () => {
    const db = await connectDb();
    expect(db).toBeDefined();

    // Test 1: Check if jobs table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs'
      ) as exists
    `);

    const tableExists = tableCheck.rows[0].exists;
    expect(tableExists).toBe(true);

    if (tableExists) {
      // If jobs table exists, check its structure
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'jobs'
        ORDER BY ordinal_position
      `);

      expect(columns.rows.length).toBeGreaterThan(0);
      
      // Check for required columns
      const columnNames = columns.rows.map(col => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('team_id');
      expect(columnNames).toContain('status');

      // Count rows
      const countResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM jobs`,
      );
      expect(countResult.rows[0].count).toBeDefined();
    }
  });
});
