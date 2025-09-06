import { connectDb } from "@midday/db/client";
import { sql } from "drizzle-orm";

async function checkTables() {
  const db = await connectDb();
  
  console.log("Checking existing tables in database...\n");
  
  // Query to list all tables
  const tables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log("Tables found:");
  tables.rows.forEach(row => {
    console.log(`  - ${row.table_name}`);
  });
  
  // Check specifically for tags table
  const hasTags = tables.rows.some(row => row.table_name === 'tags');
  console.log(`\n✅ Tags table exists: ${hasTags}`);
  
  if (!hasTags) {
    console.log("\n❌ Tags table is missing!");
  }
  
  // Check for document_tags which might be the actual table name
  const hasDocumentTags = tables.rows.some(row => row.table_name === 'document_tags');
  console.log(`✅ Document_tags table exists: ${hasDocumentTags}`);
  
  process.exit(0);
}

checkTables().catch(console.error);