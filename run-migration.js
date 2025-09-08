const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk1OTE4NSwiZXhwIjoyMDcyNTM1MTg1fQ.bLXB6Uc4VLwHaLCLtKNqBXUJN7TQW3sum4kcVz5e8rI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running database migration...');
  
  const migrationSQL = fs.readFileSync('./run_this_migration.sql', 'utf8');
  
  try {
    // Split the migration into separate statements
    const statements = migrationSQL.split(/;(?=\s*(?:CREATE|ALTER|DO|GRANT|--|$))/);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        console.log('Executing statement...');
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: trimmed + ';'
        }).catch(err => ({ error: err }));
        
        // If exec_sql doesn't exist, try direct query
        if (error && error.message?.includes('exec_sql')) {
          // Use raw SQL via postgres-js
          const { default: postgres } = await import('postgres');
          const sql = postgres('postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres');
          
          try {
            await sql.unsafe(trimmed + ';');
            console.log('✓ Statement executed successfully');
          } catch (err) {
            if (err.message?.includes('already exists')) {
              console.log('⚠ Already exists, skipping...');
            } else {
              console.error('✗ Error:', err.message);
            }
          }
          
          await sql.end();
        } else if (error) {
          console.error('✗ Error:', error.message);
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }
    
    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();