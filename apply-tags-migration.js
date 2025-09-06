import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk1OTE4NSwiZXhwIjoyMDcyNTM1MTg1fQ.2s0DRPEBRBqRuBWMGpKfx_AReGE_2gz7hQjQyJcdKxA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying tags table migration...\n');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('create-tags-table.sql', 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    }).single();
    
    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('RPC failed, trying direct query...');
      
      // Split into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.includes('CREATE TABLE IF NOT EXISTS tags')) {
          console.log('Creating tags table...');
          // Create table through Supabase
          const { error: createError } = await supabase
            .from('tags')
            .select('id')
            .limit(1);
          
          if (createError?.code === '42P01') {
            console.log('Tags table does not exist, needs manual creation');
            console.log('\nPlease run the following SQL in Supabase SQL Editor:');
            console.log('----------------------------------------');
            console.log(sql);
            console.log('----------------------------------------');
            return;
          }
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('tags')
      .select('*')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Tags table is accessible');
    } else {
      console.log('⚠️ Tags table exists but may have permission issues:', testError.message);
    }
    
  } catch (err) {
    console.error('Error applying migration:', err);
    console.log('\nPlease run the SQL manually in Supabase SQL Editor');
  }
}

applyMigration();