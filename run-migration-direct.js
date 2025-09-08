import postgres from 'postgres';
import fs from 'fs';

const sql = postgres('postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres');

async function runMigration() {
  console.log('Running database migration...');
  
  try {
    // Run the migration SQL directly
    const migrationSQL = fs.readFileSync('./run_this_migration.sql', 'utf8');
    
    // Execute the entire migration as one transaction
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Test the functions
    console.log('\nTesting functions...');
    const testTeamId = '45ef1539-1fec-4d7c-9465-d707fc288da5';
    
    // Test get_next_invoice_number
    try {
      const result = await sql`SELECT get_next_invoice_number(${testTeamId}) as next_number`;
      console.log('✓ get_next_invoice_number works:', result[0].next_number);
    } catch (err) {
      console.log('✗ get_next_invoice_number error:', err.message);
    }
    
    // Test get_payment_score
    try {
      const result = await sql`SELECT * FROM get_payment_score(${testTeamId})`;
      console.log('✓ get_payment_score works:', result[0]);
    } catch (err) {
      console.log('✗ get_payment_score error:', err.message);
    }
    
    // Check if columns were added
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name IN ('invoice_no_label', 'issue_date_label', 'due_date_label')
    `;
    console.log(`\n✓ Added ${columns.length} label columns to invoices table`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Some objects already exist, this is OK');
    }
  } finally {
    await sql.end();
  }
}

runMigration();