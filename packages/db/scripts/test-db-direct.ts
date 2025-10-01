import { primaryDb } from '../src/client';
import { userInvites } from '../src/schema';
import { sql } from 'drizzle-orm';

async function testDirect() {
  console.log('\n🔍 Testing direct database connection...\n');
  
  try {
    // Test 1: Check if we can connect to the database
    console.log('1. Testing basic database connection...');
    const result = await primaryDb.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');
    
    // Test 2: Check if user_invites table exists
    console.log('\n2. Checking if user_invites table exists...');
    const tableCheck = await primaryDb.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_invites'
      ) as exists
    `);
    console.log('Table exists:', tableCheck[0].exists);
    
    // Test 3: Try to query the user_invites table
    console.log('\n3. Querying user_invites table...');
    try {
      const invites = await primaryDb.select().from(userInvites).limit(1);
      console.log('✅ user_invites query successful');
      console.log('Found records:', invites.length);
    } catch (error: any) {
      console.error('❌ Error querying user_invites:', error.message);
      
      // Check if it's a permission issue
      if (error.message.includes('permission') || error.message.includes('policy')) {
        console.log('\n⚠️ This appears to be a permission/policy issue');
        console.log('Checking RLS policies...');
        
        const policies = await primaryDb.execute(sql`
          SELECT pol.polname, pol.polcmd, pol.polqual::text 
          FROM pg_policies pol 
          WHERE pol.tablename = 'user_invites'
        `);
        console.log('RLS Policies:', policies);
      }
    }
    
    // Test 4: Check table structure
    console.log('\n4. Checking table structure...');
    const columns = await primaryDb.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_invites'
      ORDER BY ordinal_position
    `);
    console.log('Table columns:');
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error: any) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testDirect();